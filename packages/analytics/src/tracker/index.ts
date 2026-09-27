import { createDexieRepository, db } from '@codeforge/data/dexie';
import { v4 as uuidv4 } from 'uuid';

export interface AnalyticsEvent {
  id: string;
  userId: string;
  eventType: string;
  eventName: string;
  properties: Record<string, unknown>;
  timestamp: number;
  sessionId: string;
  pageUrl?: string;
  userAgent?: string;
}

export interface SessionData {
  id: string;
  userId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  eventsCount: number;
  pagesVisited: string[];
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface EventSchema {
  eventName: string;
  requiredProperties: string[];
  optionalProperties: string[];
  propertyTypes: Record<string, 'string' | 'number' | 'boolean' | 'object' | 'array'>;
}

export class AnalyticsTracker {
  private eventsRepo = createDexieRepository(db.syncQueue as any);
  private sessionsRepo = createDexieRepository(db.syncQueue as any);
  private schemas = new Map<string, EventSchema>();
  private currentSession: SessionData | null = null;
  private eventQueue: AnalyticsEvent[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private isEnabled = true;

  constructor() {
    this.registerCoreSchemas();
    this.initializeSession();
    this.startFlushInterval();
  }

  private registerCoreSchemas(): void {
    const coreSchemas: EventSchema[] = [
      {
        eventName: 'page_view',
        requiredProperties: ['page_url', 'page_title'],
        optionalProperties: ['referrer', 'load_time'],
        propertyTypes: { page_url: 'string', page_title: 'string', referrer: 'string', load_time: 'number' },
      },
      {
        eventName: 'course_started',
        requiredProperties: ['course_id', 'course_slug'],
        optionalProperties: ['lesson_id', 'entry_point'],
        propertyTypes: { course_id: 'string', course_slug: 'string', lesson_id: 'string', entry_point: 'string' },
      },
      {
        eventName: 'lesson_started',
        requiredProperties: ['lesson_id', 'course_id'],
        optionalProperties: ['time_spent_previous'],
        propertyTypes: { lesson_id: 'string', course_id: 'string', time_spent_previous: 'number' },
      },
      {
        eventName: 'exercise_started',
        requiredProperties: ['exercise_id', 'lesson_id', 'exercise_type'],
        optionalProperties: ['attempt_number'],
        propertyTypes: { exercise_id: 'string', lesson_id: 'string', exercise_type: 'string', attempt_number: 'number' },
      },
      {
        eventName: 'exercise_completed',
        requiredProperties: ['exercise_id', 'score', 'time_spent', 'passed'],
        optionalProperties: ['hints_used', 'attempts', 'language'],
        propertyTypes: { exercise_id: 'string', score: 'number', time_spent: 'number', passed: 'boolean', hints_used: 'number', attempts: 'number', language: 'string' },
      },
      {
        eventName: 'code_executed',
        requiredProperties: ['language', 'success', 'execution_time'],
        optionalProperties: ['lines_of_code', 'memory_used', 'error_type'],
        propertyTypes: { language: 'string', success: 'boolean', execution_time: 'number', lines_of_code: 'number', memory_used: 'number', error_type: 'string' },
      },
      {
        eventName: 'build_created',
        requiredProperties: ['build_id', 'template'],
        optionalProperties: ['files_count', 'has_assets'],
        propertyTypes: { build_id: 'string', template: 'string', files_count: 'number', has_assets: 'boolean' },
      },
      {
        eventName: 'build_published',
        requiredProperties: ['build_id'],
        optionalProperties: ['slug', 'is_remix'],
        propertyTypes: { build_id: 'string', slug: 'string', is_remix: 'boolean' },
      },
      {
        eventName: 'achievement_unlocked',
        requiredProperties: ['achievement_id', 'achievement_category'],
        optionalProperties: ['xp_reward'],
        propertyTypes: { achievement_id: 'string', achievement_category: 'string', xp_reward: 'number' },
      },
      {
        eventName: 'streak_updated',
        requiredProperties: ['current_streak', 'longest_streak'],
        optionalProperties: ['freeze_used'],
        propertyTypes: { current_streak: 'number', longest_streak: 'number', freeze_used: 'boolean' },
      },
      {
        eventName: 'ai_assistant_used',
        requiredProperties: ['feature', 'model'],
        optionalProperties: ['tokens_used', 'response_time', 'language'],
        propertyTypes: { feature: 'string', model: 'string', tokens_used: 'number', response_time: 'number', language: 'string' },
      },
      {
        eventName: 'world_entered',
        requiredProperties: ['world_id'],
        optionalProperties: ['session_duration'],
        propertyTypes: { world_id: 'string', session_duration: 'number' },
      },
      {
        eventName: 'search_performed',
        requiredProperties: ['query', 'results_count'],
        optionalProperties: ['category', 'clicked_result'],
        propertyTypes: { query: 'string', results_count: 'number', category: 'string', clicked_result: 'boolean' },
      },
    ];

    for (const schema of coreSchemas) {
      this.schemas.set(schema.eventName, schema);
    }
  }

  private initializeSession(): void {
    const sessionId = uuidv4();
    this.currentSession = {
      id: sessionId,
      userId: 'local-user', // Would be actual user ID
      startTime: Date.now(),
      eventsCount: 0,
      pagesVisited: [],
    };
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 10000); // Flush every 10 seconds
  }

