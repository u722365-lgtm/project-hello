/**
 * ShadowTalk Inference Router — Unified request routing across 3 modes.
 *
 * Routing priority:
 *   1. WebLLM (if user selected a local model) → $0, runs in browser
 *   2. BYOK (if user has their own key for the selected provider) → $0 to you
 *   3. Shared Free Pool (edge function with Groq → Google AI → OpenRouter fallback)
 *
 * For Mission Control multi-step loops, BYOK and WebLLM requests go directly
 * from the user's device — costing you absolutely nothing.
 */

import { backend, isConfigured } from '@/integrations/local/client';
import { decryptKey, listStoredKeyProviders } from '@/lib/byok/crypto';
import { getByokProvider, type ByokProviderId } from '@/lib/byok/providers';
import { byokChatStream, type ByokStreamResult } from '@/lib/byok/client';
import {
  isWebGPUSupported,
  isModelLoaded,
  webLlmChat,
  WEBLLM_MODELS,
  type WebLlmProgress,
} from '@/lib/webllm/engine';

// ---- Types ----

export type InferenceMode = 'shared-pool' | 'byok' | 'webllm';

export interface InferenceMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface InferenceRequest {
  messages: InferenceMessage[];
 model?: string;
  /** Explicit mode override — if not set, router auto-detects */
  mode?: InferenceMode;
  /** BYOK provider ID — if set, prefer this provider */
  byokProvider?: ByokProviderId;
  /** System prompt (appended if not already in messages) */
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  deepResearch?: boolean;
  personality?: string;
  signal?: AbortSignal;
  onDelta?: (token: string, accumulated: string) => void;
  onModeResolved?: (mode: InferenceMode, detail: string) => void;
  onProviderInfo?: (info: { provider: string; model: string; ttftMs?: number }) => void;
  onWebLlmProgress?: (progress: WebLlmProgress) => void;
}

export interface InferenceResult {
  content: string;
  mode: InferenceMode;
  provider: string;
  model: string;
  ttftMs?: number;
  totalMs: number;
}

// ---- SSE Parser for shared pool responses ----

function parseSseLine(line: string): string | null {
  if (!line.startsWith('data: ') || line === 'data: [DONE]') return null;
  try {
    const data = JSON.parse(line.slice(6));
    return data.choices?.[0]?.delta?.content ?? null;
  } catch {
    return null;
  }
}

// ---- Shared Pool (Edge Function) ----

