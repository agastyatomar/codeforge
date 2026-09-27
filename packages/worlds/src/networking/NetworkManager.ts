import { WorldEngine, WorldUser, AvatarConfig } from '../phaser';
import { WebrtcProvider } from 'y-webrtc';
import * as Y from 'yjs';

export interface NetworkCallbacks {
  onUserJoin?: (user: WorldUser) => void;
  onUserLeave?: (userId: string) => void;
  onPositionUpdate?: (userId: string, position: { x: number; y: number }) => void;
  onAvatarUpdate?: (userId: string, avatar: AvatarConfig) => void;
  onChatMessage?: (userId: string, message: string) => void;
}

export class NetworkManager {
  private engine: WorldEngine;
  private provider: WebrtcProvider | null = null;
  private doc: Y.Doc | null = null;
  private usersMap: Y.Map<WorldUser> | null = null;
  private positionsMap: Y.Map<{ x: number; y: number }> | null = null;
  private avatarsMap: Y.Map<AvatarConfig> | null = null;
  private chatArray: Y.Array<{ userId: string; message: string; timestamp: number }> | null = null;
  private callbacks: NetworkCallbacks = {};
  private connected = false;
  private localUserId: string;
  private localUserName: string;
  private localAvatar: AvatarConfig;

  constructor(engine: WorldEngine) {
    this.engine = engine;
    this.localUserId = engine.getUserId();
    this.localUserName = engine.getUserName();
    this.localAvatar = engine.getAvatar();
  }

  async connect(): Promise<void> {
    this.doc = new Y.Doc();

    this.usersMap = this.doc.getMap('users');
    this.positionsMap = this.doc.getMap('positions');
    this.avatarsMap = this.doc.getMap('avatars');
    this.chatArray = this.doc.getArray('chat');

    this.provider = new WebrtcProvider('codeforge-world', this.doc, {
      signaling: ['wss://signaling.yjs.dev', 'wss://signaling.yjs.dev:443'],
      maxConns: 20,
    });

    this.provider.on('status', (event: { connected: boolean }) => {
      this.connected = event.connected;
      if (event.connected) {
        this.announceLocalUser();
      }
    });

    this.usersMap.observe((event) => {
      event.changes.keys.forEach((change, userId) => {
        if (change.action === 'add' || change.action === 'update') {
          const user = this.usersMap!.get(userId);
          if (user && userId !== this.localUserId) {
            this.callbacks.onUserJoin?.(user);
          }
        } else if (change.action === 'delete') {
          this.callbacks.onUserLeave?.(userId);
        }
      });
    });

    this.positionsMap.observe((event) => {
      event.changes.keys.forEach((_change, userId) => {
        if (userId !== this.localUserId) {
          const position = this.positionsMap!.get(userId);
          if (position) {
            this.callbacks.onPositionUpdate?.(userId, position);
          }
        }
      });
    });

    this.avatarsMap.observe((event) => {
      event.changes.keys.forEach((_change, userId) => {
        if (userId !== this.localUserId) {
          const avatar = this.avatarsMap!.get(userId);
          if (avatar) {
            this.callbacks.onAvatarUpdate?.(userId, avatar);
          }
        }
      });
    });

    this.chatArray.observe((event) => {
      event.changes.delta.forEach((delta) => {
        if (delta.insert && delta.insert.length > 0) {
          for (const item of delta.insert) {
            if (item.userId !== this.localUserId) {
              this.callbacks.onChatMessage?.(item.userId, item.message);
            }
          }
        }
      });
    });

    return new Promise((resolve) => {
      if (this.connected) {
        resolve();
      } else {
        const check = setInterval(() => {
          if (this.connected) {
            clearInterval(check);
            resolve();
          }
        }, 100);
      }
    });
  }

  private announceLocalUser(): void {
    if (!this.usersMap) return;

    const user: WorldUser = {
      id: this.localUserId,
      name: this.localUserName,
      avatar: this.localAvatar,
      position: { x: 400, y: 300 },
      lastActive: Date.now(),
    };

    this.usersMap.set(this.localUserId, user);
    this.positionsMap!.set(this.localUserId, user.position);
    this.avatarsMap!.set(this.localUserId, this.localAvatar);
  }

  sendPosition(position: { x: number; y: number }): void {
    if (!this.positionsMap || !this.connected) return;
    this.positionsMap.set(this.localUserId, position);
  }

  sendAvatarUpdate(avatar: AvatarConfig): void {
    if (!this.avatarsMap || !this.connected) return;
    this.localAvatar = avatar;
    this.avatarsMap.set(this.localUserId, avatar);
    this.usersMap!.set(this.localUserId, {
      ...this.usersMap!.get(this.localUserId)!,
      avatar,
    });
  }

  sendChatMessage(message: string): void {
    if (!this.chatArray || !this.connected) return;
    this.chatArray.push([{
      userId: this.localUserId,
      message,
      timestamp: Date.now(),
    }]);
  }

  onUserJoin(callback: (user: WorldUser) => void): void {
    this.callbacks.onUserJoin = callback;
  }

  onUserLeave(callback: (userId: string) => void): void {
    this.callbacks.onUserLeave = callback;
  }

  onPositionUpdate(callback: (userId: string, position: { x: number; y: number }) => void): void {
    this.callbacks.onPositionUpdate = callback;
  }

  onAvatarUpdate(callback: (userId: string, avatar: AvatarConfig) => void): void {
    this.callbacks.onAvatarUpdate = callback;
  }

  onChatMessage(callback: (userId: string, message: string) => void): void {
    this.callbacks.onChatMessage = callback;
  }

  disconnect(): void {
    if (this.usersMap) {
      this.usersMap.delete(this.localUserId);
      this.positionsMap!.delete(this.localUserId);
      this.avatarsMap!.delete(this.localUserId);
    }
    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
    }
    if (this.doc) {
      this.doc.destroy();
      this.doc = null;
    }
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getConnectedUsers(): WorldUser[] {
    if (!this.usersMap) return [];
    const users: WorldUser[] = [];
    this.usersMap.forEach((user) => {
      if (user.id !== this.localUserId) {
        users.push(user);
      }
    });
    return users;
  }
}