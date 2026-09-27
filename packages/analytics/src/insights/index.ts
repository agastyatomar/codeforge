import { createDexieRepository, db } from '@codeforge/data/dexie';
import { AnalyticsEvent } from '../tracker';

export interface LearningInsight {
  id: string;
  userId: string;
  type: 'progress' | 'engagement' | 'performance' | 'retention' | 'recommendation';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'success' | 'critical';
  metricValue: number;
  threshold?: number;
  actionable: boolean;
  suggestedActions: string[];
  generatedAt: number;
  expiresAt?: number;
}

export interface ProgressReport {
  userId: string;
  period: { start: number; end: number };
  summary: {
    totalXPEarned: number;
    exercisesCompleted: number;
    coursesCompleted: number;
    lessonsCompleted: number;
    averageScore: number;
    totalTimeSpent: number;
    streakDays: number;
    achievementsUnlocked: number;
  };
  trends: {
    xpTrend: 'up' | 'down' | 'stable';
    engagementTrend: 'up' | 'down' | 'stable';
    performanceTrend: 'up' | 'down' | 'stable';
  };
  breakdown: {
    byLanguage: Record<string, { xp: number; exercises: number; timeSpent: number }>;
    byCourse: Record<string, { progress: number; xp: number; completed: boolean }>;
    byDayOfWeek: Record<number, { xp: number; sessions: number }>;
    byHourOfDay: Record<number, { xp: number; sessions: number }>;
  };
  generatedAt: number;
}

export interface HeatmapData {
  userId: string;
  period: { start: number; end: number };
  data: Array<{
    date: string;
    value: number;
    events: number;
  }>;
  maxValue: number;
  totalValue: number;
}

export interface PredictionResult {
  userId: string;
  predictions: {
    nextCourseCompletion?: { courseId: string; probability: number; estimatedDays: number };
    streakRisk?: { riskLevel: 'low' | 'medium' | 'high'; daysAtRisk: number };
    churnRisk?: { riskLevel: 'low' | 'medium' | 'high'; factors: string[] };
    nextAchievement?: { achievementId: string; probability: number; estimatedXP: number };
    recommendedCourse?: { courseId: string; reason: string; confidence: number };
  };
  generatedAt: number;
  modelVersion: string;
}

export class InsightsEngine {
  private eventsRepo = createDexieRepository(db.syncQueue as any);

