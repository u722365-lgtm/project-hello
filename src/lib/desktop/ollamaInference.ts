/**
 * Renderer-side Ollama chat via Electron IPC (Odysseus sidecar pattern).
 */

import { getDesktopAPI } from "@/lib/desktopBridge";
import type { RouterMessage } from "@/lib/offline/hybridRouter";
import {
  getStoredOllamaModel,
  getStoredOllamaUrl,
  isOllamaInferenceReady,
} from "@/lib/desktop/sovereignMode";

export type OllamaStatus = {
  reachable: boolean;
  version?: string;
  models: string[];
  activeModel: string;
  baseUrl: string;
  error?: string;
};

export async function fetchOllamaStatus(): Promise<OllamaStatus | null> {
  const api = getDesktopAPI();
  if (!api?.ollamaStatus) return null;
  return api.ollamaStatus({
    baseUrl: getStoredOllamaUrl(),
    model: getStoredOllamaModel(),
  });
}

export async function configureOllama(partial: { baseUrl?: string; model?: string }): Promise<OllamaStatus | null> {
  const api = getDesktopAPI();
  if (!api?.ollamaConfigure) return null;
  return api.ollamaConfigure({
    baseUrl: partial.baseUrl ?? getStoredOllamaUrl(),
    model: partial.model ?? getStoredOllamaModel(),
  });
}

export async function pullOllamaModel(
  model: string,
  onProgress?: (status: string, percent?: number) => void,
): Promise<{ ok: boolean; error?: string }> {
  const api = getDesktopAPI();
  if (!api?.ollamaPull) {
    return { ok: false, error: "Desktop Ollama API unavailable" };
  }
  return api.ollamaPull(model, onProgress);
}

type OllamaChatInput = {
  messages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  prompt?: string;
  model?: string;
};

export async function runOllamaChat(
  rawInput: OllamaChatInput | Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  onToken?: (token: string) => void,
  signal?: AbortSignal,
): Promise<{ content: string; ok: boolean; error?: string }> {
  const input: OllamaChatInput = Array.isArray(rawInput) ? { messages: rawInput } : rawInput;

  if (!isOllamaInferenceReady()) {
    return { content: '', ok: false, error: 'Ollama is not ready' };
  }

  const api = getDesktopAPI();
  if (!api?.ollamaChat) {
    return { content: '', ok: false, error: 'Desktop Ollama API unavailable' };
  }

  const messages = [...(input.messages ?? [])];
  if (messages.length === 0 && input.prompt) {
    messages.push({ role: 'user', content: input.prompt });
  }
  if (messages.length === 0) {
    return { content: '', ok: false, error: 'No prompt or messages provided' };
  }

  const result = await api.ollamaChat(
    {
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      baseUrl: getStoredOllamaUrl(),
      model: input.model ?? getStoredOllamaModel(),
    },
    onToken ?? (() => {}),
    signal,
  );
  return result;
}
