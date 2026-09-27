import type { Exercise, TestCase, TestResult, ExecutionResult, UserProgress } from '@codeforge/core/types';
import { executeCode } from '@codeforge/code-execution';
import { validateCode } from '../validators';

export interface RunnerContext {
  exercise: Exercise;
  userCode: string;
  language: string;
  attemptNumber: number;
  previousResults?: TestResult[];
}

export interface RunnerResult {
  success: boolean;
  score: number;
  testResults: TestResult[];
  executionResult: ExecutionResult;
  feedback: RunnerFeedback[];
  xpEarned: number;
}

export interface RunnerFeedback {
  type: 'success' | 'error' | 'warning' | 'hint' | 'info';
  message: string;
  location?: { line: number; column: number };
  relatedTest?: string;
}

export abstract class BaseRunner {
  protected context: RunnerContext;

  constructor(context: RunnerContext) {
    this.context = context;
  }

  abstract run(): Promise<RunnerResult>;

  protected async executeCode(code: string): Promise<ExecutionResult> {
    return executeCode(this.context.language, code, {
      timeout: this.context.exercise.timeLimit || 5000,
      memoryLimit: this.context.exercise.memoryLimit || 128,
    });
  }

  protected calculateScore(testResults: TestResult[]): number {
    if (testResults.length === 0) return 0;
    const totalWeight = testResults.reduce((sum, r) => sum + (r.weight || 1), 0);
    const passedWeight = testResults.filter((r) => r.passed).reduce((sum, r) => sum + (r.weight || 1), 0);
    return Math.round((passedWeight / totalWeight) * 100);
  }

  protected calculateXP(score: number): number {
    const baseXP = this.context.exercise.xpReward;
    const scoreMultiplier = score / 100;
    const attemptPenalty = Math.max(0, (this.context.attemptNumber - 1) * 0.1);
    const difficultyMultiplier = this.context.exercise.difficulty / 5;
    return Math.round(baseXP * scoreMultiplier * (1 - attemptPenalty) * difficultyMultiplier);
  }

  protected generateFeedback(testResults: TestResult[], executionResult: ExecutionResult): RunnerFeedback[] {
    const feedback: RunnerFeedback[] = [];

    if (!executionResult.success) {
      feedback.push({
        type: 'error',
        message: executionResult.error || 'Code execution failed',
      });
      return feedback;
    }

    const passedTests = testResults.filter((r) => r.passed).length;
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

      for (const result of testResults.filter((r) => !r.passed)) {
        feedback.push({
          type: 'error',
          message: `Test failed: ${result.message || 'Output mismatch'}`,
          relatedTest: result.input,
        });
      }
    }

    return feedback;
  }
}

export class CodeRunner extends BaseRunner {
  async run(): Promise<RunnerResult> {
    const { userCode, exercise } = this.context;

    const validation = validateCode(userCode, exercise);
    if (!validation.valid) {
      return {
        success: false,
        score: 0,
        testResults: [],
        executionResult: { success: false, output: '', error: validation.errors.join(', '), executionTime: 0, memoryUsed: 0 },
        feedback: validation.errors.map((e) => ({ type: 'error' as const, message: e })),
        xpEarned: 0,
      };
    }

    const executionResult = await this.executeCode(userCode);
    const testResults = await this.runTests(exercise, executionResult);
    const score = this.calculateScore(testResults);
    const feedback = this.generateFeedback(testResults, executionResult);
    const xpEarned = score >= 70 ? this.calculateXP(score) : 0;

    return {
      success: score >= 70,
      score,
      testResults,
      executionResult,
      feedback,
      xpEarned,
    };
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
}

export class MultipleChoiceRunner extends BaseRunner {
  async run(): Promise<RunnerResult> {
    const { userCode, exercise } = this.context;
    const selectedAnswer = userCode.trim();

    const testResults: TestResult[] = exercise.tests.map((testCase) => {
      const passed = selectedAnswer === testCase.expectedOutput.trim();
      return {
        passed,
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual: selectedAnswer,
        message: passed ? undefined : `Selected: ${selectedAnswer}, Expected: ${testCase.expectedOutput}`,
        weight: testCase.weight,
      };
    });

    const score = this.calculateScore(testResults);
    const feedback = this.generateFeedback(testResults, { success: true, output: '', executionTime: 0, memoryUsed: 0 });
    const xpEarned = score >= 70 ? this.calculateXP(score) : 0;

    return {
      success: score >= 70,
      score,
      testResults,
      executionResult: { success: true, output: selectedAnswer, executionTime: 0, memoryUsed: 0 },
      feedback,
      xpEarned,
    };
  }
}

export class FillBlankRunner extends BaseRunner {
  async run(): Promise<RunnerResult> {
    const { userCode, exercise } = this.context;
    const answers = this.parseAnswers(userCode);

    const testResults: TestResult[] = exercise.tests.map((testCase, index) => {
      const userAnswer = answers[index]?.trim() || '';
      const passed = this.compareAnswers(userAnswer, testCase.expectedOutput.trim());
      return {
        passed,
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual: userAnswer,
        message: passed ? undefined : `Blank ${index + 1}: Expected "${testCase.expectedOutput}", Got "${userAnswer}"`,
        weight: testCase.weight,
      };
    });

    const score = this.calculateScore(testResults);
    const feedback = this.generateFeedback(testResults, { success: true, output: '', executionTime: 0, memoryUsed: 0 });
    const xpEarned = score >= 70 ? this.calculateXP(score) : 0;

    return {
      success: score >= 70,
      score,
      testResults,
      executionResult: { success: true, output: JSON.stringify(answers), executionTime: 0, memoryUsed: 0 },
      feedback,
      xpEarned,
    };
  }

