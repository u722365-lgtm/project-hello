import type { TauriOllamaClient } from "@/lib/tauri/types";

export interface OllamaStatus {
  endpoint: string;
  ready: boolean;
  version?: string;
  models: string[];
  defaultModel: string;
  fallbackModel: string;
  activeModel: string;
  error?: string;
}

export interface PullProgress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

export interface OllamaChatCommandArgs {
  model: string;
  prompt: string;
  stream: string | boolean;
  context?: number[];
  options?: Record<string, unknown>;
}

export interface OllamaChatResult {
  model: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

type TauriInvoke = (cmd: string, args?: any) => Promise<any>;

function getInvoke(): TauriInvoke | null {
  const maybe =
    (typeof window !== "undefined" &&
      ((window as any).__TAURI_INVOKE_HANDLERS__ || (document as any)?.__TAURI_INVOKE_HANDLERS__)) ||
    null;

  if (!maybe) return null;

  const invoke = typeof maybe.invoke === "function" ? maybe.invoke : null;
  return invoke;
}

export function buildTauriOllamaClient(): TauriOllamaClient | null {
  const invoke = getInvoke();
  if (!invoke) return null;

  async function call(name: string, args?: any): Promise<any> {
    try {
      return await invoke(name, args ?? undefined);
    } catch (err) {
      console.warn(`[ollamaClient] tauri command ${name} failed`, err);
      return undefined;
    }
  }

  return {
    async health() {
      const result = await call("ollama_status");
      return result as any;
    },

    async pull(name: string) {
      const progress: PullProgress | undefined = await call("ollama_pull", { model: name });
      if (!progress) return { success: false, error: "ollama not reachable" };
      const ok = /completed pull for /.test(progress.status ?? "");
      return { success: ok, status: progress.status };
    },

    async streamCompletion(params) {
      const request: OllamaChatCommandArgs = {
        model: (params?.model || "").trim() || "qwen2.5:7b",
        prompt: params?.prompt ?? "",
        stream: true,
        context: params?.context,
        options: params?.options,
      };

      const result: OllamaChatResult | undefined = await call("ollama_chat", request);
      if (!result) throw new Error("ollama_chat returned empty result");

      return {
        async *[Symbol.asyncIterator]() {
          yield result.message.content || "";
        },
      };
    },
  };
}
