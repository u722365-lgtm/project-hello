/**
 * Local (on-device) agent completion.
 *
 * Runs fully offline: prefers a loaded WebLLM model, falls back to a local
 * Ollama daemon when one is reachable. Never sends data to a cloud provider.
 */
import { isModelLoaded, loadWebLlmModel, webLlmChat, isWebGPUSupported } from '@/lib/webllm/engine';

export interface LocalAgentCompletionOptions {
  systemPrompt?: string;
  signal?: AbortSignal;
  onToken?: (token: string) => void;
  temperature?: number;
  maxTokens?: number;
}

const OLLAMA_BASE =
  (import.meta as any).env?.VITE_OLLAMA_BASE_URL || 'http://127.0.0.1:11434';

function ollamaModel(): string {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('shadowtalk-ollama-model');
    if (stored) return stored;
  }
  return (import.meta as any).env?.VITE_OLLAMA_MODEL || 'llama3.2';
}

async function streamOllama(
  prompt: string,
  options: LocalAgentCompletionOptions,
): Promise<string> {
  const messages = [
    ...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
    { role: 'user', content: prompt },
  ];

  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: ollamaModel(),
      messages,
      stream: true,
      options: { temperature: options.temperature ?? 0.7 },
    }),
    signal: options.signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`Local model unavailable (Ollama responded ${res.status}).`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const json = JSON.parse(line);
        const token: string = json?.message?.content ?? '';
        if (token) {
          content += token;
          options.onToken?.(token);
        }
      } catch {
        /* ignore malformed keep-alive lines */
      }
    }
  }

  return content;
}

/**
 * Stream a completion from an on-device model.
 * Resolves with the full text; tokens are delivered through `onToken`.
 */
export async function streamLocalAgentCompletion(
  prompt: string,
  options: LocalAgentCompletionOptions = {},
): Promise<string> {
  // 1) WebLLM (browser, WebGPU) — only when a model is already loaded on device
  if (isWebGPUSupported() && isModelLoaded()) {
    try {
      const result = await webLlmChat([{ role: 'user', content: prompt }], {
        systemPrompt: options.systemPrompt,
        signal: options.signal,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        onDelta: (token) => options.onToken?.(token),
      });
      if (result?.content) return result.content;
    } catch (err) {
      console.warn('[localAgentCompletion] WebLLM failed, trying Ollama:', err);
    }
  }

  // 2) Local Ollama daemon
  return streamOllama(prompt, options);
}
