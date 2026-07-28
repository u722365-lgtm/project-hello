import { useEffect } from "react";
import { getStatus } from "@/lib/ollama/unifiedClient";

/** Keeps Ollama health cache warm on web and desktop so routing picks local inference. */
export function useOllamaProvider() {
  useEffect(() => {
    let cancelled = false;

    const probe = async () => {
      if (cancelled) return;
      try {
        await getStatus();
      } catch {
        /* optional local daemon */
      }
    };

    void probe();
    const id = window.setInterval(() => void probe(), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);
}

/** Invisible engine mounted in App.tsx */
export function OllamaProviderEngine() {
  useOllamaProvider();
  return null;
}
