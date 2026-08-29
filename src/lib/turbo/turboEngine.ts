/**
 * ShadowTalk-Turbo Engine — Forge & Execute fast-path.
 *
 * Self-contained: does NOT depend on turboPipeline.ts.
 * Provides a simple Promise<string> API for forge/execute:
 *
 *   turboComplete(systemPrompt, userContent, opts) → TurboEngineResult
 *
 * Used by:
 *   - generateExecutionPlan.ts  → plan generation
 *   - synthesizeDeliverable.ts   → non-strategy synthesis
 *   - unifiedDocumentPipeline.ts → drafting phase
 *
 * Falls back to the standard edge-function path if no Turbo key is available.
 */

import { resolveTurboKey, TURBO_MODEL_GROQ, TURBO_MODEL_CHAT, GROQ_API_URL, OPENROUTER_API_URL, TURBO_MODEL_OPENROUTER } from './turboProviders';
import { isSovereignAgentsEnabled } from '@/lib/desktop/sovereignAgentMode';
import { localComplete, isWebGPUSupported, WEBGPU_MODEL } from '@/lib/webgpu/localEngine';
import { isAnyLocalModelReady } from '@/lib/offline/localRuntime';
import { trackAiMetrics, estimateTokens } from '@/lib/telemetry/agenticMetrics';
import { streamCloudChat } from '@/lib/cloudChat';

// ---- Public Types ----

export interface TurboEngineOptions {
  /** Model override. Default: llama-3.3-70b-versatile */
  model?: string;
  /** Max tokens. Default: 4096 */
  maxTokens?: number;
  /** Temperature. Default: 0.5 */
  temperature?: number;
  /** AbortSignal */
  signal?: AbortSignal;
  /** Stream callback (optional — for live UI updates) */
  onDelta?: (accumulated: string) => void;
  /** Task complexity for intelligent model routing. Default: 'high' */
  taskComplexity?: 'low' | 'medium' | 'high';
}

export interface TurboEngineResult {
  content: string;
  source: 'turbo-groq' | 'turbo-openrouter' | 'webgpu-local' | 'cloud' | 'fallback';
  modelUsed?: string;
  ttftMs?: number;
  totalMs?: number;
}

// ---- SSE Parser ----

function parseSseLine(line: string): string | null {
  if (!line.startsWith('data: ') || line === 'data: [DONE]') return null;
  try {
    const data = JSON.parse(line.slice(6));
    return data.choices?.[0]?.delta?.content ?? null;
  } catch {
    return null;
  }
}

// ---- Connection Pre-warming ----

let lastPrewarmAt = 0;
const PREWARM_INTERVAL_MS = 45_000;

function prewarmGroqConnection(apiKey: string): void {
  const now = Date.now();
  if (now - lastPrewarmAt < PREWARM_INTERVAL_MS) return;
  lastPrewarmAt = now;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: TURBO_MODEL_GROQ, messages: [{ role: 'user', content: '.' }], max_tokens: 1, stream: false }),
    signal: controller.signal,
  }).catch(() => {}).finally(() => clearTimeout(timeout));
}

// ---- Stream from Groq ----

async function streamGroq(
  apiKey: string,
  systemPrompt: string,
  userContent: string,
  opts: TurboEngineOptions,
): Promise<TurboEngineResult> {
  const startMs = performance.now();
  const controller = new AbortController();
  if (opts.signal) opts.signal.addEventListener('abort', () => controller.abort(), { once: true });

  const modelToUse = opts.model || (opts.taskComplexity === 'low' ? TURBO_MODEL_CHAT : TURBO_MODEL_GROQ);

  const resp = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelToUse,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      max_tokens: opts.maxTokens || 4096,
      temperature: opts.temperature ?? 0.5,
      stream: true,
    }),
    signal: controller.signal,
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`Groq ${resp.status}: ${errText.slice(0, 200)}`);
  }

  const reader = resp.body?.getReader();
  if (!reader) throw new Error('No response body from Groq');

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
        if (!ttftRecorded) ttftRecorded = true;
        content += token;
        opts.onDelta?.(content);
      }
    }
  }

  return {
    content,
    source: 'turbo-groq',
    modelUsed: modelToUse,
    ttftMs: ttftRecorded ? performance.now() - startMs : undefined,
    totalMs: performance.now() - startMs,
  };
}

// ---- Stream from OpenRouter (fallback) ----

