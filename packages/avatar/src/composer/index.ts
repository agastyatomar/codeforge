import { createCanvas, Canvas, CanvasRenderingContext2D, Image } from 'canvas';
import { AvatarConfig } from '@codeforge/worlds';

export interface AvatarLayer {
  name: string;
  category: 'skin' | 'hair' | 'outfit' | 'background';
  index: number;
  colorable: boolean;
  zIndex: number;
}

export interface AvatarAssets {
  skinTones: string[];
  hairStyles: { base: string; colors: string[] }[];
  outfits: { base: string; colors: string[] }[];
  backgrounds: string[];
}

export const DEFAULT_ASSETS: AvatarAssets = {
  skinTones: [
    '#FFDBAC', '#F8C8A8', '#E8B8A0', '#D8A898', '#C89888', '#B88878', '#A87868',
  ],
  hairStyles: [
    { base: 'hair-short', colors: ['#2C1B18', '#4A3728', '#6B4E31', '#8B6914', '#C4A052', '#E8C45A', '#1A1A2E', '#FF6B6B', '#4ECDC4', '#45B7D1'] },
    { base: 'hair-medium', colors: ['#2C1B18', '#4A3728', '#6B4E31', '#8B6914', '#C4A052', '#E8C45A', '#1A1A2E', '#FF6B6B', '#4ECDC4', '#45B7D1'] },
    { base: 'hair-long', colors: ['#2C1B18', '#4A3728', '#6B4E31', '#8B6914', '#C4A052', '#E8C45A', '#1A1A2E', '#FF6B6B', '#4ECDC4', '#45B7D1'] },
  ],
  outfits: [
    { base: 'outfit-casual', colors: ['#1A1A2E', '#16213E', '#0F3460', '#E94560', '#2C1B18'] },
    { base: 'outfit-formal', colors: ['#1A1A2E', '#16213E', '#0F3460', '#E94560', '#2C1B18'] },
    { base: 'outfit-hoodie', colors: ['#1A1A2E', '#16213E', '#0F3460', '#E94560', '#2C1B18', '#FF6B6B', '#4ECDC4', '#45B7D1'] },
    { base: 'outfit-jacket', colors: ['#1A1A2E', '#16213E', '#0F3460', '#E94560', '#2C1B18'] },
  ],
  backgrounds: [
    'bg-gradient-1', 'bg-gradient-2', 'bg-gradient-3', 'bg-solid-1', 'bg-solid-2', 'bg-pattern-1',
  ],
};

export interface CompositedAvatar {
  canvas: Canvas;
  dataUrl: string;
  config: AvatarConfig;
  hash: string;
}

export class AvatarComposer {
  private assets: AvatarAssets;
  private layerCache = new Map<string, Image>();
  private compositionCache = new Map<string, CompositedAvatar>();

  constructor(assets: AvatarAssets = DEFAULT_ASSETS) {
    this.assets = assets;
  }

  async compose(config: AvatarConfig, size = 256): Promise<CompositedAvatar> {
    const hash = this.generateHash(config);
    const cached = this.compositionCache.get(hash);
    if (cached) return cached;

    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    await this.drawBackground(ctx, config, size);
    await this.drawSkin(ctx, config, size);
    await this.drawHair(ctx, config, size);
    await this.drawOutfit(ctx, config, size);

    const dataUrl = canvas.toDataURL('image/png');

    const result: CompositedAvatar = {
      canvas,
      dataUrl,
      config: { ...config },
      hash,
    };

    this.compositionCache.set(hash, result);
    return result;
  }

