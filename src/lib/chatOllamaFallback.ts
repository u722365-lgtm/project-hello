/**
 * Centralized Lovable→Ollama runtime fallback client.
 *
 * This module provides a single place for ShadowTalk to switch to
 * local Ollama free models whenever the Lovable platform gateway fails,
 * returns 402/429/503, or the edge function signals `fallback=ollama`.
 *
 * It does NOT create a new `src/lib/ollama/` directory to avoid Windows
 * temp path issues; this file is the canonical fallback entrypoint.
 */

export interface OllamaLocalStatus {
  endpoint: string;
  ready: boolean;
  models: string[];
  defaultModel: string;
}

export interface OllamaChatRequest {
  model: string;
  prompt: string;
  stream?: boolean;
}

export interface OllamaChatResponse {
  model: string;
  message: { role: string; content: string };
  done: boolean;
}

export function isOllamaLikelyAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  const platform = (window as any)?.__TAURI__ ? 'tauri' : 'browser';
  if (platform !== 'tauri') return false;
  // In desktop mode, default to assuming fallback can be retried.
  // Actual presence is checked async by detectOllamaLocalStatus().
  return true;
}

let cachedStatus: { ready: boolean; models: string[] } | null = null;
let lastCheckAt = 0;
let checkPromise: Promise<OllamaLocalStatus | null> | null = null;

export async function detectOllamaLocalStatus(
  invoke?: (cmd: string, args?: any) => Promise<any>,
  maxAgeMs = 10000,
): Promise<OllamaLocalStatus | null> {
  if (!invoke) {
    const fromTauriClient = tryTauriOllamaClient();
    if (fromTauriClient) return fromTauriClient;
  }

  const now = Date.now();
  if (cachedStatus && now - lastCheckAt < maxAgeMs) {
    return { endpoint: 'http://127.0.0.1:11434', ready: cachedStatus.ready, models: cachedStatus.models, defaultModel: 'qwen2.5:7b' };
  }

  // Soft debounce if a check is already running
  if (checkPromise) return checkPromise;

  checkPromise = (async () => {
    const status = await resolveStatus(invoke);
    cachedStatus = status ? { ready: status.ready, models: status.models } : null;
    lastCheckAt = Date.now();
    checkPromise = null;
    return status;
  })();

  return checkPromise;
}

async function tryTauriOllamaClient(): Promise<OllamaLocalStatus | null> {
  try {
    const mod = await import('@/lib/tauri/ollamaClient');
    const client = mod.buildTauriOllamaClient?.();
    if (!client) return null;
    return client.health().then((h: any) =>
      h
        ? ({ endpoint: h.endpoint || 'http://127.0.0.1:11434', ready: !!h.ready, models: Array.isArray(h.models) ? h.models : [], defaultModel: h.defaultModel || 'qwen2.5:7b' } satisfies OllamaLocalStatus)
        : null,
    );
  } catch {
    return null;
  }
}

async function resolveStatus(invoke?: (cmd: string, args?: any) => Promise<any>): Promise<OllamaLocalStatus | null> {
  // Try direct HTTP health endpoint first if falling back from browser/lovable flow
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 1500);
    const res = await fetch('http://127.0.0.1:11434/api/tags', { signal: controller.signal as any });
    clearTimeout(id);
    if (res.ok) {
      const data = (await res.json()) as { models?: Array<{ name?: string }> };
      const models = (data.models || []).map(m => m.name).filter(Boolean) as string[];
      return { endpoint: 'http://127.0.0.1:11434', ready: models.length > 0, models, defaultModel: 'qwen2.5:7b' };
    }
  } catch {
    // likely no local ollama
  }

  if (!invoke) return null;
  try {
    const result = await invoke('ollama_status');
    const r = result as any;
    return {
      endpoint: typeof r?.endpoint === 'string' ? r.endpoint : 'http://127.0.0.1:11434',
      ready: !!r?.ready,
      models: Array.isArray(r?.models) ? r.models : [],
      defaultModel: typeof r?.defaultModel === 'string' ? r.defaultModel : 'qwen2.5:7b',
    };
  } catch {
    return null;
  }
}

export async function chatWithOllama(
  invoke: (cmd: string, args?: any) => Promise<any>,
  request: OllamaChatRequest,
): Promise<OllamaChatResponse | null> {
  const model = (request.model || '').trim() || 'qwen2.5:7b';
  const prompt = typeof request.prompt === 'string' ? request.prompt : String(request.prompt);
  const stream = request.stream !== false;

  try {
    const result = await invoke('ollama_chat', { model, prompt, stream });
    if (!result) return null;
    const r = result as any;
    return {
      model: String(r.model || model),
      message: { role: String(r?.message?.role || 'assistant'), content: String(r?.message?.content || '') },
      done: r?.done !== false,
    } satisfies OllamaChatResponse;
  } catch {
    return null;
  }
}

export async function ensureOllamaModel(
  invoke: (cmd: string, args?: any) => Promise<any>,
  preferredModel: string,
): Promise<string | null> {
  const status = await detectOllamaLocalStatus(invoke);
  if (!status || !status.ready) return null;

  const available = status.models.map((name) => name.toLowerCase());
  const exact = available.find((name) => name === preferredModel.toLowerCase());
  if (exact) return preferredModel;

  const base = preferredModel.split(':')[0]?.toLowerCase();
  const baseMatch = available.find((name) => name.startsWith(base || ''));
  if (baseMatch) return baseMatch;

  return status.models[0] || null;
}

export class OllamaFallbackUnavailable extends Error {
  constructor(message = 'Ollama fallback is not available') {
    super(message);
    this.name = 'OllamaFallbackUnavailable';
  }
}

export { tryTauriOllamaClient };
