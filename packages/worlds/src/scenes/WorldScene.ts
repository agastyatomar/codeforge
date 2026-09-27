import Phaser from 'phaser';
import { Avatar } from '../objects/Avatar';
import { WorldEngine, WorldUser, AvatarConfig } from '../phaser';

export class WorldScene extends Phaser.Scene {
  private engine: WorldEngine;
  private worldId: string;
  private localAvatar: Avatar | null = null;
  private remoteAvatars = new Map<string, Avatar>();
  private tilemap: Phaser.Tilemaps.Tilemap | null = null;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasd: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key } | null = null;
  private moveSpeed = 150;
  private lastPosition = { x: 0, y: 0 };
  private positionUpdateThrottle = 0;

  constructor() {
    super({ key: 'WorldScene' });
  }

  init(data: { worldId: string; engine: WorldEngine }): void {
    this.worldId = data.worldId;
    this.engine = data.engine;
  }

  preload(): void {
    this.load.image('tiles', '/assets/tilesets/world-tiles.png');
    this.load.tilemapTiledJSON('world-map', '/assets/maps/world.json');
    this.load.atlas('avatars', '/assets/avatars/atlas.png', '/assets/avatars/atlas.json');
  }

  create(): void {
    this.createMap();
    this.createLocalAvatar();
    this.setupInput();
    this.setupNetworking();
    this.setupCamera();
  }

  private createMap(): void {
    this.tilemap = this.make.tilemap({ key: 'world-map' });
    const tileset = this.tilemap.addTilesetImage('tiles', 'tiles');

    if (tileset) {
      this.tilemap.createLayer('Background', tileset, 0, 0);
      this.tilemap.createLayer('Ground', tileset, 0, 0);
      const collisionLayer = this.tilemap.createLayer('Collision', tileset, 0, 0);
      if (collisionLayer) {
        collisionLayer.setCollisionByProperty({ collides: true });
        this.physics.world.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels);
      }
      this.tilemap.createLayer('Foreground', tileset, 0, 0);
    }
  }

  private createLocalAvatar(): void {
    const startX = this.tilemap ? this.tilemap.widthInPixels / 2 : 400;
    const startY = this.tilemap ? this.tilemap.heightInPixels / 2 : 300;

    this.localAvatar = new Avatar(this, startX, startY, this.engine.getAvatar());
    this.localAvatar.setName(this.engine.getUserName());

    if (this.tilemap) {
      this.physics.add.collider(this.localAvatar, this.tilemap.getLayer('Collision')!);
    }
  }

  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,S,A,D') as any;
  }

  private setupNetworking(): void {
    const networkManager = this.engine.getNetworkManager();
    if (!networkManager) return;

    networkManager.onUserJoin((user: WorldUser) => {
      this.addRemoteAvatar(user);
    });

    networkManager.onUserLeave((userId: string) => {
      this.removeRemoteAvatar(userId);
    });

    networkManager.onPositionUpdate((userId: string, position: { x: number; y: number }) => {
      this.updateRemoteAvatarPosition(userId, position);
    });

    networkManager.onAvatarUpdate((userId: string, avatar: AvatarConfig) => {
      this.updateRemoteAvatarAppearance(userId, avatar);
    });

    networkManager.onChatMessage((userId: string, message: string) => {
      this.showChatBubble(userId, message);
    });
  }

  private setupCamera(): void {
    if (this.localAvatar) {
      this.cameras.main.startFollow(this.localAvatar, true, 0.1, 0.1);
      this.cameras.main.setBounds(0, 0, this.tilemap?.widthInPixels || 800, this.tilemap?.heightInPixels || 600);
      this.cameras.main.setZoom(1);
    }
  }

  private addRemoteAvatar(user: WorldUser): void {
    if (this.remoteAvatars.has(user.id)) return;

    const avatar = new Avatar(this, user.position.x, user.position.y, user.avatar);
    avatar.setName(user.name);
    avatar.setTint(0xffffff);
    this.remoteAvatars.set(user.id, avatar);
  }

  private removeRemoteAvatar(userId: string): void {
    const avatar = this.remoteAvatars.get(userId);
    if (avatar) {
      avatar.destroy();
      this.remoteAvatars.delete(userId);
    }
  }

  private updateRemoteAvatarPosition(userId: string, position: { x: number; y: number }): void {
    const avatar = this.remoteAvatars.get(userId);
    if (avatar) {
      avatar.setTargetPosition(position.x, position.y);
    }
  }

  private updateRemoteAvatarAppearance(userId: string, avatarConfig: AvatarConfig): void {
    const avatar = this.remoteAvatars.get(userId);
    if (avatar) {
      avatar.updateAppearance(avatarConfig);
    }
  }

  private showChatBubble(userId: string, message: string): void {
    const avatar = this.remoteAvatars.get(userId) || this.localAvatar;
    if (avatar) {
      avatar.showChatBubble(message);
    }
  }

  updateLocalAvatar(config: AvatarConfig): void {
    if (this.localAvatar) {
      this.localAvatar.updateAppearance(config);
    }
  }

  update(time: number, delta: number): void {
    if (!this.localAvatar) return;

    this.handleMovement(delta);
    this.updateRemoteAvatars(delta);
    this.sendPositionUpdate();
  }

  private handleMovement(delta: number): void {
    if (!this.localAvatar) return;

    const speed = this.moveSpeed * (delta / 1000);
    let moving = false;

    if (this.cursors!.left.isDown || this.wasd!.left.isDown) {
      this.localAvatar.setVelocityX(-speed);
      moving = true;
    } else if (this.cursors!.right.isDown || this.wasd!.right.isDown) {
      this.localAvatar.setVelocityX(speed);
      moving = true;
    } else {
      this.localAvatar.setVelocityX(0);
    }

    if (this.cursors!.up.isDown || this.wasd!.up.isDown) {
      this.localAvatar.setVelocityY(-speed);
      moving = true;
    } else if (this.cursors!.down.isDown || this.wasd!.down.isDown) {
      this.localAvatar.setVelocityY(speed);
      moving = true;
    } else {
      this.localAvatar.setVelocityY(0);
    }

    this.localAvatar.updateAnimation(moving);
  }

  private updateRemoteAvatars(delta: number): void {
    for (const avatar of this.remoteAvatars.values()) {
      avatar.update(delta);
    }
  }

  private sendPositionUpdate(): void {
    if (!this.localAvatar) return;

    const position = { x: this.localAvatar.x, y: this.localAvatar.y };
    const distance = Phaser.Math.Distance.Between(
      this.lastPosition.x,
      this.lastPosition.y,
      position.x,
      position.y
    );

    if (distance > 5) {
      this.lastPosition = position;
      this.positionUpdateThrottle += 16;
      if (this.positionUpdateThrottle >= 100) {
        this.positionUpdateThrottle = 0;
        const networkManager = this.engine.getNetworkManager();
        if (networkManager) {
          networkManager.sendPosition(position);
        }
      }
    }
  }
}