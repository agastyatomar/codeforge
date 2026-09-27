export * from './sqlite';
export * from './dexie';
export * from './sync';

import { initializeSQLite, createSQLiteRepository, createSQLiteTransaction, getDatabase, exportDatabase, importDatabase } from './sqlite';
import { db as dexieDB, initializeDexie, createDexieRepository, createDexieTransaction, clearAllData, exportAllData, importAllData } from './dexie';
import { SyncEngine, CRDTSyncManager, syncManager, createSyncRepository } from './sync';
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

export interface DataLayer {
  sqlite: {
    initialize: typeof initializeSQLite;
    getDatabase: typeof getDatabase;
    createRepository: typeof createSQLiteRepository;
    createTransaction: typeof createSQLiteTransaction;
    exportDatabase: typeof exportDatabase;
    importDatabase: typeof importDatabase;
  };
  dexie: {
    db: typeof dexieDB;
    initialize: typeof initializeDexie;
    createRepository: typeof createDexieRepository;
    createTransaction: typeof createDexieTransaction;
    clearAllData: typeof clearAllData;
    exportAllData: typeof exportAllData;
    importAllData: typeof importAllData;
  };
  sync: {
    SyncEngine: typeof SyncEngine;
    CRDTSyncManager: typeof CRDTSyncManager;
    syncManager: typeof syncManager;
    createSyncRepository: typeof createSyncRepository;
  };
}

export const dataLayer: DataLayer = {
  sqlite: {
    initialize: initializeSQLite,
    getDatabase,
    createRepository: createSQLiteRepository,
    createTransaction: createSQLiteTransaction,
    exportDatabase,
    importDatabase,
  },
  dexie: {
    db: dexieDB,
    initialize: initializeDexie,
    createRepository: createDexieRepository,
    createTransaction: createDexieTransaction,
    clearAllData,
    exportAllData,
    importAllData,
  },
  sync: {
    SyncEngine,
    CRDTSyncManager,
    syncManager,
    createSyncRepository,
  },
};

export async function initializeDataLayer(): Promise<void> {
  await Promise.all([initializeSQLite(), initializeDexie()]);
}

export default dataLayer;