  private parseAnswers(code: string): string[] {
    return code.split('\n').map((line) => line.trim()).filter(Boolean);
  }

  private compareAnswers(user: string, expected: string): boolean {
    return user.toLowerCase() === expected.toLowerCase();
  }
}

export class DragDropRunner extends BaseRunner {
  async run(): Promise<RunnerResult> {
    const { userCode, exercise } = this.context;
    const userOrder = JSON.parse(userCode);

    const testResults: TestResult[] = exercise.tests.map((testCase) => {
      const expectedOrder = JSON.parse(testCase.expectedOutput);
      const passed = JSON.stringify(userOrder) === JSON.stringify(expectedOrder);
      return {
        passed,
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual: JSON.stringify(userOrder),
        message: passed ? undefined : `Order mismatch`,
        weight: testCase.weight,
      };
    });

    const score = this.calculateScore(testResults);
    const feedback = this.generateFeedback(testResults, { success: true, output: '', executionTime: 0, memoryUsed: 0 });
    const xpEarned = score >= 70 ? this.calculateXP(score) : 0;

    return {
      success: score >= 70,
      score,
      testResults,
      executionResult: { success: true, output: JSON.stringify(userOrder), executionTime: 0, memoryUsed: 0 },
      feedback,
      xpEarned,
    };
  }
}

export class ProjectRunner extends BaseRunner {
  async run(): Promise<RunnerResult> {
    const { userCode, exercise } = this.context;

    const validation = validateCode(userCode, exercise);
    if (!validation.valid) {
      return {
        success: false,
        score: 0,
        testResults: [],
        executionResult: { success: false, output: '', error: validation.errors.join(', '), executionTime: 0, memoryUsed: 0 },
        feedback: validation.errors.map((e) => ({ type: 'error' as const, message: e })),
        xpEarned: 0,
      };
    }

    const executionResult = await this.executeCode(userCode);
    const testResults = await this.runProjectTests(exercise, executionResult);
    const score = this.calculateScore(testResults);
    const feedback = this.generateFeedback(testResults, executionResult);
    const xpEarned = score >= 70 ? this.calculateXP(score) : 0;

    return {
      success: score >= 70,
      score,
      testResults,
      executionResult,
      feedback,
      xpEarned,
    };
  }

  private async runProjectTests(exercise: Exercise, executionResult: ExecutionResult): Promise<TestResult[]> {
    return exercise.tests.map((testCase) => {
      if (executionResult.success) {
        const passed = executionResult.output.trim() === testCase.expectedOutput.trim();
        return {
          passed,
          input: testCase.input,
          expected: testCase.expectedOutput,
          actual: executionResult.output,
          message: passed ? undefined : `Project test failed`,
          weight: testCase.weight,
        };
      }
      return {
        passed: false,
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual: executionResult.error || 'Execution failed',
        message: executionResult.error,
        weight: testCase.weight,
      };
    });
  }
}

export class DebuggingRunner extends BaseRunner {
  async run(): Promise<RunnerResult> {
    const { userCode, exercise } = this.context;

    const validation = validateCode(userCode, exercise);
    if (!validation.valid) {
      return {
        success: false,
        score: 0,
        testResults: [],
        executionResult: { success: false, output: '', error: validation.errors.join(', '), executionTime: 0, memoryUsed: 0 },
        feedback: validation.errors.map((e) => ({ type: 'error' as const, message: e })),
        xpEarned: 0,
      };
    }

    const executionResult = await this.executeCode(userCode);
    const testResults = await this.runDebuggingTests(exercise, executionResult, userCode);
    const score = this.calculateScore(testResults);
    const feedback = this.generateFeedback(testResults, executionResult);
    const xpEarned = score >= 70 ? this.calculateXP(score) : 0;

    return {
      success: score >= 70,
      score,
      testResults,
      executionResult,
      feedback,
      xpEarned,
    };
  }

