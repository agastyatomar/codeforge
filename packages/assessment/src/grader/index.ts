import { executeCode } from '@codeforge/code-execution';
import { Exercise, TestCase, TestResult, ExecutionResult } from '@codeforge/core/types';
import { z } from 'zod';

export const GradingConfigSchema = z.object({
  passingScore: z.number().min(0).max(100).default(70),
  partialCredit: z.boolean().default(true),
  timeLimit: z.number().positive().default(5000),
  memoryLimit: z.number().positive().default(128),
  maxRetries: z.number().int().nonnegative().default(3),
  allowPartialPoints: z.boolean().default(true),
  weightByDifficulty: z.boolean().default(true),
});

export type GradingConfig = z.infer<typeof GradingConfigSchema>;

export interface GradingResult {
  passed: boolean;
  score: number;
  maxScore: number;
  percentage: number;
  testResults: TestResult[];
  executionResult: ExecutionResult;
  feedback: GradingFeedback[];
  xpEarned: number;
  timeTaken: number;
  memoryUsed: number;
}

export interface GradingFeedback {
  type: 'success' | 'error' | 'warning' | 'hint' | 'info';
  message: string;
  testCaseId?: string;
  suggestion?: string;
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
  weight: number;
  evaluator: 'automated' | 'manual' | 'hybrid';
  testCases?: string[];
}

export interface Rubric {
  id: string;
  name: string;
  description: string;
  criteria: RubricCriterion[];
  passingThreshold: number;
  maxScore: number;
}

export class AutoGrader {
  private config: GradingConfig;
  private rubrics = new Map<string, Rubric>();

  constructor(config: Partial<GradingConfig> = {}) {
    this.config = GradingConfigSchema.parse(config);
  }

  registerRubric(rubric: Rubric): void {
    this.rubrics.set(rubric.id, rubric);
  }

  getRubric(id: string): Rubric | undefined {
    return this.rubrics.get(id);
  }

  async gradeExercise(
    exercise: Exercise,
    userCode: string,
    language: string,
    attemptNumber: number
  ): Promise<GradingResult> {
    const startTime = Date.now();
    
    // Validate code first
    const validation = this.validateCode(userCode, exercise);
    if (!validation.valid) {
      return this.createFailedResult(validation.errors, startTime);
    }

    // Execute code
    const executionResult = await executeCode(language, userCode, {
      timeout: exercise.timeLimit || this.config.timeLimit,
      memoryLimit: exercise.memoryLimit || this.config.memoryLimit,
    });

    // Run test cases
    const testResults = await this.runTests(exercise, executionResult);
    
    // Calculate score
    const { score, maxScore, percentage, passed } = this.calculateScore(
      exercise,
      testResults,
      attemptNumber
    );

    // Generate feedback
    const feedback = this.generateFeedback(exercise, testResults, executionResult);

    // Calculate XP
    const xpEarned = passed ? this.calculateXP(exercise, percentage, attemptNumber) : 0;

    return {
      passed,
      score,
      maxScore,
      percentage,
      testResults,
      executionResult,
      feedback,
      xpEarned,
      timeTaken: Date.now() - startTime,
      memoryUsed: executionResult.memoryUsed,
    };
  }

  async gradeWithRubric(
    rubricId: string,
    submission: { code: string; language: string; files?: Record<string, string> },
    context?: Record<string, unknown>
  ): Promise<{ score: number; maxScore: number; criteriaResults: CriterionResult[] }> {
    const rubric = this.rubrics.get(rubricId);
    if (!rubric) throw new Error(`Rubric not found: ${rubricId}`);

    const criteriaResults: CriterionResult[] = [];

    for (const criterion of rubric.criteria) {
      const result = await this.evaluateCriterion(criterion, submission, context);
      criteriaResults.push(result);
    }

    const totalScore = criteriaResults.reduce((sum, r) => sum + r.score, 0);
    const maxScore = rubric.maxScore;

    return {
      score: totalScore,
      maxScore,
      criteriaResults,
    };
  }

