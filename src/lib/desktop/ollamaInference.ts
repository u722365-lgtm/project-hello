/**
 * Renderer-side Ollama — desktop IPC for status/pull; chat via unified client (web + desktop).
 */

import { getDesktopAPI } from "@/lib/desktopBridge";
import type { RouterMessage } from "@/lib/offline/hybridRouter";
import { chat as unifiedChat, getStatus } from "@/lib/ollama/unifiedClient";
import {
  getStoredOllamaModel,
  getStoredOllamaUrl,
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

type OllamaChatInput =
  | RouterMessage[]
  | {
      messages?: RouterMessage[];
      prompt?: string;
      model?: string;
    };

export async function runOllamaChat(
  rawInput: OllamaChatInput,
  onToken?: (token: string) => void,
  signal?: AbortSignal,
): Promise<{ content: string; ok: boolean; error?: string }> {
  const input = Array.isArray(rawInput) ? { messages: rawInput } : rawInput;

  const messages = [...(input.messages ?? [])];
  if (messages.length === 0 && input.prompt) {
    messages.push({ role: "user", content: input.prompt });
  }
  if (messages.length === 0) {
    return { content: "", ok: false, error: "No prompt or messages provided" };
  }

  const status = await getStatus();
  if (!status.reachable || status.models.length === 0) {
    return {
      content: "",
      ok: false,
      error: status.error ?? "Ollama is not ready — install a model at /local-models",
    };
  }

  return unifiedChat(messages, { onToken, signal });
}
