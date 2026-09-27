import { Course, Lesson, Exercise, TestCase, Hint, validateCourse, validateLesson, validateExercise } from '@codeforge/course-engine/schema';
import { z } from 'zod';

export interface CourseDraft {
  id?: string;
  course: Partial<Course>;
  lessons: LessonDraft[];
  status: 'draft' | 'review' | 'published' | 'archived';
  version: string;
  lastSaved: number;
  authorId: string;
  collaborators: string[];
}

export interface LessonDraft {
  id?: string;
  lesson: Partial<Lesson>;
  exercises: ExerciseDraft[];
  order: number;
  status: 'draft' | 'review' | 'published';
}

export interface ExerciseDraft {
  id?: string;
  exercise: Partial<Exercise>;
  testCases: TestCaseDraft[];
  hints: HintDraft[];
  order: number;
  status: 'draft' | 'review' | 'published';
}

export interface TestCaseDraft {
  id?: string;
  input: string;
  expectedOutput: string;
  description: string;
  hidden: boolean;
  weight: number;
}

export interface HintDraft {
  id?: string;
  level: number;
  content: string;
  xpPenalty: number;
  unlockCondition: 'attempts' | 'time' | 'manual';
  unlockValue: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  path: string;
  message: string;
  code: string;
}

export class CourseBuilder {
  private draft: CourseDraft;
  private history: CourseDraft[] = [];
  private maxHistory = 50;

  constructor(initialDraft?: Partial<CourseDraft>) {
    this.draft = {
      course: {
        slug: '',
        title: '',
        description: '',
        version: '1.0.0',
        author: '',
        tags: [],
        language: '',
        difficulty: 'beginner',
        estimatedHours: 0,
        lessons: [],
        prerequisites: [],
        learningObjectives: [],
      },
      lessons: [],
      status: 'draft',
      version: '1.0.0',
      lastSaved: Date.now(),
      authorId: '',
      collaborators: [],
      ...initialDraft,
    };
    this.saveToHistory();
  }

  getDraft(): CourseDraft {
    return { ...this.draft };
  }

  updateCourse(courseData: Partial<Course>): void {
    this.draft.course = { ...this.draft.course, ...courseData };
    this.draft.lastSaved = Date.now();
    this.saveToHistory();
  }

  addLesson(lessonData: Partial<Lesson>): LessonDraft {
    const newLesson: LessonDraft = {
      id: crypto.randomUUID(),
      lesson: {
        order: this.draft.lessons.length,
        title: '',
        description: '',
        content: '',
        contentType: 'markdown',
        exercises: [],
        estimatedMinutes: 30,
        xpReward: 50,
        ...lessonData,
      } as Lesson,
      exercises: [],
      order: this.draft.lessons.length,
      status: 'draft',
    };
    this.draft.lessons.push(newLesson);
    this.updateLessonOrders();
    this.saveToHistory();
    return newLesson;
  }

  removeLesson(lessonId: string): boolean {
    const index = this.draft.lessons.findIndex(l => l.id === lessonId);
    if (index === -1) return false;
    this.draft.lessons.splice(index, 1);
    this.updateLessonOrders();
    this.saveToHistory();
    return true;
  }

  reorderLesson(fromIndex: number, toIndex: number): void {
    const lessons = [...this.draft.lessons];
    const [removed] = lessons.splice(fromIndex, 1);
    lessons.splice(toIndex, 0, removed);
    this.draft.lessons = lessons;
    this.updateLessonOrders();
    this.saveToHistory();
  }

  updateLesson(lessonId: string, lessonData: Partial<Lesson>): boolean {
    const lesson = this.draft.lessons.find(l => l.id === lessonId);
    if (!lesson) return false;
    lesson.lesson = { ...lesson.lesson, ...lessonData };
    this.draft.lastSaved = Date.now();
    this.saveToHistory();
    return true;
  }

  addExercise(lessonId: string, exerciseData: Partial<Exercise>): ExerciseDraft | null {
    const lesson = this.draft.lessons.find(l => l.id === lessonId);
    if (!lesson) return null;

    const newExercise: ExerciseDraft = {
      id: crypto.randomUUID(),
      exercise: {
        order: lesson.exercises.length,
        type: 'code',
        title: '',
        description: '',
        instructions: '',
        tests: [],
        hints: [],
        xpReward: 25,
        difficulty: 1,
        ...exerciseData,
      } as Exercise,
      testCases: [],
      hints: [],
      order: lesson.exercises.length,
      status: 'draft',
    };
    lesson.exercises.push(newExercise);
    this.updateExerciseOrders(lesson);
    this.saveToHistory();
    return newExercise;
  }

  removeExercise(lessonId: string, exerciseId: string): boolean {
    const lesson = this.draft.lessons.find(l => l.id === lessonId);
    if (!lesson) return false;
    const index = lesson.exercises.findIndex(e => e.id === exerciseId);
    if (index === -1) return false;
    lesson.exercises.splice(index, 1);
    this.updateExerciseOrders(lesson);
    this.saveToHistory();
    return true;
  }

