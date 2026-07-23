import type { SecureStore } from './secureStore';
import { BrowserSecureStore } from './secureStore.browser';

type DesktopSecureBackend = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<string[]>;
};

class DesktopSecureStore implements SecureStore {
  private readonly backend: SecureStore;
  constructor() {
    const api =
      typeof window !== 'undefined'
        ? ((window as any).shadowtalkDesktop?.secureStore as DesktopSecureBackend | undefined)
        : undefined;
    this.backend = api
      ? {
          getItem: async (key) => api.getItem(key),
          setItem: async (key, value) => api.setItem(key, value),
          removeItem: async (key) => api.removeItem(key),
          getAllKeys: async () => api.getAllKeys(),
        }
      : new BrowserSecureStore();
  }


  async getItem(key: string): Promise<string | null> {
    try {
      return await this.backend.getItem(key);
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await this.backend.setItem(key, value);
    } catch {
      // ignore
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await this.backend.removeItem(key);
    } catch {
      // ignore
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return await this.backend.getAllKeys();
    } catch {
      return [];
    }
  }
}

export { DesktopSecureStore };
