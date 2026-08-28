/**
 * WebLLM engine — in-browser (WebGPU) inference.
 *
 * Lazily imports @mlc-ai/web-llm so the heavy runtime is only downloaded when a
 * user actually opts into on-device inference.
 */

export interface WebLlmModel {
  id: string;
  name: string;
  description: string;
  sizeMB: number;
  vramMB?: number;
}

export interface WebLlmProgress {
  progress: number;
  percent: number;
  text: string;
  message: string;
  phase?: 'downloading' | 'initializing' | 'ready' | 'error';
}

export interface WebLlmChatResult {
  content: string;
  model: string;
  ttftMs?: number;
  totalMs: number;
}

export const WEBLLM_MODELS: WebLlmModel[] = [
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 1B',
    description: 'Smallest useful model. Fast, runs on most laptops.',
    sizeMB: 700,
    vramMB: 1128,
  },
  {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 3B',
    description: 'Better reasoning, needs a stronger GPU.',
    sizeMB: 1800,
    vramMB: 2952,
  },
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 1.5B',
    description: 'Strong multilingual small model.',
    sizeMB: 950,
    vramMB: 1629,
  },
  {
    id: 'gemma-2-2b-it-q4f16_1-MLC',
    name: 'Gemma 2 2B',
    description: 'Google Gemma, good instruction following.',
    sizeMB: 1400,
    vramMB: 1895,
  },
  {
    id: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC',
    name: 'SmolLM2 1.7B',
    description: 'Tiny and quick, good for autocomplete.',
    sizeMB: 1000,
    vramMB: 1774,
  },
];

type AnyEngine = {
  chat: {
    completions: {
      create: (args: Record<string, unknown>) => Promise<any>;
    };
  };
  unload?: () => Promise<void>;
};

let engine: AnyEngine | null = null;
let loadedModelId: string | null = null;
let loadingPromise: Promise<void> | null = null;

/** Whether the browser exposes WebGPU. */
export function isWebGPUSupported(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

/** Currently loaded model id (or null). */
export function getLoadedModelId(): string | null {
  return loadedModelId;
}

/** Whether a model (or any model, if omitted) is loaded in memory. */
export function isModelLoaded(modelId?: string): boolean {
  if (!loadedModelId) return false;
  return modelId ? loadedModelId === modelId : true;
}

/** Load a WebLLM model into memory, reporting download progress. */
export async function loadWebLlmModel(
  modelId: string,
  onProgress?: (p: WebLlmProgress) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!isWebGPUSupported()) {
    throw new Error('WebGPU is not supported in this browser.');
  }
  if (loadedModelId === modelId && engine) return;
  if (loadingPromise) await loadingPromise.catch(() => undefined);

  loadingPromise = (async () => {
    const webllm = await import('@mlc-ai/web-llm');
    if (signal?.aborted) throw new Error('Aborted');

    const created = await webllm.CreateMLCEngine(modelId, {
      initProgressCallback: (report: { progress: number; text: string }) => {
        const percent = Math.round((report.progress ?? 0) * 100);
        onProgress?.({
          progress: report.progress ?? 0,
          percent,
          text: report.text ?? '',
          message: report.text ?? '',
        });
      },
    });

    engine = created as unknown as AnyEngine;
    loadedModelId = modelId;
  })();

  try {
    await loadingPromise;
  } finally {
    loadingPromise = null;
  }
}

/** Release the loaded model. */
export async function unloadWebLlmModel(): Promise<void> {
  try {
    await engine?.unload?.();
  } catch {
    // ignore
  }
  engine = null;
  loadedModelId = null;
}

/** Run a streaming chat completion on the loaded model. */
export async function webLlmChat(
  messages: { role: string; content: string }[],
  opts: {
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
    signal?: AbortSignal;
    onDelta?: (token: string, accumulated: string) => void;
  } = {},
): Promise<WebLlmChatResult> {
  if (!engine || !loadedModelId) {
    throw new Error('No on-device model loaded. Install one in Settings first.');
  }

  const startMs = Date.now();
  let ttftMs: number | undefined;

  const finalMessages = opts.systemPrompt
    && !messages.some((m) => m.role === 'system')
    ? [{ role: 'system', content: opts.systemPrompt }, ...messages]
    : messages;

  const stream = await engine.chat.completions.create({
    messages: finalMessages,
    stream: true,
    max_tokens: opts.maxTokens ?? 1024,
    temperature: opts.temperature ?? 0.7,
  });

  let content = '';
  for await (const chunk of stream as AsyncIterable<any>) {
    if (opts.signal?.aborted) break;
    const delta: string | undefined = chunk?.choices?.[0]?.delta?.content;
    if (delta) {
      if (ttftMs === undefined) ttftMs = Date.now() - startMs;
      content += delta;
      opts.onDelta?.(delta, content);
    }
  }

  return {
    content,
    model: loadedModelId,
    ttftMs,
    totalMs: Date.now() - startMs,
  };
}
