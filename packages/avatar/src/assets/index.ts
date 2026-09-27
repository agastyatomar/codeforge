export interface AvatarAssetManifest {
  version: string;
  assets: {
    skinTones: SkinToneAsset[];
    hairStyles: HairStyleAsset[];
    outfits: OutfitAsset[];
    backgrounds: BackgroundAsset[];
    accessories: AccessoryAsset[];
  };
}

export interface SkinToneAsset {
  id: string;
  name: string;
  color: string;
  preview: string;
}

export interface HairStyleAsset {
  id: string;
  name: string;
  baseLayer: string;
  colors: HairColorAsset[];
}

export interface HairColorAsset {
  id: string;
  name: string;
  color: string;
  overlayLayer: string;
}

export interface OutfitAsset {
  id: string;
  name: string;
  baseLayer: string;
  colors: OutfitColorAsset[];
  slots: OutfitSlot[];
}

export interface OutfitColorAsset {
  id: string;
  name: string;
  color: string;
  overlayLayer: string;
}

export interface OutfitSlot {
  name: string;
  layer: string;
  required: boolean;
}

export interface BackgroundAsset {
  id: string;
  name: string;
  type: 'gradient' | 'solid' | 'pattern' | 'image';
  data: string | { colors: string[]; angle?: number } | string;
  preview: string;
}

export interface AccessoryAsset {
  id: string;
  name: string;
  category: 'glasses' | 'hat' | 'jewelry' | 'headphones' | 'mask' | 'other';
  layer: string;
  colors?: AccessoryColorAsset[];
  slots: string[];
}

export interface AccessoryColorAsset {
  id: string;
  name: string;
  color: string;
  layer: string;
}

