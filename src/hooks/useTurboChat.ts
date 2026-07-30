/**
 * useTurboChat — React hook for ShadowTalk-Turbo.
 *
 * Bypasses the Supabase edge function entirely and streams directly
 * from Groq (or OpenRouter free fallback) to the browser.
 *
 * Key differences from useGlobalChat:
 *   - No Supabase edge function hop (saves ~800ms)
 *   - No DB queries for memory/context (saves ~350ms)
 *   - No model router overhead
 *   - Built-in response caching (instant for repeat queries)
 *   - Connection pre-warming (first token ~200ms after warm)
 *   - Falls back to useGlobalChat if no Groq key is available
 */

import { useRef, useCallback, useState, useEffect } from "react";
import {
  turboChat,
  prewarmGroqConnection,
  cancelPrewarm,
  resolveTurboKey,
  type TurboMessage,
  type TurboOptions,
  type TurboResult,
} from "@/lib/turbo";
import { useGlobalChat, type GlobalChatMessage } from "@/hooks/useGlobalChat";

export interface UseTurboChatReturn {
  /** Send messages through Turbo pipeline (or fallback to standard) */
  send: (messages: GlobalChatMessage[], opts?: TurboChatHookOptions) => Promise<TurboChatResult>;
  /** Abort in-flight request */
  abort: () => void;
  /** Is a request in-flight? */
  isLoading: boolean;
  /** Is turbo mode available? (has Groq key) */
  isTurboAvailable: boolean;
  /** Last result metadata (source, timing) */
  lastResult: TurboResult | null;
}

export interface TurboChatHookOptions {
  /** Extra system prompt prepended before messages */
  systemPrompt?: string;
  /** Personality preset */
  personality?: "turbo" | "friendly" | "professional" | "creative";
  /** Called with accumulated content on each SSE chunk */
  onDelta?: (accumulated: string) => void;
  /** Force standard mode (skip turbo even if available) */
  forceStandard?: boolean;
}

export interface TurboChatResult {
  content: string;
  source: "turbo-groq" | "turbo-cache" | "turbo-openrouter" | "standard-cloud" | "standard-offline" | "error";
  ttftMs?: number;
  totalMs?: number;
}

export function useTurboChat(): UseTurboChatReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isTurboAvailable, setIsTurboAvailable] = useState(false);
  const [lastResult, setLastResult] = useState<TurboResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const globalChat = useGlobalChat();

  // Check turbo availability on mount and when storage changes
  useEffect(() => {
    const check = () => {
      const key = resolveTurboKey();
      setIsTurboAvailable(!!key);
      if (key) prewarmGroqConnection(key);
    };

    check();

    // Re-check when localStorage changes (another tab might update keys)
 const handleStorage = (e: StorageEvent) => {
      if (e.key?.includes("shadowtalk") || e.key?.includes("ai")) check();
    };
    window.addEventListener("storage", handleStorage);

    // Periodic re-check (for same-tab updates)
    const interval = setInterval(check, 30_000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
      cancelPrewarm();
    };
  }, []);

  const send = useCallback(
    async (
      messages: GlobalChatMessage[],
      opts: TurboChatHookOptions = {},
    ): Promise<TurboChatResult> => {
      // Cancel in-flight
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);

      try {
        // If forced standard or no turbo key, use global chat fallback
        const turboKey = resolveTurboKey();
        if (opts.forceStandard || !turboKey) {
          const result = await globalChat.send(messages, {
            systemPrompt: opts.systemPrompt,
            personality: opts.personality,
            onDelta: opts.onDelta,
            signal: controller.signal,
          });

          const turboResult: TurboChatResult =
            result.source === "cloud"
              ? { content: result.content, source: "standard-cloud" }
              : result.source === "offline"
                ? { content: result.content, source: "standard-offline" }
                : { content: result.content, source: "error" };

          setIsLoading(false);
          return turboResult;
        }

        // ---- TURBO PATH ----
        const turboMessages: TurboMessage[] = messages.map(m => ({
          role: m.role,
          content: m.content,
        }));

        const turboResult = await turboChat(turboMessages, {
          systemPrompt: opts.systemPrompt,
          personality: opts.personality || "turbo",
          onDelta: opts.onDelta,
          signal: controller.signal,
          apiKey: turboKey,
        });

        setLastResult(turboResult);

        // Map turbo source to hook source
        const sourceMap: Record<TurboResult["source"], TurboChatResult["source"]> = {
          groq: "turbo-groq",
          "openrouter-free": "turbo-openrouter",
          cache: "turbo-cache",
          error: "error",
        };

        setIsLoading(false);
        return {
          content: turboResult.content,
          source: sourceMap[turboResult.source] || "error",
          ttftMs: turboResult.ttftMs,
          totalMs: turboResult.totalMs,
        };
      } catch (err) {
        if (controller.signal.aborted) {
          setIsLoading(false);
          return { content: "", source: "error" };
        }
        console.error("[TurboChat] Error:", err);
        setIsLoading(false);
        return { content: "Something went wrong. Please try again.", source: "error" };
      }
    },
    [globalChat],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
  }, []);

  return { send, abort, isLoading, isTurboAvailable, lastResult };
}
