import { createDexieRepository, db } from '@codeforge/data/dexie';

export interface Reward {
  id: string;
  type: 'currency' | 'avatar-item' | 'theme' | 'title' | 'badge' | 'unlock' | 'boost';
  name: string;
  description: string;
  icon: string;
  value: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  metadata?: Record<string, unknown>;
}

export interface UserRewards {
  userId: string;
  currency: number;
  avatarItems: string[];
  themes: string[];
  titles: string[];
  badges: string[];
  unlocks: string[];
  activeBoosts: ActiveBoost[];
}

export interface ActiveBoost {
  id: string;
  type: 'xp' | 'streak' | 'currency' | 'drop-rate';
  multiplier: number;
  expiresAt: number;
  source: string;
}

export interface LootBox {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  currencyType: 'coins' | 'gems';
  rewards: LootBoxReward[];
  cooldownHours?: number;
}

export interface LootBoxReward {
  reward: Reward;
  probability: number;
  minQuantity: number;
  maxQuantity: number;
}

export class RewardEngine {
  private rewardsRepo = createDexieRepository(db.syncQueue as any);
  private lootBoxes = new Map<string, LootBox>();
  private rewardDefinitions = new Map<string, Reward>();

  constructor() {
    this.registerBuiltInRewards();
    this.registerLootBoxes();
  }

  private registerBuiltInRewards(): void {
    const rewards: Reward[] = [
      { id: 'coins-10', type: 'currency', name: '10 Coins', description: 'A small amount of coins', icon: '🪙', value: 10, rarity: 'common' },
      { id: 'coins-50', type: 'currency', name: '50 Coins', description: 'A handful of coins', icon: '🪙', value: 50, rarity: 'common' },
      { id: 'coins-100', type: 'currency', name: '100 Coins', description: 'A pouch of coins', icon: '💰', value: 100, rarity: 'uncommon' },
      { id: 'coins-500', type: 'currency', name: '500 Coins', description: 'A chest of coins', icon: '💰', value: 500, rarity: 'rare' },
      { id: 'gems-1', type: 'currency', name: '1 Gem', description: 'A precious gem', icon: '💎', value: 1, rarity: 'rare', metadata: { currencyType: 'gems' } },
      { id: 'gems-5', type: 'currency', name: '5 Gems', description: 'A handful of gems', icon: '💎', value: 5, rarity: 'epic', metadata: { currencyType: 'gems' } },
      { id: 'avatar-hat-1', type: 'avatar-item', name: 'Baseball Cap', description: 'A cool baseball cap', icon: '🧢', value: 50, rarity: 'common', metadata: { slot: 'head', itemId: 'hat-baseball' } },
      { id: 'avatar-hat-2', type: 'avatar-item', name: 'Wizard Hat', description: 'A magical wizard hat', icon: '🧙', value: 200, rarity: 'uncommon', metadata: { slot: 'head', itemId: 'hat-wizard' } },
      { id: 'avatar-glasses-1', type: 'avatar-item', name: 'Nerd Glasses', description: 'Classic nerd glasses', icon: '👓', value: 100, rarity: 'common', metadata: { slot: 'face', itemId: 'glasses-nerd' } },
      { id: 'avatar-shirt-1', type: 'avatar-item', name: 'CodeForge T-Shirt', description: 'Official CodeForge merchandise', icon: '👕', value: 150, rarity: 'uncommon', metadata: { slot: 'body', itemId: 'shirt-codeforge' } },
      { id: 'theme-dark', type: 'theme', name: 'Dark Theme', description: 'Classic dark theme', icon: '🌙', value: 0, rarity: 'common', metadata: { themeId: 'dark' } },
      { id: 'theme-neon', type: 'theme', name: 'Neon Dreams', description: 'Vibrant neon theme', icon: '🌈', value: 500, rarity: 'rare', metadata: { themeId: 'neon' } },
      { id: 'theme-matrix', type: 'theme', name: 'Matrix', description: 'Green code rain theme', icon: '💚', value: 1000, rarity: 'epic', metadata: { themeId: 'matrix' } },
      { id: 'title-novice', type: 'title', name: 'Novice', description: 'Just starting out', icon: '🌱', value: 0, rarity: 'common', metadata: { titleId: 'novice' } },
      { id: 'title-coder', type: 'title', name: 'Coder', description: 'Writing code daily', icon: '💻', value: 0, rarity: 'common', metadata: { titleId: 'coder' } },
      { id: 'title-pro', type: 'title', name: 'Pro', description: 'Professional developer', icon: '🚀', value: 0, rarity: 'uncommon', metadata: { titleId: 'pro' } },
      { id: 'title-master', type: 'title', name: 'Master', description: 'Master of the craft', icon: '🎓', value: 0, rarity: 'rare', metadata: { titleId: 'master' } },
      { id: 'boost-xp-2x-1h', type: 'boost', name: '2X XP Boost (1h)', description: 'Double XP for 1 hour', icon: '⚡', value: 100, rarity: 'uncommon', metadata: { boostType: 'xp', multiplier: 2, duration: 3600000 } },
      { id: 'boost-xp-2x-24h', type: 'boost', name: '2X XP Boost (24h)', description: 'Double XP for 24 hours', icon: '⚡', value: 1000, rarity: 'rare', metadata: { boostType: 'xp', multiplier: 2, duration: 86400000 } },
      { id: 'boost-streak-freeze', type: 'boost', name: 'Streak Freeze', description: 'Protect your streak for one day', icon: '❄️', value: 200, rarity: 'uncommon', metadata: { boostType: 'streak-freeze' } },
    ];

    for (const reward of rewards) {
      this.rewardDefinitions.set(reward.id, reward);
    }
  }

