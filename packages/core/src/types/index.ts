import { z } from 'zod';

export const PluginManifestSchema = z.object({
  name: z.string().min(1).max(100),
  version: z.string().regex(/^\d+\.\d+\.\d+(-[\w.]+)?$/),
  description: z.string().max(500).optional(),
  author: z.string().optional(),
  license: z.string().optional(),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  keywords: z.array(z.string()).optional(),
  main: z.string().optional(),
  module: z.string().optional(),
  types: z.string().optional(),
  exports: z.record(z.string()).optional(),
  dependencies: z.record(z.string()).optional(),
  peerDependencies: z.record(z.string()).optional(),
  optionalDependencies: z.record(z.string()).optional(),
  codeforge: z.object({
    type: z.enum([
      'course',
      'language',
      'editor',
      'theme',
      'ai-model',
      'template',
      'assessment',
      'analytics',
      'gamification',
      'community',
      'world',
      'utility',
    ]),
    entryPoint: z.string(),
    provides: z.array(z.string()).optional(),
    requires: z.array(z.string()).optional(),
    configSchema: z.record(z.unknown()).optional(),
    defaultConfig: z.record(z.unknown()).optional(),
    permissions: z
      .array(
        z.enum([
          'fs:read',
          'fs:write',
          'network:fetch',
          'network:websocket',
          'clipboard:read',
          'clipboard:write',
          'notifications',
          'idle-detection',
          'gpu',
          'audio',
          'video',
        ])
      )
      .optional(),
    minCoreVersion: z.string().optional(),
    maxCoreVersion: z.string().optional(),
  }),
});

export type PluginManifest = z.infer<typeof PluginManifestSchema>;

export interface PluginContext {
  pluginId: string;
  manifest: PluginManifest;
  config: Record<string, unknown>;
  storage: PluginStorage;
  events: EventBus;
  logger: PluginLogger;
  api: CoreAPI;
}

export interface PluginStorage {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

export interface PluginLogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

export interface CoreAPI {
  plugins: PluginRegistryAPI;
  data: DataAPI;
  courses: CourseAPI;
  editor: EditorAPI;
  gamification: GamificationAPI;
  ui: UIAPI;
}

export interface PluginRegistryAPI {
  getPlugin(id: string): PluginInstance | undefined;
  getPluginsByType(type: PluginManifest['codeforge']['type']): PluginInstance[];
  onPluginLoaded(callback: (plugin: PluginInstance) => void): () => void;
  onPluginUnloaded(callback: (pluginId: string) => void): () => void;
}

export interface DataAPI {
  repository<T>(name: string): Repository<T>;
  transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T>;
  migrate(): Promise<void>;
}

export interface CourseAPI {
  getCourse(id: string): Promise<Course | undefined>;
  getCourses(): Promise<Course[]>;
  getExercises(courseId: string): Promise<Exercise[]>;
  onProgressChange(callback: (progress: UserProgress) => void): () => void;
}

export interface EditorAPI {
  openFile(path: string): Promise<void>;
  getOpenFiles(): EditorFile[];
  onFileChange(callback: (file: EditorFile) => void): () => void;
  executeCode(language: string, code: string): Promise<ExecutionResult>;
}

export interface GamificationAPI {
  awardXP(amount: number, source: string): Promise<void>;
  unlockAchievement(id: string): Promise<void>;
  getUserStats(): Promise<UserStats>;
  onAchievementUnlocked(callback: (achievement: Achievement) => void): () => void;
}

export interface UIAPI {
  notify(notification: Notification): void;
  openModal(component: React.ComponentType, props?: Record<string, unknown>): Promise<unknown>;
  registerCommand(command: Command): () => void;
  registerSetting(setting: Setting): () => void;
}

export interface Repository<T> {
  findById(id: string): Promise<T | undefined>;
  findAll(): Promise<T[]>;
  find(query: Query<T>): Promise<T[]>;
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, changes: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  count(query: Query<T>): Promise<number>;
}

export interface Query<T> {
  where?: Partial<T>;
  orderBy?: { field: keyof T; direction: 'asc' | 'desc' }[];
  limit?: number;
  offset?: number;
}

export interface Transaction {
  repository<T>(name: string): Repository<T>;
}

export interface PluginInstance {
  id: string;
  manifest: PluginManifest;
  context: PluginContext;
  module: unknown;
  status: 'loading' | 'loaded' | 'error' | 'unloaded';
  error?: Error;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  version: string;
  author: string;
  tags: string[];
  language: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  lessons: Lesson[];
  prerequisites: string[];
  learningObjectives: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  id: string;
  courseId: string;
  order: number;
  title: string;
  description: string;
  content: string;
  contentType: 'markdown' | 'html' | 'video' | 'interactive';
  exercises: Exercise[];
  estimatedMinutes: number;
  xpReward: number;
}

export interface Exercise {
  id: string;
  lessonId: string;
  order: number;
  type: 'code' | 'multiple-choice' | 'fill-blank' | 'drag-drop' | 'project';
  title: string;
  description: string;
  instructions: string;
  starterCode?: string;
  solution?: string;
  tests: TestCase[];
  hints: Hint[];
  xpReward: number;
  difficulty: number;
  timeLimit?: number;
  memoryLimit?: number;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  description: string;
  hidden: boolean;
  weight: number;
}

export interface Hint {
  level: number;
  content: string;
  xpPenalty: number;
}

export interface UserProgress {
  userId: string;
  courseId: string;
  lessonId: string;
  exerciseId: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'failed';
  score: number;
  attempts: number;
  timeSpent: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  totalXP: number;
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  streakDays: number;
  longestStreak: number;
  coursesCompleted: number;
  exercisesCompleted: number;
  achievementsUnlocked: number;
  totalTimeSpent: number;
  lastActiveDate: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'course' | 'streak' | 'social' | 'creative' | 'mastery' | 'special';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  criteria: AchievementCriteria;
  unlockedAt?: Date;
}

export interface AchievementCriteria {
  type: 'count' | 'streak' | 'completion' | 'custom';
  target: number;
  scope?: string;
  customFn?: string;
}

export interface EditorFile {
  path: string;
  content: string;
  language: string;
  isDirty: boolean;
  isActive: boolean;
  cursorPosition?: { line: number; column: number };
  selection?: { start: { line: number; column: number }; end: { line: number; column: number } };
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  memoryUsed: number;
  testResults?: TestResult[];
}

export interface TestResult {
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  message?: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface Command {
  id: string;
  title: string;
  description: string;
  icon?: string;
  shortcut?: string;
  handler: () => void | Promise<void>;
  when?: string;
}

export interface Setting {
  id: string;
  title: string;
  description: string;
  type: 'boolean' | 'string' | 'number' | 'select' | 'color' | 'json';
  default: unknown;
  options?: { label: string; value: unknown }[];
  category: string;
  requiresReload?: boolean;
}

export interface Repository<T> {
  findById(id: string): Promise<T | undefined>;
  findAll(): Promise<T[]>;
  find(query: Query<T>): Promise<T[]>;
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, changes: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  count(query: Query<T>): Promise<number>;
}

export interface Query<T> {
  where?: Partial<T>;
  orderBy?: { field: keyof T; direction: 'asc' | 'desc' }[];
  limit?: number;
  offset?: number;
}

export interface Transaction {
  repository<T>(name: string): Repository<T>;
}