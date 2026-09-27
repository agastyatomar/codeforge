import Parser from 'rss-parser';
import { createDexieRepository, db } from '@codeforge/data/dexie';
import { z } from 'zod';

export const NewsArticleSchema = z.object({
  id: z.string().uuid(),
  title: z.string().max(500),
  link: z.string().url(),
  content: z.string().optional(),
  contentSnippet: z.string().optional(),
  pubDate: z.number(),
  source: z.string(),
  sourceUrl: z.string().url(),
  categories: z.array(z.string()).optional(),
  author: z.string().optional(),
  imageUrl: z.string().url().optional(),
  read: z.boolean().default(false),
  saved: z.boolean().default(false),
  createdAt: z.number(),
});

export type NewsArticle = z.infer<typeof NewsArticleSchema>;

export const NewsSourceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  url: z.string().url(),
  feedUrl: z.string().url(),
  category: z.string(),
  enabled: z.boolean().default(true),
  fetchInterval: z.number().int().positive().default(3600000),
  lastFetched: z.number().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type NewsSource = z.infer<typeof NewsSourceSchema>;

export interface NewsFilters {
  categories?: string[];
  sources?: string[];
  read?: boolean;
  saved?: boolean;
  dateFrom?: number;
  dateTo?: number;
  search?: string;
}