  private registerLootBoxes(): void {
    const lootBoxes: LootBox[] = [
      {
        id: 'starter-box',
        name: 'Starter Box',
        description: 'A box for new learners',
        icon: '📦',
        cost: 50,
        currencyType: 'coins',
        rewards: [
          { reward: this.rewardDefinitions.get('coins-10')!, probability: 0.4, minQuantity: 1, maxQuantity: 3 },
          { reward: this.rewardDefinitions.get('coins-50')!, probability: 0.3, minQuantity: 1, maxQuantity: 1 },
          { reward: this.rewardDefinitions.get('avatar-hat-1')!, probability: 0.15, minQuantity: 1, maxQuantity: 1 },
          { reward: this.rewardDefinitions.get('avatar-glasses-1')!, probability: 0.1, minQuantity: 1, maxQuantity: 1 },
          { reward: this.rewardDefinitions.get('theme-dark')!, probability: 0.05, minQuantity: 1, maxQuantity: 1 },
        ],
      },
      {
        id: 'premium-box',
        name: 'Premium Box',
        description: 'Better rewards for dedicated learners',
        icon: '🎁',
        cost: 200,
        currencyType: 'coins',
        rewards: [
          { reward: this.rewardDefinitions.get('coins-100')!, probability: 0.3, minQuantity: 1, maxQuantity: 2 },
          { reward: this.rewardDefinitions.get('gems-1')!, probability: 0.1, minQuantity: 1, maxQuantity: 1 },
          { reward: this.rewardDefinitions.get('avatar-hat-2')!, probability: 0.2, minQuantity: 1, maxQuantity: 1 },
          { reward: this.rewardDefinitions.get('avatar-shirt-1')!, probability: 0.15, minQuantity: 1, maxQuantity: 1 },
          { reward: this.rewardDefinitions.get('theme-neon')!, probability: 0.15, minQuantity: 1, maxQuantity: 1 },
          { reward: this.rewardDefinitions.get('boost-xp-2x-1h')!, probability: 0.1, minQuantity: 1, maxQuantity: 1 },
        ],
      },
      {
        id: 'legendary-box',
        name: 'Legendary Box',
        description: 'The rarest rewards',
        icon: '✨',
        cost: 5,
        currencyType: 'gems',
        rewards: [
          { reward: this.rewardDefinitions.get('gems-5')!, probability: 0.2, minQuantity: 1, maxQuantity: 1 },
          { reward: this.rewardDefinitions.get('theme-matrix')!, probability: 0.3, minQuantity: 1, maxQuantity: 1 },
          { reward: this.rewardDefinitions.get('title-master')!, probability: 0.2, minQuantity: 1, maxQuantity: 1 },
          { reward: this.rewardDefinitions.get('boost-xp-2x-24h')!, probability: 0.2, minQuantity: 1, maxQuantity: 1 },
          { reward: this.rewardDefinitions.get('boost-streak-freeze')!, probability: 0.1, minQuantity: 3, maxQuantity: 5 },
        ],
      },
    ];

    for (const box of lootBoxes) {
      this.lootBoxes.set(box.id, box);
    }
  }

  getReward(id: string): Reward | undefined {
    return this.rewardDefinitions.get(id);
  }

  getAllRewards(): Reward[] {
    return Array.from(this.rewardDefinitions.values());
  }

  getRewardsByType(type: Reward['type']): Reward[] {
    return Array.from(this.rewardDefinitions.values()).filter((r) => r.type === type);
  }

  getLootBox(id: string): LootBox | undefined {
    return this.lootBoxes.get(id);
  }

  getAllLootBoxes(): LootBox[] {
    return Array.from(this.lootBoxes.values());
  }