  private async evaluateCriterion(
    criterion: RubricCriterion,
    submission: { code: string; language: string },
    context?: Record<string, unknown>
  ): Promise<CriterionResult> {
    if (criterion.evaluator === 'automated' && criterion.testCases) {
      // Would run specific test cases
      return {
        criterionId: criterion.id,
        score: criterion.maxPoints,
        maxPoints: criterion.maxPoints,
        passed: true,
        feedback: 'All test cases passed',
      };
    }

    // Manual or hybrid evaluation would be handled differently
    return {
      criterionId: criterion.id,
      score: 0,
      maxPoints: criterion.maxPoints,
      passed: false,
      feedback: 'Requires manual evaluation',
    };
  }

  private validateCode(code: string, exercise: Exercise): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for forbidden patterns
    if (exercise.metadata?.blockedPatterns) {
      for (const pattern of exercise.metadata.blockedPatterns) {
        const regex = new RegExp(pattern);
        if (regex.test(code)) {
          errors.push(`Forbidden pattern detected: ${pattern}`);
        }
      }
    }

    // Check required patterns
    if (exercise.metadata?.requiredPatterns) {
      for (const pattern of exercise.metadata.requiredPatterns) {
        const regex = new RegExp(pattern);
        if (!regex.test(code)) {
          errors.push(`Required pattern missing: ${pattern}`);
        }
      }
    }

    // Check line limits
    if (exercise.metadata?.maxLines) {
      const lines = code.split('\n').length;
      if (lines > exercise.metadata.maxLines) {
        errors.push(`Code exceeds maximum lines (${lines}/${exercise.metadata.maxLines})`);
      }
    }

    // Check character limits
    if (exercise.metadata?.maxCharacters) {
      if (code.length > exercise.metadata.maxCharacters) {
        errors.push(`Code exceeds maximum characters (${code.length}/${exercise.metadata.maxCharacters})`);
      }
    }

    // Check for common security issues
    if (/\beval\s*\(/.test(code)) {
      errors.push('Use of eval() is not allowed');
    }
    if (/new\s+Function\s*\(/.test(code)) {
      errors.push('Use of Function constructor is not allowed');
    }

    return { valid: errors.length === 0, errors };
  }

  private async runTests(exercise: Exercise, executionResult: ExecutionResult): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const testCase of exercise.tests) {
      if (executionResult.success) {
        const actualOutput = executionResult.output.trim();
        const expectedOutput = testCase.expectedOutput.trim();
        const passed = actualOutput === expectedOutput;

        results.push({
          passed,
          input: testCase.input,
          expected: testCase.expectedOutput,
          actual: actualOutput,
          message: passed ? undefined : `Expected: ${testCase.expectedOutput}, Got: ${actualOutput}`,
          weight: testCase.weight,
        });
      } else {
        results.push({
          passed: false,
          input: testCase.input,
          expected: testCase.expectedOutput,
          actual: executionResult.error || 'Execution failed',
          message: executionResult.error,
          weight: testCase.weight,
        });
      }
    }

    return results;
  }

  private calculateScore(
    exercise: Exercise,
    testResults: TestResult[],
    attemptNumber: number
  ): { score: number; maxScore: number; percentage: number; passed: boolean } {
    if (testResults.length === 0) {
      return { score: 0, maxScore: 100, percentage: 0, passed: false };
    }

    const totalWeight = testResults.reduce((sum, r) => sum + (r.weight || 1), 0);
    const passedWeight = testResults
      .filter(r => r.passed)
      .reduce((sum, r) => sum + (r.weight || 1), 0);

    const percentage = (passedWeight / totalWeight) * 100;
    const maxScore = 100;
    const score = Math.round(percentage);
    const passed = percentage >= this.config.passingScore;

    return { score, maxScore, percentage, passed };
  }

  private calculateXP(exercise: Exercise, percentage: number, attemptNumber: number): number {
    const baseXP = exercise.xpReward;
    const scoreMultiplier = percentage / 100;
    const attemptPenalty = Math.max(0, (attemptNumber - 1) * 0.1);
    const difficultyMultiplier = exercise.difficulty / 5;

    return Math.round(baseXP * scoreMultiplier * (1 - attemptPenalty) * difficultyMultiplier);
  }

  private generateFeedback(
    exercise: Exercise,
    testResults: TestResult[],
    executionResult: ExecutionResult
  ): GradingFeedback[] {
    const feedback: GradingFeedback[] = [];

    if (!executionResult.success) {
      feedback.push({
        type: 'error',
        message: executionResult.error || 'Code execution failed',
        suggestion: 'Check the error message and fix syntax/runtime errors',
      });
      return feedback;
    }

    const passedTests = testResults.filter(r => r.passed).length;
    const totalTests = testResults.length;

    if (passedTests === totalTests) {
      feedback.push({
        type: 'success',
        message: `All ${totalTests} test(s) passed!`,
      });
    } else {
      feedback.push({
        type: 'error',
        message: `${passedTests}/${totalTests} tests passed`,
      });

      for (const result of testResults.filter(r => !r.passed)) {
        feedback.push({
          type: 'error',
          message: `Test failed: ${result.message || 'Output mismatch'}`,
          testCaseId: result.input,
          suggestion: 'Compare your output with the expected output carefully',
        });
      }
    }

    // Add hints for failed tests
    if (passedTests < totalTests && exercise.hints.length > 0) {
      const nextHint = exercise.hints[0]; // Would track which hints were used
      feedback.push({
        type: 'hint',
        message: `Hint: ${nextHint.content}`,
        suggestion: `Using this hint costs ${nextHint.xpPenalty} XP`,
      });
    }

    return feedback;
  }

  private createFailedResult(errors: string[], startTime: number): GradingResult {
    return {
      passed: false,
      score: 0,
      maxScore: 100,
      percentage: 0,
      testResults: [],
      executionResult: {
        success: false,
        output: '',
        error: errors.join('; '),
        executionTime: Date.now() - startTime,
        memoryUsed: 0,
      },
      feedback: errors.map(e => ({ type: 'error' as const, message: e })),
      xpEarned: 0,
      timeTaken: Date.now() - startTime,
      memoryUsed: 0,
    };
  }
}

