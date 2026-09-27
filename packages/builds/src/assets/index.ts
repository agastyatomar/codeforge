import sharp from 'sharp';
import { createDexieRepository, db } from '@codeforge/data/dexie';
import { z } from 'zod';

export const AssetSchema = z.object({
  id: z.string().uuid(),
  buildId: z.string().uuid().optional(),
  userId: z.string().uuid(),
  name: z.string(),
  originalName: z.string(),
  type: z.string(),
  size: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  data: z.string(),
  path: z.string(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.number(),
});

export type Asset = z.infer<typeof AssetSchema>;

export interface AssetUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  generateThumbnails?: boolean;
  thumbnailSizes?: number[];
  optimize?: boolean;
  quality?: number;
}

export interface AssetProcessingResult {
  asset: Asset;
  thumbnails?: Map<number, string>;
  optimized?: boolean;
}

export class AssetManager {
  private assetsRepo = createDexieRepository(db.syncQueue as any);
  private defaultOptions: AssetUploadOptions = {
    maxSize: 10 * 1024 * 1024,
    allowedTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm', 'audio/mp3', 'audio/wav', 'audio/ogg', 'font/woff', 'font/woff2', 'application/json', 'text/plain', 'text/css', 'application/javascript'],
    generateThumbnails: true,
    thumbnailSizes: [64, 128, 256, 512],
    optimize: true,
    quality: 85,
  };

  constructor(options: Partial<AssetUploadOptions> = {}) {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }

  async uploadAsset(userId: string, file: File, buildId?: string, options?: AssetUploadOptions): Promise<AssetProcessingResult> {
    const opts = { ...this.defaultOptions, ...options };

    if (opts.maxSize && file.size > opts.maxSize) {
      throw new Error(`File size exceeds limit of ${opts.maxSize} bytes`);
    }

    if (opts.allowedTypes && !opts.allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} not allowed`);
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    let optimizedData = base64;
    let optimized = false;
    let width: number | undefined;
    let height: number | undefined;
    const thumbnails = new Map<number, string>();

    if (opts.optimize && this.isOptimizable(file.type)) {
      const result = await this.optimizeImage(base64, file.type, opts.quality);
      optimizedData = result.data;
      optimized = true;
      width = result.width;
      height = result.height;

      if (opts.generateThumbnails && opts.thumbnailSizes) {
        for (const size of opts.thumbnailSizes) {
          const thumb = await this.generateThumbnail(base64, file.type, size, opts.quality);
          thumbnails.set(size, thumb);
        }
      }
    } else if (this.isImage(file.type)) {
      const metadata = await this.getImageMetadata(base64, file.type);
      width = metadata.width;
      height = metadata.height;
    }

    const asset: Asset = {
      id: crypto.randomUUID(),
      buildId,
      userId,
      name: file.name,
      originalName: file.name,
      type: file.type,
      size: file.size,
      width,
      height,
      data: optimizedData,
      path: `assets/${crypto.randomUUID()}-${file.name}`,
      metadata: {
        originalSize: file.size,
        optimized,
        thumbnails: Array.from(thumbnails.keys()),
      },
      createdAt: Date.now(),
    };

    AssetSchema.parse(asset);
    await this.assetsRepo.create(asset as any);

    return { asset, thumbnails, optimized };
  }

  private isOptimizable(type: string): boolean {
    return ['image/png', 'image/jpeg', 'image/webp'].includes(type);
  }

  private isImage(type: string): boolean {
    return type.startsWith('image/');
  }

  private async optimizeImage(base64: string, mimeType: string, quality: number): Promise<{ data: string; width: number; height: number }> {
    const buffer = Buffer.from(base64, 'base64');
    const image = sharp(buffer);

    const metadata = await image.metadata();
    const optimized = await image
      .resize({ width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality, progressive: true })
      .toBuffer();

    return {
      data: optimized.toString('base64'),
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  }

  private async generateThumbnail(base64: string, mimeType: string, size: number, quality: number): Promise<string> {
    const buffer = Buffer.from(base64, 'base64');
    const thumbnail = await sharp(buffer)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .jpeg({ quality })
      .toBuffer();

    return thumbnail.toString('base64');
  }

  private async getImageMetadata(base64: string, mimeType: string): Promise<{ width: number; height: number }> {
    const buffer = Buffer.from(base64, 'base64');
    const metadata = await sharp(buffer).metadata();
    return { width: metadata.width || 0, height: metadata.height || 0 };
  }

  async getAsset(assetId: string): Promise<Asset | null> {
    return this.assetsRepo.findById(assetId);
  }

  async getAssets(buildId?: string, userId?: string): Promise<Asset[]> {
    const query: any = {};
    if (buildId) query.buildId = buildId;
    if (userId) query.userId = userId;
    return this.assetsRepo.find({ where: query, orderBy: [{ field: 'createdAt', direction: 'desc' }] });
  }

  async deleteAsset(assetId: string, userId: string): Promise<boolean> {
    const asset = await this.getAsset(assetId);
    if (!asset || asset.userId !== userId) return false;
    await this.assetsRepo.delete(assetId);
    return true;
  }

  async updateAssetMetadata(assetId: string, userId: string, metadata: Record<string, unknown>): Promise<Asset | null> {
    const asset = await this.getAsset(assetId);
    if (!asset || asset.userId !== userId) return null;
    return this.assetsRepo.update(assetId, { metadata: { ...asset.metadata, ...metadata } });
  }

  async getAssetDataUrl(assetId: string): Promise<string | null> {
    const asset = await this.getAsset(assetId);
    if (!asset) return null;
    return `data:${asset.type};base64,${asset.data}`;
  }

  async getAssetBlob(assetId: string): Promise<Blob | null> {
    const asset = await this.getAsset(assetId);
    if (!asset) return null;
    const binary = atob(asset.data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: asset.type });
  }

  async copyAsset(assetId: string, userId: string, newBuildId?: string): Promise<Asset | null> {
    const asset = await this.getAsset(assetId);
    if (!asset) return null;

    const newAsset: Asset = {
      ...asset,
      id: crypto.randomUUID(),
      userId,
      buildId: newBuildId,
      path: `assets/${crypto.randomUUID()}-${asset.originalName}`,
      createdAt: Date.now(),
    };

    AssetSchema.parse(newAsset);
    await this.assetsRepo.create(newAsset as any);
    return newAsset;
  }

  getSupportedTypes(): string[] {
    return this.defaultOptions.allowedTypes || [];
  }

  getMaxSize(): number {
    return this.defaultOptions.maxSize || 10 * 1024 * 1024;
  }
}

export function createAssetManager(options?: AssetUploadOptions): AssetManager {
  return new AssetManager(options);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function getFileTypeIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.startsWith('font/')) return '🔤';
  if (mimeType === 'application/json') return '📄';
  if (mimeType === 'text/css') return '🎨';
  if (mimeType === 'application/javascript') return '📜';
  if (mimeType.startsWith('text/')) return '📝';
  return '📎';
}