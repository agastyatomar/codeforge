export * from './xp';
export * from './achievements';
export * from './leaderboard';
export * from './streaks';
export * from './rewards';

import { XPSystem, createXPSystem } from './xp';
import { AchievementEngine, createAchievementEngine } from './achievements';
import { LeaderboardEngine, createLeaderboardEngine } from './leaderboard';
import { StreakEngine, createStreakEngine } from './streaks';
import { RewardEngine, createRewardEngine } from './rewards';

export {
  XPSystem,
  createXPSystem,
  AchievementEngine,
  createAchievementEngine,
  LeaderboardEngine,
  createLeaderboardEngine,
  StreakEngine,
  createStreakEngine,
  RewardEngine,
  createRewardEngine,
};

export type { XPEvent, LevelThresholds, LevelReward } from './xp';
export type { AchievementDefinition } from './achievements';
export type { LeaderboardEntry, LeaderboardConfig } from './leaderboard';
export type { StreakData, StreakDay, StreakConfig } from './streaks';
export type { Reward, UserRewards, ActiveBoost, LootBox, LootBoxReward } from './rewards';