/**
 * Optional server-side Ollama fallback for edge functions.
 *
 * Behavior:
 * - enabled only when FALLBACK_TO_OLLAMA=true
 * - triggers when platform/Lovable responses return 402/429/503,
 *   or when a caller passes fallback="ollama" explicitly.
 */

export interface OllamaFallbackStatus {
  enabled: boolean;
  endpoint: string;
  ready: boolean;
  models: string[];
  defaultModel: string;
  fallbackModel: string;
}

export interface OllamaChatRequest {
  model: string;
  prompt: string;
  system?: string;
  stream?: boolean;
}

export interface OllamaChatResponse {
  model: string;
  message: { role: string; content: string };
  done: boolean;
}

function env(name: string, fallback?: string): string {
  const v = Deno.env.get(name);
  if (v && v.trim()) return v.trim();
  return fallback ?? '';
}

export function getOllamaFallbackConfig(): OllamaFallbackStatus {
  const enabled = env('FALLBACK_TO_OLLAMA', 'false').toLowerCase() === 'true';
  const endpoint = env('OLLAMA_BASE_URL', 'http://127.0.0.1:11434').replace(/\/$/, '');
  const defaultModel = env('OLLAMA_DEFAULT_MODEL', 'qwen2.5:7b');
  const fallbackModel = env('OLLAMA_FALLBACK_MODEL', 'phi3:mini');
  return { enabled, endpoint, ready: false, models: [], defaultModel, fallbackModel };
}

async function detectReady(
  endpoint: string,
): Promise<{ ready: boolean; models: string[] }> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${endpoint}/api/tags`, { signal: controller.signal as any });
    clearTimeout(id);
    if (!res.ok) return { ready: false, models: [] };
    const data = (await res.json()) as { models?: Array<{ name?: string }> };
    const models = (data.models || []).map((m) => m.name).filter((n): n is string => !!n);
    return { ready: models.length > 0, models };
  } catch {
    return { ready: false, models: [] };
  }
}

let cached: { ready: boolean; models: string[] } | null = null;
let cachedAt = 0;
let inflight: Promise<{ ready: boolean; models: string[] }> | null = null;

export async function resolveOllamaFallbackStatus(): Promise<OllamaFallbackStatus> {
  const cfg = getOllamaFallbackConfig();
  if (!cfg.enabled) return cfg;
  const now = Date.now();
  if (cached && now - cachedAt < 10000) {
    return { ...cfg, ready: cached.ready, models: cached.models };
  }
  if (!inflight) {
    inflight = detectReady(cfg.endpoint).then((r) => {
      cached = r;
      cachedAt = Date.now();
      inflight = null;
      return r;
    });
  }
  const status = await inflight;
  return { ...cfg, ready: status.ready, models: status.models };
}

export function shouldFallbackToOllama(cfg: OllamaFallbackStatus): boolean {
  if (!cfg.enabled) return false;
  return cfg.ready && cfg.models.length > 0;
}

export function pickOllamaModel(cfg: OllamaFallbackStatus, requested?: string): string {
  if (requested && cfg.models.some((m) => m.toLowerCase() === requested.toLowerCase())) {
    return requested;
  }
  if (requested) {
    const prefix = requested.split(':')[0]?.toLowerCase();
    const match = cfg.models.find((m) => m.toLowerCase().startsWith(prefix || ''));
    if (match) return match;
  }
  if (cfg.ready && cfg.models.length) return cfg.models[0];
  return cfg.defaultModel;
}

export async function ollamaChat(
  cfg: OllamaFallbackStatus,
  req: OllamaChatRequest,
): Promise<OllamaChatResponse | null> {
  const model = pickOllamaModel(cfg, req.model || cfg.defaultModel);
  const payload: Record<string, unknown> = {
    model,
    prompt: req.prompt,
    stream: req.stream !== false,
  };
  if (req.system) payload.system = req.system;

  try {
    const res = await fetch(`${cfg.endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      model?: string;
      message?: { role?: string; content?: string };
      done?: boolean;
    };
    return {
      model: data.model || model,
      message: {
        role: data.message?.role || 'assistant',
        content: data.message?.content || '',
      },
      done: data.done !== false,
    };
  } catch {
    return null;
  }
}
