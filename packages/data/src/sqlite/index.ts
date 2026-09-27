import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { Repository, Query, Transaction } from '@codeforge/core/types';

const SQL_WASM_URL = '/sql-wasm/sql-wasm.wasm';

let SqlJs: SqlJsStatic | null = null;
let dbInstance: Database | null = null;
let initPromise: Promise<void> | null = null;

export async function initializeSQLite(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    SqlJs = await initSqlJs({
      locateFile: () => SQL_WASM_URL,
    });

    const savedDb = await loadFromIndexedDB();
    if (savedDb) {
      dbInstance = new SqlJs.Database(savedDb);
    } else {
      dbInstance = new SqlJs.Database();
      await runMigrations(dbInstance);
    }

    setInterval(saveToIndexedDB, 30000);
    window.addEventListener('beforeunload', saveToIndexedDB);
  })();

  return initPromise;
}

async function runMigrations(db: Database): Promise<void> {
  const migrations = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT,
      avatar_config TEXT,
      settings TEXT,
      stats TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      version TEXT NOT NULL,
      author TEXT,
      tags TEXT,
      language TEXT,
      difficulty TEXT,
      estimated_hours REAL,
      lessons TEXT,
      prerequisites TEXT,
      learning_objectives TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      \`order\` INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT,
      content_type TEXT,
      exercises TEXT,
      estimated_minutes INTEGER,
      xp_reward INTEGER,
      FOREIGN KEY (course_id) REFERENCES courses(id)
    )`,
    `CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      lesson_id TEXT NOT NULL,
      \`order\` INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      instructions TEXT,
      starter_code TEXT,
      solution TEXT,
      tests TEXT,
      hints TEXT,
      xp_reward INTEGER,
      difficulty INTEGER,
      time_limit INTEGER,
      memory_limit INTEGER,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    )`,
    `CREATE TABLE IF NOT EXISTS user_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      status TEXT NOT NULL,
      score REAL,
      attempts INTEGER DEFAULT 0,
      time_spent INTEGER DEFAULT 0,
      completed_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (course_id) REFERENCES courses(id),
      FOREIGN KEY (lesson_id) REFERENCES lessons(id),
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    )`,
    `CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      category TEXT,
      rarity TEXT,
      xp_reward INTEGER,
      criteria TEXT,
      created_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS user_achievements (
      user_id TEXT NOT NULL,
      achievement_id TEXT NOT NULL,
      unlocked_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, achievement_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (achievement_id) REFERENCES achievements(id)
    )`,
    `CREATE TABLE IF NOT EXISTS builds (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      slug TEXT UNIQUE,
      files TEXT,
      assets TEXT,
      is_public INTEGER DEFAULT 0,
      published_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS build_files (
      id TEXT PRIMARY KEY,
      build_id TEXT NOT NULL,
      path TEXT NOT NULL,
      content TEXT,
      language TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (build_id) REFERENCES builds(id)
    )`,
    `CREATE TABLE IF NOT EXISTS world_state (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      world_id TEXT NOT NULL,
      position_x REAL,
      position_y REAL,
      avatar_state TEXT,
      inventory TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS community_posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      channel_id TEXT,
      title TEXT,
      content TEXT,
      images TEXT,
      reactions TEXT,
      reply_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS community_replies (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (post_id) REFERENCES community_posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_user_progress_user_course ON user_progress(user_id, course_id)`,
    `CREATE INDEX IF NOT EXISTS idx_user_progress_exercise ON user_progress(exercise_id)`,
    `CREATE INDEX IF NOT EXISTS idx_builds_user ON builds(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_community_posts_channel ON community_posts(channel_id)`,
    `CREATE INDEX IF NOT EXISTS idx_community_replies_post ON community_replies(post_id)`,
  ];

  for (const migration of migrations) {
    db.run(migration);
  }
}

async function loadFromIndexedDB(): Promise<Uint8Array | null> {
  const { openDB } = await import('idb');
  const db = await openDB('codeforge-sqlite', 1, {
    upgrade(db) {
      db.createObjectStore('databases');
    },
  });
  const data = await db.get('databases', 'main');
  return data ? new Uint8Array(data) : null;
}

async function saveToIndexedDB(): Promise<void> {
  if (!dbInstance) return;

  const { openDB } = await import('idb');
  const db = await openDB('codeforge-sqlite', 1);
  const data = dbInstance.export();
  await db.put('databases', Array.from(data), 'main');
}

export function getDatabase(): Database | null {
  return dbInstance;
}

