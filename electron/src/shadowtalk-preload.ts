import { contextBridge, ipcRenderer } from 'electron';

const CHAT_STREAM_CHUNK = 'st-desktop:chatStreamChunk';
const CHAT_STREAM_END = 'st-desktop:chatStreamEnd';

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
});
