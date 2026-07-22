export interface SecureStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<string[]>;
}

let _instance: Promise<SecureStore> | null = null;

export function getSecureStore(): Promise<SecureStore> {
  if (!_instance) {
    _instance = createSecureStore();
  }
  return _instance;
}

async function createSecureStore(): Promise<SecureStore> {
  if (typeof window !== 'undefined' && window.shadowtalkDesktop?.secureStore) {
    return createDesktopBackend();
  }
  return createBrowserBackend();
}

function createDesktopBackend(): Promise<SecureStore> {
  const api = window.shadowtalkDesktop.secureStore;
  return Promise.resolve({
    getItem: async (key) => {
      try { return await api.getItem(key); } catch { return null; }
    },
    setItem: async (key, value) => {
      try { await api.setItem(key, value); } catch { /* noop */ }
    },
    removeItem: async (key) => {
      try { await api.removeItem(key); } catch { /* noop */ }
    },
    getAllKeys: async () => {
      try { return await api.getAllKeys(); } catch { return []; }
    },
  });
}

async function createBrowserBackend(): Promise<SecureStore> {
  const mod = await import('./secureStore.browser');
  return new mod.BrowserSecureStore();
}
