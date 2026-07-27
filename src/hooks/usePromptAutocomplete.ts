import { useEffect, useMemo, useRef, useState } from "react";
import { suggestCompletion } from "@/lib/chat/promptAutocomplete";

/**
 * Debounced inline prompt suggestion. Works for anonymous and signed-in users.
 */
export function usePromptAutocomplete(message: string, enabled = true) {
  const [completion, setCompletion] = useState<string | null>(null);
  const dismissedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setCompletion(null);
      return;
    }
    if (dismissedFor.current && message.startsWith(dismissedFor.current)) {
      setCompletion(null);
      return;
    }
    const id = window.setTimeout(() => {
      setCompletion(suggestCompletion(message));
    }, 120);
    return () => window.clearTimeout(id);
  }, [message, enabled]);

  const suggestion = useMemo(
    () => (completion ? `${message}${completion}` : null),
    [completion, message],
  );

  return {
    /** Text to append to what the user typed */
    completion,
    /** Full suggested prompt (typed text + completion) */
    suggestion,
    dismiss: () => {
      dismissedFor.current = message;
      setCompletion(null);
    },
    clear: () => setCompletion(null),
  };
}
