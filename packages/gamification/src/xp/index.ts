import { createDexieRepository, db } from '@codeforge/data/dexie';
import type { UserStats, Achievement } from '@codeforge/core/types';

export interface XPEvent {
  userId: string;
  amount: number;
  source: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface LevelThresholds {
  level: number;
  xpRequired: number;
  totalXP: number;
  rewards: LevelReward[];
}

export interface LevelReward {
  type: 'badge' | 'title' | 'theme' | 'avatar-item' | 'currency' | 'unlock';
  id: string;
  name: string;
  description: string;
}

export class XPSystem {
  private statsRepo = createDexieRepository(db.users);
  private xpEventsRepo = createDexieRepository(db.syncQueue as any);
  private levelThresholds: LevelThresholds[];

  constructor() {
    this.levelThresholds = this.generateLevelThresholds();
  }

  private generateLevelThresholds(): LevelThresholds[] {
    const thresholds: LevelThresholds[] = [];
    let totalXP = 0;

    for (let level = 1; level <= 100; level++) {
      const xpRequired = Math.floor(100 * Math.pow(1.15, level - 1));
      totalXP += xpRequired;

      const rewards: LevelReward[] = [];

      if (level % 5 === 0) {
        rewards.push({
          type: 'badge',
          id: `level-${level}-badge`,
          name: `Level ${level} Badge`,
          description: `Reached level ${level}`,
        });
      }

      if (level % 10 === 0) {
        rewards.push({
          type: 'title',
          id: `level-${level}-title`,
          name: this.getLevelTitle(level),
          description: `Unlocked at level ${level}`,
        });
      }

      if (level % 25 === 0) {
        rewards.push({
          type: 'theme',
          id: `level-${level}-theme`,
          name: `Level ${level} Theme`,
          description: `Exclusive theme unlocked at level ${level}`,
        });
      }

      thresholds.push({ level, xpRequired, totalXP, rewards });
    }

    return thresholds;
  }

  private getLevelTitle(level: number): string {
    if (level >= 100) return 'Code Legend';
    if (level >= 90) return 'Grandmaster';
    if (level >= 80) return 'Master';
    if (level >= 70) return 'Expert';
    if (level >= 60) return 'Senior';
    if (level >= 50) return 'Pro';
    if (level >= 40) return 'Advanced';
    if (level >= 30) return 'Experienced';
    if (level >= 20) return 'Developer';
    if (level >= 10) return 'Coder';
    return 'Novice';
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const user = await this.statsRepo.findById(userId);
    if (!user) {
      return this.createDefaultStats(userId);
    }
    return JSON.parse(user.stats || '{}') as UserStats;
  }

  private createDefaultStats(userId: string): UserStats {
    return {
      totalXP: 0,
      level: 1,
      currentLevelXP: 0,
      nextLevelXP: 100,
      streakDays: 0,
      longestStreak: 0,
      coursesCompleted: 0,
      exercisesCompleted: 0,
      achievementsUnlocked: 0,
      totalTimeSpent: 0,
      lastActiveDate: new Date(),
    };
  }

  async awardXP(userId: string, amount: number, source: string, metadata?: Record<string, unknown>): Promise<UserStats> {
    const stats = await this.getUserStats(userId);
    const oldLevel = stats.level;

    stats.totalXP += amount;
    this.updateLevel(stats);

    await this.recordXPEvent(userId, amount, source, metadata);

    if (stats.level > oldLevel) {
      await this.handleLevelUp(userId, stats, oldLevel);
    }

    await this.updateUserStats(userId, stats);
    return stats;
  }

  private updateLevel(stats: UserStats): void {
    for (const threshold of this.levelThresholds) {
      if (stats.totalXP >= threshold.totalXP) {
        stats.level = threshold.level;
        stats.currentLevelXP = stats.totalXP - (threshold.totalXP - threshold.xpRequired);
        stats.nextLevelXP = threshold.xpRequired;
      } else {
        break;
      }
    }
  }

  private async handleLevelUp(userId: string, stats: UserStats, oldLevel: number): Promise<void> {
    const threshold = this.levelThresholds.find((t) => t.level === stats.level);
    if (threshold) {
      for (const reward of threshold.rewards) {
        await this.grantReward(userId, reward);
      }
    }
  }

  private async grantReward(userId: string, reward: LevelReward): Promise<void> {
    switch (reward.type) {
      case 'badge':
        await this.unlockAchievement(userId, reward.id);
        break;
      case 'title':
        await this.grantTitle(userId, reward.id);
        break;
      case 'theme':
        await this.unlockTheme(userId, reward.id);
        break;
      case 'avatar-item':
        await this.unlockAvatarItem(userId, reward.id);
        break;
    }
  }

