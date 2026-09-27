import { createDexieRepository, db } from '@codeforge/data/dexie';
import { syncManager, createSyncRepository } from '@codeforge/data/sync';
import type { CommunityPostRecord, CommunityReplyRecord } from '@codeforge/data/dexie';
import { z } from 'zod';

export const PostSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  channelId: z.string().optional(),
  title: z.string().max(200).optional(),
  content: z.string().max(50000),
  images: z.array(z.string().url()).max(5).optional(),
  tags: z.array(z.string()).max(10).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const ReplySchema = z.object({
  id: z.string().uuid(),
  postId: z.string().uuid(),
  userId: z.string().uuid(),
  content: z.string().max(10000),
  parentReplyId: z.string().uuid().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const ChannelSchema = z.object({
  id: z.string().uuid(),
  name: z.string().max(50),
  description: z.string().max(500),
  icon: z.string().optional(),
  color: z.string().optional(),
  order: z.number().int().nonnegative(),
  readOnly: z.boolean().default(false),
  moderatorOnly: z.boolean().default(false),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Post = z.infer<typeof PostSchema>;
export type Reply = z.infer<typeof ReplySchema>;
export type Channel = z.infer<typeof ChannelSchema>;

export interface PostWithReplies extends Post {
  replies: Reply[];
  replyCount: number;
  reactionCounts: Record<string, number>;
  userReaction?: string;
  author?: { id: string; username: string; avatar?: string; level: number };
}

export interface ForumStats {
  totalPosts: number;
  totalReplies: number;
  totalUsers: number;
  postsToday: number;
  repliesToday: number;
  activeUsers: number;
}

export class ForumEngine {
  private postsRepo = createDexieRepository(db.communityPosts);
  private repliesRepo = createDexieRepository(db.communityReplies);
  private channelsRepo = createDexieRepository(db.communityPosts as any);
  private syncEngine = syncManager.getEngine('forum') || syncManager.createEngine('forum');

  constructor() {
    this.initializeDefaultChannels();
  }

  private async initializeDefaultChannels(): Promise<void> {
    const defaultChannels: Channel[] = [
      { id: 'general', name: 'General', description: 'General discussion about coding', icon: '💬', color: '#58a6ff', order: 0, readOnly: false, moderatorOnly: false, createdAt: Date.now(), updatedAt: Date.now() },
      { id: 'help', name: 'Help & Questions', description: 'Ask for help with coding problems', icon: '❓', color: '#3fb950', order: 1, readOnly: false, moderatorOnly: false, createdAt: Date.now(), updatedAt: Date.now() },
      { id: 'showcase', name: 'Showcase', description: 'Show off your projects and builds', icon: '🚀', color: '#d29922', order: 2, readOnly: false, moderatorOnly: false, createdAt: Date.now(), updatedAt: Date.now() },
      { id: 'off-topic', name: 'Off Topic', description: 'Non-coding discussions', icon: '🎮', color: '#bc8cff', order: 3, readOnly: false, moderatorOnly: false, createdAt: Date.now(), updatedAt: Date.now() },
      { id: 'announcements', name: 'Announcements', description: 'Official announcements', icon: '📢', color: '#f85149', order: -1, readOnly: true, moderatorOnly: true, createdAt: Date.now(), updatedAt: Date.now() },
    ];

    for (const channel of defaultChannels) {
      const existing = await this.channelsRepo.findById(channel.id);
      if (!existing) {
        await this.channelsRepo.create(channel as any);
      }
    }
  }

  async createPost(userId: string, post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<Post> {
    const newPost: Post = {
      ...post,
      id: crypto.randomUUID(),
      userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    PostSchema.parse(newPost);
    await this.postsRepo.create(newPost as any);
    return newPost;
  }

  async getPost(postId: string): Promise<PostWithReplies | null> {
    const post = await this.postsRepo.findById(postId);
    if (!post) return null;

    const replies = await this.getReplies(postId);
    const reactions = await this.getReactionCounts(postId);
    const author = await this.getAuthor(post.userId);

    return {
      ...post,
      replies,
      replyCount: replies.length,
      reactionCounts: reactions,
      author,
    };
  }

  async getPosts(options: {
    channelId?: string;
    userId?: string;
    tags?: string[];
    sortBy?: 'recent' | 'popular' | 'trending';
    limit?: number;
    offset?: number;
  } = {}): Promise<PostWithReplies[]> {
    let query: any = {};

    if (options.channelId) query.channelId = options.channelId;
    if (options.userId) query.userId = options.userId;

    const sortBy = options.sortBy || 'recent';
    const orderBy = sortBy === 'recent' ? [{ field: 'createdAt', direction: 'desc' as const }] :
                    sortBy === 'popular' ? [{ field: 'reactionCount', direction: 'desc' as const }] :
                    [{ field: 'createdAt', direction: 'desc' as const }];

    const posts = await this.postsRepo.find({ where: query, orderBy, limit: options.limit || 50, offset: options.offset });

    const enriched = await Promise.all(
      posts.map(async (post) => {
        const replies = await this.getReplies(post.id);
        const reactions = await this.getReactionCounts(post.id);
        const author = await this.getAuthor(post.userId);
        return { ...post, replies, replyCount: replies.length, reactionCounts: reactions, author };
      })
    );

    if (options.tags && options.tags.length > 0) {
      return enriched.filter((p) => p.tags?.some((t) => options.tags!.includes(t)));
    }

    return enriched;
  }

  async updatePost(postId: string, userId: string, updates: Partial<Post>): Promise<Post | null> {
    const post = await this.postsRepo.findById(postId);
    if (!post || post.userId !== userId) return null;

    const updated = { ...post, ...updates, updatedAt: Date.now() };
    PostSchema.parse(updated);
    return this.postsRepo.update(postId, updated);
  }

  async deletePost(postId: string, userId: string, isModerator = false): Promise<boolean> {
    const post = await this.postsRepo.findById(postId);
    if (!post) return false;
    if (post.userId !== userId && !isModerator) return false;

    await this.repliesRepo.find({ where: { postId } }).then((replies) =>
      Promise.all(replies.map((r) => this.repliesRepo.delete(r.id)))
    );

    await this.postsRepo.delete(postId);
    return true;
  }

  async createReply(userId: string, reply: Omit<Reply, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reply> {
    const newReply: Reply = {
      ...reply,
      id: crypto.randomUUID(),
      userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    ReplySchema.parse(newReply);
    await this.repliesRepo.create(newReply as any);

    const post = await this.postsRepo.findById(reply.postId);
    if (post) {
      await this.postsRepo.update(postId, { replyCount: (post as any).replyCount + 1 });
    }

    return newReply;
  }

  async getReplies(postId: string, options?: { parentReplyId?: string | null; limit?: number }): Promise<Reply[]> {
    const query: any = { postId };
    if (options?.parentReplyId !== undefined) query.parentReplyId = options.parentReplyId;

    return this.repliesRepo.find({
      where: query,
      orderBy: [{ field: 'createdAt', direction: 'asc' }],
      limit: options?.limit || 100,
    });
  }

  async getReactionCounts(postId: string): Promise<Record<string, number>> {
    return { '👍': 0, '❤️': 0, '🎉': 0, '🔥': 0, '👀': 0 };
  }

  async addReaction(postId: string, userId: string, reaction: string): Promise<void> {
  }

  async removeReaction(postId: string, userId: string, reaction: string): Promise<void> {
  }

  async getChannels(): Promise<Channel[]> {
    return this.channelsRepo.find({ orderBy: [{ field: 'order', direction: 'asc' }] });
  }

  async getChannel(channelId: string): Promise<Channel | null> {
    return this.channelsRepo.findById(channelId);
  }

  async createChannel(channel: Omit<Channel, 'id' | 'createdAt' | 'updatedAt'>): Promise<Channel> {
    const newChannel: Channel = {
      ...channel,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    ChannelSchema.parse(newChannel);
    return this.channelsRepo.create(newChannel as any);
  }

  async updateChannel(channelId: string, updates: Partial<Channel>): Promise<Channel | null> {
    return this.channelsRepo.update(channelId, { ...updates, updatedAt: Date.now() });
  }

  async getStats(): Promise<ForumStats> {
    const posts = await this.postsRepo.findAll();
    const replies = await this.repliesRepo.findAll();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    return {
      totalPosts: posts.length,
      totalReplies: replies.length,
      totalUsers: new Set([...posts.map((p) => p.userId), ...replies.map((r) => r.userId)]).size,
      postsToday: posts.filter((p) => p.createdAt >= todayStart).length,
      repliesToday: replies.filter((r) => r.createdAt >= todayStart).length,
      activeUsers: new Set(posts.filter((p) => p.createdAt >= todayStart - 86400000).map((p) => p.userId)).size,
    };
  }

  async searchPosts(query: string, options: { channelId?: string; userId?: string; limit?: number } = {}): Promise<PostWithReplies[]> {
    const posts = await this.postsRepo.find({ where: { channelId: options.channelId, userId: options.userId } });
    const lowerQuery = query.toLowerCase();

    const matching = posts.filter((p) =>
      p.title?.toLowerCase().includes(lowerQuery) ||
      p.content.toLowerCase().includes(lowerQuery) ||
      p.tags?.some((t) => t.toLowerCase().includes(lowerQuery))
    );

    const enriched = await Promise.all(
      matching.slice(0, options.limit || 20).map(async (post) => {
        const replies = await this.getReplies(post.id);
        const reactions = await this.getReactionCounts(post.id);
        const author = await this.getAuthor(post.userId);
        return { ...post, replies, replyCount: replies.length, reactionCounts: reactions, author };
      })
    );

    return enriched;
  }

  private async getAuthor(userId: string): Promise<{ id: string; username: string; avatar?: string; level: number } | undefined> {
    return { id: userId, username: 'User', level: 1 };
  }
}

export function createForumEngine(): ForumEngine {
  return new ForumEngine();
}

export const REACTION_TYPES = ['👍', '❤️', '🎉', '🔥', '👀', '💡', '🚀', '🐛'] as const;

export function formatPostDate(date: number): string {
  const now = Date.now();
  const diff = now - date;

  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

  return new Date(date).toLocaleDateString();
}