/**
 * ShadowTalk Inference Router — Unified request routing.
 *
 * Routing priority:
 *   1. WebLLM (if user selected a local model) → $0, runs in browser
 *   2. BYOK (if user has their own key for the selected provider) → $0 to you
 *
 * For Mission Control multi-step loops, BYOK and WebLLM requests go directly
 * from the user's device — costing you absolutely nothing.
 */

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

export type InferenceMode = 'byok' | 'webllm';

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
    if (modelLower.includes('llama') || modelLower.includes('mixtral') || modelLower.includes('gemma') || modelLower.includes('hermes')) {
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

  // 4. Try any available BYOK key as last resort
  const providers = listStoredKeyProviders();
  if (providers.length > 0) {
    const key = await decryptKey(providers[0]);
    if (key) return 'byok';
  }

  throw new Error('No inference mode available. Add an API key in Settings (BYOK) or use a WebLLM model.');
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
        // WebLLM failed to load — try BYOK as fallback
        console.warn('[InferenceRouter] WebLLM load failed, trying BYOK:', err);
        request.onModeResolved?.('byok', 'WebLLM unavailable, trying BYOK');
        const providers = listStoredKeyProviders();
        if (providers.length > 0) {
          const providerId = providers[0] as ByokProviderId;
          const key = await decryptKey(providerId);
          if (key) {
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
        }
        throw new Error('No inference mode available. WebLLM failed to load and no BYOK keys found. Add an API key in Settings.');
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
  const providerId = request.byokProvider || await detectByokProvider(request.model);
  if (!providerId) {
    throw new Error('No BYOK key found for this model. Add an API key in Settings.');
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
  if (m.includes('llama') || m.includes('mixtral') || m.includes('hermes')) {
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
  return [
    {
      mode: 'webllm' as InferenceMode,
      available: isWebGPUSupported(),
      reason: isWebGPUSupported() ? 'WebGPU available' : 'WebGPU not supported in this browser',
    },
    {
      mode: 'byok' as InferenceMode,
      available: true,
      reason: 'Add API keys in Settings',
    },
  ];
}