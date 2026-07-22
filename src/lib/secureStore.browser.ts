import { openDB, type IDBPDatabase } from 'idb';
import type { SecureStore } from './secureStore';

const DB_NAME = 'shadowtalk-secure-store';
const STORE_NAME = 'kv';

class BrowserSecureStore implements SecureStore {
  private dbPromise: Promise<IDBPDatabase> | null = null;

  private async getDb(): Promise<IDBPDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openDB(DB_NAME, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        },
      });
    }
    return this.dbPromise;
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const db = await this.getDb();
      return (await db.get(STORE_NAME, key)) ?? null;
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.put(STORE_NAME, value, key);
    } catch {
      // avoid crashing app if IndexedDB is unavailable/blocked
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(STORE_NAME, key);
    } catch {
      // ignore
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const db = await this.getDb();
      return (await db.getAllKeys(STORE_NAME)) as string[];
    } catch {
      return [];
    }
  }
}

export { BrowserSecureStore };
