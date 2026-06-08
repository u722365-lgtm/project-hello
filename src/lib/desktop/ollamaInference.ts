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

export async function runOllamaChat(
  messages: RouterMessage[],
  onToken?: (token: string) => void,
  signal?: AbortSignal,
): Promise<{ content: string; ok: boolean; error?: string }> {
  if (!isOllamaInferenceReady()) {
    return { content: "", ok: false, error: "Ollama is not ready" };
  }

  const api = getDesktopAPI();
  if (!api?.ollamaChat) {
    return { content: "", ok: false, error: "Desktop Ollama API unavailable" };
  }

  return api.ollamaChat(
    {
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      baseUrl: getStoredOllamaUrl(),
      model: getStoredOllamaModel(),
    },
    onToken ?? (() => {}),
    signal,
  );
}
