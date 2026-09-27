import { z } from 'zod';

export const CourseSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  description: z.string().max(2000),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  author: z.string().max(100),
  tags: z.array(z.string()).max(20),
  language: z.string().min(1).max(50),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedHours: z.number().positive().max(1000),
  lessons: z.array(z.string().uuid()).min(1),
  prerequisites: z.array(z.string().uuid()),
  learningObjectives: z.array(z.string()).max(20),
  metadata: z.object({
    coverImage: z.string().url().optional(),
    bannerImage: z.string().url().optional(),
    category: z.string().optional(),
    subcategory: z.string().optional(),
    ageRating: z.enum(['everyone', 'teen', 'mature']).optional(),
    accessibility: z.object({
      screenReaderOptimized: z.boolean().default(true),
      highContrastSupported: z.boolean().default(true),
      keyboardOnly: z.boolean().default(true),
      reducedMotion: z.boolean().default(true),
    }).optional(),
    localization: z.object({
      sourceLanguage: z.string().default('en'),
      availableLanguages: z.array(z.string()).default(['en']),
      rtlSupport: z.boolean().default(false),
    }).optional(),
  }).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const LessonSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  order: z.number().int().nonnegative(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000),
  content: z.string(),
  contentType: z.enum(['markdown', 'html', 'video', 'interactive']),
  exercises: z.array(z.string().uuid()),
  estimatedMinutes: z.number().int().positive().max(480),
  xpReward: z.number().int().nonnegative().max(1000),
  metadata: z.object({
    videoUrl: z.string().url().optional(),
    videoDuration: z.number().optional(),
    interactiveType: z.enum(['simulation', 'visualization', 'quiz', 'drag-drop']).optional(),
    accessibility: z.object({
      hasTranscript: z.boolean().default(false),
      hasCaptions: z.boolean().default(false),
      hasAudioDescription: z.boolean().default(false),
    }).optional(),
  }).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const ExerciseSchema = z.object({
  id: z.string().uuid(),
  lessonId: z.string().uuid(),
  order: z.number().int().nonnegative(),
  type: z.enum(['code', 'multiple-choice', 'fill-blank', 'drag-drop', 'project', 'debugging', 'code-review']),
  title: z.string().min(1).max(200),
  description: z.string().max(5000),
  instructions: z.string().max(10000),
  starterCode: z.string().optional(),
  solution: z.string().optional(),
  tests: z.array(TestCaseSchema),
  hints: z.array(HintSchema),
  xpReward: z.number().int().nonnegative().max(500),
  difficulty: z.number().int().min(1).max(10),
  timeLimit: z.number().int().positive().max(3600).optional(),
  memoryLimit: z.number().int().positive().max(1024).optional(),
  metadata: z.object({
    allowedLanguages: z.array(z.string()).default(['python', 'javascript', 'typescript']),
    blockedPatterns: z.array(z.string()).optional(),
    requiredPatterns: z.array(z.string()).optional(),
    maxLines: z.number().int().positive().optional(),
    maxCharacters: z.number().int().positive().optional(),
    allowExternalLibraries: z.boolean().default(false),
    allowedImports: z.array(z.string()).optional(),
    scoring: z.object({
      correctnessWeight: z.number().min(0).max(1).default(0.7),
      performanceWeight: z.number().min(0).max(1).default(0.2),
      styleWeight: z.number().min(0).max(1).default(0.1),
    }).optional(),
  }).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const TestCaseSchema = z.object({
  id: z.string().uuid(),
  input: z.string(),
  expectedOutput: z.string(),
  description: z.string().max(500),
  hidden: z.boolean().default(false),
  weight: z.number().min(0).max(1).default(1),
  timeout: z.number().int().positive().max(30).optional(),
  memoryLimit: z.number().int().positive().max(512).optional(),
});

export const HintSchema = z.object({
  id: z.string().uuid(),
  level: z.number().int().min(1).max(5),
  content: z.string().max(2000),
  xpPenalty: z.number().int().nonnegative().max(50),
  unlockCondition: z.enum(['attempts', 'time', 'manual']).default('attempts'),
  unlockValue: z.number().int().positive().default(1),
});

export const CoursePackageSchema = z.object({
  manifest: z.object({
    formatVersion: z.string().default('1.0'),
    exportedAt: z.number(),
    exportedBy: z.string().optional(),
  }),
  courses: z.array(CourseSchema),
  lessons: z.array(LessonSchema),
  exercises: z.array(ExerciseSchema),
  assets: z.record(z.string()).optional(),
});

export type Course = z.infer<typeof CourseSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type TestCase = z.infer<typeof TestCaseSchema>;
export type Hint = z.infer<typeof HintSchema>;
export type CoursePackage = z.infer<typeof CoursePackageSchema>;

export function validateCourse(data: unknown): Course {
  return CourseSchema.parse(data);
}

export function validateLesson(data: unknown): Lesson {
  return LessonSchema.parse(data);
}

export function validateExercise(data: unknown): Exercise {
  return ExerciseSchema.parse(data);
}

export function validateCoursePackage(data: unknown): CoursePackage {
  return CoursePackageSchema.parse(data);
}

export function createCourseId(): string {
  return crypto.randomUUID();
}

export function createLessonId(): string {
  return crypto.randomUUID();
}

export function createExerciseId(): string {
  return crypto.randomUUID();
}

export function createTestCaseId(): string {
  return crypto.randomUUID();
}

export function createHintId(): string {
  return crypto.randomUUID();
}

export const DIFFICULTY_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
} as const;

export const EXERCISE_TYPE_LABELS = {
  code: 'Code Challenge',
  'multiple-choice': 'Multiple Choice',
  'fill-blank': 'Fill in the Blank',
  'drag-drop': 'Drag & Drop',
  project: 'Project',
  debugging: 'Debugging',
  'code-review': 'Code Review',
} as const;

export const CONTENT_TYPE_LABELS = {
  markdown: 'Markdown',
  html: 'HTML',
  video: 'Video',
  interactive: 'Interactive',
} as const;