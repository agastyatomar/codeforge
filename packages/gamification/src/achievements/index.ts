import { createDexieRepository, db } from '@codeforge/data/dexie';
import type { Achievement, AchievementCriteria } from '@codeforge/core/types';

export interface AchievementDefinition extends Achievement {
  hidden?: boolean;
  seasonal?: boolean;
  seasonId?: string;
}

export class AchievementEngine {
  private achievements = new Map<string, AchievementDefinition>();
  private achievementRepo = createDexieRepository(db.achievements);
  private userAchievementRepo = createDexieRepository(db.userAchievements);

  constructor() {
    this.registerBuiltInAchievements();
  }

  private registerBuiltInAchievements(): void {
    const achievements: AchievementDefinition[] = [
      {
        id: 'first-steps',
        name: 'First Steps',
        description: 'Complete your first exercise',
        icon: '👶',
        category: 'course',
        rarity: 'common',
        xpReward: 50,
        criteria: { type: 'count', target: 1, scope: 'exercises_completed' },
        createdAt: Date.now(),
      },
      {
        id: 'getting-started',
        name: 'Getting Started',
        description: 'Complete 10 exercises',
        icon: '🌱',
        category: 'course',
        rarity: 'common',
        xpReward: 100,
        criteria: { type: 'count', target: 10, scope: 'exercises_completed' },
        createdAt: Date.now(),
      },
      {
        id: 'dedicated-learner',
        name: 'Dedicated Learner',
        description: 'Complete 50 exercises',
        icon: '📚',
        category: 'course',
        rarity: 'uncommon',
        xpReward: 250,
        criteria: { type: 'count', target: 50, scope: 'exercises_completed' },
        createdAt: Date.now(),
      },
      {
        id: 'exercise-master',
        name: 'Exercise Master',
        description: 'Complete 200 exercises',
        icon: '🏆',
        category: 'mastery',
        rarity: 'rare',
        xpReward: 500,
        criteria: { type: 'count', target: 200, scope: 'exercises_completed' },
        createdAt: Date.now(),
      },
      {
        id: 'first-course',
        name: 'First Course',
        description: 'Complete your first course',
        icon: '🎓',
        category: 'course',
        rarity: 'common',
        xpReward: 200,
        criteria: { type: 'count', target: 1, scope: 'courses_completed' },
        createdAt: Date.now(),
      },
      {
        id: 'course-collector',
        name: 'Course Collector',
        description: 'Complete 5 courses',
        icon: '📚',
        category: 'course',
        rarity: 'uncommon',
        xpReward: 500,
        criteria: { type: 'count', target: 5, scope: 'courses_completed' },
        createdAt: Date.now(),
      },
      {
        id: 'polyglot',
        name: 'Polyglot',
        description: 'Complete courses in 5 different languages',
        icon: '🌍',
        category: 'mastery',
        rarity: 'rare',
        xpReward: 1000,
        criteria: { type: 'count', target: 5, scope: 'languages_learned' },
        createdAt: Date.now(),
      },
      {
        id: 'streak-3',
        name: 'Three Day Streak',
        description: 'Maintain a 3-day learning streak',
        icon: '🔥',
        category: 'streak',
        rarity: 'common',
        xpReward: 100,
        criteria: { type: 'streak', target: 3 },
        createdAt: Date.now(),
      },
      {
        id: 'streak-7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day learning streak',
        icon: '🔥',
        category: 'streak',
        rarity: 'uncommon',
        xpReward: 250,
        criteria: { type: 'streak', target: 7 },
        createdAt: Date.now(),
      },
      {
        id: 'streak-30',
        name: 'Monthly Master',
        description: 'Maintain a 30-day learning streak',
        icon: '🔥',
        category: 'streak',
        rarity: 'rare',
        xpReward: 1000,
        criteria: { type: 'streak', target: 30 },
        createdAt: Date.now(),
      },
      {
        id: 'streak-100',
        name: 'Century Club',
        description: 'Maintain a 100-day learning streak',
        icon: '💯',
        category: 'streak',
        rarity: 'epic',
        xpReward: 5000,
        criteria: { type: 'streak', target: 100 },
        createdAt: Date.now(),
      },
      {
        id: 'streak-365',
        name: 'Year of Code',
        description: 'Maintain a 365-day learning streak',
        icon: '🗓️',
        category: 'streak',
        rarity: 'legendary',
        xpReward: 10000,
        criteria: { type: 'streak', target: 365 },
        createdAt: Date.now(),
      },
      {
        id: 'perfect-score',
        name: 'Perfectionist',
        description: 'Get 100% on 10 exercises',
        icon: '💯',
        category: 'mastery',
        rarity: 'uncommon',
        xpReward: 300,
        criteria: { type: 'count', target: 10, scope: 'perfect_scores' },
        createdAt: Date.now(),
      },
      {
        id: 'speed-runner',
        name: 'Speed Runner',
        description: 'Complete an exercise in under 30 seconds',
        icon: '⚡',
        category: 'mastery',
        rarity: 'uncommon',
        xpReward: 200,
        criteria: { type: 'custom', target: 1, customFn: 'speed_run_under_30s' },
        createdAt: Date.now(),
      },
      {
        id: 'night-owl',
        name: 'Night Owl',
        description: 'Complete an exercise between midnight and 4 AM',
        icon: '🦉',
        category: 'special',
        rarity: 'uncommon',
        xpReward: 150,
        criteria: { type: 'custom', target: 1, customFn: 'exercise_between_midnight_4am' },
        createdAt: Date.now(),
      },
      {
        id: 'early-bird',
        name: 'Early Bird',
        description: 'Complete an exercise between 5 AM and 7 AM',
        icon: '🐦',
        category: 'special',
        rarity: 'uncommon',
        xpReward: 150,
        criteria: { type: 'custom', target: 1, customFn: 'exercise_between_5am_7am' },
        createdAt: Date.now(),
      },
      {
        id: 'weekend-warrior',
        name: 'Weekend Warrior',
        description: 'Complete 10 exercises on weekends',
        icon: '🏃',
        category: 'special',
        rarity: 'uncommon',
        xpReward: 300,
        criteria: { type: 'count', target: 10, scope: 'weekend_exercises' },
        createdAt: Date.now(),
      },
      {
        id: 'builder',
        name: 'Builder',
        description: 'Create and publish your first build',
        icon: '🛠️',
        category: 'creative',
        rarity: 'common',
        xpReward: 200,
        criteria: { type: 'count', target: 1, scope: 'builds_published' },
        createdAt: Date.now(),
      },
      {
        id: 'remixer',
        name: 'Remixer',
        description: 'Remix 5 builds from other users',
        icon: '🔄',
        category: 'creative',
        rarity: 'uncommon',
        xpReward: 300,
        criteria: { type: 'count', target: 5, scope: 'builds_remixed' },
        createdAt: Date.now(),
      },
      {
        id: 'social-butterfly',
        name: 'Social Butterfly',
        description: 'Make 10 community posts',
        icon: '🦋',
        category: 'social',
        rarity: 'common',
        xpReward: 200,
        criteria: { type: 'count', target: 10, scope: 'community_posts' },
        createdAt: Date.now(),
      },
      {
        id: 'helpful-peer',
        name: 'Helpful Peer',
        description: 'Receive 50 upvotes on your posts',
        icon: '🤝',
        category: 'social',
        rarity: 'rare',
        xpReward: 500,
        criteria: { type: 'count', target: 50, scope: 'upvotes_received' },
        createdAt: Date.now(),
      },
      {
        id: 'mentor',
        name: 'Mentor',
        description: 'Complete 10 mentoring sessions',
        icon: '👨‍🏫',
        category: 'social',
        rarity: 'rare',
        xpReward: 1000,
        criteria: { type: 'count', target: 10, scope: 'mentor_sessions' },
        createdAt: Date.now(),
      },
      {
        id: 'contestant',
        name: 'Contestant',
        description: 'Participate in your first coding contest',
        icon: '🏁',
        category: 'special',
        rarity: 'common',
        xpReward: 300,
        criteria: { type: 'count', target: 1, scope: 'contests_participated' },
        createdAt: Date.now(),
      },
      {
        id: 'champion',
        name: 'Champion',
        description: 'Win a coding contest',
        icon: '🏆',
        category: 'special',
        rarity: 'epic',
        xpReward: 2000,
        criteria: { type: 'count', target: 1, scope: 'contests_won' },
        createdAt: Date.now(),
      },
      {
        id: 'debugger',
        name: 'Debugger',
        description: 'Fix 10 broken code exercises',
        icon: '🐛',
        category: 'mastery',
        rarity: 'uncommon',
        xpReward: 400,
        criteria: { type: 'count', target: 10, scope: 'debugging_exercises' },
        createdAt: Date.now(),
      },
      {
        id: 'code-reviewer',
        name: 'Code Reviewer',
        description: 'Complete 20 code reviews',
        icon: '👀',
        category: 'mastery',
        rarity: 'uncommon',
        xpReward: 500,
        criteria: { type: 'count', target: 20, scope: 'code_reviews' },
        createdAt: Date.now(),
      },
      {
        id: 'explorer',
        name: 'Explorer',
        description: 'Visit all worlds in CodeForge',
        icon: '🗺️',
        category: 'special',
        rarity: 'rare',
        xpReward: 500,
        criteria: { type: 'count', target: 10, scope: 'worlds_visited' },
        createdAt: Date.now(),
      },
      {
        id: 'avatar-collector',
        name: 'Avatar Collector',
        description: 'Unlock 20 avatar items',
        icon: '👗',
        category: 'creative',
        rarity: 'uncommon',
        xpReward: 300,
        criteria: { type: 'count', target: 20, scope: 'avatar_items' },
        createdAt: Date.now(),
      },
      {
        id: 'theme-enthusiast',
        name: 'Theme Enthusiast',
        description: 'Try 10 different themes',
        icon: '🎨',
        category: 'creative',
        rarity: 'common',
        xpReward: 100,
        criteria: { type: 'count', target: 10, scope: 'themes_tried' },
        createdAt: Date.now(),
      },
    ];

    for (const achievement of achievements) {
      this.achievements.set(achievement.id, achievement);
    }
  }

