import { createDexieRepository, db } from '@codeforge/data/dexie';
import { executeCode } from '@codeforge/code-execution';
import { z } from 'zod';

export const ContestSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(2000),
  type: z.enum(['weekly', 'sprint', 'marathon', 'practice', 'custom']),
  status: z.enum(['upcoming', 'registration', 'running', 'paused', 'finished', 'archived']),
  startTime: z.number(),
  endTime: z.number(),
  durationMinutes: z.number().positive(),
  problems: z.array(z.string().uuid()),
  maxParticipants: z.number().int().positive().optional(),
  currentParticipants: z.number().int().nonnegative().default(0),
  rules: z.object({
    allowMultipleSubmissions: z.boolean().default(true),
    penaltyPerWrongSubmission: z.number().default(20), // minutes
    partialScoring: z.boolean().default(false),
    languageRestrictions: z.array(z.string()).optional(),
  }).default({}),
  prizes: z.array(z.object({
    rank: z.number().int().positive(),
    xp: z.number().int().nonnegative(),
    badgeId: z.string().optional(),
    title: z.string().optional(),
  })).default([]),
  createdBy: z.string().uuid(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const ContestProblemSchema = z.object({
  id: z.string().uuid(),
  contestId: z.string().uuid(),
  order: z.number().int().nonnegative(),
  title: z.string().min(1).max(200),
  description: z.string().max(10000),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']),
  points: z.number().int().positive(),
  timeLimit: z.number().positive().default(2000),
  memoryLimit: z.number().positive().default(256),
  inputFormat: z.string().max(5000),
  outputFormat: z.string().max(5000),
  constraints: z.string().max(5000),
  sampleInput: z.string().max(2000),
  sampleOutput: z.string().max(2000),
  explanation: z.string().max(10000).optional(),
  tags: z.array(z.string()).default([]),
  testCases: z.array(z.object({
    input: z.string(),
    expectedOutput: z.string(),
    description: z.string(),
    hidden: z.boolean().default(false),
    weight: z.number().min(0).max(1).default(1),
  })).min(1),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const SubmissionSchema = z.object({
  id: z.string().uuid(),
  contestId: z.string().uuid(),
  problemId: z.string().uuid(),
  userId: z.string().uuid(),
  code: z.string(),
  language: z.string(),
  status: z.enum(['pending', 'running', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compile_error', 'internal_error']),
  score: z.number().default(0),
  maxScore: z.number().default(100),
  executionTime: z.number().default(0),
  memoryUsed: z.number().default(0),
  testResults: z.array(z.object({
    testCaseId: z.string(),
    passed: z.boolean(),
    input: z.string(),
    expected: z.string(),
    actual: z.string(),
    executionTime: z.number(),
    memoryUsed: z.number(),
  })).default([]),
  submittedAt: z.number(),
  judgedAt: z.number().optional(),
});

export type Contest = z.infer<typeof ContestSchema>;
export type ContestProblem = z.infer<typeof ContestProblemSchema>;
export type Submission = z.infer<typeof SubmissionSchema>;

export interface ContestRanking {
  userId: string;
  username: string;
  avatar?: string;
  rank: number;
  previousRank?: number;
  totalScore: number;
  problemsSolved: number;
  totalPenalty: number;
  problemScores: Record<string, { score: number; submissions: number; solved: boolean }>;
  lastSubmissionTime: number;
}

export interface ContestRegistration {
  userId: string;
  contestId: string;
  registeredAt: number;
  status: 'registered' | 'waitlisted' | 'withdrawn';
}

export class ContestManager {
  private contestsRepo = createDexieRepository(db.syncQueue as any);
  private problemsRepo = createDexieRepository(db.syncQueue as any);
  private submissionsRepo = createDexieRepository(db.syncQueue as any);
  private registrationsRepo = createDexieRepository(db.syncQueue as any);

  async createContest(contest: Omit<Contest, 'id' | 'createdAt' | 'updatedAt' | 'currentParticipants'>): Promise<Contest> {
    const newContest: Contest = {
      ...contest,
      id: crypto.randomUUID(),
      currentParticipants: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await this.contestsRepo.create(newContest as any);
    return newContest;
  }

  async getContest(contestId: string): Promise<Contest | null> {
    return this.contestsRepo.findById(contestId);
  }

  async getContests(filters: { status?: Contest['status']; type?: Contest['type'] } = {}): Promise<Contest[]> {
    return this.contestsRepo.find({ where: filters });
  }

  async updateContest(contestId: string, updates: Partial<Contest>): Promise<Contest | null> {
    const contest = await this.getContest(contestId);
    if (!contest) return null;
    
    const updated = { ...contest, ...updates, updatedAt: Date.now() };
    await this.contestsRepo.update(contestId, updated);
    return updated;
  }

  async addProblem(contestId: string, problem: Omit<ContestProblem, 'id' | 'contestId' | 'createdAt' | 'updatedAt'>): Promise<ContestProblem> {
    const newProblem: ContestProblem = {
      ...problem,
      id: crypto.randomUUID(),
      contestId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await this.problemsRepo.create(newProblem as any);
    return newProblem;
  }

  async getProblems(contestId: string): Promise<ContestProblem[]> {
    return this.problemsRepo.find({ where: { contestId }, orderBy: [{ field: 'order', direction: 'asc' }] });
  }

  async registerUser(contestId: string, userId: string): Promise<ContestRegistration | { error: string }> {
    const contest = await this.getContest(contestId);
    if (!contest) return { error: 'Contest not found' };

    const now = Date.now();
    if (now < contest.startTime) {
      // Registration open
    } else if (now > contest.endTime) {
      return { error: 'Contest has ended' };
    } else if (contest.status !== 'running') {
      return { error: 'Contest is not running' };
    }

    if (contest.maxParticipants && contest.currentParticipants >= contest.maxParticipants) {
      return { error: 'Contest is full' };
    }

    const existing = await this.registrationsRepo.findById(`${contestId}:${userId}`);
    if (existing) return { error: 'Already registered' };

    const registration: ContestRegistration = {
      userId,
      contestId,
      registeredAt: now,
      status: 'registered',
    };

    await this.registrationsRepo.create({ ...registration, id: `${contestId}:${userId}` } as any);
    
    await this.contestsRepo.update(contestId, { currentParticipants: contest.currentParticipants + 1 });
    
    return registration;
  }

  async submitSolution(
    contestId: string,
    problemId: string,
    userId: string,
    code: string,
    language: string
  ): Promise<Submission> {
    const contest = await this.getContest(contestId);
    if (!contest) throw new Error('Contest not found');

    const problem = await this.problemsRepo.findById(problemId);
    if (!problem) throw new Error('Problem not found');

    // Check if contest is running
    const now = Date.now();
    if (now < contest.startTime || now > contest.endTime) {
      throw new Error('Contest is not running');
    }

    // Check if user is registered
    const registration = await this.registrationsRepo.findById(`${contestId}:${userId}`);
    if (!registration || registration.status !== 'registered') {
      throw new Error('Not registered for this contest');
    }

    // Check language restrictions
    if (contest.rules.languageRestrictions && !contest.rules.languageRestrictions.includes(language)) {
      throw new Error('Language not allowed in this contest');
    }

    const submission: Submission = {
      id: crypto.randomUUID(),
      contestId,
      problemId,
      userId,
      code,
      language,
      status: 'pending',
      score: 0,
      maxScore: problem.points,
      executionTime: 0,
      memoryUsed: 0,
      testResults: [],
      submittedAt: now,
    };

    await this.submissionsRepo.create(submission as any);

    // Judge asynchronously
    this.judgeSubmission(submission.id).catch(console.error);

    return submission;
  }

  private async judgeSubmission(submissionId: string): Promise<void> {
    const submission = await this.submissionsRepo.findById(submissionId);
    if (!submission) return;

    await this.submissionsRepo.update(submissionId, { status: 'running' });

    const problem = await this.problemsRepo.findById(submission.problemId);
    if (!problem) {
      await this.submissionsRepo.update(submissionId, { status: 'internal_error' });
      return;
    }

    try {
      const executionResult = await this.executeCodeWithTimeout(
        submission.language,
        submission.code,
        problem.timeLimit,
        problem.memoryLimit
      );

      const testResults = this.runTestCases(problem, executionResult);
      const score = this.calculateScore(problem, testResults);
      const status = this.determineStatus(executionResult, testResults);

      await this.submissionsRepo.update(submissionId, {
        status,
        score,
        executionTime: executionResult.executionTime,
        memoryUsed: executionResult.memoryUsed,
        testResults,
        judgedAt: Date.now(),
      });

      // Update rankings
      await this.updateRankings(submission.contestId, submission.userId, submission.problemId, score);
    } catch (error) {
      await this.submissionsRepo.update(submissionId, { status: 'internal_error', judgedAt: Date.now() });
    }
  }

  private async executeCodeWithTimeout(
    language: string,
    code: string,
    timeLimit: number,
    memoryLimit: number
  ): Promise<any> {
    return executeCode(language, code, { timeout: timeLimit, memoryLimit });
  }

  private runTestCases(problem: ContestProblem, executionResult: any): any[] {
    const results = [];

    for (const testCase of problem.testCases) {
      if (executionResult.success) {
        const actualOutput = executionResult.output.trim();
        const expectedOutput = testCase.expectedOutput.trim();
        const passed = actualOutput === expectedOutput;

        results.push({
          testCaseId: testCase.description, // Would use actual test case ID
          passed,
          input: testCase.input,
          expected: testCase.expectedOutput,
          actual: actualOutput,
          executionTime: executionResult.executionTime,
          memoryUsed: executionResult.memoryUsed,
        });
      } else {
        results.push({
          testCaseId: testCase.description,
          passed: false,
          input: testCase.input,
          expected: testCase.expectedOutput,
          actual: executionResult.error || 'Execution failed',
          executionTime: executionResult.executionTime,
          memoryUsed: executionResult.memoryUsed,
        });
      }
    }

    return results;
  }

  private calculateScore(problem: ContestProblem, testResults: any[]): number {
    if (testResults.length === 0) return 0;

    const totalWeight = testResults.reduce((sum, r) => sum + (r.weight || 1), 0);
    const passedWeight = testResults.filter(r => r.passed).reduce((sum, r) => sum + (r.weight || 1), 0);
    
    if (totalWeight === 0) return 0;
    
    const percentage = (passedWeight / totalWeight) * 100;
    return Math.round(percentage / 100 * problem.points);
  }

  private determineStatus(executionResult: any, testResults: any[]): Submission['status'] {
    if (!executionResult.success) {
      if (executionResult.error?.includes('timeout')) return 'time_limit_exceeded';
      if (executionResult.error?.includes('memory')) return 'memory_limit_exceeded';
      if (executionResult.error?.includes('compile')) return 'compile_error';
      return 'runtime_error';
    }

    const allPassed = testResults.every(r => r.passed);
    if (allPassed) return 'accepted';
    return 'wrong_answer';
  }

  private async updateRankings(
    contestId: string,
    userId: string,
    problemId: string,
    score: number
  ): Promise<void> {
    // Would update user's score for this problem and recalculate rankings
  }

  async getRankings(contestId: string, limit = 100): Promise<ContestRanking[]> {
    // Would calculate and return rankings
    return [];
  }

  async getUserRanking(contestId: string, userId: string): Promise<ContestRanking | null> {
    // Would return user's ranking
    return null;
  }

  async getSubmissions(
    contestId: string,
    userId: string,
    problemId?: string
  ): Promise<Submission[]> {
    return this.submissionsRepo.find({ where: { contestId, userId, problemId } });
  }

  async getContestStats(contestId: string): Promise<{
    totalParticipants: number;
    totalSubmissions: number;
    acceptedSubmissions: number;
    averageScore: number;
    problemStats: Record<string, { submissions: number; accepted: number; avgScore: number }>;
  }> {
    const submissions = await this.submissionsRepo.find({ where: { contestId } });
    const problems = await this.getProblems(contestId);

    const totalSubmissions = submissions.length;
    const acceptedSubmissions = submissions.filter(s => s.status === 'accepted').length;
    const totalScore = submissions.reduce((sum, s) => sum + s.score, 0);
    const averageScore = totalSubmissions > 0 ? totalScore / totalSubmissions : 0;

    const problemStats: Record<string, { submissions: number; accepted: number; avgScore: number }> = {};
    
    for (const problem of problems) {
      const problemSubs = submissions.filter(s => s.problemId === problem.id);
      const accepted = problemSubs.filter(s => s.status === 'accepted').length;
      const avgScore = problemSubs.length > 0 
        ? problemSubs.reduce((sum, s) => sum + s.score, 0) / problemSubs.length 
        : 0;
      problemStats[problem.id] = {
        submissions: problemSubs.length,
        accepted,
        avgScore,
      };
    }

    return {
      totalParticipants: new Set(submissions.map(s => s.userId)).size,
      totalSubmissions,
      acceptedSubmissions,
      averageScore,
      problemStats,
    };
  }
}

export function createContestManager(): ContestManager {
  return new ContestManager();
}

export function createContest(
  data: Omit<Contest, 'id' | 'createdAt' | 'updatedAt' | 'currentParticipants'>
): Contest {
  return {
    ...data,
    id: crypto.randomUUID(),
    currentParticipants: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}