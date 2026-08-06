/**
 * WebLLM Engine — Run LLMs directly in the user's browser.
 * 
 * Uses @mlc-ai/web-llm to load and run models like:
 *   - Gemma-2B (Google)
 *   - Qwen2.5-1.5B (Alibaba)
 *   - Llama-3.2-1B / 3B (Meta)
 *   - Phi-3.5-mini (Microsoft)
 * 
 * Benefits:
 *   - $0 cost (runs on user's hardware)
 *   - Complete privacy (no data leaves the device)
 *   - Works offline after model is cached
 *   - Uses WebGPU for acceleration
 */

import type { ByokStreamOptions, ByokStreamResult } from '../byok/client';

// ---- Model Catalog ----

export interface WebLlmModel {
  id: string;              // web-llm model ID for loading
  name: string;            // Display name
  description: string;
  sizeGB: number;          // Approximate download size
  vramRequired: number;    // Minimum VRAM (GB)
  contextWindow: number;
  maxOutput: number;
  isCached: () => boolean; // Check if model is in browser cache
}

export const WEBLLM_MODELS: WebLlmModel[] = [
  {
    id: 'gemma-2b-it-q4f16_1-MLC',
    name: 'Gemma 2B',
    description: 'Google compact model — fast, good quality for size',
    sizeGB: 1.4,
    vramRequired: 2,
    contextWindow: 8192,
    maxOutput: 2048,
    isCached: () => false,
  },
  {
    id: 'qwen2.5-1.5b-instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 1.5B',
    description: 'Alibaba multilingual — great for non-English',
    sizeGB: 1.0,
    vramRequired: 1.5,
    contextWindow: 8192,
    maxOutput: 2048,
    isCached: () => false,
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 1B',
    description: 'Meta ultra-compact — fastest to load',
    sizeGB: 0.7,
    vramRequired: 1,
    contextWindow: 8192,
    maxOutput: 2048,
    isCached: () => false,
  },
  {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 3B',
    description: 'Meta compact — best quality in small size',
    sizeGB: 1.8,
    vramRequired: 2.5,
    contextWindow: 8192,
    maxOutput: 2048,
    isCached: () => false,
  },
  {
    id: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
    name: 'Phi 3.5 Mini',
    description: 'Microsoft reasoning-focused compact model',
    sizeGB: 2.0,
    vramRequired: 2.5,
    contextWindow: 4096,
    maxOutput: 2048,
    isCached: () => false,
  },
];

// ---- Engine State ----

let engineInstance: any = null;
let loadedModelId: string | null = null;
let isInitializing = false;
let initError: string | null = null;

// Lazy import — web-llm is large, only load when user activates it
let webLlmModule: any = null;

async function getWebLlm() {
  if (!webLlmModule) {
    webLlmModule = await import('@mlc-ai/web-llm');
  }
  return webLlmModule;
}

// ---- Public API ----

export type WebLlmProgress = {
  phase: 'loading' | 'initializing' | 'ready' | 'error';
  progress: number;  // 0-100
  text: string;       // Status description
  modelId: string;
};

/**
 * Check if WebGPU is available in the current browser.
 */
export function isWebGPUSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  return 'gpu' in navigator;
}

/**
 * Check if a specific model is currently loaded.
 */
export function isModelLoaded(modelId?: string): boolean {
  if (!modelId) return loadedModelId !== null;
  return loadedModelId === modelId;
}

/**
 * Get the currently loaded model ID.
 */
export function getLoadedModelId(): string | null {
  return loadedModelId;
}

/**
 * Load a WebLLM model into the browser.
 * Downloads model weights if not cached, then initializes WebGPU.
 */
export async function loadWebLlmModel(
  modelId: string,
  onProgress?: (progress: WebLlmProgress) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (loadedModelId === modelId) return;
  if (isInitializing) throw new Error('A model is already loading');

  if (!isWebGPUSupported()) {
    throw new Error(
      'WebGPU is not supported in this browser. ' +
      'Use Chrome 113+ or Edge 113+ for in-browser AI.'
    );
  }

  isInitializing = true;
  initError = null;

  try {
    const webllm = await getWebLlm();

    // Unload previous model if any
    if (engineInstance) {
      try { await engineInstance.unload(); } catch { /* ignore */ }
      engineInstance = null;
      loadedModelId = null;
    }

    engineInstance = new webllm.MLCEngine();

    const initProgressCallback = (report: any) => {
      const phase = report.text.includes('loading') ? 'loading' as const :
                    report.text.includes('initialize') ? 'initializing' as const :
                    'loading' as const;
      onProgress?.({
        phase,
        progress: Math.round(report.progress * 100),
        text: report.text,
        modelId,
      });
    };

    await engineInstance.reload(modelId, initProgressCallback, {
      // Signal is not directly supported by web-llm, but we can abort the promise
    });

    loadedModelId = modelId;
    onProgress?.({ phase: 'ready', progress: 100, text: 'Model ready', modelId });
  } catch (err) {
 initError = err instanceof Error ? err.message : String(err);
    onProgress?.({ phase: 'error', progress: 0, text: initError, modelId });
    throw err;
  } finally {
    isInitializing = false;
  }
}

/**
 * Generate text using the loaded WebLLM model.
 * 
 * This runs entirely in the browser — no network calls, no API keys.
 */
export async function webLlmChat(
  messages: { role: string; content: string }[],
  options?: {
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
    signal?: AbortSignal;
    onDelta?: (token: string, accumulated: string) => void;
  },
): Promise<ByokStreamResult> {
  if (!engineInstance || !loadedModelId) {
    throw new Error('No WebLLM model loaded. Call loadWebLlmModel() first.');
  }

  const startMs = performance.now();
  const maxTokens = options?.maxTokens || 2048;
  const temperature = options?.temperature ?? 0.7;

  const allMessages = [...messages];
  if (options?.systemPrompt && !messages.some(m => m.role === 'system')) {
    allMessages.unshift({ role: 'system', content: options.systemPrompt });
  }

  let content = '';
  let ttftRecorded = false;

  const chunks = await engineInstance.chat.completions.create({
    messages: allMessages,
    max_tokens: maxTokens,
    temperature,
    stream: true,
    stream_options: { include_usage: true },
  });

  for await (const chunk of chunks) {
 const token = chunk.choices?.[0]?.delta?.content ?? '';
    if (token) {
      if (!ttftRecorded) ttftRecorded = true;
      content += token;
      options?.onDelta?.(token, content);
    }
  }

  return {
    content,
    provider: 'webllm',
    model: loadedModelId,
    ttftMs: ttftRecorded ? performance.now() - startMs : undefined,
    totalMs: performance.now() - startMs,
  };
}

/**
 * Unload the current model and free VRAM.
 */
export async function unloadWebLlmModel(): Promise<void> {
  if (engineInstance) {
    try { await engineInstance.unload(); } catch { /* ignore */ }
    engineInstance = null;
  }
  loadedModelId = null;
}

/**
 * Get estimated VRAM usage for a model.
 */
export function getVramEstimate(modelId: string): number {
  const model = WEBLLM_MODELS.find(m => m.id === modelId);
  return model?.vramRequired ?? 2;
}