export const DEFAULT_MANIFEST: AvatarAssetManifest = {
  version: '1.0.0',
  assets: {
    skinTones: [
      { id: 'light', name: 'Light', color: '#FFDBAC', preview: 'skin-light.png' },
      { id: 'light-medium', name: 'Light Medium', color: '#F8C8A8', preview: 'skin-light-medium.png' },
      { id: 'medium', name: 'Medium', color: '#E8B8A0', preview: 'skin-medium.png' },
      { id: 'medium-dark', name: 'Medium Dark', color: '#D8A898', preview: 'skin-medium-dark.png' },
      { id: 'dark', name: 'Dark', color: '#C89888', preview: 'skin-dark.png' },
      { id: 'deep', name: 'Deep', color: '#B88878', preview: 'skin-deep.png' },
      { id: 'very-deep', name: 'Very Deep', color: '#A87868', preview: 'skin-very-deep.png' },
    ],
    hairStyles: [
      {
        id: 'short',
        name: 'Short',
        baseLayer: 'hair-short-base.png',
        colors: [
          { id: 'black', name: 'Black', color: '#2C1B18', overlayLayer: 'hair-short-black.png' },
          { id: 'dark-brown', name: 'Dark Brown', color: '#4A3728', overlayLayer: 'hair-short-dark-brown.png' },
          { id: 'brown', name: 'Brown', color: '#6B4E31', overlayLayer: 'hair-short-brown.png' },
          { id: 'blonde', name: 'Blonde', color: '#C4A052', overlayLayer: 'hair-short-blonde.png' },
          { id: 'platinum', name: 'Platinum', color: '#E8C45A', overlayLayer: 'hair-short-platinum.png' },
          { id: 'white', name: 'White', color: '#1A1A2E', overlayLayer: 'hair-short-white.png' },
          { id: 'red', name: 'Red', color: '#FF6B6B', overlayLayer: 'hair-short-red.png' },
          { id: 'pink', name: 'Pink', color: '#4ECDC4', overlayLayer: 'hair-short-pink.png' },
          { id: 'blue', name: 'Blue', color: '#45B7D1', overlayLayer: 'hair-short-blue.png' },
          { id: 'purple', name: 'Purple', color: '#A855F7', overlayLayer: 'hair-short-purple.png' },
        ],
      },
      {
        id: 'medium',
        name: 'Medium',
        baseLayer: 'hair-medium-base.png',
        colors: [
          { id: 'black', name: 'Black', color: '#2C1B18', overlayLayer: 'hair-medium-black.png' },
          { id: 'dark-brown', name: 'Dark Brown', color: '#4A3728', overlayLayer: 'hair-medium-dark-brown.png' },
          { id: 'brown', name: 'Brown', color: '#6B4E31', overlayLayer: 'hair-medium-brown.png' },
          { id: 'blonde', name: 'Blonde', color: '#C4A052', overlayLayer: 'hair-medium-blonde.png' },
          { id: 'platinum', name: 'Platinum', color: '#E8C45A', overlayLayer: 'hair-medium-platinum.png' },
          { id: 'white', name: 'White', color: '#1A1A2E', overlayLayer: 'hair-medium-white.png' },
          { id: 'red', name: 'Red', color: '#FF6B6B', overlayLayer: 'hair-medium-red.png' },
          { id: 'pink', name: 'Pink', color: '#4ECDC4', overlayLayer: 'hair-medium-pink.png' },
          { id: 'blue', name: 'Blue', color: '#45B7D1', overlayLayer: 'hair-medium-blue.png' },
          { id: 'purple', name: 'Purple', color: '#A855F7', overlayLayer: 'hair-medium-purple.png' },
        ],
      },
      {
        id: 'long',
        name: 'Long',
        baseLayer: 'hair-long-base.png',
        colors: [
          { id: 'black', name: 'Black', color: '#2C1B18', overlayLayer: 'hair-long-black.png' },
          { id: 'dark-brown', name: 'Dark Brown', color: '#4A3728', overlayLayer: 'hair-long-dark-brown.png' },
          { id: 'brown', name: 'Brown', color: '#6B4E31', overlayLayer: 'hair-long-brown.png' },
          { id: 'blonde', name: 'Blonde', color: '#C4A052', overlayLayer: 'hair-long-blonde.png' },
          { id: 'platinum', name: 'Platinum', color: '#E8C45A', overlayLayer: 'hair-long-platinum.png' },
          { id: 'white', name: 'White', color: '#1A1A2E', overlayLayer: 'hair-long-white.png' },
          { id: 'red', name: 'Red', color: '#FF6B6B', overlayLayer: 'hair-long-red.png' },
          { id: 'pink', name: 'Pink', color: '#4ECDC4', overlayLayer: 'hair-long-pink.png' },
          { id: 'blue', name: 'Blue', color: '#45B7D1', overlayLayer: 'hair-long-blue.png' },
          { id: 'purple', name: 'Purple', color: '#A855F7', overlayLayer: 'hair-long-purple.png' },
        ],
      },
    ],
    outfits: [
      {
        id: 'casual',
        name: 'Casual T-Shirt',
        baseLayer: 'outfit-casual-base.png',
        colors: [
          { id: 'dark', name: 'Dark', color: '#1A1A2E', overlayLayer: 'outfit-casual-dark.png' },
          { id: 'navy', name: 'Navy', color: '#16213E', overlayLayer: 'outfit-casual-navy.png' },
          { id: 'blue', name: 'Blue', color: '#0F3460', overlayLayer: 'outfit-casual-blue.png' },
          { id: 'red', name: 'Red', color: '#E94560', overlayLayer: 'outfit-casual-red.png' },
          { id: 'black', name: 'Black', color: '#2C1B18', overlayLayer: 'outfit-casual-black.png' },
        ],
        slots: [
          { name: 'torso', layer: 'outfit-casual-torso.png', required: true },
          { name: 'sleeves', layer: 'outfit-casual-sleeves.png', required: false },
        ],
      },
      {
        id: 'formal',
        name: 'Formal Suit',
        baseLayer: 'outfit-formal-base.png',
        colors: [
          { id: 'dark', name: 'Dark', color: '#1A1A2E', overlayLayer: 'outfit-formal-dark.png' },
          { id: 'navy', name: 'Navy', color: '#16213E', overlayLayer: 'outfit-formal-navy.png' },
          { id: 'blue', name: 'Blue', color: '#0F3460', overlayLayer: 'outfit-formal-blue.png' },
          { id: 'red', name: 'Red', color: '#E94560', overlayLayer: 'outfit-formal-red.png' },
          { id: 'black', name: 'Black', color: '#2C1B18', overlayLayer: 'outfit-formal-black.png' },
        ],
        slots: [
          { name: 'jacket', layer: 'outfit-formal-jacket.png', required: true },
          { name: 'shirt', layer: 'outfit-formal-shirt.png', required: true },
          { name: 'tie', layer: 'outfit-formal-tie.png', required: false },
        ],
      },
      {
        id: 'hoodie',
        name: 'Hoodie',
        baseLayer: 'outfit-hoodie-base.png',
        colors: [
          { id: 'dark', name: 'Dark', color: '#1A1A2E', overlayLayer: 'outfit-hoodie-dark.png' },
          { id: 'navy', name: 'Navy', color: '#16213E', overlayLayer: 'outfit-hoodie-navy.png' },
          { id: 'blue', name: 'Blue', color: '#0F3460', overlayLayer: 'outfit-hoodie-blue.png' },
          { id: 'red', name: 'Red', color: '#E94560', overlayLayer: 'outfit-hoodie-red.png' },
          { id: 'black', name: 'Black', color: '#2C1B18', overlayLayer: 'outfit-hoodie-black.png' },
          { id: 'pink', name: 'Pink', color: '#FF6B6B', overlayLayer: 'outfit-hoodie-pink.png' },
          { id: 'teal', name: 'Teal', color: '#4ECDC4', overlayLayer: 'outfit-hoodie-teal.png' },
          { id: 'cyan', name: 'Cyan', color: '#45B7D1', overlayLayer: 'outfit-hoodie-cyan.png' },
        ],
        slots: [
          { name: 'body', layer: 'outfit-hoodie-body.png', required: true },
          { name: 'hood', layer: 'outfit-hoodie-hood.png', required: false },
          { name: 'drawstrings', layer: 'outfit-hoodie-drawstrings.png', required: false },
        ],
      },
      {
        id: 'jacket',
        name: 'Bomber Jacket',
        baseLayer: 'outfit-jacket-base.png',
        colors: [
          { id: 'dark', name: 'Dark', color: '#1A1A2E', overlayLayer: 'outfit-jacket-dark.png' },
          { id: 'navy', name: 'Navy', color: '#16213E', overlayLayer: 'outfit-jacket-navy.png' },
          { id: 'blue', name: 'Blue', color: '#0F3460', overlayLayer: 'outfit-jacket-blue.png' },
          { id: 'red', name: 'Red', color: '#E94560', overlayLayer: 'outfit-jacket-red.png' },
          { id: 'black', name: 'Black', color: '#2C1B18', overlayLayer: 'outfit-jacket-black.png' },
        ],
        slots: [
          { name: 'jacket', layer: 'outfit-jacket-main.png', required: true },
          { name: 'collar', layer: 'outfit-jacket-collar.png', required: true },
          { name: 'cuffs', layer: 'outfit-jacket-cuffs.png', required: false },
        ],
      },
    ],
    backgrounds: [
      { id: 'dark-gradient', name: 'Dark Gradient', type: 'gradient', data: { colors: ['#0d1117', '#161b22'], angle: 45 }, preview: 'bg-dark-gradient.png' },
      { id: 'blue-gradient', name: 'Blue Gradient', type: 'gradient', data: { colors: ['#1a1a2e', '#16213e'], angle: 135 }, preview: 'bg-blue-gradient.png' },
      { id: 'purple-gradient', name: 'Purple Gradient', type: 'gradient', data: { colors: ['#0f3460', '#533483'], angle: 90 }, preview: 'bg-purple-gradient.png' },
      { id: 'dark-solid', name: 'Dark Solid', type: 'solid', data: '#0d1117', preview: 'bg-dark-solid.png' },
      { id: 'navy-solid', name: 'Navy Solid', type: 'solid', data: '#161b22', preview: 'bg-navy-solid.png' },
      { id: 'grid-pattern', name: 'Grid Pattern', type: 'pattern', data: 'bg-grid.png', preview: 'bg-grid-pattern.png' },
    ],
    accessories: [
      {
        id: 'glasses-round',
        name: 'Round Glasses',
        category: 'glasses',
        layer: 'accessory-glasses-round.png',
        colors: [
          { id: 'black', name: 'Black', color: '#000000', layer: 'accessory-glasses-round-black.png' },
          { id: 'silver', name: 'Silver', color: '#C0C0C0', layer: 'accessory-glasses-round-silver.png' },
          { id: 'gold', name: 'Gold', color: '#FFD700', layer: 'accessory-glasses-round-gold.png' },
        ],
        slots: ['face'],
      },
      {
        id: 'glasses-square',
        name: 'Square Glasses',
        category: 'glasses',
        layer: 'accessory-glasses-square.png',
        colors: [
          { id: 'black', name: 'Black', color: '#000000', layer: 'accessory-glasses-square-black.png' },
          { id: 'silver', name: 'Silver', color: '#C0C0C0', layer: 'accessory-glasses-square-silver.png' },
          { id: 'gold', name: 'Gold', color: '#FFD700', layer: 'accessory-glasses-square-gold.png' },
        ],
        slots: ['face'],
      },
      {
        id: 'headphones',
        name: 'Headphones',
        category: 'headphones',
        layer: 'accessory-headphones.png',
        colors: [
          { id: 'black', name: 'Black', color: '#000000', layer: 'accessory-headphones-black.png' },
          { id: 'white', name: 'White', color: '#FFFFFF', layer: 'accessory-headphones-white.png' },
          { id: 'red', name: 'Red', color: '#E94560', layer: 'accessory-headphones-red.png' },
          { id: 'blue', name: 'Blue', color: '#0F3460', layer: 'accessory-headphones-blue.png' },
        ],
        slots: ['head'],
      },
    ],
  },
};

