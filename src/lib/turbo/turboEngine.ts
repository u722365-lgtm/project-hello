/**
 * ShadowTalk-Turbo Engine — Forge & Execute fast-path.
 *
 * Unlike turboPipeline (chat-oriented, streaming, onDelta callbacks),
 * this module provides a simple Promise<string> API for forge/execute:
 *
 *   turboComplete(systemPrompt, userContent, opts) → string
 *
 * Used by:
 *   - generateExecutionPlan.ts  → plan generation
 *   - synthesizeDeliverable.ts   → non-strategy synthesis
 *   - unifiedDocumentPipeline.ts → drafting phase
 *
 * Falls back to the standard edge-function path if no Turbo key is available.
 */

import {
  turboChat,
  prewarmGroqConnection,
  type TurboOptions,
} from './turboPipeline';
import { resolveTurboKey } from './turboProviders';

// ---- Public Types ----

export interface TurboEngineOptions {
  /** Model override. Default: llama-3.3-70b-versatile (powerful + fast on Groq) */
  model?: string;
  /** Max tokens. Default: 4096 (higher than chat — documents need more) */
  maxTokens?: number;
  /** Temperature. Default: 0.5 (more deterministic for structured outputs) */
  temperature?: number;
  /** AbortSignal */
  signal?: AbortSignal;
  /** Stream callback (optional — for live UI updates) */
  onDelta?: (accumulated: string) => void;
}

export interface TurboEngineResult {
  /** Generated text */
  content: string;
  /** Which engine produced the result */
  source: 'turbo-groq' | 'turbo-openrouter' | 'turbo-cache' | 'fallback';
  /** Time to first token (ms), if measured */
  ttftMs?: number;
  /** Total time (ms) */
  totalMs?: number;
}

// ---- Core Function ----

/**
 * Send a system+user prompt through Turbo and get back the full text.
 * This is the main entry point for forge/execute fast-path.
 *
 * Flow:
 *   1. Resolve Groq API key (localStorage → sessionStorage)
 *   2. Pre-warm connection in background
 *   3. Stream from Groq directly (bypasses edge function entirely)
 *   4. Fallback to OpenRouter free tier on Groq failure
 *   5. Returns { content, source: 'fallback' } if no key available
 *
 * @param systemPrompt  The system instruction (kept minimal ~200 tokens)
 * @param userContent   The user message / task description
 * @param opts          Optional model, maxTokens, temperature, signal, onDelta
 */
export async function turboComplete(
  systemPrompt: string,
  userContent: string,
  opts: TurboEngineOptions = {},
): Promise<TurboEngineResult> {
  const startMs = performance.now();

  // 1. Resolve API key
  const apiKey = resolveTurboKey();

  if (!apiKey) {
    // No key available — signal that caller should use fallback path
    return {
      content: '',
      source: 'fallback',
      ttftMs: undefined,
      totalMs: performance.now() - startMs,
    };
  }

  // 2. Pre-warm in background (non-blocking)
  prewarmGroqConnection(apiKey);

  // 3. Build turbo options
  const turboOpts: TurboOptions = {
    apiKey,
    model: opts.model || 'llama-3.3-70b-versatile',
    maxTokens: opts.maxTokens || 4096,
    temperature: opts.temperature ?? 0.5,
    signal: opts.signal,
    onDelta: opts.onDelta,
    // No personality — we pass systemPrompt directly
    personality: 'turbo',
  };

  // 4. Stream from Groq (or OpenRouter fallback)
  const result = await turboChat(
    [{ role: 'user', content: userContent }],
    {
      ...turboOpts,
      systemPrompt,
    },
  );

  // 5. Map result source
  const sourceMap: Record<string, TurboEngineResult['source']> = {
    groq: 'turbo-groq',
    'openrouter-free': 'turbo-openrouter',
    cache: 'turbo-cache',
    error: 'fallback',
  };

  return {
    content: result.content,
    source: sourceMap[result.source] || 'fallback',
    ttftMs: result.ttftMs,
    totalMs: result.totalMs || (performance.now() - startMs),
  };
}

/**
 * Check if Turbo is available (has a valid API key).
 * Non-reactive — use this in non-React code (forge/execute libs).
 */
export function isTurboAvailable(): boolean {
  return !!resolveTurboKey();
}