export function createSQLiteRepository<T extends { id: string }>(
  tableName: string,
  columns: string[],
  rowToEntity: (row: unknown[]) => T,
  entityToRow: (entity: T) => unknown[]
): Repository<T> {
  return {
    async findById(id: string): Promise<T | undefined> {
      await initializeSQLite();
      const stmt = dbInstance!.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
      stmt.bind([id]);
      const row = stmt.getAsObject();
      stmt.free();
      return row ? rowToEntity(Object.values(row)) : undefined;
    },

    async findAll(): Promise<T[]> {
      await initializeSQLite();
      const stmt = dbInstance!.prepare(`SELECT * FROM ${tableName}`);
      const rows: T[] = [];
      while (stmt.step()) {
        rows.push(rowToEntity(stmt.get()));
      }
      stmt.free();
      return rows;
    },

    async find(query: Query<T>): Promise<T[]> {
      await initializeSQLite();
      let sql = `SELECT * FROM ${tableName}`;
      const params: unknown[] = [];

      if (query.where) {
        const conditions: string[] = [];
        for (const [key, value] of Object.entries(query.where)) {
          conditions.push(`${key} = ?`);
          params.push(value);
        }
        if (conditions.length > 0) {
          sql += ` WHERE ${conditions.join(' AND ')}`;
        }
      }

      if (query.orderBy) {
        sql += ` ORDER BY ${query.orderBy.map((o) => `${o.field} ${o.direction}`).join(', ')}`;
      }

      if (query.limit) {
        sql += ` LIMIT ${query.limit}`;
        if (query.offset) {
          sql += ` OFFSET ${query.offset}`;
        }
      }

      const stmt = dbInstance!.prepare(sql);
      for (const param of params) {
        stmt.bind([param]);
      }
      const rows: T[] = [];
      while (stmt.step()) {
        rows.push(rowToEntity(stmt.get()));
      }
      stmt.free();
      return rows;
    },

    async create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
      await initializeSQLite();
      const now = Date.now();
      const id = crypto.randomUUID();
      const fullEntity = { ...entity, id, createdAt: now, updatedAt: now } as T;
      const row = entityToRow(fullEntity);
      const placeholders = columns.map(() => '?').join(', ');
      dbInstance!.run(`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`, row);
      await saveToIndexedDB();
      return fullEntity;
    },

    async update(id: string, changes: Partial<T>): Promise<T> {
      await initializeSQLite();
      const existing = await this.findById(id);
      if (!existing) throw new Error(`Entity not found: ${id}`);

      const updated = { ...existing, ...changes, updatedAt: Date.now() } as T;
      const row = entityToRow(updated);
      const setClause = columns.filter((c) => c !== 'id' && c !== 'createdAt').map((c) => `${c} = ?`).join(', ');
      dbInstance!.run(`UPDATE ${tableName} SET ${setClause} WHERE id = ?`, [...row.slice(1), id]);
      await saveToIndexedDB();
      return updated;
    },

    async delete(id: string): Promise<void> {
      await initializeSQLite();
      dbInstance!.run(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
      await saveToIndexedDB();
    },

    async count(query: Query<T>): Promise<number> {
      await initializeSQLite();
      let sql = `SELECT COUNT(*) as count FROM ${tableName}`;
      const params: unknown[] = [];

      if (query.where) {
        const conditions: string[] = [];
        for (const [key, value] of Object.entries(query.where)) {
          conditions.push(`${key} = ?`);
          params.push(value);
        }
        if (conditions.length > 0) {
          sql += ` WHERE ${conditions.join(' AND ')}`;
        }
      }

      const stmt = dbInstance!.prepare(sql);
      for (const param of params) {
        stmt.bind([param]);
      }
      stmt.step();
      const count = stmt.get()[0] as number;
      stmt.free();
      return count;
    },
  };
}

export function createSQLiteTransaction(): Transaction {
  let committed = false;

  return {
    repository<T>(name: string): Repository<T> {
      return createSQLiteRepository(name, [], () => null as unknown as T, () => []);
    },
    async commit(): Promise<void> {
      committed = true;
      await saveToIndexedDB();
    },
    async rollback(): Promise<void> {
      if (!committed) {
        const data = await loadFromIndexedDB();
        if (data && dbInstance) {
          const SqlJs = await import('sql.js');
          dbInstance = new SqlJs.default.Database(data);
        }
      }
    },
  };
}

export function exportDatabase(): Uint8Array | null {
  return dbInstance?.export() || null;
}

export async function importDatabase(data: Uint8Array): Promise<void> {
  if (!SqlJs) await initializeSQLite();
  dbInstance = new SqlJs!.Database(data);
  await saveToIndexedDB();
}

export async function vacuumDatabase(): Promise<void> {
  if (!dbInstance) return;
  dbInstance.run('VACUUM');
  await saveToIndexedDB();
}

export function getDatabaseStats(): { tables: number; size: number } {
  if (!dbInstance) return { tables: 0, size: 0 };
  const stmt = dbInstance.prepare("SELECT name FROM sqlite_master WHERE type='table'");
  let tables = 0;
  while (stmt.step()) tables++;
  stmt.free();
  return { tables, size: dbInstance.export().length };
}