async function streamOpenRouter(
  apiKey: string,
  systemPrompt: string,
  userContent: string,
  opts: TurboEngineOptions,
): Promise<TurboEngineResult> {
  const startMs = performance.now();

  const resp = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://shadowtalk.app',
      'X-Title': 'ShadowTalk Turbo',
    },
    body: JSON.stringify({
      model: TURBO_MODEL_OPENROUTER,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      max_tokens: opts.maxTokens || 4096,
      stream: true,
    }),
    signal: opts.signal,
  });

  if (!resp.ok) throw new Error(`OpenRouter ${resp.status}`);

  const reader = resp.body?.getReader();
  if (!reader) throw new Error('No response body from OpenRouter');

  const decoder = new TextDecoder();
  let content = '';
  let lineBuffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    lineBuffer += decoder.decode(value, { stream: true });
    const lines = lineBuffer.split('\n');
    lineBuffer = lines.pop() ?? '';
    for (const line of lines) {
      const token = parseSseLine(line);
      if (token) {
        content += token;
        opts.onDelta?.(content);
      }
    }
  }

  return { content, source: 'turbo-openrouter', modelUsed: TURBO_MODEL_OPENROUTER, totalMs: performance.now() - startMs };
}

// ---- Main Entry Point ----

/**
 * Send a system+user prompt through Turbo and get back the full text.
 * Flow: resolve key → prewarm → Groq → OpenRouter fallback → { fallback } if no key.
 */
export async function turboComplete(
  systemPrompt: string,
  userContent: string,
  opts: TurboEngineOptions = {},
): Promise<TurboEngineResult> {
  const startMs = performance.now();
  const apiKey = resolveTurboKey();

  // WebGPU Local Fallback Strategy
  // If Sovereign Agents is enabled, and we don't have a specific API key (or we do and want to force local),
  // we try local WebGPU first if supported.
  // Only use the local model when it is ALREADY loaded — otherwise the first
  // message would block on a multi-minute model download.
  if (isSovereignAgentsEnabled() && isWebGPUSupported() && isAnyLocalModelReady()) {
    try {
      const content = await localComplete(systemPrompt, userContent, opts.onDelta);
      const totalMs = performance.now() - startMs;
      trackAiMetrics('llm_completion', {
        source: 'webgpu-local',
        model: WEBGPU_MODEL,
        totalMs,
        inputTokens: estimateTokens(systemPrompt + userContent),
        outputTokens: estimateTokens(content),
      });
      return { content, source: 'webgpu-local', modelUsed: WEBGPU_MODEL, totalMs };
    } catch (localErr) {
      console.warn('[TurboEngine] WebGPU local execution failed:', localErr);
    }
  }

  if (!apiKey) {
    return cloudFallback(systemPrompt, userContent, opts, startMs);
  }

  prewarmGroqConnection(apiKey);

  // Try Groq
  try {
    const result = await streamGroq(apiKey, systemPrompt, userContent, opts);
    trackAiMetrics('llm_completion', {
      source: 'turbo-groq',
      model: result.modelUsed,
      ttftMs: result.ttftMs,
      totalMs: result.totalMs,
      inputTokens: estimateTokens(systemPrompt + userContent),
      outputTokens: estimateTokens(result.content),
    });
    return result;
  } catch (groqErr) {
    console.warn('[TurboEngine] Groq failed:', groqErr);
  }

  // Try OpenRouter fallback
  if (apiKey.startsWith('sk-or-')) {
    try {
      const result = await streamOpenRouter(apiKey, systemPrompt, userContent, opts);
      trackAiMetrics('llm_completion', {
        source: 'turbo-openrouter',
        model: result.modelUsed,
        ttftMs: result.ttftMs,
        totalMs: result.totalMs,
        inputTokens: estimateTokens(systemPrompt + userContent),
        outputTokens: estimateTokens(result.content),
      });
      return result;
    } catch (orErr) {
      console.warn('[TurboEngine] OpenRouter fallback failed:', orErr);
    }
  }

  return cloudFallback(systemPrompt, userContent, opts, startMs);
}

/** Lovable Cloud AI streaming fallback (used when no BYOK Turbo key works). */
async function cloudFallback(
  systemPrompt: string,
  userContent: string,
  opts: TurboEngineOptions,
  startMs: number,
): Promise<TurboEngineResult> {
  try {
    const { content, error } = await streamCloudChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      { signal: opts.signal, onDelta: opts.onDelta, temperature: opts.temperature },
    );
    if (error) console.warn('[TurboEngine] Cloud AI failed:', error);
    return { content, source: 'cloud', totalMs: performance.now() - startMs };
  } catch (err) {
    console.warn('[TurboEngine] Cloud AI failed:', err);
    return { content: '', source: 'fallback', totalMs: performance.now() - startMs };
  }
}

/**
 * Check if Turbo is available (has a valid API key).
 * Non-reactive — safe to call from any context.
 */
export function isTurboAvailable(): boolean {
  return !!resolveTurboKey();
}
