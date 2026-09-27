import { createDexieRepository, db } from '@codeforge/data/dexie';
import { z } from 'zod';

export const BKTParamsSchema = z.object({
  // Probability of knowing the skill initially
  pInit: z.number().min(0).max(1).default(0.2),
  // Probability of learning the skill after an opportunity
  pLearn: z.number().min(0).max(1).default(0.3),
  // Probability of slipping (making a mistake despite knowing)
  pSlip: z.number().min(0).max(1).default(0.1),
  // Probability of guessing correctly
  pGuess: z.number().min(0).max(1).default(0.2),
});

export type BKTParams = z.infer<typeof BKTParamsSchema>;

export interface SkillMastery {
  userId: string;
  skillId: string;
  skillName: string;
  masteryProbability: number; // 0-1
  practiceCount: number;
  correctCount: number;
  lastPracticed: number;
  params: BKTParams;
  history: MasteryEvent[];
}

export interface MasteryEvent {
  timestamp: number;
  exerciseId: string;
  correct: boolean;
  masteryBefore: number;
  masteryAfter: number;
  responseTime: number;
}

export interface KnowledgeState {
  userId: string;
  skills: Map<string, SkillMastery>;
  overallMastery: number;
  strengths: string[];
  weaknesses: string[];
  recommendedSkills: string[];
  updatedAt: number;
}

export class BKTEngine {
  private masteryRepo = createDexieRepository(db.syncQueue as any);
  private defaultParams: BKTParams = {
    pInit: 0.2,
    pLearn: 0.3,
    pSlip: 0.1,
    pGuess: 0.2,
  };

  async updateMastery(
    userId: string,
    skillId: string,
    skillName: string,
    correct: boolean,
    exerciseId: string,
    responseTime: number,
    customParams?: Partial<BKTParams>
  ): Promise<SkillMastery> {
    const params = { ...this.defaultParams, ...customParams };
    let mastery = await this.getMastery(userId, skillId);

    if (!mastery) {
      mastery = {
        userId,
        skillId,
        skillName,
        masteryProbability: params.pInit,
        practiceCount: 0,
        correctCount: 0,
        lastPracticed: Date.now(),
        params,
        history: [],
      };
    }

    const masteryBefore = mastery.masteryProbability;
    
    // Update using BKT formula
    let masteryAfter: number;
    if (correct) {
      // P(L|correct) = P(correct|L) * P(L) / P(correct)
      // P(correct|L) = 1 - pSlip
      // P(correct|not L) = pGuess
      // P(correct) = P(correct|L) * P(L) + P(correct|not L) * P(not L)
      const pCorrectGivenKnown = 1 - params.pSlip;
      const pCorrectGivenUnknown = params.pGuess;
      const pKnown = mastery.masteryProbability;
      const pCorrect = pCorrectGivenKnown * pKnown + pCorrectGivenUnknown * (1 - pKnown);
      
      masteryAfter = (pCorrectGivenKnown * pKnown) / pCorrect;
    } else {
      // P(L|incorrect) = P(incorrect|L) * P(L) / P(incorrect)
      // P(incorrect|L) = pSlip
      // P(incorrect|not L) = 1 - pGuess
      const pIncorrectGivenKnown = params.pSlip;
      const pIncorrectGivenUnknown = 1 - params.pGuess;
      const pKnown = mastery.masteryProbability;
      const pIncorrect = pIncorrectGivenKnown * pKnown + pIncorrectGivenUnknown * (1 - pKnown);
      
      masteryAfter = (pIncorrectGivenKnown * pKnown) / pIncorrect;
    }

    // Apply learning
    // After practicing, probability of knowing increases
    masteryAfter = masteryAfter + (1 - masteryAfter) * params.pLearn;

    // Update mastery
    mastery.masteryProbability = Math.min(1, Math.max(0, masteryAfter));
    mastery.practiceCount += 1;
    if (correct) mastery.correctCount += 1;
    mastery.lastPracticed = Date.now();

    // Add to history
    mastery.history.push({
      timestamp: Date.now(),
      exerciseId,
      correct,
      masteryBefore,
      masteryAfter,
      responseTime,
    });

    // Keep only last 100 history entries
    if (mastery.history.length > 100) {
      mastery.history = mastery.history.slice(-100);
    }

    await this.saveMastery(mastery);
    return mastery;
  }

  async getMastery(userId: string, skillId: string): Promise<SkillMastery | null> {
    const records = await this.masteryRepo.find({
      where: { entityType: 'mastery', entityId: `${userId}:${skillId}` },
      orderBy: [{ field: 'timestamp', direction: 'desc' }],
      limit: 1,
    });

    if (records.length === 0) return null;
    return JSON.parse(records[0].data);
  }

  async getUserMasteries(userId: string): Promise<SkillMastery[]> {
    const records = await this.masteryRepo.find({
      where: { entityType: 'mastery', entityId: { userId } },
    });
    return records.map(r => JSON.parse(r.data));
  }

