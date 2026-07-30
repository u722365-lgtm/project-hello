/**
 * Turbo Provider Configuration — Key resolution & provider constants.
 *
 * Shared between useTurboChat (React hook) and turboEngine (forge/execute).
 * Keeps key resolution logic DRY.
 */

import { loadCustomAiConfig, hasActiveCustomKey, type CustomAiKeysConfig } from '@/lib/customApiKeys';

// ---- Provider Constants ----

/** Primary Turbo model — fastest powerful model on Groq */
export const TURBO_MODEL_GROQ = 'llama-3.3-70b-versatile';

/** Chat-optimized Turbo model — smallest, fastest (used by useTurboChat) */
export const TURBO_MODEL_CHAT = 'llama-3.1-8b-instant';

/** OpenRouter free fallback model */
export const TURBO_MODEL_OPENROUTER = 'google/gemini-2.0-flash-exp:free';

/** Groq API endpoint */
export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/** OpenRouter API endpoint */
export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// ---- Key Resolution ----

/**
 * Resolve the Turbo API key from multiple sources.
 * Non-reactive — safe to call from any context (React hooks, forge/execute libs).
 *
 * Priority:
 *   1. localStorage (shadowtalk_custom_ai_keys — if provider is groq or turbo)
 *   2. sessionStorage (shadowtalk_turbo_groq_key — set by settings page)
 */
export function resolveTurboKey(): string | null {
  // 1. Check localStorage (BYOK config)
  try {
    const config: CustomAiKeysConfig = loadCustomAiConfig();
    if (hasActiveCustomKey(config)) {
      // Accept groq or turbo provider
      if ((config.provider as string) === 'groq' || (config.provider as string) === 'turbo') {
        return config.apiKey;
      }
      // Also accept any key that looks like a Groq key
      if (config.apiKey.startsWith('gsk_')) {
        return config.apiKey;
      }
    }
  } catch {
    // silent — localStorage may be unavailable
  }

  // 2. Check sessionStorage (dedicated turbo key from settings)
  try {
    const turboKey = sessionStorage.getItem('shadowtalk_turbo_groq_key');
    if (turboKey && turboKey.startsWith('gsk_')) return turboKey;
  } catch {
    // silent
  }

  return null;
}

// ---- Provider Info ----

export interface TurboProviderInfo {
  id: 'groq' | 'openrouter';
  name: string;
  model: string;
  url: string;
  maxTokens: number;
  /** Approximate TTFB on Groq hardware */
  avgTtftMs: number;
}

export const TURBO_PROVIDERS: TurboProviderInfo[] = [
  {
    id: 'groq',
    name: 'Groq (Llama 3.3 70B)',
    model: TURBO_MODEL_GROQ,
    url: GROQ_API_URL,
    maxTokens: 8192,
    avgTtftMs: 250,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter Free (Gemini Flash)',
    model: TURBO_MODEL_OPENROUTER,
    url: OPENROUTER_API_URL,
    maxTokens: 4096,
    avgTtftMs: 600,
  },
];