async function sharedPoolStream(
  messages: InferenceMessage[],
  opts: InferenceRequest,
): Promise<InferenceResult> {
  const startMs = performance.now();
  const authToken = localStorage.getItem('shadowtalk-auth-token');

  // Try to get auth header from Supabase session
  let authHeader = '';
  try {
    const { data } = await backend.auth.getSession();
    if (data?.session?.access_token) {
      authHeader = data.session.access_token;
    }
  } catch { /* use empty */ }

  const body: Record<string, unknown> = {
    messages: messages.filter(m => m.role !== 'system' || m.content !== opts.systemPrompt),
    model: opts.model,
    stream: true,
    personality: opts.personality,
    deepResearch: opts.deepResearch,
  };

  // If system prompt is different from default, include it
  if (opts.systemPrompt && !messages.some(m => m.role === 'system' && m.content === opts.systemPrompt)) {
    // Edge function will prepend it
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (authHeader) {
    headers['Authorization'] = `Bearer ${authHeader}`;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_API_BASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_API_KEY;

  const resp = await fetch(`${supabaseUrl}/functions/v1/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({ error: resp.statusText }));
    throw new Error(errData.error || `Shared pool error: ${resp.status}`);
  }

  const provider = resp.headers.get('X-Provider') || 'shared-pool';
  const model = resp.headers.get('X-Model') || opts.model || 'unknown';

  // Stream response
  const reader = resp.body?.getReader();
  if (!reader) throw new Error('No response body from shared pool');

  const decoder = new TextDecoder();
  let content = '';
  let lineBuffer = '';
  let ttftRecorded = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    lineBuffer += decoder.decode(value, { stream: true });
    const lines = lineBuffer.split('\n');
    lineBuffer = lines.pop() ?? '';
    for (const line of lines) {
      const token = parseSseLine(line);
      if (token) {
        if (!ttftRecorded) {
          ttftRecorded = true;
          opts.onProviderInfo?.({ provider, model, ttftMs: performance.now() - startMs });
        }
        content += token;
        opts.onDelta?.(token, content);
      }
    }
  }

  return {
    content,
    mode: 'shared-pool',
    provider,
    model,
    ttftMs: ttftRecorded ? performance.now() - startMs : undefined,
    totalMs: performance.now() - startMs,
  };
}

// ---- Auto-detect mode ----

async function detectMode(opts: InferenceRequest): Promise<InferenceMode> {
  // 1. WebLLM — if model ID matches a WebLLM model and it's loaded
  if (opts.model && WEBLLM_MODELS.some(m => m.id === opts.model)) {
    if (isModelLoaded(opts.model) || isWebGPUSupported()) {
      return 'webllm';
    }
  }

  // 2. BYOK — if user has an encrypted key for the selected provider
  if (opts.byokProvider) {
    const key = await decryptKey(opts.byokProvider);
    if (key) return 'byok';
  }

  // 3. Check if any BYOK key is stored for the model's natural provider
  if (opts.model) {
    const modelLower = opts.model.toLowerCase();
    if (modelLower.includes('llama') || modelLower.includes('mixtral') || modelLower.includes('gemma')) {
      const key = await decryptKey('groq');
      if (key) return 'byok';
    }
    if (modelLower.includes('gemini')) {
      const key = await decryptKey('google');
      if (key) return 'byok';
    }
    if (modelLower.includes('gpt')) {
      const key = await decryptKey('openai');
      if (key) return 'byok';
    }
    if (modelLower.includes('claude')) {
      const key = await decryptKey('anthropic');
      if (key) return 'byok';
    }
  }

  // 4. Shared pool (default)
  return 'shared-pool';
}

// ---- Main Router ----

/**
 * Route a chat request through the appropriate inference path.
 * Automatically detects the best mode based on user configuration.
 */
export async function infer(request: InferenceRequest): Promise<InferenceResult> {
  // Resolve mode
  let mode = request.mode;
  if (!mode) {
    mode = await detectMode(request);
  }

  const modeDetails: Record<InferenceMode, string> = {
    'webllm': request.model || 'local-model',
    'byok': request.byokProvider || 'user-key',
    'shared-pool': 'Groq → Google AI → OpenRouter',
  };
  request.onModeResolved?.(mode, modeDetails[mode]);

  // ---- WebLLM path ----
  if (mode === 'webllm') {
    // If model not loaded, try to load it first
    if (!isModelLoaded(request.model)) {
      const modelId = request.model || WEBLLM_MODELS[0].id;
      try {
        await import('@/lib/webllm/engine').then(mod =>
          mod.loadWebLlmModel(modelId, request.onWebLlmProgress, request.signal)
        );
      } catch (err) {
        // WebLLM failed to load — fall back to shared pool
        console.warn('[InferenceRouter] WebLLM load failed, falling back to shared pool:', err);
        request.onModeResolved?.('shared-pool', 'WebLLM unavailable, using shared pool');
        return sharedPoolStream(request.messages, request);
      }
    }

    const result = await webLlmChat(request.messages, {
      maxTokens: request.maxTokens,
      temperature: request.temperature,
      systemPrompt: request.systemPrompt,
      signal: request.signal,
      onDelta: request.onDelta,
    });

    return {
      content: result.content,
      mode: 'webllm',
      provider: 'webllm',
      model: result.model,
      ttftMs: result.ttftMs,
      totalMs: result.totalMs,
    };
  }

  // ---- BYOK path ----
  if (mode === 'byok') {
    const providerId = request.byokProvider || await detectByokProvider(request.model);
    if (!providerId) {
      // No BYOK key available — fall back to shared pool
      request.onModeResolved?.('shared-pool', 'No BYOK key found, using shared pool');
      return sharedPoolStream(request.messages, request);
    }

    const result = await byokChatStream({
      providerId,
      messages: request.messages,
      model: request.model,
      maxTokens: request.maxTokens,
      temperature: request.temperature,
      systemPrompt: request.systemPrompt,
      signal: request.signal,
      onDelta: request.onDelta,
      onProviderInfo: request.onProviderInfo,
    });

    return {
      content: result.content,
      mode: 'byok',
      provider: result.provider,
      model: result.model,
      ttftMs: result.ttftMs,
      totalMs: result.totalMs,
    };
  }

  // ---- Shared Pool path ----
  return sharedPoolStream(request.messages, request);
}

/**
 * Detect which BYOK provider matches a model name.
 */
async function detectByokProvider(model?: string): Promise<ByokProviderId | null> {
  if (!model) {
    // Try any available BYOK key
    const providers = listStoredKeyProviders();
    if (providers.length > 0) {
      const key = await decryptKey(providers[0]);
      if (key) return providers[0] as ByokProviderId;
    }
    return null;
  }

  const m = model.toLowerCase();
  if (m.includes('llama') || m.includes('mixtral')) {
    const key = await decryptKey('groq');
    if (key) return 'groq';
  }
  if (m.includes('gemini')) {
    const key = await decryptKey('google');
    if (key) return 'google';
  }
  if (m.includes('gpt') || m.includes('o1')) {
    const key = await decryptKey('openai');
    if (key) return 'openai';
  }
  if (m.includes('claude')) {
    const key = await decryptKey('anthropic');
    if (key) return 'anthropic';
  }
  if (m.includes('/')) {
    // Could be OpenRouter format: org/model
    const key = await decryptKey('openrouter');
    if (key) return 'openrouter';
  }

  return null;
}

// ---- Utility: check available modes ----

export function getAvailableModes(): { mode: InferenceMode; available: boolean; reason: string }[] {
  const modes = [
    {
      mode: 'webllm' as InferenceMode,
      available: isWebGPUSupported(),
      reason: isWebGPUSupported() ? 'WebGPU available' : 'WebGPU not supported in this browser',
    },
    {
      mode: 'byok' as InferenceMode,
      available: true, // Always available (user just needs to add keys)
      reason: 'Add API keys in Settings',
    },
    {
      mode: 'shared-pool' as InferenceMode,
      available: isConfigured,
      reason: isConfigured ? 'Connected to ShadowTalk cloud' : 'Supabase not configured',
    },
  ];
  return modes;
}