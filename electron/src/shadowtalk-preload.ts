import { contextBridge, ipcRenderer } from 'electron';

const CHAT_STREAM_CHUNK = 'st-desktop:chatStreamChunk';
const CHAT_STREAM_END = 'st-desktop:chatStreamEnd';
const OLLAMA_CHAT_CHUNK = 'st-desktop:ollamaChatChunk';
const OLLAMA_CHAT_END = 'st-desktop:ollamaChatEnd';
const OLLAMA_PULL_PROGRESS = 'st-desktop:ollamaPullProgress';

const invoke = <T>(channel: string, ...args: unknown[]): Promise<T> =>
  ipcRenderer.invoke(channel, ...args) as Promise<T>;

contextBridge.exposeInMainWorld('shadowtalkDesktop', {
  isDesktop: true as const,
  platform: process.platform,

  getInfo: () => invoke('st-desktop:getInfo'),

  openFile: (options?: Electron.OpenDialogOptions) =>
    invoke<Electron.OpenDialogReturnValue>('st-desktop:openFile', options ?? {}),

  saveFile: (options?: Electron.SaveDialogOptions) =>
    invoke<Electron.SaveDialogReturnValue>('st-desktop:saveFile', options ?? {}),

  readTextFile: (filePath: string) => invoke<string>('st-desktop:readTextFile', filePath),

  writeTextFile: (filePath: string, content: string) =>
    invoke<{ ok: boolean }>('st-desktop:writeTextFile', filePath, content),

  openPath: (filePath: string) => invoke<void>('st-desktop:openPath', filePath),

  openExternal: (url: string) => invoke<void>('st-desktop:openExternal', url),

  revealInFolder: (filePath: string) => invoke<void>('st-desktop:revealInFolder', filePath),

  showNotification: (title: string, body: string) =>
    invoke<void>('st-desktop:notify', title, body),

  getAutoLaunch: () => invoke<boolean>('st-desktop:getAutoLaunch'),

  setAutoLaunch: (enabled: boolean) => invoke<boolean>('st-desktop:setAutoLaunch', enabled),

  chatStream: (
    payload: { url: string; headers: Record<string, string>; body: string },
    onChunk: (chunk: string) => void,
    onEnd: (result: { ok: boolean; status: number; body: string }) => void,
  ) => {
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const onChunkEvt = (_: unknown, data: { requestId: string; chunk: string }) => {
      if (data.requestId === requestId) onChunk(data.chunk);
    };
    const onEndEvt = (_: unknown, data: { requestId: string; ok: boolean; status: number; body: string }) => {
      if (data.requestId !== requestId) return;
      ipcRenderer.removeListener(CHAT_STREAM_CHUNK, onChunkEvt);
      ipcRenderer.removeListener(CHAT_STREAM_END, onEndEvt);
      onEnd({ ok: data.ok, status: data.status, body: data.body });
    };
    ipcRenderer.on(CHAT_STREAM_CHUNK, onChunkEvt);
    ipcRenderer.on(CHAT_STREAM_END, onEndEvt);
    return invoke<{ started: boolean }>('st-desktop:chatStream', { ...payload, requestId });
  },

  ollamaStatus: (opts?: { baseUrl?: string; model?: string }) =>
    invoke<{
      reachable: boolean;
      version?: string;
      models: string[];
      activeModel: string;
      baseUrl: string;
      error?: string;
    }>('st-desktop:ollamaStatus', opts ?? {}),

  ollamaConfigure: (opts: { baseUrl?: string; model?: string }) =>
    invoke<{
      reachable: boolean;
      version?: string;
      models: string[];
      activeModel: string;
      baseUrl: string;
      error?: string;
    }>('st-desktop:ollamaConfigure', opts),

  ollamaPull: (
    model: string,
    onProgress?: (status: string, percent?: number) => void,
  ) => {
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const onProgressEvt = (_: unknown, data: { requestId: string; status: string; percent?: number }) => {
      if (data.requestId === requestId) onProgress?.(data.status, data.percent);
    };
    ipcRenderer.on(OLLAMA_PULL_PROGRESS, onProgressEvt);
    return invoke<{ ok: boolean; error?: string; requestId: string }>('st-desktop:ollamaPull', model).finally(
      () => ipcRenderer.removeListener(OLLAMA_PULL_PROGRESS, onProgressEvt),
    );
  },

  fetchUrl: (url: string) =>
    invoke<{ ok: boolean; status: number; text: string; error?: string }>("st-desktop:fetchUrl", url),

  ollamaChat: (
    payload: {
      messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
      baseUrl?: string;
      model?: string;
    },
    onToken: (token: string) => void,
    signal?: AbortSignal,
  ) => {
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return new Promise<{ content: string; ok: boolean; error?: string }>((resolve) => {
      let settled = false;
      const finish = (result: { content: string; ok: boolean; error?: string }) => {
        if (settled) return;
        settled = true;
        ipcRenderer.removeListener(OLLAMA_CHAT_CHUNK, onChunkEvt);
        ipcRenderer.removeListener(OLLAMA_CHAT_END, onEndEvt);
        resolve(result);
      };

      const onChunkEvt = (_: unknown, data: { requestId: string; token: string }) => {
        if (data.requestId === requestId) onToken(data.token);
      };
      const onEndEvt = (
        _: unknown,
        data: { requestId: string; content: string; ok: boolean; error?: string },
      ) => {
        if (data.requestId !== requestId) return;
        finish({ content: data.content, ok: data.ok, error: data.error });
      };

      signal?.addEventListener('abort', () => finish({ content: '', ok: false, error: 'Aborted' }), {
        once: true,
      });

      ipcRenderer.on(OLLAMA_CHAT_CHUNK, onChunkEvt);
      ipcRenderer.on(OLLAMA_CHAT_END, onEndEvt);
      void invoke('st-desktop:ollamaChat', { ...payload, requestId }).catch((err: unknown) =>
        finish({
          content: '',
          ok: false,
          error: err instanceof Error ? err.message : 'Ollama chat failed',
        }),
      );
    });
  },
});