  private async runDebuggingTests(
    exercise: Exercise,
    executionResult: ExecutionResult,
    userCode: string
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const testCase of exercise.tests) {
      if (executionResult.success) {
        const passed = executionResult.output.trim() === testCase.expectedOutput.trim();
        results.push({
          passed,
          input: testCase.input,
          expected: testCase.expectedOutput,
          actual: executionResult.output,
          message: passed ? undefined : 'Debugging test failed - output mismatch',
          weight: testCase.weight,
        });
      } else {
        results.push({
          passed: false,
          input: testCase.input,
          expected: testCase.expectedOutput,
          actual: executionResult.error || 'Execution failed',
          message: 'Code has runtime errors that need to be fixed',
          weight: testCase.weight,
        });
      }
    }

    return results;
  }
}

export class CodeReviewRunner extends BaseRunner {
  async run(): Promise<RunnerResult> {
    const { userCode, exercise } = this.context;

    const issues = await this.analyzeCode(userCode, exercise);
    const testResults = issues.map((issue, index) => ({
      passed: issue.severity !== 'error',
      input: `Code review check ${index + 1}`,
      expected: 'No issues',
      actual: issue.message,
      message: issue.message,
      weight: issue.severity === 'error' ? 1 : 0.5,
    }));

    const score = this.calculateScore(testResults);
    const feedback = issues.map((issue) => ({
      type: issue.severity === 'error' ? 'error' as const : issue.severity === 'warning' ? 'warning' as const : 'info' as const,
      message: issue.message,
      location: issue.location,
    }));

    const xpEarned = score >= 70 ? this.calculateXP(score) : 0;

    return {
      success: score >= 70,
      score,
      testResults,
      executionResult: { success: true, output: JSON.stringify(issues), executionTime: 0, memoryUsed: 0 },
      feedback,
      xpEarned,
    };
  }

  private async analyzeCode(code: string, exercise: Exercise): Promise<Array<{ severity: 'error' | 'warning' | 'info'; message: string; location?: { line: number; column: number } }>> {
    const issues: Array<{ severity: 'error' | 'warning' | 'info'; message: string; location?: { line: number; column: number } }> = [];

    if (exercise.metadata?.blockedPatterns) {
      for (const pattern of exercise.metadata.blockedPatterns) {
        const regex = new RegExp(pattern);
        const match = code.match(regex);
        if (match) {
          issues.push({
            severity: 'error',
            message: `Forbidden pattern detected: ${pattern}`,
          });
        }
      }
    }

    if (exercise.metadata?.requiredPatterns) {
      for (const pattern of exercise.metadata.requiredPatterns) {
        const regex = new RegExp(pattern);
        if (!regex.test(code)) {
          issues.push({
            severity: 'warning',
            message: `Required pattern missing: ${pattern}`,
          });
        }
      }
    }

    const lines = code.split('\n');
    if (exercise.metadata?.maxLines && lines.length > exercise.metadata.maxLines) {
      issues.push({
        severity: 'warning',
        message: `Code exceeds maximum lines (${lines.length}/${exercise.metadata.maxLines})`,
      });
    }

    if (exercise.metadata?.maxCharacters && code.length > exercise.metadata.maxCharacters) {
      issues.push({
        severity: 'warning',
        message: `Code exceeds maximum characters (${code.length}/${exercise.metadata.maxCharacters})`,
      });
    }

    return issues;
  }
}

export function createRunner(exercise: Exercise, userCode: string, language: string, attemptNumber: number, previousResults?: TestResult[]): BaseRunner {
  const context: RunnerContext = { exercise, userCode, language, attemptNumber, previousResults };

  switch (exercise.type) {
    case 'code':
      return new CodeRunner(context);
    case 'multiple-choice':
      return new MultipleChoiceRunner(context);
    case 'fill-blank':
      return new FillBlankRunner(context);
    case 'drag-drop':
      return new DragDropRunner(context);
    case 'project':
      return new ProjectRunner(context);
    case 'debugging':
      return new DebuggingRunner(context);
    case 'code-review':
      return new CodeReviewRunner(context);
    default:
      throw new Error(`Unknown exercise type: ${exercise.type}`);
  }
}

export async function runExercise(
  exercise: Exercise,
  userCode: string,
  language: string,
  attemptNumber: number,
  previousResults?: TestResult[]
): Promise<RunnerResult> {
  const runner = createRunner(exercise, userCode, language, attemptNumber, previousResults);
  return runner.run();
}