  reorderExercise(lessonId: string, fromIndex: number, toIndex: number): boolean {
    const lesson = this.draft.lessons.find(l => l.id === lessonId);
    if (!lesson) return false;
    const exercises = [...lesson.exercises];
    const [removed] = exercises.splice(fromIndex, 1);
    exercises.splice(toIndex, 0, removed);
    lesson.exercises = exercises;
    this.updateExerciseOrders(lesson);
    this.saveToHistory();
    return true;
  }

  updateExercise(lessonId: string, exerciseId: string, exerciseData: Partial<Exercise>): boolean {
    const lesson = this.draft.lessons.find(l => l.id === lessonId);
    if (!lesson) return false;
    const exercise = lesson.exercises.find(e => e.id === exerciseId);
    if (!exercise) return false;
    exercise.exercise = { ...exercise.exercise, ...exerciseData };
    this.draft.lastSaved = Date.now();
    this.saveToHistory();
    return true;
  }

  addTestCase(lessonId: string, exerciseId: string, testCase: Partial<TestCase>): TestCaseDraft | null {
    const exercise = this.findExercise(lessonId, exerciseId);
    if (!exercise) return null;
    
    const newTestCase: TestCaseDraft = {
      id: crypto.randomUUID(),
      input: '',
      expectedOutput: '',
      description: '',
      hidden: false,
      weight: 1,
      ...testCase,
    };
    exercise.testCases.push(newTestCase);
    this.saveToHistory();
    return newTestCase;
  }

  removeTestCase(lessonId: string, exerciseId: string, testCaseId: string): boolean {
    const exercise = this.findExercise(lessonId, exerciseId);
    if (!exercise) return false;
    const index = exercise.testCases.findIndex(t => t.id === testCaseId);
    if (index === -1) return false;
    exercise.testCases.splice(index, 1);
    this.saveToHistory();
    return true;
  }

  addHint(lessonId: string, exerciseId: string, hint: Partial<Hint>): HintDraft | null {
    const exercise = this.findExercise(lessonId, exerciseId);
    if (!exercise) return null;
    
    const newHint: HintDraft = {
      id: crypto.randomUUID(),
      level: exercise.hints.length + 1,
      content: '',
      xpPenalty: 5,
      unlockCondition: 'attempts',
      unlockValue: 1,
      ...hint,
    };
    exercise.hints.push(newHint);
    this.saveToHistory();
    return newHint;
  }

  removeHint(lessonId: string, exerciseId: string, hintId: string): boolean {
    const exercise = this.findExercise(lessonId, exerciseId);
    if (!exercise) return false;
    const index = exercise.hints.findIndex(h => h.id === hintId);
    if (index === -1) return false;
    exercise.hints.splice(index, 1);
    // Re-level hints
    exercise.hints.forEach((h, i) => { h.level = i + 1; });
    this.saveToHistory();
    return true;
  }

  private findExercise(lessonId: string, exerciseId: string): ExerciseDraft | null {
    const lesson = this.draft.lessons.find(l => l.id === lessonId);
    if (!lesson) return null;
    return lesson.exercises.find(e => e.id === exerciseId) || null;
  }

  private updateLessonOrders(): void {
    this.draft.lessons.forEach((lesson, index) => {
      lesson.lesson.order = index;
    });
  }

  private updateExerciseOrders(lesson: LessonDraft): void {
    lesson.exercises.forEach((exercise, index) => {
      exercise.exercise.order = index;
    });
  }

  validate(): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate course
    if (!this.draft.course.slug) {
      errors.push({ path: 'course.slug', message: 'Course slug is required', code: 'REQUIRED' });
    } else if (!/^[a-z0-9-]+$/.test(this.draft.course.slug)) {
      errors.push({ path: 'course.slug', message: 'Slug must be lowercase alphanumeric with hyphens', code: 'INVALID_FORMAT' });
    }
    if (!this.draft.course.title) {
      errors.push({ path: 'course.title', message: 'Course title is required', code: 'REQUIRED' });
    }
    if (!this.draft.course.language) {
      errors.push({ path: 'course.language', message: 'Course language is required', code: 'REQUIRED' });
    }
    if (this.draft.course.estimatedHours <= 0) {
      warnings.push({ path: 'course.estimatedHours', message: 'Estimated hours should be positive', code: 'NON_POSITIVE' });
    }

    // Validate lessons
    if (this.draft.lessons.length === 0) {
      warnings.push({ path: 'lessons', message: 'Course has no lessons', code: 'EMPTY' });
    }