  async getKnowledgeState(userId: string): Promise<KnowledgeState> {
    const masteries = await this.getUserMasteries(userId);
    const skillsMap = new Map(masteries.map(m => [m.skillId, m]));

    const totalMastery = masteries.reduce((sum, m) => sum + m.masteryProbability, 0);
    const overallMastery = masteries.length > 0 ? totalMastery / masteries.length : 0;

    // Identify strengths (mastery > 0.8)
    const strengths = masteries
      .filter(m => m.masteryProbability > 0.8)
      .map(m => m.skillName);

    // Identify weaknesses (mastery < 0.4 and practiced)
    const weaknesses = masteries
      .filter(m => m.masteryProbability < 0.4 && m.practiceCount > 0)
      .map(m => m.skillName);

    // Recommend skills to practice (low mastery, not recently practiced)
    const now = Date.now();
    const recommendedSkills = masteries
      .filter(m => m.masteryProbability < 0.7 && (now - m.lastPracticed) > 24 * 60 * 60 * 1000)
      .sort((a, b) => a.masteryProbability - b.masteryProbability)
      .slice(0, 5)
      .map(m => m.skillId);

    return {
      userId,
      skills: skillsMap,
      overallMastery,
      strengths,
      weaknesses,
      recommendedSkills,
      updatedAt: Date.now(),
    };
  }

  async predictPerformance(
    userId: string,
    skillId: string,
    exerciseDifficulty: number
  ): Promise<{ predictedCorrect: number; confidence: number }> {
    const mastery = await this.getMastery(userId, skillId);
    if (!mastery) {
      return { predictedCorrect: this.defaultParams.pGuess, confidence: 0.1 };
    }

    // Adjust for exercise difficulty
    const baseProb = mastery.masteryProbability * (1 - this.defaultParams.pSlip) + 
                     (1 - mastery.masteryProbability) * this.defaultParams.pGuess;
    
    // Adjust for difficulty (higher difficulty = lower probability)
    const adjustedProb = baseProb * (1 - exerciseDifficulty * 0.3);
    
    return {
      predictedCorrect: Math.max(0, Math.min(1, adjustedProb)),
      confidence: mastery.practiceCount / (mastery.practiceCount + 10),
    };
  }

  async getLearningCurve(userId: string, skillId: string): Promise<{
    timestamps: number[];
    masteryValues: number[];
    events: MasteryEvent[];
  }> {
    const mastery = await this.getMastery(userId, skillId);
    if (!mastery) return { timestamps: [], masteryValues: [], events: [] };

    const timestamps = mastery.history.map(e => e.timestamp);
    const masteryValues = mastery.history.map(e => e.masteryAfter);

    return {
      timestamps,
      masteryValues,
      events: mastery.history,
    };
  }

  async getRecommendedExercises(
    userId: string,
    availableExercises: { id: string; skillId: string; difficulty: number }[],
    limit = 5
  ): Promise<string[]> {
    const knowledgeState = await this.getKnowledgeState(userId);
    const weakSkills = new Set(knowledgeState.weaknesses);
    const recommendedSkills = new Set(knowledgeState.recommendedSkills);

    // Score exercises
    const scored = availableExercises.map(ex => {
      let score = 0;
      if (weakSkills.has(ex.skillId)) score += 50;
      if (recommendedSkills.has(ex.skillId)) score += 30;
      
      // Prefer appropriate difficulty
      const mastery = knowledgeState.skills.get(ex.skillId);
      if (mastery) {
        const targetDifficulty = mastery.masteryProbability * 0.8 + 0.2;
        score -= Math.abs(ex.difficulty - targetDifficulty) * 20;
      }
      
      return { exerciseId: ex.id, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.exerciseId);
  }

  private async saveMastery(mastery: SkillMastery): Promise<void> {
    await this.masteryRepo.create({
      id: `mastery-${mastery.userId}:${mastery.skillId}-${Date.now()}`,
      entityType: 'mastery',
      entityId: `${mastery.userId}:${mastery.skillId}`,
      operation: 'update',
      data: JSON.stringify(mastery),
      timestamp: Date.now(),
      retries: 0,
    });
  }
}

export function createBKTEngine(): BKTEngine {
  return new BKTEngine();
}

// Deep Knowledge Tracing (DKT) - Simplified version using RNN-like approach
export class DKTEngine {
  private skillEmbeddings = new Map<string, number[]>();
  private userStates = new Map<string, { hiddenState: number[]; skillStates: Map<string, number> }>();

  constructor() {
    // Initialize with random embeddings
  }

  async predict(userId: string, skillId: string, exerciseId: string, correct: boolean): Promise<{
    prediction: number;
    newState: { hiddenState: number[]; skillStates: Map<string, number> };
  }> {
    // Simplified DKT - would use actual RNN in production
    let userState = this.userStates.get(userId);
    if (!userState) {
      userState = {
        hiddenState: new Array(64).fill(0).map(() => Math.random() * 0.01),
        skillStates: new Map(),
      };
      this.userStates.set(userId, userState);
    }

    const skillState = userState.skillStates.get(skillId) || 0.5;
    const prediction = skillState * 0.8 + 0.1; // Simplified

    // Update skill state based on correctness
    const learningRate = 0.1;
    const newSkillState = skillState + learningRate * (correct ? 1 - skillState : -skillState);
    userState.skillStates.set(skillId, Math.max(0, Math.min(1, newSkillState)));

    return {
      prediction,
      newState: userState,
    };
  }

  getUserState(userId: string) {
    return this.userStates.get(userId);
  }
}

export function createDKTEngine(): DKTEngine {
  return new DKTEngine();
}