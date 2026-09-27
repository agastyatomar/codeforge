import Phaser from 'phaser';
import { AvatarConfig } from '../phaser';

export class Avatar extends Phaser.Physics.Arcade.Sprite {
  private avatarConfig: AvatarConfig;
  private targetPosition: { x: number; y: number } | null = null;
  private moveSpeed = 200;
  private nameText: Phaser.GameObjects.Text | null = null;
  private chatBubble: Phaser.GameObjects.Container | null = null;
  private chatBubbleTimeout: Phaser.Time.TimerEvent | null = null;
  private currentFrame = 'idle-down';
  private animationsCreated = false;

  constructor(scene: Phaser.Scene, x: number, y: number, config: AvatarConfig) {
    super(scene, x, y, 'avatars', 'idle-down');
    this.avatarConfig = config;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setDepth(10);
    this.setScale(1.5);

    this.createAnimations();
    this.createNameText();
    this.play('idle-down');
  }

  private createAnimations(): void {
    if (this.animationsCreated) return;

    const directions = ['down', 'up', 'left', 'right'];
    const states = ['idle', 'walk'];

    for (const direction of directions) {
      for (const state of states) {
        const key = `${state}-${direction}`;
        const frames = this.anims.generateFrameNames('avatars', {
          prefix: `${key}/`,
          start: 1,
          end: state === 'idle' ? 1 : 4,
          zeroPad: 1,
        });

        if (frames.length > 0) {
          this.anims.create({
            key,
            frames,
            frameRate: state === 'idle' ? 2 : 8,
            repeat: state === 'idle' ? -1 : -1,
          });
        }
      }
    }

    this.animationsCreated = true;
  }

  private createNameText(): void {
    this.nameText = this.scene.add.text(0, -50, '', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '12px',
      fontWeight: '500',
      color: '#e6edf3',
      stroke: '#0d1117',
      strokeThickness: 3,
      align: 'center',
    }).setOrigin(0.5).setDepth(11);
  }

  setName(name: string): void {
    if (this.nameText) {
      this.nameText.setText(name);
    }
  }

  setTargetPosition(x: number, y: number): void {
    this.targetPosition = { x, y };
  }

  updateAnimation(moving: boolean): void {
    if (!this.body) return;

    const velocity = this.body.velocity as Phaser.Math.Vector2;
    let direction = 'down';

    if (Math.abs(velocity.x) > Math.abs(velocity.y)) {
      direction = velocity.x > 0 ? 'right' : 'left';
    } else {
      direction = velocity.y > 0 ? 'down' : 'up';
    }

    const state = moving ? 'walk' : 'idle';
    const newFrame = `${state}-${direction}`;

    if (newFrame !== this.currentFrame && this.anims.exists(newFrame)) {
      this.play(newFrame, true);
      this.currentFrame = newFrame;
    }
  }

  update(delta: number): void {
    if (this.targetPosition && this.body) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, this.targetPosition.x, this.targetPosition.y);

      if (distance > 5) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.targetPosition.x, this.targetPosition.y);
        this.setVelocity(Math.cos(angle) * this.moveSpeed, Math.sin(angle) * this.moveSpeed);
        this.updateAnimation(true);
      } else {
        this.setVelocity(0, 0);
        this.targetPosition = null;
        this.updateAnimation(false);
      }
    }

    if (this.nameText) {
      this.nameText.setPosition(this.x, this.y - 50);
    }

    if (this.chatBubble) {
      this.chatBubble.setPosition(this.x, this.y - 80);
    }
  }

  updateAppearance(config: AvatarConfig): void {
    this.avatarConfig = config;
  }

  showChatBubble(message: string): void {
    if (this.chatBubble) {
      this.chatBubble.destroy();
    }

    const container = this.scene.add.container(this.x, this.y - 80);
    container.setDepth(12);

    const bg = this.scene.add.graphics();
    const padding = 10;
    const maxWidth = 200;

    const text = this.scene.add.text(padding, padding, message, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '12px',
      color: '#e6edf3',
      wordWrap: { width: maxWidth - padding * 2 },
    }).setOrigin(0, 0);

    const width = Math.min(text.width + padding * 2, maxWidth);
    const height = text.height + padding * 2;

    bg.fillStyle(0x161b22, 0.95);
    bg.fillRoundedRect(0, 0, width, height, 8);
    bg.lineStyle(1, 0x30363d, 1);
    bg.strokeRoundedRect(0, 0, width, height, 8);

    const tail = this.scene.add.graphics();
    tail.fillStyle(0x161b22, 0.95);
    tail.fillTriangle(width / 2 - 8, height, width / 2, height + 10, width / 2 + 8, height);
    tail.lineStyle(1, 0x30363d, 1);
    tail.strokeTriangle(width / 2 - 8, height, width / 2, height + 10, width / 2 + 8, height);

    container.add([bg, tail, text]);
    container.setPosition(this.x - width / 2, this.y - 80 - height);

    this.chatBubble = container;

    this.chatBubbleTimeout = this.scene.time.delayedCall(5000, () => {
      if (this.chatBubble) {
        this.scene.tweens.add({
          targets: this.chatBubble,
          alpha: 0,
          duration: 300,
          onComplete: () => {
            if (this.chatBubble) {
              this.chatBubble.destroy();
              this.chatBubble = null;
            }
          },
        });
      }
    });
  }

  destroy(): void {
    if (this.nameText) {
      this.nameText.destroy();
    }
    if (this.chatBubble) {
      this.chatBubble.destroy();
    }
    if (this.chatBubbleTimeout) {
      this.chatBubbleTimeout.remove();
    }
    super.destroy();
  }
}