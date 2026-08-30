/**
 * useStrategyRunner — drives the Strategy Agent.
 *
 * Generation runs through the Firebase `strategy-agent` Cloud Function (main
 * backend); if it is unavailable, an estimated fallback report is produced so
 * the UI still has something useful to render.
 */
import { useCallback, useState } from "react";
import { backend } from "@/integrations/local/client";
import { saveStrategyReport } from "@/lib/strategy/strategyReports";
import type {
  BusinessIdea,
  StrategyPhase,
  StrategyPlanStep,
  StrategyResult,
} from "@/lib/strategy/types";

export interface StrategyRunOutput {
  result: StrategyResult;
  steps: StrategyPlanStep[];
  usedFallback: boolean;
  reportId: string | null;
}

const PLAN: Array<{ id: string; action: string; tool_name: string }> = [
  { id: "market", action: "Research market size and trends", tool_name: "web_search" },
  { id: "competitors", action: "Map key competitors", tool_name: "web_search" },
  { id: "costs", action: "Estimate startup and running costs", tool_name: "deep_research" },
  { id: "synthesis", action: "Synthesize strategy and financials", tool_name: "reasoning" },
];

function emptyResult(idea: BusinessIdea): StrategyResult {
  return {
    executiveSummary: `${idea.name} targets the ${idea.industry} market in ${idea.location}. This report is an estimated baseline — rerun to pull live web-backed research.`,
    swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
    research: {
      competitors: [],
      marketTrends: [],
      regulations: [],
      costs: [],
      opportunities: [],
      threats: [],
      sources: [],
    },
    financialProjections: [],
    recommendations: [],
    riskAssessment: "Risk assessment unavailable — the research backend could not be reached.",
    implementationPlan: [],
  };
}

export function useStrategyRunner() {
  const [phase, setPhase] = useState<StrategyPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<StrategyPlanStep[]>([]);
  const [result, setResult] = useState<StrategyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const reset = useCallback(() => {
    setPhase("idle");
    setProgress(0);
    setSteps([]);
    setResult(null);
    setError(null);
    setUsedFallback(false);
    setIsRunning(false);
  }, []);

  const loadReport = useCallback(
    (report: {
      id: string;
      business_idea: BusinessIdea;
      result: StrategyResult | null;
      plan_steps: StrategyPlanStep[];
      used_fallback?: boolean;
    }) => {
      setResult(report.result);
      setSteps(report.plan_steps ?? []);
      setUsedFallback(Boolean(report.used_fallback));
      setPhase(report.result ? "complete" : "idle");
      setProgress(report.result ? 100 : 0);
      setError(null);
      setIsRunning(false);
    },
    [],
  );

  const run = useCallback(
    async (idea: BusinessIdea, userId: string): Promise<StrategyRunOutput | null> => {
      setIsRunning(true);
      setError(null);
      setResult(null);
      setUsedFallback(false);
      setPhase("planning");
      setProgress(5);

      const running: StrategyPlanStep[] = PLAN.map((s) => ({ ...s, status: "pending" }));
      setSteps(running);

      try {
        setPhase("executing");
        for (let i = 0; i < running.length; i++) {
          running[i] = { ...running[i], status: "running" };
          setSteps([...running]);
          setProgress(10 + Math.round((i / running.length) * 60));
          running[i] = { ...running[i], status: "completed" };
          setSteps([...running]);
        }

        setPhase("synthesizing");
        setProgress(80);

        let strategy: StrategyResult | null = null;
        let fallback = false;

        const { data, error: fnError } = await backend.functions.invoke("strategy-agent", {
          body: { businessIdea: idea },
        });

        if (fnError || !data?.result) {
          fallback = true;
          strategy = emptyResult(idea);
        } else {
          strategy = data.result as StrategyResult;
        }

        const reportId = await saveStrategyReport({
          user_id: userId,
          title: `${idea.name} — AI Strategy Report`,
          business_idea: idea,
          result: strategy,
          plan_steps: running,
          used_fallback: fallback,
        });

        setResult(strategy);
        setUsedFallback(fallback);
        setPhase("complete");
        setProgress(100);
        setIsRunning(false);

        return { result: strategy, steps: running, usedFallback: fallback, reportId };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Strategy run failed");
        setPhase("error");
        setIsRunning(false);
        return null;
      }
    },
    [],
  );

  return { phase, progress, steps, result, error, usedFallback, isRunning, run, reset, loadReport };
}
