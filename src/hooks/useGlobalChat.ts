/**
 * useGlobalChat — standard (cloud/offline) chat path used as the fallback
 * for ShadowTalk-Turbo when no BYOK Groq key is available.
 */

import { useCallback, useRef, useState } from "react";
import { backend } from "@/integrations/local/client";
import { streamChatCompletion } from "@/lib/see/chatCompletion";

export interface GlobalChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GlobalChatOptions {
  systemPrompt?: string;
  personality?: string;
  onDelta?: (accumulated: string) => void;
  signal?: AbortSignal;
  model?: string;
}

export interface GlobalChatResponse {
  content: string;
  source: "cloud" | "offline" | "error";
  error?: string;
}

export function useGlobalChat() {
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (messages: GlobalChatMessage[], opts: GlobalChatOptions = {}): Promise<GlobalChatResponse> => {
      setIsLoading(true);
      try {
        const { data } = await backend.auth.getSession();
        const token = data.session?.access_token || import.meta.env.VITE_API_KEY;

        const lastUser = [...messages].reverse().find((m) => m.role === "user");
        const prompt = [opts.systemPrompt, lastUser?.content].filter(Boolean).join("\n\n");

        const content = await streamChatCompletion(token as string, prompt, {
          model: opts.model,
          signal: opts.signal,
        });

        opts.onDelta?.(content);
        return { content, source: "cloud" };
      } catch (err) {
        return {
          content: "",
          source: "error",
          error: err instanceof Error ? err.message : "Chat request failed",
        };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  return { send, abort, isLoading };
}