  registerAchievement(achievement: AchievementDefinition): void {
    this.achievements.set(achievement.id, achievement);
  }

  getAchievement(id: string): AchievementDefinition | undefined {
    return this.achievements.get(id);
  }

  getAllAchievements(): AchievementDefinition[] {
    return Array.from(this.achievements.values());
  }

  getAchievementsByCategory(category: Achievement['category']): AchievementDefinition[] {
    return Array.from(this.achievements.values()).filter((a) => a.category === category);
  }

  getAchievementsByRarity(rarity: Achievement['rarity']): AchievementDefinition[] {
    return Array.from(this.achievements.values()).filter((a) => a.rarity === rarity);
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    const userAchievements = await this.userAchievementRepo.find({ where: { userId } });
    return userAchievements.map((ua) => {
      const achievement = this.achievements.get(ua.achievementId);
      return achievement ? { ...achievement, unlockedAt: ua.unlockedAt } : null;
    }).filter(Boolean) as Achievement[];
  }

  async isUnlocked(userId: string, achievementId: string): Promise<boolean> {
    const userAchievement = await this.userAchievementRepo.findById(`${userId}:${achievementId}`);
    return !!userAchievement;
  }

  async unlockAchievement(userId: string, achievementId: string): Promise<Achievement | null> {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) return null;

