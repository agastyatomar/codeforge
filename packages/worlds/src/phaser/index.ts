import Phaser from 'phaser';
import { WorldScene } from '../scenes/WorldScene';
import { LobbyScene } from '../scenes/LobbyScene';
import { Avatar } from '../objects/Avatar';
import { NetworkManager } from '../networking/NetworkManager';

export interface WorldConfig {
  width: number;
  height: number;
  tileSize: number;
  backgroundColor: number;
  physics?: 'arcade' | 'matter';
  debug?: boolean;
}

export interface WorldUser {
  id: string;
  name: string;
  avatar: AvatarConfig;
  position: { x: number; y: number };
  lastActive: number;
}

export interface AvatarConfig {
  skinTone: number;
  hairStyle: number;
  hairColor: number;
  outfitStyle: number;
  outfitColor: number;
  background: number;
}

export class WorldEngine {
  private game: Phaser.Game | null = null;
  private config: WorldConfig;
  private container: HTMLElement | null = null;
  private networkManager: NetworkManager | null = null;
  private currentScene: 'lobby' | 'world' = 'lobby';
  private userId: string;
  private userName: string;
  private avatarConfig: AvatarConfig;
  private handlers = new Set<(event: WorldEvent) => void>();

  constructor(config: Partial<WorldConfig> = {}) {
    this.config = {
      width: 1280,
      height: 720,
      tileSize: 32,
      backgroundColor: 0x0d1117,
      physics: 'arcade',
      debug: false,
      ...config,
    };
    this.userId = crypto.randomUUID();
    this.userName = 'Player';
    this.avatarConfig = this.getDefaultAvatar();
  }

  private getDefaultAvatar(): AvatarConfig {
    return {
      skinTone: 0,
      hairStyle: 0,
      hairColor: 0,
      outfitStyle: 0,
      outfitColor: 0,
      background: 0,
    };
  }

  async initialize(container: HTMLElement): Promise<void> {
    this.container = container;

    this.game = new Phaser.Game({
      type: Phaser.WEBGL,
      width: this.config.width,
      height: this.config.height,
      parent: container,
      backgroundColor: this.config.backgroundColor,
      physics: {
        default: this.config.physics,
        arcade: {
          gravity: { y: 0 },
          debug: this.config.debug,
        },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: this.config.width,
        height: this.config.height,
      },
      scene: [LobbyScene, WorldScene],
      render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false,
      },
    });

    this.game.events.once('ready', () => {
      this.emit({ type: 'ready', game: this.game! });
    });

    this.networkManager = new NetworkManager(this);
    await this.networkManager.connect();
  }

  enterWorld(worldId: string): void {
    if (!this.game) return;
    this.currentScene = 'world';
    this.game.scene.start('WorldScene', { worldId, engine: this });
    this.emit({ type: 'world-enter', worldId });
  }

  enterLobby(): void {
    if (!this.game) return;
    this.currentScene = 'lobby';
    this.game.scene.start('LobbyScene', { engine: this });
    this.emit({ type: 'lobby-enter' });
  }

  setUser(userId: string, userName: string): void {
    this.userId = userId;
    this.userName = userName;
  }

  setAvatar(config: AvatarConfig): void {
    this.avatarConfig = config;
    if (this.currentScene === 'world') {
      const worldScene = this.game?.scene.getScene('WorldScene') as WorldScene;
      if (worldScene) {
        worldScene.updateLocalAvatar(config);
      }
    }
  }

  getAvatar(): AvatarConfig {
    return { ...this.avatarConfig };
  }

  getUserId(): string {
    return this.userId;
  }

  getUserName(): string {
    return this.userName;
  }

  getGame(): Phaser.Game | null {
    return this.game;
  }

  getNetworkManager(): NetworkManager | null {
    return this.networkManager;
  }

  onEvent(handler: (event: WorldEvent) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  destroy(): void {
    if (this.networkManager) {
      this.networkManager.disconnect();
    }
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
    this.handlers.clear();
  }

  private emit(event: WorldEvent): void {
    for (const handler of this.handlers) {
      try {
        handler(event);
      } catch (error) {
        console.error('World event handler error:', error);
      }
    }
  }
}

export interface WorldEvent {
  type: 'ready' | 'world-enter' | 'lobby-enter' | 'user-join' | 'user-leave' | 'chat-message' | 'avatar-update' | 'position-update' | 'error';
  game?: Phaser.Game;
  worldId?: string;
  userId?: string;
  userName?: string;
  avatar?: AvatarConfig;
  position?: { x: number; y: number };
  message?: string;
  error?: Error;
}

export function createWorldEngine(config?: Partial<WorldConfig>): WorldEngine {
  return new WorldEngine(config);
}

export const WORLD_CONFIGS: Record<string, WorldConfig> = {
  lobby: {
    width: 1280,
    height: 720,
    tileSize: 32,
    backgroundColor: 0x0d1117,
  },
  main: {
    width: 2560,
    height: 1440,
    tileSize: 32,
    backgroundColor: 0x0d1117,
  },
  classroom: {
    width: 1920,
    height: 1080,
    tileSize: 32,
    backgroundColor: 0x161b22,
  },
  playground: {
    width: 3840,
    height: 2160,
    tileSize: 64,
    backgroundColor: 0x0d1117,
  },
};