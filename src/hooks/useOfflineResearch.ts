import { useCallback, useState } from "react";
import { useOfflineRAG } from "@/hooks/useOfflineRAG";
import { useOfflineChat } from "@/hooks/useOfflineChat";
import { turboComplete } from "@/lib/turbo/turboEngine";

export type ResearchDepth = "quick" | "standard" | "deep";
export type ResearchStage =
  | "idle"
  | "decomposing"
  | "retrieving"
  | "analyzing"
  | "synthesizing"
  | "done";

export interface ResearchSource {
  id: string;
  title: string;
  type: string;
  relevance: number;
}

export interface ResearchResults {
  query: string;
  summary: string;
  insights: string[];
  sources: ResearchSource[];
  citations: string[];
  queryDecomposition?: string[];
  followUpQuestions?: string[];
}

const DEPTH_CONFIG: Record<ResearchDepth, { subQueries: number; chunks: number }> = {
  quick: { subQueries: 1, chunks: 3 },
  standard: { subQueries: 3, chunks: 6 },
  deep: { subQueries: 5, chunks: 10 },
};

async function askModel(
  prompt: string,
  system: string,
  local: ReturnType<typeof useOfflineChat>,
): Promise<string> {
  if (local.isReady) {
    const out = await local.ask(prompt, system);
    if (out) return out;
  }
  try {
    const result = await turboComplete(system, prompt);
    return result.content || "";
  } catch {
    return "";
  }
}

export function useOfflineResearch() {
  const rag = useOfflineRAG();
  const local = useOfflineChat();

  const [isResearching, setIsResearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<ResearchStage>("idle");
  const [results, setResults] = useState<ResearchResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearResults = useCallback(() => {
    setResults(null);
    setStage("idle");
    setProgress(0);
    setError(null);
  }, []);

  const conductResearch = useCallback(
    async (query: string, opts?: { depth?: ResearchDepth }) => {
      const depth = opts?.depth ?? "standard";
      const cfg = DEPTH_CONFIG[depth];

      setIsResearching(true);
      setError(null);
      setResults(null);
      setStage("decomposing");
      setProgress(10);

      try {
        let subQueries: string[] = [query];
        if (cfg.subQueries > 1) {
          const raw = await askModel(
            `Break this research question into ${cfg.subQueries} focused sub-questions. Return one per line, no numbering.\n\n${query}`,
            "You decompose research questions. Reply with plain lines only.",
            local,
          );
          const parsed = raw
            .split("\n")
            .map((l) => l.replace(/^[-*\d.\s]+/, "").trim())
            .filter(Boolean)
            .slice(0, cfg.subQueries);
          if (parsed.length) subQueries = parsed;
        }

        setStage("retrieving");
        setProgress(35);

        const sources: ResearchSource[] = [];
        const contextChunks: string[] = [];
        for (const q of subQueries) {
          const hits = await rag.search(q, cfg.chunks);
          for (const h of hits) {
            contextChunks.push(h.text);
            sources.push({
              id: h.id,
              title: (h.metadata?.title as string) ?? h.text.slice(0, 60),
              type: (h.metadata?.type as string) ?? "document",
              relevance: h.similarity,
            });
          }
        }

        setStage("analyzing");
        setProgress(60);

        const context = contextChunks.slice(0, cfg.chunks * 2).join("\n---\n");
        const answer = await askModel(
          `Research question: ${query}\n\nSub-questions:\n${subQueries.join("\n")}\n\n${
            context ? `Knowledge base excerpts:\n${context}` : "No local documents indexed."
          }\n\nWrite a concise summary, then a line "INSIGHTS:" followed by 3-5 bullet insights, then a line "FOLLOW-UP:" with 3 follow-up questions.`,
          "You are a rigorous research analyst. Be factual and concise.",
          local,
        );

        setStage("synthesizing");
        setProgress(85);

        const [summaryPart, rest = ""] = answer.split(/INSIGHTS:/i);
        const [insightsPart, followPart = ""] = rest.split(/FOLLOW-?UP:/i);
        const toList = (s: string) =>
          s
            .split("\n")
            .map((l) => l.replace(/^[-*\d.\s]+/, "").trim())
            .filter(Boolean);

        setResults({
          query,
          summary: (summaryPart || answer || "No answer could be generated.").trim(),
          insights: toList(insightsPart),
          sources,
          citations: sources.slice(0, 8).map((s, i) => `[${i + 1}] ${s.title}`),
          queryDecomposition: subQueries,
          followUpQuestions: toList(followPart).slice(0, 3),
        });

        setStage("done");
        setProgress(100);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Research failed");
        setStage("idle");
      } finally {
        setIsResearching(false);
      }
    },
    [local, rag],
  );

  const quickAnswer = useCallback(
    (query: string) => conductResearch(query, { depth: "quick" }),
    [conductResearch],
  );

  return {
    isResearching,
    progress,
    stage,
    results,
    error,
    conductResearch,
    quickAnswer,
    clearResults,
    hasKnowledgeBase: rag.documentCount > 0,
    documentCount: rag.documentCount,
  };
}

export default useOfflineResearch;
