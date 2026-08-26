import { useState, useEffect } from 'react';
import { turboComplete } from "@/lib/turbo/turboEngine";

export type OmnisciencePrediction = {
  id: string;
  type: 'completion' | 'security' | 'optimization' | 'test';
  title: string;
  description: string;
  codeSnippet?: string;
  confidence: number;
};

export function useOmniscience(fileContent: string, isEnabled: boolean) {
  const [predictions, setPredictions] = useState<OmnisciencePrediction[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!isEnabled || !fileContent.trim() || fileContent.length < 20) {
      setPredictions([]);
      setIsAnalyzing(false);
      return;
    }

    setIsAnalyzing(true);

    const abortController = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const systemMsg = `You are an omniscient IDE assistant. Analyze the user's code and predict their next obstacle or need. 
Return a strict JSON array of objects (no markdown, just raw JSON). 
Each object must match this TypeScript interface:
{
  type: 'completion' | 'security' | 'optimization' | 'test';
  title: string;
  description: string;
  codeSnippet?: string;
  confidence: number; // 0.0 to 1.0
}
Provide 1 to 3 highly relevant predictions. If the code is trivial, return an empty array [].`;

        const userMsg = `Code context:\n\n${fileContent}`;

        const response = await turboComplete(systemMsg, userMsg, {
          signal: abortController.signal,
          taskComplexity: 'low'
        });
        
        if (abortController.signal.aborted) return;

        let rawResponse = response.content || "[]";
                          
        // Cleanup potential markdown wrapping
        if (rawResponse.startsWith("\`\`\`")) {
           rawResponse = rawResponse.replace(/\`\`\`(json)?\n/, "").replace(/\`\`\`$/, "");
        }

        try {
          const parsed = JSON.parse(rawResponse);
          if (Array.isArray(parsed)) {
            const validPredictions = parsed.map(p => ({
              id: crypto.randomUUID(),
              type: p.type || 'completion',
              title: p.title || 'Suggestion',
              description: p.description || '',
              codeSnippet: p.codeSnippet,
              confidence: p.confidence || 0.8
            }));
            setPredictions(validPredictions);
          }
        } catch (parseError) {
          console.error("[Omniscience] Failed to parse AI JSON response", parseError);
        }

      } catch (err) {
        console.error("[Omniscience] Backend error", err);
      } finally {
        if (!abortController.signal.aborted) {
          setIsAnalyzing(false);
        }
      }
    }, 2000); // 2-second debounce

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [fileContent, isEnabled]);

  return {
    predictions,
    isAnalyzing
  };
}
