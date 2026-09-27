import Phaser from 'phaser';
import { WorldEngine } from '../phaser';

export class LobbyScene extends Phaser.Scene {
  private engine: WorldEngine;
  private background: Phaser.GameObjects.Graphics | null = null;
  private titleText: Phaser.GameObjects.Text | null = null;
  private playButton: Phaser.GameObjects.Container | null = null;
  private avatarPreview: Phaser.GameObjects.Container | null = null;
  private userList: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'LobbyScene' });
  }

  init(data: { engine: WorldEngine }): void {
    this.engine = data.engine;
  }

  create(): void {
    this.createBackground();
    this.createTitle();
    this.createPlayButton();
    this.createAvatarPreview();
    this.createUserList();
    this.setupAnimations();
  }

  private createBackground(): void {
    this.background = this.add.graphics();
    this.background.fillGradientStyle(0x0d1117, 0x0d1117, 0x161b22, 0x161b22, 1);
    this.background.fillRect(0, 0, this.scale.width, this.scale.height);

    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, this.scale.width);
      const y = Phaser.Math.Between(0, this.scale.height);
      const size = Phaser.Math.Between(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.1, 0.3);
      this.background.fillStyle(0x58a6ff, alpha);
      this.background.fillCircle(x, y, size);
    }
  }

  private createTitle(): void {
    this.titleText = this.add.text(this.scale.width / 2, 100, 'CODEFORGE', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '64px',
      fontWeight: '700',
      color: '#58a6ff',
      stroke: '#0d1117',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(this.scale.width / 2, 170, 'Learn. Build. Connect.', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '24px',
      color: '#8b949e',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: this.titleText,
      scale: { from: 1, to: 1.05 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createPlayButton(): void {
    const container = this.add.container(this.scale.width / 2, this.scale.height / 2 + 50);

    const bg = this.add.graphics();
    bg.fillStyle(0x238636, 1);
    bg.fillRoundedRect(-120, -40, 240, 80, 12);
    bg.lineStyle(2, 0x3fb950, 1);
    bg.strokeRoundedRect(-120, -40, 240, 80, 12);

    const text = this.add.text(0, 0, 'ENTER WORLD', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '24px',
      fontWeight: '600',
      color: '#ffffff',
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(240, 80);
    container.setInteractive(new Phaser.Geom.Rectangle(-120, -40, 240, 80), Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x3fb950, 1);
      bg.fillRoundedRect(-120, -40, 240, 80, 12);
      this.tweens.add({ targets: container, scale: 1.05, duration: 100 });
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x238636, 1);
      bg.fillRoundedRect(-120, -40, 240, 80, 12);
      this.tweens.add({ targets: container, scale: 1, duration: 100 });
    });

    container.on('pointerdown', () => {
      this.engine.enterWorld('main');
    });

    this.playButton = container;
  }

  private createAvatarPreview(): void {
    const container = this.add.container(this.scale.width / 2, this.scale.height / 2 - 150);
    const avatarConfig = this.engine.getAvatar();

    const bg = this.add.graphics();
    bg.fillStyle(0x161b22, 1);
    bg.fillRoundedRect(-100, -100, 200, 200, 16);
    bg.lineStyle(2, 0x30363d, 1);
    bg.strokeRoundedRect(-100, -100, 200, 200, 16);

    const avatarText = this.add.text(0, 0, this.getAvatarEmoji(avatarConfig), {
      fontSize: '80px',
    }).setOrigin(0.5);

    const nameText = this.add.text(0, 120, this.engine.getUserName(), {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '18px',
      color: '#e6edf3',
    }).setOrigin(0.5);

    container.add([bg, avatarText, nameText]);
    this.avatarPreview = container;
  }

  private getAvatarEmoji(config: any): string {
    const skins = ['👤', '🧑', '👨', '👩', '🧔', '👴', '👵'];
    return skins[config.skinTone % skins.length] || '👤';
  }

  private createUserList(): void {
    const container = this.add.container(this.scale.width - 250, 100);

    const bg = this.add.graphics();
    bg.fillStyle(0x161b22, 0.9);
    bg.fillRoundedRect(0, 0, 220, 300, 12);
    bg.lineStyle(1, 0x30363d, 1);
    bg.strokeRoundedRect(0, 0, 220, 300, 12);

    const title = this.add.text(110, 20, 'ONLINE USERS', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '14px',
      fontWeight: '600',
      color: '#58a6ff',
    }).setOrigin(0.5, 0);

    const users = [
      { name: 'CodeMaster', avatar: '👨‍💻' },
      { name: 'ScriptKitty', avatar: '🐱‍💻' },
      { name: 'BugHunter', avatar: '🐛' },
      { name: 'DevWizard', avatar: '🧙‍♂️' },
      { name: 'PixelPilot', avatar: '🎮' },
    ];

    const userItems: Phaser.GameObjects.Text[] = [];
    users.forEach((user, index) => {
      const text = this.add.text(20, 50 + index * 40, `${user.avatar} ${user.name}`, {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '14px',
        color: '#e6edf3',
      });
      userItems.push(text);
    });

    container.add([bg, title, ...userItems]);
    this.userList = container;
  }

  private setupAnimations(): void {
    if (this.playButton) {
      this.tweens.add({
        targets: this.playButton,
        y: this.playButton.y + 5,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }
}