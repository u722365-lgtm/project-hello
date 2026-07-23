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

type DesktopSecureBackend = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<string[]>;
};

function getDesktopSecureStore(): DesktopSecureBackend | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as any).shadowtalkDesktop?.secureStore as DesktopSecureBackend | undefined;
}

async function createSecureStore(): Promise<SecureStore> {
  if (getDesktopSecureStore()) {
    return createDesktopBackend();
  }
  return createBrowserBackend();
}

function createDesktopBackend(): Promise<SecureStore> {
  const api = getDesktopSecureStore()!;
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
