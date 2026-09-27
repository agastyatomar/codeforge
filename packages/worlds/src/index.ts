export * from './phaser';
export * from './scenes/WorldScene';
export * from './scenes/LobbyScene';
export * from './objects/Avatar';
export * from './networking/NetworkManager';

import { WorldEngine, createWorldEngine } from './phaser';
import { WorldScene } from './scenes/WorldScene';
import { LobbyScene } from './scenes/LobbyScene';
import { Avatar } from './objects/Avatar';
import { NetworkManager } from './networking/NetworkManager';

export {
  WorldEngine,
  createWorldEngine,
  WorldScene,
  LobbyScene,
  Avatar,
  NetworkManager,
};

export type { WorldConfig, WorldUser, AvatarConfig, WorldEvent } from './phaser';