  async generateInsights(userId: string): Promise<LearningInsight[]> {
    const events = await this.getUserEvents(userId);
    const insights: LearningInsight[] = [];

    // Progress insights
    insights.push(...this.analyzeProgress(userId, events));
    
    // Engagement insights
    insights.push(...this.analyzeEngagement(userId, events));
    
    // Performance insights
    insights.push(...this.analyzePerformance(userId, events));
    
    // Retention insights
    insights.push(...this.analyzeRetention(userId, events));

    return insights.sort((a, b) => {
      const severityOrder = { critical: 4, warning: 3, info: 2, success: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  private getUserEvents(userId: string, days = 30): AnalyticsEvent[] {
    // Would query from database
    return [];
  }

  private analyzeProgress(userId: string, events: AnalyticsEvent[]): LearningInsight[] {
    const insights: LearningInsight[] = [];
    
    const exerciseEvents = events.filter(e => e.eventName === 'exercise_completed');
    const completedExercises = exerciseEvents.filter(e => e.properties.passed === true);
    const totalExercises = exerciseEvents.length;
    const completionRate = totalExercises > 0 ? completedExercises.length / totalExercises : 0;

    if (completionRate < 0.5 && totalExercises > 5) {
      insights.push({
        id: uuidv4(),
        userId,
        type: 'progress',
        title: 'Low Exercise Completion Rate',
        description: `Your exercise completion rate is ${Math.round(completionRate * 100)}%. Consider reviewing hints or reducing difficulty.`,
        severity: 'warning',
        metricValue: completionRate,
        threshold: 0.5,
        actionable: true,
        suggestedActions: [
          'Review hint system for difficult exercises',
          'Try easier exercises to build confidence',
          'Focus on one concept at a time',
        ],
        generatedAt: Date.now(),
      });
    }

    const xpEvents = events.filter(e => e.eventName === 'xp_awarded');
    const totalXP = xpEvents.reduce((sum, e) => sum + (e.properties.amount as number || 0), 0);
    const avgDailyXP = totalXP / 30;

    if (avgDailyXP < 50) {
      insights.push({
        id: uuidv4(),
        userId,
        type: 'progress',
        title: 'Low Daily XP',
        description: `You're earning an average of ${Math.round(avgDailyXP)} XP per day. Try setting a daily goal.`,
        severity: 'info',
        metricValue: avgDailyXP,
        threshold: 50,
        actionable: true,
        suggestedActions: [
          'Set a daily XP goal (e.g., 100 XP/day)',
          'Complete at least one exercise daily',
          'Try challenge packs for bonus XP',
        ],
        generatedAt: Date.now(),
      });
    }

    return insights;
  }

  private analyzeEngagement(userId: string, events: AnalyticsEvent[]): LearningInsight[] {
    const insights: LearningInsight[] = [];
    
    const sessionEvents = events.filter(e => e.eventName === 'session_start' || e.eventName === 'session_end');
    const uniqueDays = new Set(events.map(e => new Date(e.timestamp).toDateString())).size;
    
    if (uniqueDays < 7) {
      insights.push({
        id: uuidv4(),
        userId,
        type: 'engagement',
        title: 'Low Weekly Engagement',
        description: `You've been active on ${uniqueDays} of the last 7 days. Consistency is key for learning.`,
        severity: 'warning',
        metricValue: uniqueDays,
        threshold: 7,
        actionable: true,
        suggestedActions: [
          'Set a daily learning reminder',
          'Join a study group or find a learning buddy',
          'Start with just 15 minutes per day',
        ],
        generatedAt: Date.now(),
      });
    }

    const aiEvents = events.filter(e => e.eventName === 'ai_assistant_used');
    if (aiEvents.length === 0) {
      insights.push({
        id: uuidv4(),
        userId,
        type: 'engagement',
        title: 'AI Assistant Not Used',
        description: 'The AI assistant can help with code explanations, debugging, and completions.',
        severity: 'info',
        metricValue: 0,
        threshold: 1,
        actionable: true,
        suggestedActions: [
          'Try asking the AI to explain a difficult concept',
          'Use AI for code completion while coding',
          'Ask AI to generate practice exercises',
        ],
        generatedAt: Date.now(),
      });
    }

    return insights;
  }

  private analyzePerformance(userId: string, events: AnalyticsEvent[]): LearningInsight[] {
    const insights: LearningInsight[] = [];
    
    const codeEvents = events.filter(e => e.eventName === 'code_executed');
    const failedExecutions = codeEvents.filter(e => e.properties.success === false);
    const failureRate = codeEvents.length > 0 ? failedExecutions.length / codeEvents.length : 0;

    if (failureRate > 0.3 && codeEvents.length > 10) {
      insights.push({
        id: uuidv4(),
        userId,
        type: 'performance',
        title: 'High Code Execution Failure Rate',
        description: `${Math.round(failureRate * 100)}% of your code executions are failing. Review error messages carefully.`,
        severity: 'warning',
        metricValue: failureRate,
        threshold: 0.3,
        actionable: true,
        suggestedActions: [
          'Read error messages completely before fixing',
          'Use AI assistant to explain errors',
          'Test code incrementally with small changes',
        ],
        generatedAt: Date.now(),
      });
    }

    const avgExecutionTime = codeEvents.length > 0
      ? codeEvents.reduce((sum, e) => sum + (e.properties.execution_time as number || 0), 0) / codeEvents.length
      : 0;

    if (avgExecutionTime > 5000) {
      insights.push({
        id: uuidv4(),
        userId,
        type: 'performance',
        title: 'Slow Code Execution',
        description: `Average execution time is ${Math.round(avgExecutionTime)}ms. Consider optimizing algorithms.`,
        severity: 'info',
        metricValue: avgExecutionTime,
        threshold: 5000,
        actionable: true,
        suggestedActions: [
          'Profile code to find bottlenecks',
          'Use more efficient algorithms/data structures',
          'Avoid unnecessary computations in loops',
        ],
        generatedAt: Date.now(),
      });
    }

    return insights;
  }

  private analyzeRetention(userId: string, events: AnalyticsEvent[]): LearningInsight[] {
    const insights: LearningInsight[] = [];
    
    const now = Date.now();
    const lastEvent = events.length > 0 ? Math.max(...events.map(e => e.timestamp)) : 0;
    const daysSinceActivity = lastEvent > 0 ? Math.floor((now - lastEvent) / (1000 * 60 * 60 * 24)) : 999;

    if (daysSinceActivity > 7) {
      insights.push({
        id: uuidv4(),
        userId,
        type: 'retention',
        title: 'Inactive for a Week',
        description: `You haven't been active for ${daysSinceActivity} days. Don't lose your streak!`,
        severity: daysSinceActivity > 14 ? 'critical' : 'warning',
        metricValue: daysSinceActivity,
        threshold: 7,
        actionable: true,
        suggestedActions: [
          'Complete a quick 15-minute exercise',
          'Review your last completed lesson',
          'Set a specific time for learning today',
        ],
        generatedAt: Date.now(),
      });
    }

    return insights;
  }

  async generateProgressReport(userId: string, periodDays = 30): Promise<ProgressReport> {
    const events = await this.getUserEvents(userId, periodDays);
    const now = Date.now();
    const start = now - periodDays * 24 * 60 * 60 * 1000;

    const xpEvents = events.filter(e => e.eventName === 'xp_awarded');
    const totalXPEarned = xpEvents.reduce((sum, e) => sum + (e.properties.amount as number || 0), 0);
    
    const exerciseEvents = events.filter(e => e.eventName === 'exercise_completed');
    const completedExercises = exerciseEvents.filter(e => e.properties.passed === true);
    
    const courseEvents = events.filter(e => e.eventName === 'course_completed');
    const lessonEvents = events.filter(e => e.eventName === 'lesson_completed');
    
    const scores = exerciseEvents.map(e => e.properties.score as number).filter(s => s > 0);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    
    const timeEvents = events.filter(e => e.properties.time_spent);
    const totalTimeSpent = timeEvents.reduce((sum, e) => sum + (e.properties.time_spent as number || 0), 0);

    return {
      userId,
      period: { start, end: now },
      summary: {
        totalXPEarned,
        exercisesCompleted: completedExercises.length,
        coursesCompleted: courseEvents.length,
        lessonsCompleted: lessonEvents.length,
        averageScore,
        totalTimeSpent,
        streakDays: 0, // Would calculate from streak data
        achievementsUnlocked: events.filter(e => e.eventName === 'achievement_unlocked').length,
      },
      trends: {
        xpTrend: this.calculateTrend(xpEvents.map(e => e.properties.amount as number || 0)),
        engagementTrend: this.calculateTrend(events.map(e => 1)),
        performanceTrend: this.calculateTrend(scores),
      },
      breakdown: {
        byLanguage: this.breakdownByLanguage(events),
        byCourse: this.breakdownByCourse(events),
        byDayOfWeek: this.breakdownByDayOfWeek(events),
        byHourOfDay: this.breakdownByHourOfDay(events),
      },
      generatedAt: now,
    };
  }

  private calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable';
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const diff = (secondAvg - firstAvg) / firstAvg;
    if (diff > 0.1) return 'up';
    if (diff < -0.1) return 'down';
    return 'stable';
  }

  private breakdownByLanguage(events: AnalyticsEvent[]): Record<string, { xp: number; exercises: number; timeSpent: number }> {
    const breakdown: Record<string, { xp: number; exercises: number; timeSpent: number }> = {};
    
    for (const event of events) {
      const lang = event.properties.language as string;
      if (!lang) continue;
      
      if (!breakdown[lang]) {
        breakdown[lang] = { xp: 0, exercises: 0, timeSpent: 0 };
      }
      
      if (event.eventName === 'xp_awarded') {
        breakdown[lang].xp += event.properties.amount as number || 0;
      }
      if (event.eventName === 'exercise_completed') {
        breakdown[lang].exercises += 1;
      }
      if (event.properties.time_spent) {
        breakdown[lang].timeSpent += event.properties.time_spent as number;
      }
    }
    
    return breakdown;
  }

  private breakdownByCourse(events: AnalyticsEvent[]): Record<string, { progress: number; xp: number; completed: boolean }> {
    // Simplified implementation
    return {};
  }

  private breakdownByDayOfWeek(events: AnalyticsEvent[]): Record<number, { xp: number; sessions: number }> {
    const breakdown: Record<number, { xp: number; sessions: number }> = {};
    
    for (let i = 0; i < 7; i++) {
      breakdown[i] = { xp: 0, sessions: 0 };
    }
    
    for (const event of events) {
      if (event.eventName === 'xp_awarded') {
        const day = new Date(event.timestamp).getDay();
        breakdown[day].xp += event.properties.amount as number || 0;
        breakdown[day].sessions += 1;
      }
    }
    
    return breakdown;
  }

  private breakdownByHourOfDay(events: AnalyticsEvent[]): Record<number, { xp: number; sessions: number }> {
    const breakdown: Record<number, { xp: number; sessions: number }> = {};
    
    for (let i = 0; i < 24; i++) {
      breakdown[i] = { xp: 0, sessions: 0 };
    }
    
    for (const event of events) {
      if (event.eventName === 'xp_awarded') {
        const hour = new Date(event.timestamp).getHours();
        breakdown[hour].xp += event.properties.amount as number || 0;
        breakdown[hour].sessions += 1;
      }
    }
    
    return breakdown;
  }

  async generateHeatmap(userId: string, days = 365): Promise<HeatmapData> {
    const events = await this.getUserEvents(userId, days);
    const now = Date.now();
    const start = now - days * 24 * 60 * 60 * 1000;
    
    const dailyData = new Map<string, { value: number; events: number }>();
    
    for (const event of events) {
      if (event.eventName === 'xp_awarded') {
        const date = new Date(event.timestamp).toISOString().split('T')[0];
        const existing = dailyData.get(date) || { value: 0, events: 0 };
        existing.value += event.properties.amount as number || 0;
        existing.events += 1;
        dailyData.set(date, existing);
      }
    }
    
    const data = Array.from(dailyData.entries()).map(([date, value]) => ({
      date,
      value: value.value,
      events: value.events,
    }));
    
    const maxValue = Math.max(...data.map(d => d.value), 0);
    const totalValue = data.reduce((sum, d) => sum + d.value, 0);
    
    return {
      userId,
      period: { start, end: now },
      data,
      maxValue,
      totalValue,
    };
  }

  async generatePredictions(userId: string): Promise<PredictionResult> {
    // Simplified prediction - would use ML model in production
    return {
      userId,
      predictions: {
        nextCourseCompletion: {
          courseId: 'course-1',
          probability: 0.75,
          estimatedDays: 14,
        },
        streakRisk: {
          riskLevel: 'low',
          daysAtRisk: 0,
        },
        churnRisk: {
          riskLevel: 'low',
          factors: [],
        },
        nextAchievement: {
          achievementId: 'dedicated-learner',
          probability: 0.8,
          estimatedXP: 250,
        },
        recommendedCourse: {
          courseId: 'javascript-fundamentals',
          reason: 'Natural progression after Python basics',
          confidence: 0.85,
        },
      },
      generatedAt: Date.now(),
      modelVersion: '1.0.0',
    };
  }
}

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function createInsightsEngine() {
  return new InsightsEngine();
}