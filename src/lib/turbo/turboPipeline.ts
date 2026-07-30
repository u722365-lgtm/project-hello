/**
 * ShadowTalk-Turbo Pipeline — chat-oriented streaming fast path.
 *
 * Streams directly from Groq (BYOK) with an OpenRouter free-tier fallback,
 * bypassing the edge function entirely for lowest possible TTFT.
 */

import {
  GROQ_API_URL,
  OPENROUTER_API_URL,
  TURBO_MODEL_CHAT,
  TURBO_MODEL_OPENROUTER,
} from './turboProviders';

// ---- Types ----

export interface TurboMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface TurboOptions {
  apiKey?: string | null;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  personality?: string;
  signal?: AbortSignal;
  onDelta?: (accumulated: string) => void;
  /** Set false to skip the in-memory response cache */
  useCache?: boolean;
}

export interface TurboResult {
  content: string;
  source: 'groq' | 'openrouter-free' | 'cache' | 'error';
  ttftMs?: number;
  totalMs?: number;
  model?: string;
  error?: string;
}

// ---- Cache (small LRU, session-only) ----

const CACHE_LIMIT = 40;
const cache = new Map<string, string>();

function cacheKey(messages: TurboMessage[], opts: TurboOptions): string {
  return JSON.stringify({
    m: messages.slice(-6),
    s: opts.systemPrompt ?? '',
    mo: opts.model ?? '',
  });
}

function cacheSet(key: string, value: string) {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, value);
  if (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
}

export function clearTurboCache(): void {
  cache.clear();
}

export function getTurboCacheStats(): { size: number; limit: number } {
  return { size: cache.size, limit: CACHE_LIMIT };
}

// ---- Connection pre-warm ----

let prewarmController: AbortController | null = null;

/** Warm the TLS connection to Groq so the first real request is faster. */
export function prewarmGroqConnection(apiKey?: string | null): void {
  if (typeof fetch === 'undefined' || !apiKey) return;
  try {
    prewarmController?.abort();
  } catch {
    /* noop */
  }
  prewarmController = new AbortController();
  fetch('https://api.groq.com/openai/v1/models', {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: prewarmController.signal,
  }).catch(() => {
    /* silent — warmup only */
  });
}

export function cancelPrewarm(): void {
  try {
    prewarmController?.abort();
  } catch {
    /* noop */
  }
  prewarmController = null;
}

// ---- Streaming core ----

async function streamCompletion(
  url: string,
  apiKey: string,
  model: string,
  messages: TurboMessage[],
  opts: TurboOptions,
  extraHeaders: Record<string, string> = {},
): Promise<{ content: string; ttftMs?: number }> {
  const startMs = performance.now();
  let ttftMs: number | undefined;
  let accumulated = '';

  const payload = {
    model,
    messages: opts.systemPrompt
      ? [{ role: 'system', content: opts.systemPrompt }, ...messages]
      : messages,
    max_tokens: opts.maxTokens ?? 2048,
    temperature: opts.temperature ?? 0.6,
    stream: true,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify(payload),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Turbo request failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        const delta: string = parsed?.choices?.[0]?.delta?.content ?? '';
        if (delta) {
          if (ttftMs === undefined) ttftMs = performance.now() - startMs;
          accumulated += delta;
          opts.onDelta?.(accumulated);
        }
      } catch {
        /* ignore malformed chunk */
      }
    }
  }

  return { content: accumulated, ttftMs };
}

// ---- Public entry point ----

export async function turboChat(
  messages: TurboMessage[],
  opts: TurboOptions = {},
): Promise<TurboResult> {
  const startMs = performance.now();
  const key = cacheKey(messages, opts);

  if (opts.useCache !== false) {
    const hit = cache.get(key);
    if (hit) {
      opts.onDelta?.(hit);
      return {
        content: hit,
        source: 'cache',
        ttftMs: 0,
        totalMs: performance.now() - startMs,
      };
    }
  }

  const apiKey = opts.apiKey;
  if (!apiKey) {
    return {
      content: '',
      source: 'error',
      error: 'No Turbo API key available',
      totalMs: performance.now() - startMs,
    };
  }

  const model = opts.model || TURBO_MODEL_CHAT;

  // 1. Groq (primary)
  try {
    const { content, ttftMs } = await streamCompletion(
      GROQ_API_URL,
      apiKey,
      model,
      messages,
      opts,
    );
    if (content) {
      if (opts.useCache !== false) cacheSet(key, content);
      return {
        content,
        source: 'groq',
        ttftMs,
        totalMs: performance.now() - startMs,
        model,
      };
    }
  } catch (err) {
    if (opts.signal?.aborted) {
      return { content: '', source: 'error', error: 'aborted' };
    }
    console.warn('[Turbo] Groq failed, trying OpenRouter fallback:', err);
  }

  // 2. OpenRouter free tier (fallback — only if key looks like an OpenRouter key)
  if (apiKey.startsWith('sk-or-')) {
    try {
      const { content, ttftMs } = await streamCompletion(
        OPENROUTER_API_URL,
        apiKey,
        TURBO_MODEL_OPENROUTER,
        messages,
        opts,
        typeof window !== 'undefined'
          ? { 'HTTP-Referer': window.location.origin, 'X-Title': 'ShadowTalk AI' }
          : {},
      );
      if (content) {
        if (opts.useCache !== false) cacheSet(key, content);
        return {
          content,
          source: 'openrouter-free',
          ttftMs,
          totalMs: performance.now() - startMs,
          model: TURBO_MODEL_OPENROUTER,
        };
      }
    } catch (err) {
      console.warn('[Turbo] OpenRouter fallback failed:', err);
    }
  }

  return {
    content: '',
    source: 'error',
    error: 'Turbo providers unavailable',
    totalMs: performance.now() - startMs,
  };
}
