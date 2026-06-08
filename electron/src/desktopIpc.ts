import { app, dialog, ipcMain, Notification, shell } from 'electron';
import type { WebContents } from 'electron';
import { access } from 'fs/promises';
import { readFile, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';
import {
  probeOllamaStatus,
  pullOllamaModel,
  setOllamaConfig,
  streamOllamaChat,
  type ChatMessage,
} from './ollamaSidecar';

const CHANNEL = {
  getInfo: 'st-desktop:getInfo',
  openFile: 'st-desktop:openFile',
  saveFile: 'st-desktop:saveFile',
  readTextFile: 'st-desktop:readTextFile',
  writeTextFile: 'st-desktop:writeTextFile',
  openPath: 'st-desktop:openPath',
  openExternal: 'st-desktop:openExternal',
  notify: 'st-desktop:notify',
  getAutoLaunch: 'st-desktop:getAutoLaunch',
  setAutoLaunch: 'st-desktop:setAutoLaunch',
  revealInFolder: 'st-desktop:revealInFolder',
  chatStream: 'st-desktop:chatStream',
  ollamaStatus: 'st-desktop:ollamaStatus',
  ollamaConfigure: 'st-desktop:ollamaConfigure',
  ollamaPull: 'st-desktop:ollamaPull',
  ollamaChat: 'st-desktop:ollamaChat',
  fetchUrl: 'st-desktop:fetchUrl',
} as const;

export const CHAT_STREAM_CHUNK = 'st-desktop:chatStreamChunk';
export const CHAT_STREAM_END = 'st-desktop:chatStreamEnd';
export const OLLAMA_CHAT_CHUNK = 'st-desktop:ollamaChatChunk';
export const OLLAMA_CHAT_END = 'st-desktop:ollamaChatEnd';
export const OLLAMA_PULL_PROGRESS = 'st-desktop:ollamaPullProgress';

type ChatStreamPayload = {
  requestId: string;
  url: string;
  headers: Record<string, string>;
  body: string;
};

async function pumpChatSse(wc: WebContents, requestId: string, url: string, headers: Record<string, string>, body: string) {
  try {
    const res = await fetch(url, { method: 'POST', headers, body });
    if (!res.ok) {
      const errText = await res.text();
      wc.send(CHAT_STREAM_END, { requestId, ok: false, status: res.status, body: errText });
      return;
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/event-stream')) {
      const errText = await res.text();
      wc.send(CHAT_STREAM_END, { requestId, ok: false, status: res.status, body: errText });
      return;
    }
    const reader = res.body?.getReader();
    if (!reader) {
      wc.send(CHAT_STREAM_END, { requestId, ok: false, status: 500, body: 'No response body' });
      return;
    }
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      wc.send(CHAT_STREAM_CHUNK, { requestId, chunk: decoder.decode(value, { stream: true }) });
    }
    wc.send(CHAT_STREAM_END, { requestId, ok: true, status: 200, body: '' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Chat request failed';
    wc.send(CHAT_STREAM_END, { requestId, ok: false, status: 0, body: msg });
  }
}

export function registerDesktopIpc(): void {
  ipcMain.handle(CHANNEL.getInfo, async () => {
    const bundledDir = join(process.resourcesPath, 'offline-models', 'SmolLM2-135M-Instruct-q4f16_1-MLC');
    let offlineModelBundled = false;
    try {
      await access(bundledDir);
      offlineModelBundled = true;
    } catch {
      offlineModelBundled = false;
    }
    return {
      platform: process.platform,
      arch: process.arch,
      appVersion: app.getVersion(),
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      userDataPath: app.getPath('userData'),
      documentsPath: app.getPath('documents'),
      homePath: homedir(),
      shadowtalkDataPath: join(app.getPath('userData'), 'shadowtalk-data'),
      offlineModelBundled,
      offlineModelPath: offlineModelBundled ? bundledDir : undefined,
      sovereignDesktopCapable: true,
    };
  });

  ipcMain.handle(CHANNEL.openFile, async (_event, options: Electron.OpenDialogOptions) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      ...options,
    });
    return result;
  });

  ipcMain.handle(CHANNEL.saveFile, async (_event, options: Electron.SaveDialogOptions) => {
    const result = await dialog.showSaveDialog(options);
    return result;
  });

  ipcMain.handle(CHANNEL.readTextFile, async (_event, filePath: string) => {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('Invalid file path');
    }
    return readFile(filePath, 'utf-8');
  });

  ipcMain.handle(CHANNEL.writeTextFile, async (_event, filePath: string, content: string) => {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('Invalid file path');
    }
    await writeFile(filePath, content, 'utf-8');
    return { ok: true };
  });

  ipcMain.handle(CHANNEL.openPath, async (_event, filePath: string) => {
    await shell.openPath(filePath);
  });

  ipcMain.handle(CHANNEL.openExternal, async (_event, url: string) => {
    await shell.openExternal(url);
  });

  ipcMain.handle(CHANNEL.revealInFolder, async (_event, filePath: string) => {
    shell.showItemInFolder(filePath);
  });

  ipcMain.handle(CHANNEL.notify, async (_event, title: string, body: string) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
  });

  ipcMain.handle(CHANNEL.getAutoLaunch, async () => {
    const settings = app.getLoginItemSettings();
    return settings.openAtLogin;
  });

  ipcMain.handle(CHANNEL.setAutoLaunch, async (_event, enabled: boolean) => {
    app.setLoginItemSettings({ openAtLogin: enabled });
    return enabled;
  });

  ipcMain.handle(CHANNEL.chatStream, async (event, payload: ChatStreamPayload) => {
    const { requestId, url, headers, body } = payload;
    if (!url.includes('.supabase.co/functions/v1/') && !url.includes('.supabase.in/functions/v1/')) {
      throw new Error('Invalid chat URL');
    }
    void pumpChatSse(event.sender, requestId, url, headers, body);
    return { started: true as const };
  });

  ipcMain.handle(
    CHANNEL.ollamaStatus,
    async (_event, opts?: { baseUrl?: string; model?: string }) => {
      if (opts?.baseUrl || opts?.model) {
        setOllamaConfig({ baseUrl: opts.baseUrl, model: opts.model });
      }
      return probeOllamaStatus();
    },
  );

  ipcMain.handle(
    CHANNEL.ollamaConfigure,
    async (_event, opts: { baseUrl?: string; model?: string }) => {
      setOllamaConfig(opts);
      return probeOllamaStatus();
    },
  );

  ipcMain.handle(CHANNEL.ollamaPull, async (event, model: string) => {
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const result = await pullOllamaModel(model, (status, percent) => {
      event.sender.send(OLLAMA_PULL_PROGRESS, { requestId, status, percent });
    });
    return { ...result, requestId };
  });

  ipcMain.handle(CHANNEL.fetchUrl, async (_event, url: string) => {
    if (!url || typeof url !== "string" || !/^https?:\/\//i.test(url)) {
      return { ok: false, status: 0, text: "", error: "Invalid URL" };
    }
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "ShadowTalk-Desktop/1.0" },
        signal: AbortSignal.timeout(20_000),
      });
      const text = await res.text();
      return {
        ok: res.ok,
        status: res.status,
        text: text.slice(0, 80_000),
        error: res.ok ? undefined : `HTTP ${res.status}`,
      };
    } catch (e) {
      return {
        ok: false,
        status: 0,
        text: "",
        error: e instanceof Error ? e.message : "Fetch failed",
      };
    }
  });

  ipcMain.handle(
    CHANNEL.ollamaChat,
    async (
      event,
      payload: {
        requestId: string;
        messages: ChatMessage[];
        baseUrl?: string;
        model?: string;
      },
    ) => {
      const { requestId, messages, baseUrl, model } = payload;
      if (baseUrl || model) {
        setOllamaConfig({ baseUrl, model });
      }

      const controller = new AbortController();
      const onAbort = () => controller.abort();
      event.sender.once('destroyed', onAbort);

      const result = await streamOllamaChat(
        messages,
        (token) => {
          event.sender.send(OLLAMA_CHAT_CHUNK, { requestId, token });
        },
        controller.signal,
      );

      event.sender.removeListener('destroyed', onAbort);
      event.sender.send(OLLAMA_CHAT_END, { requestId, ...result });
      return { started: true as const };
    },
  );
}
