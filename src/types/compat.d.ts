// Ambient type patches for pre-existing scaffolding that predates several APIs.
// Widens the desktop bridge type + a couple of catalog types to satisfy the compiler
// without altering runtime behaviour.

import "./shadowtalk-desktop";

declare global {
  interface Window {
    __TAURI__?: unknown;
    shadowtalkBackends?: Record<string, unknown>;
  }
}

declare module "@/types/shadowtalk-desktop" {
  interface ShadowTalkDesktopAPI {
    preferredLogin?: () => Promise<{ redirected: boolean; error?: Error }>;
    secureStore?: {
      getItem(key: string): Promise<string | null>;
      setItem(key: string, value: string): Promise<void>;
      removeItem(key: string): Promise<void>;
      getAllKeys(): Promise<string[]>;
    };
  }
}

declare module "@/lib/tauri/types" {
  interface TauriOllamaClient {
    health?: () => Promise<{
      endpoint?: string;
      ready?: boolean;
      models?: string[];
      defaultModel?: string;
    } | null>;
    pull?: (name: string) => Promise<{ success: boolean; status?: string; error?: string }>;
  }
}

declare module "@/lib/offline/webLlmModelCatalog" {
  interface WebLlmModelEntry {
    badge?: string;
  }
}

declare module "@tauri-apps/api/core" {
  export function invoke<T = unknown>(cmd: string, args?: Record<string, unknown>): Promise<T>;
}

export {};