    this.draft.lessons.forEach((lesson, lIndex) => {
      if (!lesson.lesson.title) {
        errors.push({ path: `lessons[${lIndex}].title`, message: 'Lesson title is required', code: 'REQUIRED' });
      }
      if (lesson.exercises.length === 0) {
        warnings.push({ path: `lessons[${lIndex}].exercises`, message: 'Lesson has no exercises', code: 'EMPTY' });
      }

      lesson.exercises.forEach((exercise, eIndex) => {
        if (!exercise.exercise.title) {
          errors.push({ path: `lessons[${lIndex}].exercises[${eIndex}].title`, message: 'Exercise title is required', code: 'REQUIRED' });
        }
        if (exercise.exercise.type === 'code' && exercise.testCases.length === 0) {
          errors.push({ path: `lessons[${lIndex}].exercises[${eIndex}].tests`, message: 'Code exercises require at least one test case', code: 'REQUIRED' });
        }
        if (exercise.hints.length > 5) {
          warnings.push({ path: `lessons[${lIndex}].exercises[${eIndex}].hints`, message: 'More than 5 hints may overwhelm learners', code: 'TOO_MANY_HINTS' });
        }
      });
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  export(): Course {
    const validation = this.validate();
    if (!validation.valid) {
      throw new Error(`Cannot export invalid course: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    return validateCourse({
      id: this.draft.id || crypto.randomUUID(),
      slug: this.draft.course.slug!,
      title: this.draft.course.title!,
      description: this.draft.course.description || '',
      version: this.draft.course.version,
      author: this.draft.course.author || '',
      tags: this.draft.course.tags || [],
      language: this.draft.course.language!,
      difficulty: this.draft.course.difficulty,
      estimatedHours: this.draft.course.estimatedHours,
      lessons: this.draft.lessons.map(l => l.lesson.id!).filter(Boolean),
      prerequisites: this.draft.course.prerequisites || [],
      learningObjectives: this.draft.course.learningObjectives || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  exportLessons(): Lesson[] {
    return this.draft.lessons.map(l => validateLesson({
      ...l.lesson,
      id: l.id!,
      courseId: this.draft.course.id || '',
    } as Lesson));
  }

  exportExercises(): Exercise[] {
    const exercises: Exercise[] = [];
    for (const lesson of this.draft.lessons) {
      for (const exercise of lesson.exercises) {
        exercises.push(validateExercise({
          ...exercise.exercise,
          id: exercise.id!,
          lessonId: lesson.id!,
          tests: exercise.testCases.map(t => ({
            ...t,
            id: t.id || crypto.randomUUID(),
          })),
          hints: exercise.hints.map(h => ({
            ...h,
            id: h.id || crypto.randomUUID(),
          })),
        } as Exercise));
      }
    }
    return exercises;
  }

  import(courseData: Course): void {
    // Would import a full course
    this.draft.course = { ...this.draft.course, ...courseData };
    this.saveToHistory();
  }

  duplicate(): CourseBuilder {
    return new CourseBuilder(this.getDraft());
  }

  undo(): boolean {
    if (this.history.length <= 1) return false;
    this.history.pop(); // Remove current
    this.draft = { ...this.history[this.history.length - 1] };
    return true;
  }

  redo(): boolean {
    // Would need a separate redo stack
    return false;
  }

  private saveToHistory(): void {
    this.history.push(JSON.parse(JSON.stringify(this.draft)));
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  getHistoryLength(): number {
    return this.history.length;
  }

  setStatus(status: CourseDraft['status']): void {
    this.draft.status = status;
    this.draft.lastSaved = Date.now();
  }

  addCollaborator(userId: string): void {
    if (!this.draft.collaborators.includes(userId)) {
      this.draft.collaborators.push(userId);
    }
  }

  removeCollaborator(userId: string): void {
    this.draft.collaborators = this.draft.collaborators.filter(id => id !== userId);
  }
}

export function createCourseBuilder(initialData?: Partial<CourseDraft>): CourseBuilder {
  return new CourseBuilder(initialData);
}

// Template for common course structures
export const COURSE_TEMPLATES = {
  beginner: {
    structure: [
      { title: 'Introduction', lessons: 2, exercises: 4 },
      { title: 'Fundamentals', lessons: 4, exercises: 8 },
      { title: 'Practice', lessons: 2, exercises: 4 },
      { title: 'Project', lessons: 1, exercises: 2 },
    ],
  },
  intermediate: {
    structure: [
      { title: 'Review', lessons: 1, exercises: 2 },
      { title: 'Core Concepts', lessons: 5, exercises: 10 },
      { title: 'Advanced Topics', lessons: 3, exercises: 6 },
      { title: 'Capstone Project', lessons: 2, exercises: 4 },
    ],
  },
  projectBased: {
    structure: [
      { title: 'Setup & Planning', lessons: 2, exercises: 3 },
      { title: 'Core Implementation', lessons: 4, exercises: 6 },
      { title: 'Testing & Debugging', lessons: 2, exercises: 3 },
      { title: 'Deployment', lessons: 1, exercises: 2 },
    ],
  },
};

export function createCourseBuilderFromTemplate(template: keyof typeof COURSE_TEMPLATES, baseData: Partial<CourseDraft>): CourseBuilder {
  const templateData = COURSE_TEMPLATES[template];
  const builder = new CourseBuilder(baseData);
  // Would populate based on template structure
  return builder;
}