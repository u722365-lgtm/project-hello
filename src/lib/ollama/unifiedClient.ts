/**
 * Unified Ollama client — works in both:
 *   - Desktop (Electron): uses the bundled sidecar via window.shadowtalkDesktop IPC.
 *   - Web browser: talks directly to the user's local `ollama serve` at http://localhost:11434.
 *
 * The desktop path reuses helpers in @/lib/desktop/ollamaInference (Odysseus sidecar).
 * The web path uses fetch + NDJSON streaming per Ollama's REST API.
 *
 * User needs to run `OLLAMA_ORIGINS='*' ollama serve` (or set the origin to the
 * ShadowTalk URL) so the browser is allowed to call the local daemon.
 */

import { isShadowTalkDesktop } from "@/lib/desktopBridge";
import {
  fetchOllamaStatus,
  configureOllama,
  pullOllamaModel,
  runOllamaChat,
  type OllamaStatus,
} from "@/lib/desktop/ollamaInference";
import {
  getStoredOllamaModel,
  getStoredOllamaUrl,
  setStoredOllamaModel,
  setStoredOllamaUrl,
  updateOllamaCache,
} from "@/lib/desktop/sovereignMode";
import { isOllamaDefaultProvider, OLLAMA_WEB_ENABLED_KEY } from "@/lib/ollama/defaultProvider";

export type OllamaMessage = { role: "system" | "user" | "assistant"; content: string };

export function isOllamaChatEnabled(): boolean {
  return isOllamaDefaultProvider();
}

export function setOllamaChatEnabled(enabled: boolean): void {
  localStorage.setItem(OLLAMA_WEB_ENABLED_KEY, enabled ? "1" : "0");
}

export function getOllamaUrl(): string {
  return getStoredOllamaUrl();
}

export function setOllamaUrl(url: string): void {
  setStoredOllamaUrl(url);
}

export function getOllamaModel(): string {
  return getStoredOllamaModel();
}

export function setOllamaModel(model: string): void {
  setStoredOllamaModel(model);
}

export function runtimeIsDesktop(): boolean {
  return isShadowTalkDesktop();
}

/** GET /api/tags — list installed models */
async function webListModels(baseUrl: string, signal?: AbortSignal): Promise<string[]> {
  const resp = await fetch(`${baseUrl}/api/tags`, { signal });
  if (!resp.ok) throw new Error(`Ollama returned ${resp.status}`);
  const data = (await resp.json()) as { models?: { name: string }[] };
  return (data.models ?? []).map((m) => m.name);
}

/** GET /api/version */
async function webVersion(baseUrl: string, signal?: AbortSignal): Promise<string | undefined> {
  try {
    const resp = await fetch(`${baseUrl}/api/version`, { signal });
    if (!resp.ok) return undefined;
    const data = (await resp.json()) as { version?: string };
    return data.version;
  } catch {
    return undefined;
  }
}

export async function getStatus(): Promise<OllamaStatus> {
  if (isShadowTalkDesktop()) {
    const s = await fetchOllamaStatus();
    if (s) {
      updateOllamaCache({
        reachable: s.reachable,
        models: s.models,
        activeModel: s.activeModel,
        error: s.error,
      });
      return s;
    }
  }

  const baseUrl = getStoredOllamaUrl();
  const activeModel = getStoredOllamaModel();
  try {
    const [models, version] = await Promise.all([webListModels(baseUrl), webVersion(baseUrl)]);
    const status: OllamaStatus = {
      reachable: true,
      version,
      models,
      activeModel,
      baseUrl,
    };
    updateOllamaCache({ reachable: true, models, activeModel, error: undefined });
    return status;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const hint = /Failed to fetch|NetworkError|CORS/i.test(message)
      ? `Cannot reach Ollama at ${baseUrl}. Start it with: OLLAMA_ORIGINS='*' ollama serve`
      : message;
    updateOllamaCache({ reachable: false, models: [], activeModel, error: hint });
    return {
      reachable: false,
      models: [],
      activeModel,
      baseUrl,
      error: hint,
    };
  }
}

export async function configure(partial: { baseUrl?: string; model?: string }): Promise<OllamaStatus> {
  if (partial.baseUrl !== undefined) setStoredOllamaUrl(partial.baseUrl);
  if (partial.model !== undefined) setStoredOllamaModel(partial.model);
  if (isShadowTalkDesktop()) {
    const s = await configureOllama(partial);
    if (s) return s;
  }
  return getStatus();
}

/** POST /api/pull — stream NDJSON progress */
async function webPull(
  baseUrl: string,
  model: string,
  onProgress?: (status: string, percent?: number) => void,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const resp = await fetch(`${baseUrl}/api/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: model, stream: true }),
    });
    if (!resp.ok || !resp.body) {
      return { ok: false, error: `Pull failed (${resp.status})` };
    }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;
        try {
          const parsed = JSON.parse(line) as {
            status?: string;
            total?: number;
            completed?: number;
            error?: string;
          };
          if (parsed.error) return { ok: false, error: parsed.error };
          const pct =
            parsed.total && parsed.completed
              ? Math.round((parsed.completed / parsed.total) * 100)
              : undefined;
          if (parsed.status) onProgress?.(parsed.status, pct);
        } catch {
          /* ignore partial */
        }
      }
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function pullModel(
  model: string,
  onProgress?: (status: string, percent?: number) => void,
): Promise<{ ok: boolean; error?: string }> {
  if (isShadowTalkDesktop()) {
    return pullOllamaModel(model, onProgress);
  }
  return webPull(getStoredOllamaUrl(), model, onProgress);
}

export async function deleteModel(model: string): Promise<{ ok: boolean; error?: string }> {
  if (isShadowTalkDesktop()) {
    return { ok: false, error: "Delete not supported via sidecar. Use `ollama rm` in a terminal." };
  }
  try {
    const resp = await fetch(`${getStoredOllamaUrl()}/api/delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: model }),
    });
    if (!resp.ok) return { ok: false, error: `Delete failed (${resp.status})` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** POST /api/chat — stream NDJSON tokens */
async function webChat(
  baseUrl: string,
  model: string,
  messages: OllamaMessage[],
  onToken?: (token: string) => void,
  signal?: AbortSignal,
): Promise<{ ok: boolean; content: string; error?: string }> {
  try {
    const resp = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream: true }),
      signal,
    });
    if (!resp.ok || !resp.body) {
      return { ok: false, content: "", error: `Chat failed (${resp.status})` };
    }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let content = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;
        try {
          const parsed = JSON.parse(line) as {
            message?: { content?: string };
            done?: boolean;
            error?: string;
          };
          if (parsed.error) return { ok: false, content, error: parsed.error };
          const token = parsed.message?.content ?? "";
          if (token) {
            content += token;
            onToken?.(token);
          }
        } catch {
          /* ignore */
        }
      }
    }
    return { ok: true, content };
  } catch (err) {
    if ((err as Error).name === "AbortError") return { ok: true, content: "" };
    return { ok: false, content: "", error: err instanceof Error ? err.message : String(err) };
  }
}

export async function chat(
  messages: OllamaMessage[],
  options?: { onToken?: (token: string) => void; signal?: AbortSignal },
): Promise<{ ok: boolean; content: string; error?: string }> {
  const model = getStoredOllamaModel();
  if (isShadowTalkDesktop()) {
    return runOllamaChat(messages, options?.onToken, options?.signal);
  }
  return webChat(getStoredOllamaUrl(), model, messages, options?.onToken, options?.signal);
}
