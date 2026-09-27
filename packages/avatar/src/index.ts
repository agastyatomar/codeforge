export * from './composer';
export * from './assets';
export * from './preview';

import { AvatarComposer, createAvatarComposer, DEFAULT_ASSETS } from './composer';
import { AvatarPreviewGenerator, createAvatarPreviewGenerator } from './preview';
import { DEFAULT_MANIFEST, getManifest, validateAssetManifest } from './assets';

export {
  AvatarComposer,
  createAvatarComposer,
  AvatarPreviewGenerator,
  createAvatarPreviewGenerator,
  DEFAULT_ASSETS,
  DEFAULT_MANIFEST,
  getManifest,
  validateAssetManifest,
};

export type { AvatarAssets, AvatarLayer, CompositedAvatar } from './composer';
export type { AvatarAssetManifest, SkinToneAsset, HairStyleAsset, OutfitAsset, BackgroundAsset, AccessoryAsset } from './assets';
export type { PreviewOptions } from './preview';