  private async drawBackground(ctx: CanvasRenderingContext2D, config: AvatarConfig, size: number): Promise<void> {
    const bgIndex = config.background % this.assets.backgrounds.length;
    const bgName = this.assets.backgrounds[bgIndex];

    const gradient = ctx.createLinearGradient(0, 0, size, size);
    const colors = this.getBackgroundColors(bgName);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  private getBackgroundColors(bgName: string): [string, string] {
    const gradients: Record<string, [string, string]> = {
      'bg-gradient-1': ['#0d1117', '#161b22'],
      'bg-gradient-2': ['#1a1a2e', '#16213e'],
      'bg-gradient-3': ['#0f3460', '#533483'],
      'bg-solid-1': ['#0d1117', '#0d1117'],
      'bg-solid-2': ['#161b22', '#161b22'],
      'bg-pattern-1': ['#0d1117', '#161b22'],
    };
    return gradients[bgName] || ['#0d1117', '#161b22'];
  }

  private async drawSkin(ctx: CanvasRenderingContext2D, config: AvatarConfig, size: number): Promise<void> {
    const skinColor = this.assets.skinTones[config.skinTone % this.assets.skinTones.length];

    ctx.fillStyle = skinColor;
    const centerX = size / 2;
    const centerY = size / 2 + 20;

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, size * 0.25, size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(centerX, centerY - size * 0.15, size * 0.2, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private async drawHair(ctx: CanvasRenderingContext2D, config: AvatarConfig, size: number): Promise<void> {
    const hairStyle = this.assets.hairStyles[config.hairStyle % this.assets.hairStyles.length];
    const hairColor = hairStyle.colors[config.hairColor % hairStyle.colors.length];

    ctx.fillStyle = hairColor;
    const centerX = size / 2;
    const centerY = size / 2 - size * 0.15;

    switch (config.hairStyle % 3) {
      case 0:
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - size * 0.05, size * 0.22, size * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 1:
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, size * 0.25, size * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 2:
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + size * 0.05, size * 0.28, size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
  }

  private async drawOutfit(ctx: CanvasRenderingContext2D, config: AvatarConfig, size: number): Promise<void> {
    const outfit = this.assets.outfits[config.outfitStyle % this.assets.outfits.length];
    const outfitColor = outfit.colors[config.outfitColor % outfit.colors.length];

    ctx.fillStyle = outfitColor;
    const centerX = size / 2;
    const centerY = size / 2 + size * 0.25;

    switch (config.outfitStyle % 4) {
      case 0:
        ctx.beginPath();
        ctx.roundRect(centerX - size * 0.2, centerY, size * 0.4, size * 0.35, size * 0.05);
        ctx.fill();
        break;
      case 1:
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX - size * 0.2, centerY + size * 0.35);
        ctx.lineTo(centerX + size * 0.2, centerY + size * 0.35);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.roundRect(centerX - size * 0.18, centerY - size * 0.05, size * 0.36, size * 0.1, size * 0.02);
        ctx.fill();
        break;
      case 2:
        ctx.beginPath();
        ctx.roundRect(centerX - size * 0.22, centerY - size * 0.05, size * 0.44, size * 0.4, size * 0.05);
        ctx.fill();

        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.roundRect(centerX - size * 0.1, centerY - size * 0.05, size * 0.2, size * 0.15, size * 0.02);
        ctx.fill();
        break;
      case 3:
        ctx.beginPath();
        ctx.roundRect(centerX - size * 0.2, centerY, size * 0.4, size * 0.35, size * 0.05);
        ctx.fill();

        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.roundRect(centerX - size * 0.18, centerY + size * 0.02, size * 0.36, size * 0.08, size * 0.02);
        ctx.fill();
        break;
    }
  }

  private generateHash(config: AvatarConfig): string {
    return `${config.skinTone}-${config.hairStyle}-${config.hairColor}-${config.outfitStyle}-${config.outfitColor}-${config.background}`;
  }

  clearCache(): void {
    this.compositionCache.clear();
    for (const image of this.layerCache.values()) {
      (image as any).src = '';
    }
    this.layerCache.clear();
  }

  getCacheSize(): number {
    return this.compositionCache.size;
  }

  async preloadAssets(): Promise<void> {
  }
}

export function createAvatarComposer(assets?: AvatarAssets): AvatarComposer {
  return new AvatarComposer(assets);
}

export function getAssetCounts(): { skinTones: number; hairStyles: number; hairColors: number; outfits: number; outfitColors: number; backgrounds: number } {
  return {
    skinTones: DEFAULT_ASSETS.skinTones.length,
    hairStyles: DEFAULT_ASSETS.hairStyles.length,
    hairColors: DEFAULT_ASSETS.hairStyles[0]?.colors.length || 0,
    outfits: DEFAULT_ASSETS.outfits.length,
    outfitColors: DEFAULT_ASSETS.outfits[0]?.colors.length || 0,
    backgrounds: DEFAULT_ASSETS.backgrounds.length,
  };
}

export function getTotalCombinations(): number {
  const counts = getAssetCounts();
  return counts.skinTones * counts.hairStyles * counts.hairColors * counts.outfits * counts.outfitColors * counts.backgrounds;
}