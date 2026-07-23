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
  chatCompletion(params: {
    model: string;
    prompt: string;
    context?: number[];
    options?: Record<string, unknown>;
  }): Promise<{ text: string }>;
}

async function getBackends() {
  if (typeof window !== 'undefined' && (window as any).shadowtalkBackends) {
    return (window as any).shadowtalkBackends;
  }
  if (platform === 'tauri') {
    try {
      const { buildTauriOllamaClient } = await import('@/lib/tauri/ollamaClient');
      const client = buildTauriOllamaClient();
      if (client) {
        (window as any).shadowtalkBackends = { ollamaClient: client };
      }
    } catch {
      // ignore bootstrap wiring errors
    }
  }
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
    chatCompletion: async (params) => {
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
      if (!response.ok) {
        throw new Error('Chat completion failed: ' + (response.statusText || response.status));
      }

      const body = await response.text();
      let last = '';
      for (const line of body.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed.includes('"message"')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed && parsed.message && typeof parsed.message.content === 'string') {
              last = parsed.message.content;
            }
          } catch {}
        }
      }
      return { text: last || '' };
    },
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
