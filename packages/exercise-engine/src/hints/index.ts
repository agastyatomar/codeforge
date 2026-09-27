import type { Exercise, Hint } from '@codeforge/core/types';

export interface HintContext {
  exercise: Exercise;
  attemptNumber: number;
  timeSpent: number;
  previousHintsUsed: string[];
  code?: string;
  language?: string;
}

export interface HintResult {
  hint: Hint | null;
  available: boolean;
  reason?: string;
}

export class HintEngine {
  private exercise: Exercise;
  private usedHints = new Set<string>();

  constructor(exercise: Exercise) {
    this.exercise = exercise;
  }

  getNextHint(context: HintContext): HintResult {
    const availableHints = this.exercise.hints
      .filter((h) => !this.usedHints.has(h.id))
      .sort((a, b) => a.level - b.level);

    if (availableHints.length === 0) {
      return { hint: null, available: false, reason: 'No more hints available' };
    }

    const nextHint = availableHints[0];

    if (!this.isHintUnlocked(nextHint, context)) {
      return {
        hint: null,
        available: false,
        reason: this.getUnlockReason(nextHint, context),
      };
    }

    this.usedHints.add(nextHint.id);
    return { hint: nextHint, available: true };
  }

  getHintById(hintId: string): Hint | undefined {
    return this.exercise.hints.find((h) => h.id === hintId);
  }

  getUsedHints(): Hint[] {
    return this.exercise.hints.filter((h) => this.usedHints.has(h.id));
  }

  getRemainingHints(): Hint[] {
    return this.exercise.hints.filter((h) => !this.usedHints.has(h.id));
  }

  getTotalXPPenalty(): number {
    return Array.from(this.usedHints).reduce((sum, id) => {
      const hint = this.exercise.hints.find((h) => h.id === id);
      return sum + (hint?.xpPenalty || 0);
    }, 0);
  }

  reset(): void {
    this.usedHints.clear();
  }

  private isHintUnlocked(hint: Hint, context: HintContext): boolean {
    switch (hint.unlockCondition) {
      case 'attempts':
        return context.attemptNumber >= hint.unlockValue;
      case 'time':
        return context.timeSpent >= hint.unlockValue * 1000;
      case 'manual':
        return true;
      default:
        return true;
    }
  }

  private getUnlockReason(hint: Hint, context: HintContext): string {
    switch (hint.unlockCondition) {
      case 'attempts':
        return `Requires ${hint.unlockValue} attempt(s) (current: ${context.attemptNumber})`;
      case 'time':
        return `Requires ${hint.unlockValue} second(s) (current: ${Math.floor(context.timeSpent / 1000)}s)`;
      case 'manual':
        return 'Available on request';
      default:
        return 'Locked';
    }
  }
}

export function createHintEngine(exercise: Exercise): HintEngine {
  return new HintEngine(exercise);
}

export interface AdaptiveHintConfig {
  enableAdaptiveHints: boolean;
  maxHintsPerExercise: number;
  hintQualityThreshold: number;
}

export class AdaptiveHintEngine extends HintEngine {
  private config: AdaptiveHintConfig;
  private hintEffectiveness = new Map<string, { shown: number; helped: number }>();

  constructor(exercise: Exercise, config: Partial<AdaptiveHintConfig> = {}) {
    super(exercise);
    this.config = {
      enableAdaptiveHints: true,
      maxHintsPerExercise: 3,
      hintQualityThreshold: 0.6,
      ...config,
    };
  }

  getNextHint(context: HintContext): HintResult {
    if (!this.config.enableAdaptiveHints) {
      return super.getNextHint(context);
    }

    const availableHints = this.exercise.hints
      .filter((h) => !this.usedHints.has(h.id))
      .sort((a, b) => this.getHintPriority(b, context) - this.getHintPriority(a, context));

    if (availableHints.length === 0) {
      return { hint: null, available: false, reason: 'No more hints available' };
    }

    if (this.usedHints.size >= this.config.maxHintsPerExercise) {
      return { hint: null, available: false, reason: `Maximum hints (${this.config.maxHintsPerExercise}) reached` };
    }

    const nextHint = availableHints[0];

    if (!this.isHintUnlocked(nextHint, context)) {
      return {
        hint: null,
        available: false,
        reason: this.getUnlockReason(nextHint, context),
      };
    }

    this.usedHints.add(nextHint.id);
    return { hint: nextHint, available: true };
  }

