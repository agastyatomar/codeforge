import { createDexieRepository, db } from '@codeforge/data/dexie';

export interface StreakData {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  streakHistory: StreakDay[];
  freezeCount: number;
  freezesUsed: number;
  lastFreezeDate?: string;
}

export interface StreakDay {
  date: string;
  active: boolean;
  xpEarned: number;
  exercisesCompleted: number;
  coursesProgressed: number;
}

export interface StreakConfig {
  freezeEnabled: boolean;
  maxFreezes: number;
  freezeCooldownDays: number;
  timezone: string;
  streakStartHour: number;
}

export class StreakEngine {
  private streakRepo = createDexieRepository(db.syncQueue as any);
  private config: StreakConfig;

  constructor(config: Partial<StreakConfig> = {}) {
    this.config = {
      freezeEnabled: true,
      maxFreezes: 3,
      freezeCooldownDays: 7,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      streakStartHour: 0,
      ...config,
    };
  }

  async getStreak(userId: string): Promise<StreakData> {
    const records = await this.streakRepo.find({
      where: { entityType: 'streak', entityId: userId },
      orderBy: [{ field: 'timestamp', direction: 'desc' }],
      limit: 1,
    });

    if (records.length > 0) {
      return JSON.parse(records[0].data);
    }

    return this.createDefaultStreak(userId);
  }

  private createDefaultStreak(userId: string): StreakData {
    return {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: '',
      streakHistory: [],
      freezeCount: this.config.maxFreezes,
      freezesUsed: 0,
    };
  }

  async recordActivity(userId: string, activity: { xpEarned: number; exercisesCompleted: number; coursesProgressed: number }): Promise<StreakData> {
    const streak = await this.getStreak(userId);
    const today = this.getTodayString();
    const yesterday = this.getYesterdayString();

    const alreadyActiveToday = streak.streakHistory.some((d) => d.date === today && d.active);
    if (alreadyActiveToday) {
      const dayIndex = streak.streakHistory.findIndex((d) => d.date === today);
      if (dayIndex >= 0) {
        streak.streakHistory[dayIndex].xpEarned += activity.xpEarned;
        streak.streakHistory[dayIndex].exercisesCompleted += activity.exercisesCompleted;
        streak.streakHistory[dayIndex].coursesProgressed += activity.coursesProgressed;
      }
      return this.saveStreak(streak);
    }

    const wasActiveYesterday = streak.streakHistory.some((d) => d.date === yesterday && d.active);

    if (wasActiveYesterday) {
      streak.currentStreak += 1;
    } else if (streak.lastActiveDate && streak.lastActiveDate !== yesterday) {
      const daysSinceLastActive = this.daysBetween(streak.lastActiveDate, yesterday);
      if (daysSinceLastActive === 1) {
        streak.currentStreak += 1;
      } else {
        streak.currentStreak = 1;
      }
    } else {
      streak.currentStreak = 1;
    }

    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    streak.lastActiveDate = today;
    streak.streakHistory.push({
      date: today,
      active: true,
      xpEarned: activity.xpEarned,
      exercisesCompleted: activity.exercisesCompleted,
      coursesProgressed: activity.coursesProgressed,
    });

    streak.streakHistory = streak.streakHistory.slice(-365);

    return this.saveStreak(streak);
  }

  async useFreeze(userId: string): Promise<{ success: boolean; streak?: StreakData; error?: string }> {
    if (!this.config.freezeEnabled) {
      return { success: false, error: 'Streak freezes are not enabled' };
    }

    const streak = await this.getStreak(userId);
    const today = this.getTodayString();
    const yesterday = this.getYesterdayString();

    const wasActiveYesterday = streak.streakHistory.some((d) => d.date === yesterday && d.active);
    const alreadyActiveToday = streak.streakHistory.some((d) => d.date === today && d.active);

    if (alreadyActiveToday) {
      return { success: false, error: 'Already active today' };
    }

    if (wasActiveYesterday) {
      return { success: false, error: 'Cannot freeze - was active yesterday' };
    }

    if (streak.freezesUsed >= this.config.maxFreezes) {
      return { success: false, error: 'No freezes remaining' };
    }

    if (streak.lastFreezeDate) {
      const daysSinceLastFreeze = this.daysBetween(streak.lastFreezeDate, today);
      if (daysSinceLastFreeze < this.config.freezeCooldownDays) {
        return { success: false, error: `Freeze on cooldown. Available in ${this.config.freezeCooldownDays - daysSinceLastFreeze} days` };
      }
    }

    streak.freezesUsed += 1;
    streak.freezeCount = Math.max(0, streak.freezeCount - 1);
    streak.lastFreezeDate = today;

    streak.streakHistory.push({
      date: today,
      active: false,
      xpEarned: 0,
      exercisesCompleted: 0,
      coursesProgressed: 0,
    });

    const saved = await this.saveStreak(streak);
    return { success: true, streak: saved };
  }