export function getManifest(): AvatarAssetManifest {
  return DEFAULT_MANIFEST;
}

export function getAssetById(type: keyof AvatarAssetManifest['assets'], id: string): any {
  const assets = DEFAULT_MANIFEST.assets[type] as any[];
  return assets.find((a) => a.id === id);
}

export function getAssetsByCategory(category: string): any[] {
  const allAssets = [
    ...DEFAULT_MANIFEST.assets.skinTones,
    ...DEFAULT_MANIFEST.assets.hairStyles,
    ...DEFAULT_MANIFEST.assets.outfits,
    ...DEFAULT_MANIFEST.assets.backgrounds,
    ...DEFAULT_MANIFEST.assets.accessories,
  ];
  return allAssets.filter((a) => a.category === category || a.id === category);
}

export function validateAssetManifest(manifest: AvatarAssetManifest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!manifest.version) {
    errors.push('Missing version');
  }

  if (!manifest.assets) {
    errors.push('Missing assets');
  } else {
    if (!manifest.assets.skinTones || manifest.assets.skinTones.length === 0) {
      errors.push('No skin tones defined');
    }
    if (!manifest.assets.hairStyles || manifest.assets.hairStyles.length === 0) {
      errors.push('No hair styles defined');
    }
    if (!manifest.assets.outfits || manifest.assets.outfits.length === 0) {
      errors.push('No outfits defined');
    }
    if (!manifest.assets.backgrounds || manifest.assets.backgrounds.length === 0) {
      errors.push('No backgrounds defined');
    }
  }

  return { valid: errors.length === 0, errors };
}