    const alreadyUnlocked = await this.isUnlocked(userId, achievementId);
    if (alreadyUnlocked) return null;

    await this.userAchievementRepo.create({
      id: `${userId}:${achievementId}`,
      userId,
      achievementId,
      unlockedAt: Date.now(),
    });

    return { ...achievement, unlockedAt: Date.now() };
  }

  async checkAchievements(userId: string, stats: Record<string, number>): Promise<Achievement[]> {
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of this.achievements.values()) {
      if (await this.isUnlocked(userId, achievement.id)) continue;

      if (this.evaluateCriteria(achievement.criteria, stats)) {
        const unlocked = await this.unlockAchievement(userId, achievement.id);
        if (unlocked) newlyUnlocked.push(unlocked);
      }
    }

    return newlyUnlocked;
  }

  private evaluateCriteria(criteria: AchievementCriteria, stats: Record<string, number>): boolean {
    switch (criteria.type) {
      case 'count':
        return (stats[criteria.scope || ''] || 0) >= criteria.target;
      case 'streak':
        return (stats.currentStreak || 0) >= criteria.target;
      case 'completion':
        return (stats.completionRate || 0) >= criteria.target;
      case 'custom':
        return this.evaluateCustom(criteria.customFn || '', stats);
      default:
        return false;
    }
  }

  private evaluateCustom(fn: string, stats: Record<string, number>): boolean {
    switch (fn) {
      case 'speed_run_under_30s':
        return (stats.fastestExerciseTime || Infinity) < 30000;
      case 'exercise_between_midnight_4am':
        return stats.exercisesMidnightTo4am > 0;
      case 'exercise_between_5am_7am':
        return stats.exercises5amTo7am > 0;
      default:
        return false;
    }
  }

  async initializeDatabase(): Promise<void> {
    for (const achievement of this.achievements.values()) {
      const existing = await this.achievementRepo.findById(achievement.id);
      if (!existing) {
        await this.achievementRepo.create({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          category: achievement.category,
          rarity: achievement.rarity,
          xpReward: achievement.xpReward,
          criteria: JSON.stringify(achievement.criteria),
          createdAt: achievement.createdAt,
        });
      }
    }
  }

  getAchievementProgress(userId: string, achievementId: string, stats: Record<string, number>): { current: number; target: number; percentage: number } {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) return { current: 0, target: 0, percentage: 0 };

    let current = 0;
    switch (achievement.criteria.type) {
      case 'count':
        current = stats[achievement.criteria.scope || ''] || 0;
        break;
      case 'streak':
        current = stats.currentStreak || 0;
        break;
      case 'completion':
        current = Math.round((stats.completionRate || 0) * 100);
        break;
    }

    return {
      current: Math.min(current, achievement.criteria.target),
      target: achievement.criteria.target,
      percentage: Math.min((current / achievement.criteria.target) * 100, 100),
    };
  }
}

export function createAchievementEngine(): AchievementEngine {
  return new AchievementEngine();
}

export const ACHIEVEMENT_CATEGORIES = [
  'course',
  'streak',
  'social',
  'creative',
  'mastery',
  'special',
] as const;

export const ACHIEVEMENT_RARITIES = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
] as const;

export const RARITY_COLORS = {
  common: '#8b949e',
  uncommon: '#3fb950',
  rare: '#58a6ff',
  epic: '#bc8cff',
  legendary: '#d29922',
} as const;