  async getStreakStatus(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    isActiveToday: boolean;
    canFreeze: boolean;
    freezesRemaining: number;
    nextFreezeAvailable?: string;
    streakAtRisk: boolean;
  }> {
    const streak = await this.getStreak(userId);
    const today = this.getTodayString();
    const yesterday = this.getYesterdayString();

    const isActiveToday = streak.streakHistory.some((d) => d.date === today && d.active);
    const wasActiveYesterday = streak.streakHistory.some((d) => d.date === yesterday && d.active);

    const canFreeze = this.config.freezeEnabled &&
      streak.freezesUsed < this.config.maxFreezes &&
      !isActiveToday &&
      !wasActiveYesterday &&
      (!streak.lastFreezeDate || this.daysBetween(streak.lastFreezeDate, today) >= this.config.freezeCooldownDays);

    const streakAtRisk = !isActiveToday && !wasActiveYesterday && streak.currentStreak > 0;

    let nextFreezeAvailable: string | undefined;
    if (streak.lastFreezeDate) {
      const daysSinceLastFreeze = this.daysBetween(streak.lastFreezeDate, today);
      if (daysSinceLastFreeze < this.config.freezeCooldownDays) {
        const availableDate = new Date(today);
        availableDate.setDate(availableDate.getDate() + (this.config.freezeCooldownDays - daysSinceLastFreeze));
        nextFreezeAvailable = this.formatDate(availableDate);
      }
    }

    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      isActiveToday,
      canFreeze,
      freezesRemaining: this.config.maxFreezes - streak.freezesUsed,
      nextFreezeAvailable,
      streakAtRisk,
    };
  }

  async getStreakCalendar(userId: string, year: number, month: number): Promise<StreakDay[]> {
    const streak = await this.getStreak(userId);
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const calendar: StreakDay[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = this.formatDate(d);
      const day = streak.streakHistory.find((sd) => sd.date === dateStr);
      calendar.push(day || { date: dateStr, active: false, xpEarned: 0, exercisesCompleted: 0, coursesProgressed: 0 });
    }

    return calendar;
  }

  async getStreakStats(userId: string): Promise<{
    totalActiveDays: number;
    totalXPEarned: number;
    averageXPPerDay: number;
    longestStreak: number;
    currentStreak: number;
    freezesUsed: number;
    freezesRemaining: number;
  }> {
    const streak = await this.getStreak(userId);
    const activeDays = streak.streakHistory.filter((d) => d.active);
    const totalXP = activeDays.reduce((sum, d) => sum + d.xpEarned, 0);

    return {
      totalActiveDays: activeDays.length,
      totalXPEarned: totalXP,
      averageXPPerDay: activeDays.length > 0 ? totalXP / activeDays.length : 0,
      longestStreak: streak.longestStreak,
      currentStreak: streak.currentStreak,
      freezesUsed: streak.freezesUsed,
      freezesRemaining: this.config.maxFreezes - streak.freezesUsed,
    };
  }

  private async saveStreak(streak: StreakData): Promise<StreakData> {
    await this.streakRepo.create({
      id: `streak-${streak.userId}-${Date.now()}`,
      entityType: 'streak',
      entityId: streak.userId,
      operation: 'update',
      data: JSON.stringify(streak),
      timestamp: Date.now(),
      retries: 0,
    });
    return streak;
  }

  private getTodayString(): string {
    return this.formatDate(new Date());
  }

  private getYesterdayString(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.formatDate(yesterday);
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private daysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

export function createStreakEngine(config?: Partial<StreakConfig>): StreakEngine {
  return new StreakEngine(config);
}

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 200, 365, 500, 1000];

export function getStreakMilestone(streak: number): number | null {
  return STREAK_MILESTONES.find((m) => m === streak) || null;
}

export function getNextMilestone(streak: number): number | null {
  return STREAK_MILESTONES.find((m) => m > streak) || null;
}

export function formatStreak(streak: number): string {
  if (streak === 1) return '1 day';
  if (streak < 7) return `${streak} days`;
  if (streak < 30) return `${Math.floor(streak / 7)} weeks ${streak % 7} days`;
  if (streak < 365) return `${Math.floor(streak / 30)} months ${streak % 30} days`;
  return `${Math.floor(streak / 365)} years ${streak % 365} days`;
}