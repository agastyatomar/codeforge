import { Octokit } from '@octokit/rest';
import { CourseParser, createCourseParser } from '../parser';
import { CourseSchema, LessonSchema, ExerciseSchema, type Course, type Lesson, type Exercise } from '../schema';
import { generateId } from '@codeforge/core/utils';

export interface CodedexRepoConfig {
  owner: string;
  repo: string;
  branch?: string;
  token?: string;
}

export interface ImportResult {
  courses: Course[];
  lessons: Lesson[];
  exercises: Exercise[];
  errors: string[];
}

export class CodedexImporter {
  private octokit: Octokit;
  private parser: CourseParser;
  private config: CodedexRepoConfig;

  constructor(config: CodedexRepoConfig) {
    this.config = { branch: 'main', ...config };
    this.octokit = new Octokit({ auth: this.config.token });
    this.parser = createCourseParser({ validate: true });
  }

  async importAll(): Promise<ImportResult> {
    const result: ImportResult = {
      courses: [],
      lessons: [],
      exercises: [],
      errors: [],
    };

    try {
      const repos = await this.getCourseRepos();
      for (const repo of repos) {
        try {
          const repoResult = await this.importRepo(repo);
          result.courses.push(...repoResult.courses);
          result.lessons.push(...repoResult.lessons);
          result.exercises.push(...repoResult.exercises);
        } catch (error) {
          result.errors.push(`Failed to import ${repo}: ${error}`);
        }
      }
    } catch (error) {
      result.errors.push(`Failed to fetch repos: ${error}`);
    }

    return result;
  }

  async importRepo(repoName: string): Promise<ImportResult> {
    const result: ImportResult = {
      courses: [],
      lessons: [],
      exercises: [],
      errors: [],
    };

    try {
      const tree = await this.getRepoTree(repoName);
      const courseFiles = tree.filter((f) => f.path.endsWith('course.yaml') || f.path.endsWith('course.yml'));

      for (const file of courseFiles) {
        try {
          const content = await this.getFileContent(repoName, file.path);
          const course = this.parser.parseCourseYaml(content);
          course.id = generateId('course-');
          result.courses.push(course);

          const lessonDir = file.path.replace(/course\.(yaml|yml)$/, 'lessons/');
          const lessonFiles = tree
            .filter((f) => f.path.startsWith(lessonDir) && (f.path.endsWith('lesson.yaml') || f.path.endsWith('lesson.yml')))
            .sort();

          for (const lessonFile of lessonFiles) {
            const lessonContent = await this.getFileContent(repoName, lessonFile.path);
            const lesson = this.parser.parseLessonYaml(lessonContent, course.id);
            lesson.id = generateId('lesson-');
            result.lessons.push(lesson);

            const exerciseDir = lessonFile.path.replace(/lesson\.(yaml|yml)$/, 'exercises/');
            const exerciseFiles = tree
              .filter((f) => f.path.startsWith(exerciseDir) && (f.path.endsWith('.yaml') || f.path.endsWith('.yml')))
              .sort();

            for (const exerciseFile of exerciseFiles) {
              const exerciseContent = await this.getFileContent(repoName, exerciseFile.path);
              const exercise = this.parser.parseExerciseYaml(exerciseContent, lesson.id);
              exercise.id = generateId('exercise-');
              result.exercises.push(exercise);
              lesson.exercises.push(exercise.id);
            }
          }
        } catch (error) {
          result.errors.push(`Failed to import course from ${file.path}: ${error}`);
        }
      }
    } catch (error) {
      result.errors.push(`Failed to import repo ${repoName}: ${error}`);
    }

    return result;
  }

  private async getCourseRepos(): Promise<string[]> {
    const { data: repos } = await this.octokit.repos.listForOrg({
      org: this.config.owner,
      type: 'public',
      per_page: 100,
    });
    return repos.filter((r) => r.name.endsWith('-101') || r.name.endsWith('-202') || r.name.includes('course')).map((r) => r.name);
  }

  private async getRepoTree(repoName: string): Promise<Array<{ path: string; type: string }>> {
    const { data } = await this.octokit.git.getTree({
      owner: this.config.owner,
      repo: repoName,
      tree_sha: this.config.branch!,
      recursive: '1',
    });
    return data.tree.map((t) => ({ path: t.path, type: t.type }));
  }

  private async getFileContent(repoName: string, path: string): Promise<string> {
    const { data } = await this.octokit.repos.getContent({
      owner: this.config.owner,
      repo: repoName,
      path,
      ref: this.config.branch,
    });

    if ('content' in data) {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    throw new Error(`File ${path} is a directory`);
  }
}

export async function importCodedexCourses(config: CodedexImporter): Promise<ImportResult> {
  const importer = new CodedexImporter(config);
  return importer.importAll();
}

export function convertCodedexExercise(codedexExercise: {
  id: string;
  title: string;
  description: string;
  instructions: string;
  starterCode?: string;
  solution?: string;
  tests: Array<{ input: string; expected: string; hidden?: boolean }>;
  hints?: Array<{ level: number; content: string; penalty?: number }>;
  xp: number;
  difficulty: number;
}): Exercise {
  return {
    id: generateId('exercise-'),
    lessonId: '',
    order: 0,
    type: 'code',
    title: codedexExercise.title,
    description: codedexExercise.description,
    instructions: codedexExercise.instructions,
    starterCode: codedexExercise.starterCode,
    solution: codedexExercise.solution,
    tests: codedexExercise.tests.map((t, i) => ({
      id: generateId('test-'),
      input: t.input,
      expectedOutput: t.expected,
      description: `Test case ${i + 1}`,
      hidden: t.hidden || false,
      weight: 1,
    })),
    hints: (codedexExercise.hints || []).map((h, i) => ({
      id: generateId('hint-'),
      level: h.level || i + 1,
      content: h.content,
      xpPenalty: h.penalty || 5,
      unlockCondition: 'attempts' as const,
      unlockValue: 1,
    })),
    xpReward: codedexExercise.xp,
    difficulty: codedexExercise.difficulty,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function convertCodedexLesson(codedexLesson: {
  id: string;
  title: string;
  description: string;
  content: string;
  contentType: 'markdown' | 'html' | 'video';
  exercises: string[];
  estimatedMinutes: number;
  xp: number;
}): Lesson {
  return {
    id: generateId('lesson-'),
    courseId: '',
    order: 0,
    title: codedexLesson.title,
    description: codedexLesson.description,
    content: codedexLesson.content,
    contentType: codedexLesson.contentType,
    exercises: codedexLesson.exercises,
    estimatedMinutes: codedexLesson.estimatedMinutes,
    xpReward: codedexLesson.xp,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function convertCodedexCourse(codedexCourse: {
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
  lessons: string[];
  prerequisites: string[];
  learningObjectives: string[];
}): Course {
  return {
    id: generateId('course-'),
    slug: codedexCourse.slug,
    title: codedexCourse.title,
    description: codedexCourse.description,
    version: codedexCourse.version,
    author: codedexCourse.author,
    tags: codedexCourse.tags,
    language: codedexCourse.language,
    difficulty: codedexCourse.difficulty,
    estimatedHours: codedexCourse.estimatedHours,
    lessons: codedexCourse.lessons,
    prerequisites: codedexCourse.prerequisites,
    learningObjectives: codedexCourse.learningObjectives,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}