  recordHintOutcome(hintId: string, helped: boolean): void {
    const current = this.hintEffectiveness.get(hintId) || { shown: 0, helped: 0 };
    current.shown++;
    if (helped) current.helped++;
    this.hintEffectiveness.set(hintId, current);
  }

  getHintEffectiveness(hintId: string): number {
    const data = this.hintEffectiveness.get(hintId);
    if (!data || data.shown === 0) return 0;
    return data.helped / data.shown;
  }

  private getHintPriority(hint: Hint, context: HintContext): number {
    let priority = 10 - hint.level;

    const effectiveness = this.getHintEffectiveness(hint.id);
    if (effectiveness > this.config.hintQualityThreshold) {
      priority += 5;
    } else if (effectiveness > 0) {
      priority -= 2;
    }

    if (context.code && hint.content.toLowerCase().includes(context.code.slice(0, 20).toLowerCase())) {
      priority += 3;
    }

    return priority;
  }
}

export function createAdaptiveHintEngine(exercise: Exercise, config?: Partial<AdaptiveHintConfig>): AdaptiveHintEngine {
  return new AdaptiveHintEngine(exercise, config);
}

export const builtInHints: Record<string, Hint[]> = {
  'hello-world': [
    { id: 'hint-1', level: 1, content: 'Use print() to output text in Python', xpPenalty: 5, unlockCondition: 'attempts', unlockValue: 1 },
    { id: 'hint-2', level: 2, content: 'The syntax is: print("Hello, World!")', xpPenalty: 10, unlockCondition: 'attempts', unlockValue: 2 },
  ],
  'variables': [
    { id: 'hint-1', level: 1, content: 'Variables store data. In Python: name = "value"', xpPenalty: 5, unlockCondition: 'attempts', unlockValue: 1 },
    { id: 'hint-2', level: 2, content: 'Variable names can contain letters, numbers, and underscores', xpPenalty: 5, unlockCondition: 'attempts', unlockValue: 2 },
    { id: 'hint-3', level: 3, content: 'Try: my_name = "CodeForge"', xpPenalty: 10, unlockCondition: 'attempts', unlockValue: 3 },
  ],
  'loops': [
    { id: 'hint-1', level: 1, content: 'For loops repeat code. Syntax: for i in range(5):', xpPenalty: 5, unlockCondition: 'attempts', unlockValue: 1 },
    { id: 'hint-2', level: 2, content: 'range(5) gives numbers 0,1,2,3,4', xpPenalty: 5, unlockCondition: 'attempts', unlockValue: 2 },
    { id: 'hint-3', level: 3, content: 'Indentation matters in Python!', xpPenalty: 10, unlockCondition: 'attempts', unlockValue: 3 },
  ],
  'functions': [
    { id: 'hint-1', level: 1, content: 'Functions are defined with def keyword', xpPenalty: 5, unlockCondition: 'attempts', unlockValue: 1 },
    { id: 'hint-2', level: 2, content: 'Syntax: def function_name(parameters):', xpPenalty: 5, unlockCondition: 'attempts', unlockValue: 2 },
    { id: 'hint-3', level: 3, content: 'Use return to send back a value', xpPenalty: 10, unlockCondition: 'attempts', unlockValue: 3 },
  ],
  'conditionals': [
    { id: 'hint-1', level: 1, content: 'Use if/elif/else for decisions', xpPenalty: 5, unlockCondition: 'attempts', unlockValue: 1 },
    { id: 'hint-2', level: 2, content: 'Comparison operators: ==, !=, <, >, <=, >', xpPenalty: 5, unlockCondition: 'attempts', unlockValue: 2 },
    { id: 'hint-3', level: 3, content: 'Don\'t forget the colon after conditions!', xpPenalty: 10, unlockCondition: 'attempts', unlockValue: 3 },
  ],
};

export function getBuiltInHints(exerciseId: string): Hint[] {
  return builtInHints[exerciseId] || [];
}