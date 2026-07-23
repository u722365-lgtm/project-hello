export interface ShadowTalkDesktopInfo {
  platform: NodeJS.Platform;
  arch: string;
  appVersion: string;
  electronVersion: string;
  chromeVersion: string;
  userDataPath: string;
  documentsPath: string;
  homePath: string;
  shadowtalkDataPath: string;
  /** Tier C: installer shipped default MLC model cache */
  offlineModelBundled?: boolean;
  offlineModelPath?: string;
  /** Odysseus-style Ollama sidecar available on desktop */
  sovereignDesktopCapable?: boolean;
  /** Tier D: installer shipped bundled Ollama binary */
  ollamaBundled?: boolean;
  ollamaManagedProcess?: boolean;
  ollamaDefaultModel?: string;
  ollamaModelsPath?: string;
  ollamaReachable?: boolean;
}

export interface OllamaBootstrapState {
  bundledBinaryPresent: boolean;
  managedProcess: boolean;
  reachable: boolean;
  models: string[];
  defaultModel: string;
  modelsPath: string;
  seeding: boolean;
  pulling: boolean;
  message?: string;
  error?: string;
}

export interface OllamaStatusInfo {
  reachable: boolean;
  version?: string;
  models: string[];
  activeModel: string;
  baseUrl: string;
  error?: string;
}

export interface ShadowTalkDesktopAPI {
  isDesktop: true;
  platform: NodeJS.Platform;
  getInfo: () => Promise<ShadowTalkDesktopInfo>;
  openFile: (options?: OpenDialogOptions) => Promise<OpenDialogReturnValue>;
  saveFile: (options?: SaveDialogOptions) => Promise<SaveDialogReturnValue>;
  readTextFile: (filePath: string) => Promise<string>;
  writeTextFile: (filePath: string, content: string) => Promise<{ ok: boolean }>;
  openPath: (filePath: string) => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  revealInFolder: (filePath: string) => Promise<void>;
  showNotification: (title: string, body: string) => Promise<void>;
  getAutoLaunch: () => Promise<boolean>;
  setAutoLaunch: (enabled: boolean) => Promise<boolean>;
  chatStream: (
    payload: { url: string; headers: Record<string, string>; body: string },
    onChunk: (chunk: string) => void,
    onEnd: (result: { ok: boolean; status: number; body: string }) => void,
  ) => Promise<{ started: boolean }>;
  ollamaStatus: (opts?: { baseUrl?: string; model?: string }) => Promise<OllamaStatusInfo>;
  ollamaConfigure: (opts: { baseUrl?: string; model?: string }) => Promise<OllamaStatusInfo>;
  ollamaPull: (
    model: string,
    onProgress?: (status: string, percent?: number) => void,
  ) => Promise<{ ok: boolean; error?: string }>;
  ollamaBootstrap: (
    options?: { pullDefaultModel?: boolean },
    onProgress?: (status: string, percent?: number) => void,
  ) => Promise<OllamaBootstrapState>;
  ollamaBootstrapSnapshot: () => Promise<OllamaBootstrapState>;
  fetchUrl: (url: string) => Promise<{ ok: boolean; status: number; text: string; error?: string }>;
  ollamaChat: (
    payload: {
      messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
      baseUrl?: string;
      model?: string;
    },
    onToken: (token: string) => void,
    signal?: AbortSignal,
  ) => Promise<{ content: string; ok: boolean; error?: string }>;
  preferredLogin?: () => Promise<{ redirected: boolean; error?: Error }>;
  secureStore?: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    getAllKeys(): Promise<string[]>;
  };
}

interface OpenDialogOptions {
  title?: string;
  filters?: { name: string; extensions: string[] }[];
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>;
}

interface OpenDialogReturnValue {
  canceled: boolean;
  filePaths: string[];
}

interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: { name: string; extensions: string[] }[];
}

interface SaveDialogReturnValue {
  canceled: boolean;
  filePath?: string;
}

declare global {
  interface Window {
    shadowtalkDesktop?: ShadowTalkDesktopAPI;
  }
}

export {};
