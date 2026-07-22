import type { SecureStore } from './secureStore';
import { BrowserSecureStore } from './secureStore.browser';

class DesktopSecureStore implements SecureStore {
  private readonly backend: SecureStore;
  constructor() {
    this.backend =
      typeof window !== 'undefined' && window.shadowtalkDesktop?.secureStore
        ? {
            getItem: async (key) => window.shadowtalkDesktop!.secureStore!.getItem(key),
            setItem: async (key, value) =>
              window.shadowtalkDesktop!.secureStore!.setItem(key, value),
            removeItem: async (key) =>
              window.shadowtalkDesktop!.secureStore!.removeItem(key),
            getAllKeys: async () => window.shadowtalkDesktop!.secureStore!.getAllKeys(),
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
