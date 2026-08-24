import { useCallback, useEffect, useState } from "react";
import {
  isAnyLocalModelReady,
  runOfflineCompletion,
  getActiveLocalModelId,
  type RouterMessage,
} from "@/lib/offline/localRuntime";

/**
 * Minimal on-device chat hook. Used by offline surfaces (document upload,
 * research) to check readiness and run local completions.
 */
export function useOfflineChat() {
  const [isReady, setIsReady] = useState(() => isAnyLocalModelReady());
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeModel, setActiveModel] = useState<string | null>(() => getActiveLocalModelId());

  useEffect(() => {
    const tick = () => {
      setIsReady(isAnyLocalModelReady());
      setActiveModel(getActiveLocalModelId());
    };
    const id = window.setInterval(tick, 4000);
    return () => window.clearInterval(id);
  }, []);

  const generate = useCallback(
    async (messages: RouterMessage[]): Promise<string | null> => {
      setIsGenerating(true);
      try {
        const res = await runOfflineCompletion({ messages });
        return res?.content ?? null;
      } finally {
        setIsGenerating(false);
      }
    },
    [],
  );

  const ask = useCallback(
    (prompt: string, systemPrompt?: string) =>
      generate([
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        { role: "user" as const, content: prompt },
      ]),
    [generate],
  );

  return { isReady, isGenerating, activeModel, generate, ask };
}

export default useOfflineChat;