  registerSchema(schema: EventSchema): void {
    this.schemas.set(schema.eventName, schema);
  }

  track(eventName: string, properties: Record<string, unknown> = {}): void {
    if (!this.isEnabled) return;

    const schema = this.schemas.get(eventName);
    if (schema) {
      // Validate required properties
      for (const req of schema.requiredProperties) {
        if (!(req in properties)) {
          console.warn(`Missing required property "${req}" for event "${eventName}"`);
        }
      }
    }

    const event: AnalyticsEvent = {
      id: uuidv4(),
      userId: 'local-user',
      eventType: this.categorizeEvent(eventName),
      eventName,
      properties,
      timestamp: Date.now(),
      sessionId: this.currentSession?.id || 'unknown',
      pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    this.eventQueue.push(event);

    if (this.currentSession) {
      this.currentSession.eventsCount++;
      if (!this.currentSession.pagesVisited.includes(event.properties.page_url as string || '')) {
        this.currentSession.pagesVisited.push(event.properties.page_url as string || '');
      }
    }

    // Flush immediately for important events
    if (this.isHighPriorityEvent(eventName)) {
      this.flush();
    }
  }

  private categorizeEvent(eventName: string): string {
    if (eventName.startsWith('course_') || eventName.startsWith('lesson_') || eventName.startsWith('exercise_')) {
      return 'learning';
    }
    if (eventName.startsWith('build_') || eventName.startsWith('code_')) {
      return 'development';
    }
    if (eventName.startsWith('achievement_') || eventName.startsWith('streak_') || eventName.startsWith('level_')) {
      return 'gamification';
    }
    if (eventName.startsWith('ai_') || eventName.startsWith('world_')) {
      return 'social';
    }
    return 'general';
  }

  private isHighPriorityEvent(eventName: string): boolean {
    const highPriority = [
      'exercise_completed',
      'course_completed',
      'achievement_unlocked',
      'build_published',
      'code_executed',
    ];
    return highPriority.includes(eventName);
  }

  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      for (const event of events) {
        await this.eventsRepo.create({
          id: event.id,
          entityType: 'analytics-event',
          entityId: event.id,
          operation: 'create',
          data: JSON.stringify(event),
          timestamp: event.timestamp,
          retries: 0,
        });
      }
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Re-queue failed events
      this.eventQueue.unshift(...events);
    }
  }

  async endSession(): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.endTime = Date.now();
    this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;

    try {
      await this.sessionsRepo.create({
        id: this.currentSession.id,
        entityType: 'analytics-session',
        entityId: this.currentSession.id,
        operation: 'create',
        data: JSON.stringify(this.currentSession),
        timestamp: this.currentSession.startTime,
        retries: 0,
      });
    } catch (error) {
      console.error('Failed to save session:', error);
    }

    await this.flush();
    this.currentSession = null;
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  getQueueSize(): number {
    return this.eventQueue.length;
  }

  getCurrentSession(): SessionData | null {
    return this.currentSession;
  }
}

export function createAnalyticsTracker(): AnalyticsTracker {
  return new AnalyticsTracker();
}

// Auto-tracking utilities
export function trackPageView(pageTitle: string): void {
  const tracker = createAnalyticsTracker();
  tracker.track('page_view', {
    page_url: typeof window !== 'undefined' ? window.location.href : '',
    page_title: pageTitle,
    referrer: typeof document !== 'undefined' ? document.referrer : '',
  });
}

export function trackCourseStarted(courseId: string, courseSlug: string): void {
  const tracker = createAnalyticsTracker();
  tracker.track('course_started', { course_id: courseId, course_slug: courseSlug });
}

export function trackExerciseCompleted(
  exerciseId: string,
  score: number,
  timeSpent: number,
  passed: boolean,
  metadata: { hintsUsed?: number; attempts?: number; language?: string } = {}
): void {
  const tracker = createAnalyticsTracker();
  tracker.track('exercise_completed', {
    exercise_id: exerciseId,
    score,
    time_spent: timeSpent,
    passed,
    ...metadata,
  });
}