import { app, dialog, ipcMain, Notification, shell } from 'electron';
import type { WebContents } from 'electron';
import { access } from 'fs/promises';
import { readFile, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

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
} as const;

export const CHAT_STREAM_CHUNK = 'st-desktop:chatStreamChunk';
export const CHAT_STREAM_END = 'st-desktop:chatStreamEnd';

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
}