export class NewsEngine {
  private articlesRepo = createDexieRepository(db.syncQueue as any);
  private sourcesRepo = createDexieRepository(db.syncQueue as any);
  private parser = new Parser();
  private fetchIntervals = new Map<string, ReturnType<typeof setInterval>>();
  private defaultSources: NewsSource[] = [
    {
      id: 'hn',
      name: 'Hacker News',
      url: 'https://news.ycombinator.com',
      feedUrl: 'https://hnrss.org/frontpage',
      category: 'tech',
      enabled: true,
      fetchInterval: 1800000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'devto',
      name: 'DEV Community',
      url: 'https://dev.to',
      feedUrl: 'https://dev.to/feed',
      category: 'programming',
      enabled: true,
      fetchInterval: 3600000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'css-tricks',
      name: 'CSS-Tricks',
      url: 'https://css-tricks.com',
      feedUrl: 'https://css-tricks.com/feed/',
      category: 'webdev',
      enabled: true,
      fetchInterval: 3600000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'smashing',
      name: 'Smashing Magazine',
      url: 'https://www.smashingmagazine.com',
      feedUrl: 'https://www.smashingmagazine.com/feed/',
      category: 'webdev',
      enabled: true,
      fetchInterval: 3600000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'github-blog',
      name: 'GitHub Blog',
      url: 'https://github.blog',
      feedUrl: 'https://github.blog/feed/',
      category: 'tech',
      enabled: true,
      fetchInterval: 3600000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  constructor() {
    this.initializeSources();
  }

  private async initializeSources(): Promise<void> {
    for (const source of this.defaultSources) {
      const existing = await this.sourcesRepo.findById(source.id);
      if (!existing) {
        await this.sourcesRepo.create(source as any);
      }
    }
  }

  async startAutoFetch(): Promise<void> {
    const sources = await this.getSources();
    for (const source of sources.filter((s) => s.enabled)) {
      this.scheduleFetch(source);
    }
  }

  stopAutoFetch(): void {
    for (const interval of this.fetchIntervals.values()) {
      clearInterval(interval);
    }
    this.fetchIntervals.clear();
  }

  private scheduleFetch(source: NewsSource): void {
    const interval = setInterval(() => {
      this.fetchSource(source.id).catch(console.error);
    }, source.fetchInterval);
    this.fetchIntervals.set(source.id, interval);
    this.fetchSource(source.id).catch(console.error);
  }

  async fetchSource(sourceId: string): Promise<NewsArticle[]> {
    const source = await this.getSource(sourceId);
    if (!source || !source.enabled) return [];

    try {
      const feed = await this.parser.parseURL(source.feedUrl);
      const articles: NewsArticle[] = [];

      for (const item of feed.items.slice(0, 50)) {
        const article: NewsArticle = {
          id: crypto.randomUUID(),
          title: item.title || 'Untitled',
          link: item.link || source.url,
          content: item.content,
          contentSnippet: item.contentSnippet,
          pubDate: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
          source: source.name,
          sourceUrl: source.url,
          categories: item.categories || [source.category],
          author: item.creator,
          imageUrl: item.enclosure?.url,
          read: false,
          saved: false,
          createdAt: Date.now(),
        };

        NewsArticleSchema.parse(article);
        articles.push(article);
      }

      for (const article of articles) {
        const existing = await this.articlesRepo.findById(article.id);
        if (!existing) {
          await this.articlesRepo.create(article as any);
        }
      }

      await this.sourcesRepo.update(sourceId, { lastFetched: Date.now() });
      return articles;
    } catch (error) {
      console.error(`Failed to fetch ${source.name}:`, error);
      return [];
    }
  }

  async fetchAllSources(): Promise<NewsArticle[]> {
    const sources = await this.getSources();
    const allArticles: NewsArticle[] = [];

    for (const source of sources.filter((s) => s.enabled)) {
      const articles = await this.fetchSource(source.id);
      allArticles.push(...articles);
    }

    return allArticles;
  }

  async getArticles(filters: NewsFilters = {}, options: { limit?: number; offset?: number; sortBy?: 'date' | 'relevance' } = {}): Promise<NewsArticle[]> {
    let articles = await this.articlesRepo.findAll();

    if (filters.categories?.length) {
      articles = articles.filter((a) => a.categories?.some((c) => filters.categories!.includes(c)));
    }
    if (filters.sources?.length) {
      articles = articles.filter((a) => filters.sources!.includes(a.source));
    }
    if (filters.read !== undefined) {
      articles = articles.filter((a) => a.read === filters.read);
    }
    if (filters.saved !== undefined) {
      articles = articles.filter((a) => a.saved === filters.saved);
    }
    if (filters.dateFrom) {
      articles = articles.filter((a) => a.pubDate >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      articles = articles.filter((a) => a.pubDate <= filters.dateTo!);
    }
    if (filters.search) {
      const query = filters.search.toLowerCase();
      articles = articles.filter((a) =>
        a.title.toLowerCase().includes(query) ||
        a.contentSnippet?.toLowerCase().includes(query) ||
        a.content?.toLowerCase().includes(query)
      );
    }

    const sortBy = options.sortBy || 'date';
    articles.sort((a, b) => sortBy === 'date' ? b.pubDate - a.pubDate : 0);

    const offset = options.offset || 0;
    const limit = options.limit || 50;
    return articles.slice(offset, offset + limit);
  }

  async getArticle(articleId: string): Promise<NewsArticle | null> {
    return this.articlesRepo.findById(articleId);
  }

  async markAsRead(articleId: string): Promise<void> {
    await this.articlesRepo.update(articleId, { read: true });
  }

  async markAsUnread(articleId: string): Promise<void> {
    await this.articlesRepo.update(articleId, { read: false });
  }

  async toggleSaved(articleId: string): Promise<NewsArticle | null> {
    const article = await this.getArticle(articleId);
    if (!article) return null;
    await this.articlesRepo.update(articleId, { saved: !article.saved });
    return { ...article, saved: !article.saved };
  }

  async getSources(): Promise<NewsSource[]> {
    return this.sourcesRepo.findAll() as Promise<NewsSource[]>;
  }

  async getSource(sourceId: string): Promise<NewsSource | null> {
    return this.sourcesRepo.findById(sourceId);
  }

  async addSource(source: Omit<NewsSource, 'id' | 'createdAt' | 'updatedAt'>): Promise<NewsSource> {
    const newSource: NewsSource = {
      ...source,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    NewsSourceSchema.parse(newSource);
    await this.sourcesRepo.create(newSource as any);
    if (newSource.enabled) {
      this.scheduleFetch(newSource);
    }
    return newSource;
  }

  async updateSource(sourceId: string, updates: Partial<NewsSource>): Promise<NewsSource | null> {
    const source = await this.getSource(sourceId);
    if (!source) return null;

    const updated = { ...source, ...updates, updatedAt: Date.now() };
    NewsSourceSchema.parse(updated);
    await this.sourcesRepo.update(sourceId, updated);

    if (this.fetchIntervals.has(sourceId)) {
      clearInterval(this.fetchIntervals.get(sourceId)!);
      this.fetchIntervals.delete(sourceId);
    }
    if (updated.enabled) {
      this.scheduleFetch(updated);
    }

    return updated;
  }

  async removeSource(sourceId: string): Promise<void> {
    if (this.fetchIntervals.has(sourceId)) {
      clearInterval(this.fetchIntervals.get(sourceId)!);
      this.fetchIntervals.delete(sourceId);
    }
    await this.sourcesRepo.delete(sourceId);
  }

  async getUnreadCount(): Promise<number> {
    const articles = await this.articlesRepo.find({ where: { read: false } });
    return articles.length;
  }

  async getSavedArticles(): Promise<NewsArticle[]> {
    return this.articlesRepo.find({ where: { saved: true }, orderBy: [{ field: 'pubDate', direction: 'desc' }] });
  }

  async getCategories(): Promise<string[]> {
    const articles = await this.articlesRepo.findAll();
    const categories = new Set<string>();
    for (const article of articles) {
      if (article.categories) {
        for (const cat of article.categories) categories.add(cat);
      }
    }
    return Array.from(categories).sort();
  }
}

export function createNewsEngine(): NewsEngine {
  return new NewsEngine();
}

export function formatArticleDate(date: number): string {
  const now = Date.now();
  const diff = now - date;

  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

  return new Date(date).toLocaleDateString();
}