import { createDexieRepository, db } from '@codeforge/data/dexie';
import { z } from 'zod';

export const MentorProfileSchema = z.object({
  userId: z.string().uuid(),
  bio: z.string().max(2000).optional(),
  expertise: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  hourlyRate: z.number().nonnegative().optional(),
  availability: z.object({
    timezone: z.string(),
    schedule: z.array(z.object({
      dayOfWeek: z.number().min(0).max(6),
      startHour: z.number().min(0).max(23),
      endHour: z.number().min(0).max(23),
    })).default([]),
    maxHoursPerWeek: z.number().int().positive().default(10),
  }).optional(),
  rating: z.number().min(0).max(5).default(0),
  totalSessions: z.number().int().nonnegative().default(0),
  specialties: z.array(z.string()).default([]),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
    year: z.number().int(),
  })).default([]),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const MenteeProfileSchema = z.object({
  userId: z.string().uuid(),
  goals: z.array(z.string()).default([]),
  currentLevel: z.string().optional(),
  preferredLanguages: z.array(z.string()).default([]),
  learningStyle: z.enum(['guided', 'project-based', 'problem-solving', 'theory-first']).optional(),
  availability: z.object({
    timezone: z.string(),
    preferredDays: z.array(z.number().min(0).max(6)).default([]),
    preferredHours: z.array(z.number().min(0).max(23)).default([]),
    hoursPerWeek: z.number().int().positive().default(5),
  }).optional(),
  budgetRange: z.object({
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
    currency: z.string().default('USD'),
  }).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const MentorshipRequestSchema = z.object({
  id: z.string().uuid(),
  menteeId: z.string().uuid(),
  mentorId: z.string().uuid(),
  status: z.enum(['pending', 'accepted', 'declined', 'cancelled', 'completed']),
  message: z.string().max(2000).optional(),
  goals: z.array(z.string()).default([]),
  preferredSchedule: z.object({
    frequency: z.enum(['weekly', 'biweekly', 'monthly', 'flexible']),
    duration: z.number().int().positive().default(60), // minutes
    startDate: z.number().optional(),
  }).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  respondedAt: z.number().optional(),
});

export const MentorshipSessionSchema = z.object({
  id: z.string().uuid(),
  mentorshipId: z.string().uuid(),
  mentorId: z.string().uuid(),
  menteeId: z.string().uuid(),
  scheduledAt: z.number(),
  duration: z.number().int().positive(), // minutes
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show']),
  topic: z.string().max(500).optional(),
  notes: z.string().optional(),
  codeReviewId: z.string().optional(),
  recordingUrl: z.string().optional(),
  feedback: z.object({
    mentorRating: z.number().min(1).max(5).optional(),
    menteeRating: z.number().min(1).max(5).optional(),
    mentorFeedback: z.string().optional(),
    menteeFeedback: z.string().optional(),
  }).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const CodeReviewSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  reviewerId: z.string().uuid(),
  authorId: z.string().uuid(),
  code: z.string(),
  language: z.string(),
  filePath: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']),
  comments: z.array(z.object({
    id: z.string().uuid(),
    lineNumber: z.number().int().positive(),
    column: z.number().int().nonnegative().optional(),
    content: z.string(),
    type: z.enum(['suggestion', 'issue', 'question', 'praise']),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    resolved: z.boolean().default(false),
    replies: z.array(z.object({
      id: z.string().uuid(),
      authorId: z.string().uuid(),
      content: z.string(),
      createdAt: z.number(),
    })).default([]),
  })).default([]),
  summary: z.string().optional(),
  overallRating: z.number().min(1).max(5).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  completedAt: z.number().optional(),
});

export type MentorProfile = z.infer<typeof MentorProfileSchema>;
export type MenteeProfile = z.infer<typeof MenteeProfileSchema>;
export type MentorshipRequest = z.infer<typeof MentorshipRequestSchema>;
export type MentorshipSession = z.infer<typeof MentorshipSessionSchema>;
export type CodeReview = z.infer<typeof CodeReviewSchema>;

export class MatchingEngine {
  private mentorsRepo = createDexieRepository(db.syncQueue as any);
  private menteesRepo = createDexieRepository(db.syncQueue as any);
  private requestsRepo = createDexieRepository(db.syncQueue as any);
  private sessionsRepo = createDexieRepository(db.syncQueue as any);
  private reviewsRepo = createDexieRepository(db.syncQueue as any);

  async registerMentor(profile: Omit<MentorProfile, 'createdAt' | 'updatedAt' | 'rating' | 'totalSessions'>): Promise<MentorProfile> {
    const newProfile: MentorProfile = {
      ...profile,
      rating: 0,
      totalSessions: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await this.mentorsRepo.create({ ...newProfile, id: profile.userId } as any);
    return newProfile;
  }

  async registerMentee(profile: Omit<MenteeProfile, 'createdAt' | 'updatedAt'>): Promise<MenteeProfile> {
    const newProfile: MenteeProfile = {
      ...profile,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await this.menteesRepo.create({ ...newProfile, id: profile.userId } as any);
    return newProfile;
  }

  async getMentorProfile(userId: string): Promise<MentorProfile | null> {
    return this.mentorsRepo.findById(userId);
  }

  async getMenteeProfile(userId: string): Promise<MenteeProfile | null> {
    return this.menteesRepo.findById(userId);
  }

  async findMentors(criteria: {
    languages?: string[];
    specialties?: string[];
    maxHourlyRate?: number;
    minRating?: number;
    availability?: { dayOfWeek: number; hour: number }[];
  } = {}): Promise<MentorProfile[]> {
    let mentors = await this.mentorsRepo.findAll();

    if (criteria.languages?.length) {
      mentors = mentors.filter(m => 
        criteria.languages!.some(lang => m.languages.includes(lang))
      );
    }

    if (criteria.specialties?.length) {
      mentors = mentors.filter(m =>
        criteria.specialties!.some(spec => m.specialties.includes(spec))
      );
    }

    if (criteria.maxHourlyRate !== undefined) {
      mentors = mentors.filter(m => 
        m.availability?.hourlyRate === undefined || m.availability.hourlyRate <= criteria.maxHourlyRate!
      );
    }

    if (criteria.minRating !== undefined) {
      mentors = mentors.filter(m => m.rating >= criteria.minRating!);
    }

    if (criteria.availability?.length) {
      mentors = mentors.filter(m => {
        if (!m.availability?.schedule.length) return false;
        return criteria.availability!.some(a =>
          m.availability!.schedule.some(s =>
            s.dayOfWeek === a.dayOfWeek &&
            s.startHour <= a.hour &&
            s.endHour > a.hour
          )
        );
      });
    }

    // Sort by rating and availability
    return mentors.sort((a, b) => b.rating - a.rating);
  }

  async requestMentorship(request: Omit<MentorshipRequest, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'respondedAt'>): Promise<MentorshipRequest> {
    const newRequest: MentorshipRequest = {
      ...request,
      id: crypto.randomUUID(),
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await this.requestsRepo.create(newRequest as any);
    return newRequest;
  }

  async respondToRequest(requestId: string, mentorId: string, accept: boolean): Promise<MentorshipRequest | null> {
    const request = await this.requestsRepo.findById(requestId);
    if (!request || request.mentorId !== mentorId) return null;

    const updated: MentorshipRequest = {
      ...request,
      status: accept ? 'accepted' : 'declined',
      updatedAt: Date.now(),
      respondedAt: Date.now(),
    };

    await this.requestsRepo.update(requestId, updated);
    return updated;
  }

  async getRequestsForMentor(mentorId: string): Promise<MentorshipRequest[]> {
    return this.requestsRepo.find({ where: { mentorId } });
  }

  async getRequestsForMentee(menteeId: string): Promise<MentorshipRequest[]> {
    return this.requestsRepo.find({ where: { menteeId } });
  }

  async scheduleSession(session: Omit<MentorshipSession, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<MentorshipSession> {
    const newSession: MentorshipSession = {
      ...session,
      id: crypto.randomUUID(),
      status: 'scheduled',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await this.sessionsRepo.create(newSession as any);
    return newSession;
  }

  async getSessionsForMentor(mentorId: string, options: { upcoming?: boolean; past?: boolean } = {}): Promise<MentorshipSession[]> {
    const sessions = await this.sessionsRepo.find({ where: { mentorId } });
    const now = Date.now();
    
    return sessions.filter(s => {
      if (options.upcoming && s.scheduledAt < now) return false;
      if (options.past && s.scheduledAt >= now) return false;
      return true;
    }).sort((a, b) => a.scheduledAt - b.scheduledAt);
  }

  async getSessionsForMentee(menteeId: string, options: { upcoming?: boolean; past?: boolean } = {}): Promise<MentorshipSession[]> {
    const sessions = await this.sessionsRepo.find({ where: { menteeId } });
    const now = Date.now();
    
    return sessions.filter(s => {
      if (options.upcoming && s.scheduledAt < now) return false;
      if (options.past && s.scheduledAt >= now) return false;
      return true;
    }).sort((a, b) => a.scheduledAt - b.scheduledAt);
  }

  async startSession(sessionId: string): Promise<MentorshipSession | null> {
    const session = await this.sessionsRepo.findById(sessionId);
    if (!session || session.status !== 'scheduled') return null;

    const updated = { ...session, status: 'in_progress' as const, updatedAt: Date.now() };
    await this.sessionsRepo.update(sessionId, updated);
    return updated;
  }

  async completeSession(sessionId: string, notes?: string): Promise<MentorshipSession | null> {
    const session = await this.sessionsRepo.findById(sessionId);
    if (!session || session.status !== 'in_progress') return null;

    const updated: MentorshipSession = {
      ...session,
      status: 'completed',
      notes,
      updatedAt: Date.now(),
    };
    await this.sessionsRepo.update(sessionId, updated);
    return updated;
  }

  async cancelSession(sessionId: string): Promise<MentorshipSession | null> {
    const session = await this.sessionsRepo.findById(sessionId);
    if (!session || session.status === 'completed') return null;

    const updated = { ...session, status: 'cancelled' as const, updatedAt: Date.now() };
    await this.sessionsRepo.update(sessionId, updated);
    return updated;
  }

  async submitFeedback(sessionId: string, fromUserId: string, feedback: {
    rating: number;
    feedback: string;
  }): Promise<MentorshipSession | null> {
    const session = await this.sessionsRepo.findById(sessionId);
    if (!session) return null;

    const isMentor = session.mentorId === fromUserId;
    const updated: MentorshipSession = {
      ...session,
      feedback: {
        ...session.feedback,
        [isMentor ? 'mentorRating' : 'menteeRating']: feedback.rating,
        [isMentor ? 'mentorFeedback' : 'menteeFeedback']: feedback.feedback,
      },
      updatedAt: Date.now(),
    };
    await this.sessionsRepo.update(sessionId, updated);
    return updated;
  }

  async createCodeReview(review: Omit<CodeReview, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'comments'>): Promise<CodeReview> {
    const newReview: CodeReview = {
      ...review,
      id: crypto.randomUUID(),
      status: 'pending',
      comments: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await this.reviewsRepo.create(newReview as any);
    return newReview;
  }

  async addComment(reviewId: string, comment: Omit<CodeReview['comments'][0], 'id' | 'replies'>): Promise<CodeReview | null> {
    const review = await this.reviewsRepo.findById(reviewId);
    if (!review) return null;

    const newComment = {
      ...comment,
      id: crypto.randomUUID(),
      replies: [],
    };

    const updated = {
      ...review,
      comments: [...review.comments, newComment],
      status: 'in_progress' as const,
      updatedAt: Date.now(),
    };

    await this.reviewsRepo.update(reviewId, updated);
    return updated;
  }

  async replyToComment(reviewId: string, commentId: string, reply: Omit<CodeReview['comments'][0]['replies'][0], 'id' | 'createdAt'>): Promise<CodeReview | null> {
    const review = await this.reviewsRepo.findById(reviewId);
    if (!review) return null;

    const commentIndex = review.comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) return null;

    const newReply = {
      ...reply,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };

    const updatedComments = [...review.comments];
    updatedComments[commentIndex] = {
      ...updatedComments[commentIndex],
      replies: [...updatedComments[commentIndex].replies, newReply],
    };

    const updated = {
      ...review,
      comments: updatedComments,
      updatedAt: Date.now(),
    };

    await this.reviewsRepo.update(reviewId, updated);
    return updated;
  }

  async completeReview(reviewId: string, summary: string, overallRating: number): Promise<CodeReview | null> {
    const review = await this.reviewsRepo.findById(reviewId);
    if (!review) return null;

    const updated: CodeReview = {
      ...review,
      status: 'completed',
      summary,
      overallRating,
      completedAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.reviewsRepo.update(reviewId, updated);
    return updated;
  }

  async getMentorStats(mentorId: string): Promise<{
    totalSessions: number;
    totalHours: number;
    averageRating: number;
    totalReviews: number;
    averageResponseTime: number; // hours
    completionRate: number;
  }> {
    const sessions = await this.sessionsRepo.find({ where: { mentorId } });
    const completed = sessions.filter(s => s.status === 'completed');
    const reviews = await this.reviewsRepo.find({ where: { reviewerId: mentorId } });
    const completedReviews = reviews.filter(r => r.status === 'completed');

    const totalHours = completed.reduce((sum, s) => sum + s.duration, 0) / 60;
    const averageRating = completed.length > 0
      ? completed.reduce((sum, s) => sum + (s.feedback?.mentorRating || 0), 0) / completed.length
      : 0;

    return {
      totalSessions: sessions.length,
      totalHours,
      averageRating,
      totalReviews: reviews.length,
      averageResponseTime: 0, // Would calculate from request response times
      completionRate: sessions.length > 0 ? completed.length / sessions.length : 0,
    };
  }

  async getMenteeProgress(menteeId: string): Promise<{
    totalSessions: number;
    totalHours: number;
    goalsAchieved: string[];
    skillsImproved: string[];
    averageRating: number;
  }> {
    const sessions = await this.sessionsRepo.find({ where: { menteeId } });
    const completed = sessions.filter(s => s.status === 'completed');

    return {
      totalSessions: sessions.length,
      totalHours: completed.reduce((sum, s) => sum + s.duration, 0) / 60,
      goalsAchieved: [], // Would track from session topics
      skillsImproved: [], // Would track from reviews
      averageRating: completed.length > 0
        ? completed.reduce((sum, s) => sum + (s.feedback?.menteeRating || 0), 0) / completed.length
        : 0,
    };
  }
}

export function createMatchingEngine(): MatchingEngine {
  return new MatchingEngine();
}

export function calculateMatchScore(mentor: MentorProfile, mentee: MenteeProfile): number {
  let score = 0;

  // Language match
  const commonLanguages = mentor.languages.filter(l => mentee.preferredLanguages.includes(l));
  score += commonLanguages.length * 10;

  // Specialty match
  const commonSpecialties = mentor.specialties.filter(s => mentee.goals.includes(s));
  score += commonSpecialties.length * 15;

  // Rating bonus
  score += mentor.rating * 5;

  // Availability match
  if (mentor.availability && mentee.availability) {
    const commonDays = mentor.availability.schedule.filter(s =>
      mentee.availability!.preferredDays.includes(s.dayOfWeek)
    ).length;
    score += commonDays * 5;
  }

  // Experience match (mentor total sessions)
  score += Math.min(mentor.totalSessions, 20);

  return score;
}

export function findBestMentors(mentors: MentorProfile[], mentee: MenteeProfile, limit = 5): MentorProfile[] {
  return mentors
    .map(m => ({ mentor: m, score: calculateMatchScore(m, mentee) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(m => m.mentor);
}