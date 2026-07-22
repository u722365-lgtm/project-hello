import { detectRuntimePlatform } from "@/lib/tauri/runtimePlatform";
import type { ChatApi } from "./chat";
import type { TauriOllamaClient } from "@/lib/tauri/types";

export interface ChatApi {
  streamCompletion(params: {
    model: string;
    prompt: string;
    context?: number[];
    options?: Record<string, unknown>;
  }): Promise<AsyncIterable<string>>;
}

async function getBackends() {
  return (typeof window !== 'undefined' ? (window as any).shadowtalkBackends : undefined) || {};
}

export async function chat(): Promise<ChatApi> {
  const platform = detectRuntimePlatform();
  if (platform === 'tauri') {
    const client = (await getBackends()).ollamaClient as TauriOllamaClient | undefined;
    if (client) {
      return {
        streamCompletion: async (params) => client.streamCompletion(params),
      };
    }
  }

  // Web fallback: Supabase-backed remote chat.
  const { getChatFunctionUrl, getChatFetchHeaders } = await import('@/lib/supabaseEnv');
  const chatUrl = getChatFunctionUrl();

  return {
    streamCompletion: async (params) => {
      if (!chatUrl) {
        throw new Error('Chat service URL is not configured.');
      }

      const response = await fetch(`${chatUrl}/completions`, {
        method: 'POST',
        headers: {
          ...getChatFetchHeaders(),
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok || !response.body) {
        throw new Error(
          'Streaming chat request failed: ' + (response.statusText || response.status),
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      return {
        async *[Symbol.asyncIterator]() {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const text = decoder.decode(value, { stream: true });
            if (!text) continue;
            // Frontend consumer usually wants raw append text.
            yield text;
          }
        },
      } as unknown as Promise<AsyncIterable<string>>;
    },
  };
}