  async openLootBox(userId: string, lootBoxId: string): Promise<{ rewards: Reward[]; error?: string }> {
    const lootBox = this.lootBoxes.get(lootBoxId);
    if (!lootBox) {
      return { rewards: [], error: 'Loot box not found' };
    }

    const userRewards = await this.getUserRewards(userId);
    const currency = lootBox.currencyType === 'gems' ? 'gems' : 'coins';
    const currentCurrency = currency === 'gems' ? userRewards.currency : userRewards.currency;

    if (currentCurrency < lootBox.cost) {
      return { rewards: [], error: `Not enough ${currency}` };
    }

    const rewards: Reward[] = [];

    for (const lootReward of lootBox.rewards) {
      if (Math.random() < lootReward.probability) {
        const quantity = Math.floor(Math.random() * (lootReward.maxQuantity - lootReward.minQuantity + 1)) + lootReward.minQuantity;
        for (let i = 0; i < quantity; i++) {
          rewards.push(lootReward.reward);
        }
      }
    }

    await this.grantRewards(userId, rewards);
    await this.deductCurrency(userId, lootBox.cost, currency);

    return { rewards };
  }

  async grantRewards(userId: string, rewards: Reward[]): Promise<void> {
    const userRewards = await this.getUserRewards(userId);

    for (const reward of rewards) {
      switch (reward.type) {
        case 'currency':
          if (reward.metadata?.currencyType === 'gems') {
            userRewards.currency += reward.value;
          } else {
            userRewards.currency += reward.value;
          }
          break;
        case 'avatar-item':
          if (!userRewards.avatarItems.includes(reward.id)) {
            userRewards.avatarItems.push(reward.id);
          }
          break;
        case 'theme':
          if (!userRewards.themes.includes(reward.id)) {
            userRewards.themes.push(reward.id);
          }
          break;
        case 'title':
          if (!userRewards.titles.includes(reward.id)) {
            userRewards.titles.push(reward.id);
          }
          break;
        case 'badge':
          if (!userRewards.badges.includes(reward.id)) {
            userRewards.badges.push(reward.id);
          }
          break;
        case 'unlock':
          if (!userRewards.unlocks.includes(reward.id)) {
            userRewards.unlocks.push(reward.id);
          }
          break;
        case 'boost':
          const boost: ActiveBoost = {
            id: `${reward.id}-${Date.now()}`,
            type: reward.metadata?.boostType as ActiveBoost['type'] || 'xp',
            multiplier: reward.metadata?.multiplier as number || 1,
            expiresAt: Date.now() + (reward.metadata?.duration as number || 3600000),
            source: reward.id,
          };
          userRewards.activeBoosts.push(boost);
          break;
      }
    }

    await this.saveUserRewards(userRewards);
  }

  private async deductCurrency(userId: string, amount: number, currencyType: 'coins' | 'gems'): Promise<void> {
    const userRewards = await this.getUserRewards(userId);
    userRewards.currency -= amount;
    await this.saveUserRewards(userRewards);
  }

  async getUserRewards(userId: string): Promise<UserRewards> {
    const records = await this.rewardsRepo.find({
      where: { entityType: 'user-rewards', entityId: userId },
      orderBy: [{ field: 'timestamp', direction: 'desc' }],
      limit: 1,
    });

    if (records.length > 0) {
      return JSON.parse(records[0].data);
    }

    return {
      userId,
      currency: 0,
      avatarItems: [],
      themes: [],
      titles: [],
      badges: [],
      unlocks: [],
      activeBoosts: [],
    };
  }

  private async saveUserRewards(rewards: UserRewards): Promise<void> {
    await this.rewardsRepo.create({
      id: `rewards-${rewards.userId}-${Date.now()}`,
      entityType: 'user-rewards',
      entityId: rewards.userId,
      operation: 'update',
      data: JSON.stringify(rewards),
      timestamp: Date.now(),
      retries: 0,
    });
  }

  async getActiveBoosts(userId: string): Promise<ActiveBoost[]> {
    const rewards = await this.getUserRewards(userId);
    const now = Date.now();
    return rewards.activeBoosts.filter((b) => b.expiresAt > now);
  }

  async getXPMultiplier(userId: string): Promise<number> {
    const boosts = await this.getActiveBoosts(userId);
    const xpBoosts = boosts.filter((b) => b.type === 'xp');
    if (xpBoosts.length === 0) return 1;

    const maxMultiplier = Math.max(...xpBoosts.map((b) => b.multiplier));
    return maxMultiplier;
  }

  async applyXPBoost(userId: string, amount: number): Promise<number> {
    const multiplier = await this.getXPMultiplier(userId);
    return Math.round(amount * multiplier);
  }
}

export function createRewardEngine(): RewardEngine {
  return new RewardEngine();
}