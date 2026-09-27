import type { Course, Lesson, Exercise, UserProgress, TestCase, TestResult, ExecutionResult } from '@codeforge/core/types';
import { createDexieRepository, db } from '@codeforge/data/dexie';
import { EventBus, createEventBus, CoreEvents } from '@codeforge/core/events';

export interface CourseEngineConfig {
  enablePersistence: boolean;
  autoSaveInterval: number;
  maxConcurrentExercises: number;
}

export interface ExerciseExecutionContext {
  exercise: Exercise;
  lesson: Lesson;
  course: Course;
  userId: string;
  attemptNumber: number;
  previousResults?: TestResult[];
}

export class CourseEngine {
  private config: CourseEngineConfig;
  private eventBus: EventBus<CoreEvents>;
  private coursesRepo = createDexieRepository(db.courses);
  private lessonsRepo = createDexieRepository(db.lessons);
  private exercisesRepo = createDexieRepository(db.exercises);
  private progressRepo = createDexieRepository(db.userProgress);
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<CourseEngineConfig> = {}) {
    this.config = {
      enablePersistence: true,
      autoSaveInterval: 30000,
      maxConcurrentExercises: 3,
      ...config,
    };
    this.eventBus = createEventBus();
  }

  async initialize(): Promise<void> {
    if (this.config.enablePersistence) {
      this.autoSaveTimer = setInterval(() => this.persistProgress(), this.config.autoSaveInterval);
    }
  }

  async shutdown(): Promise<void> {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      await this.persistProgress();
    }
  }

  async getCourse(courseId: string): Promise<Course | undefined> {
    return this.coursesRepo.findById(courseId);
  }

  async getCourses(): Promise<Course[]> {
    return this.coursesRepo.findAll();
  }

  async getCourseWithLessons(courseId: string): Promise<{ course: Course; lessons: Lesson[] } | undefined> {
    const course = await this.getCourse(courseId);
    if (!course) return undefined;

    const lessons = await this.lessonsRepo.find({ where: { courseId }, orderBy: [{ field: 'order', direction: 'asc' }] });
    return { course, lessons };
  }

  async getLesson(lessonId: string): Promise<Lesson | undefined> {
    return this.lessonsRepo.findById(lessonId);
  }

  async getLessonWithExercises(lessonId: string): Promise<{ lesson: Lesson; exercises: Exercise[] } | undefined> {
    const lesson = await this.getLesson(lessonId);
    if (!lesson) return undefined;

    const exercises = await this.exercisesRepo.find({ where: { lessonId }, orderBy: [{ field: 'order', direction: 'asc' }] });
    return { lesson, exercises };
  }

  async getExercise(exerciseId: string): Promise<Exercise | undefined> {
    return this.exercisesRepo.findById(exerciseId);
  }

  async getUserProgress(userId: string, courseId: string): Promise<UserProgress[]> {
    return this.progressRepo.find({ where: { userId, courseId } });
  }

  async getExerciseProgress(userId: string, exerciseId: string): Promise<UserProgress | undefined> {
    const results = await this.progressRepo.find({ where: { userId, exerciseId } });
    return results[0];
  }

  async startExercise(userId: string, exerciseId: string): Promise<UserProgress> {
    const exercise = await this.getExercise(exerciseId);
    if (!exercise) throw new Error(`Exercise not found: ${exerciseId}`);

    const existing = await this.getExerciseProgress(userId, exerciseId);
    if (existing) {
      return this.updateProgress(userId, exerciseId, {
        status: 'in-progress',
        attempts: existing.attempts + 1,
      });
    }

    const lesson = await this.getLesson(exercise.lessonId);
    const course = lesson ? await this.getCourse(lesson.courseId) : undefined;

    const progress: UserProgress = {
      id: crypto.randomUUID(),
      userId,
      courseId: course?.id || '',
      lessonId: exercise.lessonId,
      exerciseId,
      status: 'in-progress',
      score: 0,
      attempts: 1,
      timeSpent: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.progressRepo.create(progress);
    this.eventBus.emit('exercise:started', { exerciseId, lessonId: exercise.lessonId, userId });
    return progress;
  }

  async submitExercise(
    userId: string,
    exerciseId: string,
    code: string,
    language: string,
    executionResult: ExecutionResult
  ): Promise<UserProgress> {
    const exercise = await this.getExercise(exerciseId);
    if (!exercise) throw new Error(`Exercise not found: ${exerciseId}`);

    const progress = await this.getExerciseProgress(userId, exerciseId);
    if (!progress) throw new Error('Exercise not started');

    const testResults = await this.runTests(exercise, code, language, executionResult);
    const passedTests = testResults.filter((r) => r.passed).length;
    const totalTests = testResults.length;
    const score = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    const passed = score >= 70;

    const updatedProgress = await this.updateProgress(userId, exerciseId, {
      status: passed ? 'completed' : 'failed',
      score,
      timeSpent: progress.timeSpent + (executionResult.executionTime || 0),
      completedAt: passed ? Date.now() : undefined,
    });

    if (passed) {
      const xpEarned = this.calculateXP(exercise, score, progress.attempts);
      this.eventBus.emit('exercise:completed', {
        exerciseId,
        lessonId: exercise.lessonId,
        userId,
        score,
        xpEarned,
      });
      this.eventBus.emit('xp:awarded', { amount: xpEarned, source: `exercise:${exerciseId}`, userId });
    } else {
      this.eventBus.emit('exercise:failed', {
        exerciseId,
        lessonId: exercise.lessonId,
        userId,
        error: `Score ${score.toFixed(1)}% below passing threshold`,
      });
    }

    return updatedProgress;
  }

  private async runTests(
    exercise: Exercise,
    code: string,
    language: string,
    executionResult: ExecutionResult
  ): Promise<TestResult[]> {
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
        });
      } else {
        results.push({
          passed: false,
          input: testCase.input,
          expected: testCase.expectedOutput,
          actual: executionResult.error || 'Execution failed',
          message: executionResult.error,
        });
      }
    }

    return results;
  }

  private calculateXP(exercise: Exercise, score: number, attempts: number): number {
    const baseXP = exercise.xpReward;
    const scoreMultiplier = score / 100;
    const attemptPenalty = Math.max(0, (attempts - 1) * 0.1);
    const difficultyMultiplier = exercise.difficulty / 5;

    return Math.round(baseXP * scoreMultiplier * (1 - attemptPenalty) * difficultyMultiplier);
  }

  async updateProgress(
    userId: string,
    exerciseId: string,
    updates: Partial<UserProgress>
  ): Promise<UserProgress> {
    const progress = await this.getExerciseProgress(userId, exerciseId);
    if (!progress) throw new Error('Progress not found');

    const updated = { ...progress, ...updates, updatedAt: Date.now() };
    return this.progressRepo.update(progress.id, updated);
  }

  async completeLesson(userId: string, lessonId: string): Promise<void> {
    const lesson = await this.getLesson(lessonId);
    if (!lesson) return;

    const course = await this.getCourse(lesson.courseId);
    if (!course) return;

    const exercises = await this.exercisesRepo.find({ where: { lessonId } });
    const allCompleted = await Promise.all(
      exercises.map(async (ex) => {
        const progress = await this.getExerciseProgress(userId, ex.id);
        return progress?.status === 'completed';
      })
    );

    if (allCompleted.every(Boolean)) {
      this.eventBus.emit('lesson:completed', {
        lessonId,
        courseId: course.id,
        userId,
        xpEarned: lesson.xpReward,
      });
      this.eventBus.emit('xp:awarded', { amount: lesson.xpReward, source: `lesson:${lessonId}`, userId });
    }
  }

  async completeCourse(userId: string, courseId: string): Promise<void> {
    const course = await this.getCourse(courseId);
    if (!course) return;

    const allLessons = await this.lessonsRepo.find({ where: { courseId } });
    const allCompleted = await Promise.all(
      allLessons.map(async (lesson) => {
        const exercises = await this.exercisesRepo.find({ where: { lessonId: lesson.id } });
        return Promise.all(
          exercises.map(async (ex) => {
            const progress = await this.getExerciseProgress(userId, ex.id);
            return progress?.status === 'completed';
          })
        ).then((results) => results.every(Boolean));
      })
    );

    if (allCompleted.every(Boolean)) {
      const totalXP = course.lessons.reduce((sum, lessonId) => {
        const lesson = allLessons.find((l) => l.id === lessonId);
        return sum + (lesson?.xpReward || 0);
      }, 0);

      this.eventBus.emit('course:completed', {
        courseId,
        userId,
        xpEarned: totalXP,
      });
    }
  }

  async getNextExercise(userId: string, courseId: string): Promise<Exercise | undefined> {
    const courseWithLessons = await this.getCourseWithLessons(courseId);
    if (!courseWithLessons) return undefined;

    for (const lesson of courseWithLessons.lessons) {
      const { exercises } = await this.getLessonWithExercises(lesson.id)!;
      for (const exercise of exercises) {
        const progress = await this.getExerciseProgress(userId, exercise.id);
        if (!progress || progress.status !== 'completed') {
          return exercise;
        }
      }
    }

    return undefined;
  }

  async getCourseProgress(userId: string, courseId: string): Promise<{
    totalExercises: number;
    completedExercises: number;
    totalXPEarned: number;
    percentage: number;
  }> {
    const courseWithLessons = await this.getCourseWithLessons(courseId);
    if (!courseWithLessons) {
      return { totalExercises: 0, completedExercises: 0, totalXPEarned: 0, percentage: 0 };
    }

    let totalExercises = 0;
    let completedExercises = 0;
    let totalXPEarned = 0;

    for (const lesson of courseWithLessons.lessons) {
      const { exercises } = await this.getLessonWithExercises(lesson.id)!;
      for (const exercise of exercises) {
        totalExercises++;
        const progress = await this.getExerciseProgress(userId, exercise.id);
        if (progress?.status === 'completed') {
          completedExercises++;
          totalXPEarned += this.calculateXP(exercise, progress.score, progress.attempts);
        }
      }
    }

    return {
      totalExercises,
      completedExercises,
      totalXPEarned,
      percentage: totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0,
    };
  }

  private async persistProgress(): Promise<void> {
  }

  onEvent<K extends keyof CoreEvents>(event: K, handler: (data: CoreEvents[K]) => void): () => void {
    return this.eventBus.on(event, handler);
  }
}

export function createCourseEngine(config?: Partial<CourseEngineConfig>): CourseEngine {
  return new CourseEngine(config);
}