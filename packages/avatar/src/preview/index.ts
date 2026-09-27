import { AvatarComposer, createAvatarComposer, CompositedAvatar } from '../composer';
import { AvatarConfig } from '@codeforge/worlds';

export interface PreviewOptions {
  size: number;
  format: 'png' | 'jpeg' | 'webp';
  quality?: number;
  background?: string;
}

export class AvatarPreviewGenerator {
  private composer: AvatarComposer;
  private previewCache = new Map<string, string>();

  constructor(composer?: AvatarComposer) {
    this.composer = composer || createAvatarComposer();
  }

  async generatePreview(config: AvatarConfig, options: Partial<PreviewOptions> = {}): Promise<string> {
    const opts: PreviewOptions = {
      size: 128,
      format: 'png',
      quality: 0.9,
      ...options,
    };

    const cacheKey = this.generateCacheKey(config, opts);
    const cached = this.previewCache.get(cacheKey);
    if (cached) return cached;

    const composed = await this.composer.compose(config, opts.size);
    let dataUrl: string;

    if (opts.format === 'png') {
      dataUrl = composed.dataUrl;
    } else if (opts.format === 'jpeg') {
      dataUrl = composed.canvas.toDataURL('image/jpeg', opts.quality);
    } else {
      dataUrl = composed.canvas.toDataURL('image/webp', opts.quality);
    }

    this.previewCache.set(cacheKey, dataUrl);
    return dataUrl;
  }

  async generateMultiplePreviews(
    configs: AvatarConfig[],
    options: Partial<PreviewOptions> = {}
  ): Promise<string[]> {
    return Promise.all(configs.map((config) => this.generatePreview(config, options)));
  }

  async generatePreviewStrip(config: AvatarConfig, variations: Partial<AvatarConfig>[], options: Partial<PreviewOptions> = {}): Promise<string> {
    const opts: PreviewOptions = {
      size: 64,
      format: 'png',
      ...options,
    };

    const variants = variations.map((v) => ({ ...config, ...v }));
    variants.unshift(config);

    const previews = await this.generateMultiplePreviews(variants, opts);

    const canvas = require('canvas').createCanvas(opts.size * variants.length, opts.size);
    const ctx = canvas.getContext('2d');

    for (let i = 0; i < previews.length; i++) {
      const img = await this.loadImage(previews[i]);
      ctx.drawImage(img, i * opts.size, 0, opts.size, opts.size);
    }

    return canvas.toDataURL('image/png');
  }

  private async loadImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  private generateCacheKey(config: AvatarConfig, options: PreviewOptions): string {
    return `${config.skinTone}-${config.hairStyle}-${config.hairColor}-${config.outfitStyle}-${config.outfitColor}-${config.background}-${options.size}-${options.format}`;
  }

  clearCache(): void {
    this.previewCache.clear();
  }

  getCacheSize(): number {
    return this.previewCache.size;
  }
}

export function createAvatarPreviewGenerator(composer?: AvatarComposer): AvatarPreviewGenerator {
  return new AvatarPreviewGenerator(composer);
}

export async function generateThumbnail(config: AvatarConfig, size = 32): Promise<string> {
  const composer = createAvatarComposer();
  const composed = await composer.compose(config, size);
  return composed.dataUrl;
}

export async function generateAvatarSpriteSheet(
  config: AvatarConfig,
  animations: string[] = ['idle-down', 'idle-up', 'idle-left', 'idle-right', 'walk-down', 'walk-up', 'walk-left', 'walk-right'],
  frameSize = 64
): Promise<string> {
  const composer = createAvatarComposer();
  const cols = 4;
  const rows = Math.ceil(animations.length / cols);

  const canvas = require('canvas').createCanvas(frameSize * cols, frameSize * rows);
  const ctx = canvas.getContext('2d');

  for (let i = 0; i < animations.length; i++) {
    const x = (i % cols) * frameSize;
    const y = Math.floor(i / cols) * frameSize;

    const composed = await composer.compose(config, frameSize);
    const img = await loadImage(composed.dataUrl);
    ctx.drawImage(img, x, y, frameSize, frameSize);
  }

  return canvas.toDataURL('image/png');
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}