export interface CriterionResult {
  criterionId: string;
  score: number;
  maxPoints: number;
  passed: boolean;
  feedback: string;
}

export function createAutoGrader(config?: Partial<GradingConfig>): AutoGrader {
  return new AutoGrader(config);
}

// Built-in rubrics
export const BUILT_IN_RUBRICS: Rubric[] = [
  {
    id: 'code-quality',
    name: 'Code Quality Rubric',
    description: 'Evaluates code quality, style, and best practices',
    criteria: [
      {
        id: 'correctness',
        name: 'Correctness',
        description: 'Code produces correct output for all test cases',
        maxPoints: 40,
        weight: 0.4,
        evaluator: 'automated',
      },
      {
        id: 'style',
        name: 'Code Style',
        description: 'Code follows language style guidelines and conventions',
        maxPoints: 20,
        weight: 0.2,
        evaluator: 'automated',
      },
      {
        id: 'efficiency',
        name: 'Efficiency',
        description: 'Code uses efficient algorithms and data structures',
        maxPoints: 20,
        weight: 0.2,
        evaluator: 'hybrid',
      },
      {
        id: 'readability',
        name: 'Readability',
        description: 'Code is well-organized, commented, and easy to understand',
        maxPoints: 10,
        weight: 0.1,
        evaluator: 'manual',
      },
      {
        id: 'best-practices',
        name: 'Best Practices',
        description: 'Code follows language-specific best practices',
        maxPoints: 10,
        weight: 0.1,
        evaluator: 'automated',
      },
    ],
    passingThreshold: 70,
    maxScore: 100,
  },
  {
    id: 'project-rubric',
    name: 'Project Assessment Rubric',
    description: 'Comprehensive rubric for project evaluation',
    criteria: [
      {
        id: 'functionality',
        name: 'Functionality',
        description: 'Project meets all requirements and works correctly',
        maxPoints: 30,
        weight: 0.3,
        evaluator: 'automated',
      },
      {
        id: 'code-quality',
        name: 'Code Quality',
        description: 'Clean, maintainable, well-structured code',
        maxPoints: 25,
        weight: 0.25,
        evaluator: 'hybrid',
      },
      {
        id: 'design',
        name: 'Design & Architecture',
        description: 'Good architectural decisions and design patterns',
        maxPoints: 20,
        weight: 0.2,
        evaluator: 'manual',
      },
      {
        id: 'testing',
        name: 'Testing',
        description: 'Adequate test coverage and quality',
        maxPoints: 15,
        weight: 0.15,
        evaluator: 'automated',
      },
      {
        id: 'documentation',
        name: 'Documentation',
        description: 'Clear documentation and comments',
        maxPoints: 10,
        weight: 0.1,
        evaluator: 'manual',
      },
    ],
    passingThreshold: 60,
    maxScore: 100,
  },
];