import { parse as parseYaml } from 'yaml';
import matter from 'gray-matter';
import { compileMDX } from 'mdx-bundler';
import { CourseSchema, LessonSchema, ExerciseSchema, CoursePackageSchema, type Course, type Lesson, type Exercise, type CoursePackage } from '../schema';
import { z } from 'zod';

export interface ParsedCourse {
  course: Course;
  lessons: Lesson[];
  exercises: Exercise[];
}

export interface ParsedLesson {
  lesson: Lesson;
  exercises: Exercise[];
}

export interface ParseOptions {
  validate?: boolean;
  includeContent?: boolean;
  language?: string;
}

export class CourseParser {
  private options: ParseOptions;

  constructor(options: ParseOptions = {}) {
    this.options = {
      validate: true,
      includeContent: true,
      language: 'en',
      ...options,
    };
  }

  async parseCourseFromDirectory(dirPath: string): Promise<ParsedCourse> {
    const courseFile = await this.readFile(`${dirPath}/course.yaml`);
    const course = this.parseCourseYaml(courseFile);

    const lessons: Lesson[] = [];
    const exercises: Exercise[] = [];

    const lessonDirs = await this.listDirectories(`${dirPath}/lessons`);

    for (const lessonDir of lessonDirs.sort()) {
      const lessonFile = await this.readFile(`${dirPath}/lessons/${lessonDir}/lesson.yaml`);
      const lesson = this.parseLessonYaml(lessonFile, course.id);

      const exerciseFiles = await this.listFiles(`${dirPath}/lessons/${lessonDir}/exercises`, '.yaml');
      for (const exFile of exerciseFiles.sort()) {
        const exercise = this.parseExerciseYaml(
          await this.readFile(`${dirPath}/lessons/${lessonDir}/exercises/${exFile}`),
          lesson.id
        );
        exercises.push(exercise);
        lesson.exercises.push(exercise.id);
      }

      lessons.push(lesson);
    }

    course.lessons = lessons.map((l) => l.id);

    if (this.options.validate) {
      CourseSchema.parse(course);
      for (const lesson of lessons) LessonSchema.parse(lesson);
      for (const exercise of exercises) ExerciseSchema.parse(exercise);
    }

    return { course, lessons, exercises };
  }

  parseCourseYaml(content: string): Course {
    const { data } = matter(content);
    const parsed = parseYaml(data.content || content);
    return {
      ...parsed,
      id: parsed.id || crypto.randomUUID(),
      createdAt: parsed.createdAt || Date.now(),
      updatedAt: parsed.updatedAt || Date.now(),
    } as Course;
  }

  parseLessonYaml(content: string, courseId: string): Lesson {
    const { data } = matter(content);
    const parsed = parseYaml(data.content || content);
    return {
      ...parsed,
      id: parsed.id || crypto.randomUUID(),
      courseId,
      exercises: parsed.exercises || [],
      createdAt: parsed.createdAt || Date.now(),
      updatedAt: parsed.updatedAt || Date.now(),
    } as Lesson;
  }

  parseExerciseYaml(content: string, lessonId: string): Exercise {
    const { data } = matter(content);
    const parsed = parseYaml(data.content || content);
    return {
      ...parsed,
      id: parsed.id || crypto.randomUUID(),
      lessonId,
      tests: parsed.tests || [],
      hints: parsed.hints || [],
      createdAt: parsed.createdAt || Date.now(),
      updatedAt: parsed.updatedAt || Date.now(),
    } as Exercise;
  }

  async parseMDXLesson(content: string): Promise<{ component: React.ComponentType; frontmatter: Record<string, unknown> }> {
    const { code, frontmatter } = await compileMDX({
      source: content,
      cwd: process.cwd(),
    });
    return { component: code as unknown as React.ComponentType, frontmatter };
  }

  async parseCoursePackage(jsonContent: string): Promise<CoursePackage> {
    const parsed = JSON.parse(jsonContent);
    if (this.options.validate) {
      return CoursePackageSchema.parse(parsed);
    }
    return parsed;
  }

  serializeCoursePackage(pkg: CoursePackage): string {
    return JSON.stringify(pkg, null, 2);
  }

  async parseYamlFile<T>(filePath: string, schema: z.ZodSchema<T>): Promise<T> {
    const content = await this.readFile(filePath);
    const { data } = matter(content);
    const parsed = parseYaml(data.content || content);
    if (this.options.validate) {
      return schema.parse(parsed);
    }
    return parsed;
  }

  private async readFile(path: string): Promise<string> {
    if (typeof window !== 'undefined') {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Failed to read ${path}: ${response.statusText}`);
      return response.text();
    }
    const fs = await import('fs/promises');
    return fs.readFile(path, 'utf-8');
  }

  private async listDirectories(path: string): Promise<string[]> {
    if (typeof window !== 'undefined') {
      return [];
    }
    const fs = await import('fs/promises');
    const entries = await fs.readdir(path, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  }

  private async listFiles(path: string, extension: string): Promise<string[]> {
    if (typeof window !== 'undefined') {
      return [];
    }
    const fs = await import('fs/promises');
    const entries = await fs.readdir(path, { withFileTypes: true });
    return entries.filter((e) => e.isFile() && e.name.endsWith(extension)).map((e) => e.name);
  }
}

export function createCourseParser(options?: ParseOptions): CourseParser {
  return new CourseParser(options);
}

export function parseCourseYaml(content: string): Course {
  const parser = new CourseParser();
  return parser.parseCourseYaml(content);
}

export function parseLessonYaml(content: string, courseId: string): Lesson {
  const parser = new CourseParser();
  return parser.parseLessonYaml(content, courseId);
}

export function parseExerciseYaml(content: string, lessonId: string): Exercise {
  const parser = new CourseParser();
  return parser.parseExerciseYaml(content, lessonId);
}

export async function parseMDXContent(source: string) {
  const { code, frontmatter } = await compileMDX({ source });
  return { component: code as unknown as React.ComponentType, frontmatter };
}