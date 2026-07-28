"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import type { RouterMessage } from "@/lib/offline/hybridRouter";
import { runLocalChat, isAnyLocalModelReady } from "@/lib/offline/localChat";
import { decideRoute } from "@/lib/offline/hybridRouter";

export type PromptAutocompleteOptions = {
  composerEnabled?: boolean;
  localOnly?: boolean;
  maxSuggestionChars?: number;
};

export type PromptAutocompleteResult = {
  suggestion: string;
  isLoading: boolean;
  accept: () => void;
  clear: () => void;
};

const SUGGESTION_SYSTEM = [
  "You write one short inline continuation.",
  "Only output the exact continuation, no quote or prefix.",
  "6 to 22 words, user language, natural tone, no restatement.",
].join(" ");

const DEBOUNCE_MS = 300;
const DEFAULT_MAX_CHARS = 140;

const MSG_CACHE = new Map<string, string>();

function makeLangKey(messages: RouterMessage[]) {
  return messages
    .map((m) => `${m.role}:${m.content}`)
    .join("|");
}

export function usePromptAutocomplete(
  text: string | undefined,
  onAccept: (value: string) => void,
  opts: PromptAutocompleteOptions = {},
): PromptAutocompleteResult {
  const { composerEnabled = true, localOnly = true, maxSuggestionChars = DEFAULT_MAX_CHARS } = opts;

  const textRef = useRef(text ?? "");
  useEffect(() => {
    textRef.current = text ?? "";
  }, [text]);

  const [suggestion, setSuggestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const cancelRef = useRef(false);
  const debounceRef = useRef<number | null>(null);
  const baseRef = useRef("");

  const clear = useCallback(() => {
    cancelRef.current = true;
    setSuggestion("");
    setIsLoading(false);
    if (typeof window !== "undefined") window.clearTimeout(debounceRef.current ?? 0);
  }, []);

  const accept = useCallback(() => {
    if (!suggestion || isLoading) return;
    const base = textRef.current;
    onAccept(base ? `${base}${suggestion}` : suggestion);
    setSuggestion("");
  }, [suggestion, isLoading, onAccept]);

  const runNext = useCallback(
    async (base: string) => {
      if (!composerEnabled || (localOnly && typeof isAnyLocalModelReady === "function" && !isAnyLocalModelReady())) {
        return;
      }
      const trimmed = base.trim();
      if (!trimmed || trimmed.length < 3) {
        setSuggestion("");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      cancelRef.current = false;
      baseRef.current = base;
      setSuggestion("");

      try {
        const route = decideRoute(
          [{ role: "user", content: trimmed }],
          typeof navigator !== "undefined" ? Boolean(navigator.onLine) : true,
        );
        if (route.target !== "local" || route.backend === "none") {
          setSuggestion("");
          setIsLoading(false);
          return;
        }

        const messages: RouterMessage[] = [
          { role: "system", content: SUGGESTION_SYSTEM },
          { role: "user", content: base },
        ];

        const langKey = makeLangKey(messages);
        const cached = MSG_CACHE.get(langKey);
        if (cached) {
          const candidate = cached
            .replace(/^["“”'‘’]+/, "")
            .replace(/^[\s:–—\-;]+/, "")
            .split("\n")[0]
            .trim();
          if (candidate.length > 0) {
            setSuggestion(candidate.slice(0, maxSuggestionChars));
            setIsLoading(false);
            return;
          }
        }

        let candidate = "";
        try {
          const content = await runLocalChat(messages).then((r) => r.content);
          candidate = content
            .replace(/^["“”'‘’]+/, "")
            .replace(/^[\s:–—\-;]+/, "")
            .split("\n")[0]
            .trim();

          if (candidate && candidate.length > 0) {
            MSG_CACHE.set(langKey, candidate);
          }
        } catch {
          // leave candidate empty
        }

        if (cancelRef.current || baseRef.current !== base || textRef.current !== base) {
          setSuggestion("");
          setIsLoading(false);
          return;
        }

        if (candidate && candidate.length > 0) {
          setSuggestion(candidate.slice(0, maxSuggestionChars));
        } else {
          setSuggestion("");
        }
      } catch {
        if (!cancelRef.current) setSuggestion("");
      } finally {
        if (!cancelRef.current) setIsLoading(false);
      }
    },
    [composerEnabled, localOnly, maxSuggestionChars],
  );

  useEffect(() => {
    if (!composerEnabled) return;
    if (typeof window !== "undefined") window.clearTimeout(debounceRef.current ?? 0);

    if (typeof text !== "string") {
      setSuggestion("");
      setIsLoading(false);
      return;
    }

    const previous = baseRef.current;
    if (text === previous) return;
    if (previous && text.startsWith(previous) && suggestion.length > 0) {
      setSuggestion("");
    }

    if (!text || text.trim().length < 3) {
      setSuggestion("");
      setIsLoading(false);
      baseRef.current = text;
      return;
    }

    const payload = text;
    debounceRef.current = window.setTimeout(() => {
      runNext(payload);
      baseRef.current = payload;
    }, DEBOUNCE_MS);

    return () => {
      if (typeof window !== "undefined") window.clearTimeout(debounceRef.current ?? 0);
    };
  }, [text, composerEnabled, suggestion.length, runNext]);

  useEffect(() => () => clear(), [clear]);

  return { suggestion, isLoading, accept, clear };
}
