import { useCallback, useEffect, useState } from "react";
export type RouterMessage = { role: "system" | "user" | "assistant"; content: string };

/**
 * Minimal on-device chat hook. Used by offline surfaces (document upload,
 * research) to check readiness and run local completions.
 */
export function useOfflineChat() {
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeModel, setActiveModel] = useState<string | null>(null);



  const generate = useCallback(
    async (messages: RouterMessage[]): Promise<string | null> => {
      return null;
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