  private async unlockAchievement(userId: string, achievementId: string): Promise<void> {
    const userAchievementsRepo = createDexieRepository(db.userAchievements);
    const existing = await userAchievementsRepo.findById(`${userId}:${achievementId}`);
    if (!existing) {
      await userAchievementsRepo.create({
        id: `${userId}:${achievementId}`,
        userId,
        achievementId,
        unlockedAt: Date.now(),
      });
    }
  }

  private async grantTitle(userId: string, titleId: string): Promise<void> {
  }

  private async unlockTheme(userId: string, themeId: string): Promise<void> {
  }

  private async unlockAvatarItem(userId: string, itemId: string): Promise<void> {
  }

  private async recordXPEvent(userId: string, amount: number, source: string, metadata?: Record<string, unknown>): Promise<void> {
    const event: XPEvent = {
      userId,
      amount,
      source,
      timestamp: Date.now(),
      metadata,
    };
    await this.xpEventsRepo.create({
      id: `xp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      entityType: 'xp-event',
      entityId: event.userId,
      operation: 'create',
      data: JSON.stringify(event),
      timestamp: event.timestamp,
      retries: 0,
    });
  }

  private async updateUserStats(userId: string, stats: UserStats): Promise<void> {
    await this.statsRepo.update(userId, { stats: JSON.stringify(stats), updatedAt: Date.now() });
  }

  getLevelThresholds(): LevelThresholds[] {
    return this.levelThresholds;
  }

  getLevelInfo(level: number): LevelThresholds | undefined {
    return this.levelThresholds.find((t) => t.level === level);
  }

  calculateLevelFromXP(totalXP: number): { level: number; currentLevelXP: number; nextLevelXP: number; progress: number } {
    let level = 1;
    let currentLevelXP = 0;
    let nextLevelXP = 100;

    for (const threshold of this.levelThresholds) {
      if (totalXP >= threshold.totalXP) {
        level = threshold.level;
        currentLevelXP = totalXP - (threshold.totalXP - threshold.xpRequired);
        nextLevelXP = threshold.xpRequired;
      } else {
        break;
      }
    }

    const progress = nextLevelXP > 0 ? (currentLevelXP / nextLevelXP) * 100 : 100;
    return { level, currentLevelXP, nextLevelXP, progress };
  }

  getXPForNextLevel(currentLevel: number): number {
    const threshold = this.levelThresholds.find((t) => t.level === currentLevel);
    return threshold?.xpRequired || 100;
  }

  getTotalXPForLevel(level: number): number {
    const threshold = this.levelThresholds.find((t) => t.level === level);
    return threshold?.totalXP || 0;
  }
}

export function createXPSystem(): XPSystem {
  return new XPSystem();
}

export const XP_SOURCES = {
  EXERCISE_COMPLETE: 'exercise:complete',
  LESSON_COMPLETE: 'lesson:complete',
  COURSE_COMPLETE: 'course:complete',
  CHALLENGE_COMPLETE: 'challenge:complete',
  DAILY_LOGIN: 'daily:login',
  STREAK_BONUS: 'streak:bonus',
  ACHIEVEMENT_UNLOCK: 'achievement:unlock',
  COMMUNITY_POST: 'community:post',
  COMMUNITY_REPLY: 'community:reply',
  BUILD_PUBLISH: 'build:publish',
  BUILD_REMIX: 'build:remix',
  WORLD_VISIT: 'world:visit',
  CODE_REVIEW: 'code:review',
  MENTOR_SESSION: 'mentor:session',
  CONTEST_PARTICIPATE: 'contest:participate',
  CONTEST_WIN: 'contest:win',
} as const;

export const XP_AMOUNTS = {
  [XP_SOURCES.EXERCISE_COMPLETE]: 50,
  [XP_SOURCES.LESSON_COMPLETE]: 200,
  [XP_SOURCES.COURSE_COMPLETE]: 1000,
  [XP_SOURCES.CHALLENGE_COMPLETE]: 100,
  [XP_SOURCES.DAILY_LOGIN]: 25,
  [XP_SOURCES.STREAK_BONUS]: 50,
  [XP_SOURCES.ACHIEVEMENT_UNLOCK]: 200,
  [XP_SOURCES.COMMUNITY_POST]: 30,
  [XP_SOURCES.COMMUNITY_REPLY]: 10,
  [XP_SOURCES.BUILD_PUBLISH]: 150,
  [XP_SOURCES.BUILD_REMIX]: 75,
  [XP_SOURCES.WORLD_VISIT]: 20,
  [XP_SOURCES.CODE_REVIEW]: 100,
  [XP_SOURCES.MENTOR_SESSION]: 200,
  [XP_SOURCES.CONTEST_PARTICIPATE]: 300,
  [XP_SOURCES.CONTEST_WIN]: 1000,
} as const;