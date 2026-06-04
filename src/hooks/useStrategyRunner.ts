import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { executeMissionTool } from "@/lib/see/missionToolExecutor";
import { generateExecutionPlan } from "@/lib/execution/generateExecutionPlan";
import type { DeliverableType } from "@/lib/execution/types";
import { synthesizeStrategyReport } from "@/lib/strategy/synthesizeStrategyReport";
import {
  generateFallbackAnalysis,
  generateFallbackResearch,
} from "@/lib/strategy/fallbackData";
import { buildStrategyGoal } from "@/lib/strategy/goalContext";
import {
  createStrategyReport,
  failStrategyReport,
  finalizeStrategyReport,
} from "@/lib/strategy/strategyReports";
import type {
  BusinessIdea,
  StrategyPlanStep,
  StrategyResult,
  StrategyRunnerPhase,
} from "@/lib/strategy/types";

const STEP_TIMEOUT_MS = 90_000;
const MAX_STEPS = 6;

export function useStrategyRunner() {
  const [phase, setPhase] = useState<StrategyRunnerPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<StrategyPlanStep[]>([]);
  const [result, setResult] = useState<StrategyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase("idle");
    setProgress(0);
  }, []);

  const run = useCallback(async (
    idea: BusinessIdea,
    userId: string,
  ): Promise<{ result: StrategyResult; usedFallback: boolean } | undefined> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    setResult(null);
    setUsedFallback(false);
    setPhase("planning");
    setProgress(5);
    setSteps([]);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setError("Sign in required to run Strategy Agent.");
      setPhase("failed");
      return;
    }

    const goal = buildStrategyGoal(idea);
    let persistedId: string | null = null;

    try {
      let plan = await generateExecutionPlan(
        buildStrategyGoal(idea),
        "strategy_report" as DeliverableType,
        token,
        controller.signal,
      );
      plan = plan.slice(0, MAX_STEPS);
      setSteps(plan);
      setProgress(12);

      persistedId = await createStrategyReport(userId, idea, plan);
      setReportId(persistedId);

      setPhase("executing");
      const previousResults: string[] = [];
      const executed: StrategyPlanStep[] = [];

      for (let i = 0; i < plan.length; i++) {
        if (controller.signal.aborted) return;

        const step = { ...plan[i], status: "running" as const };
        executed[i] = step;
        setSteps([...executed, ...plan.slice(i + 1)]);

        const stepController = new AbortController();
        const stepTimeout = setTimeout(() => stepController.abort(), STEP_TIMEOUT_MS);
        const linkedAbort = () => stepController.abort();
        controller.signal.addEventListener("abort", linkedAbort);

        const toolResult = await executeMissionTool(
          step,
          goal,
          token,
          previousResults,
          { autoApprove: true, signal: stepController.signal },
        );

        clearTimeout(stepTimeout);
        controller.signal.removeEventListener("abort", linkedAbort);

        const finished: StrategyPlanStep = {
          ...step,
          status: toolResult.success ? "completed" : "failed",
          result: toolResult.output,
          proof: toolResult.proof,
        };
        executed[i] = finished;
        setSteps([...executed, ...plan.slice(i + 1)]);

        if (toolResult.success) {
          previousResults.push(toolResult.output);
        }

        setProgress(12 + Math.round(((i + 1) / plan.length) * 58));
      }

      setPhase("synthesizing");
      setProgress(78);

      let finalResult = await synthesizeStrategyReport(idea, executed, controller.signal);
      let fallback = false;

      if (!finalResult) {
        fallback = true;
        const research = generateFallbackResearch(idea);
        finalResult = generateFallbackAnalysis(idea, research);
      } else {
        const hasRealSources = finalResult.research?.sources?.some(
          (s) => s.url?.startsWith("http") && !s.url.includes("example.com"),
        );
        if (!hasRealSources && executed.every((s) => s.status === "failed")) {
          fallback = true;
        }
      }

      setUsedFallback(fallback);
      setResult(finalResult);
      setProgress(100);
      setPhase("complete");

      if (persistedId) {
        await finalizeStrategyReport(persistedId, finalResult, executed, fallback);
      }

      return { result: finalResult, usedFallback: fallback };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setPhase("idle");
        return;
      }
      const msg = err instanceof Error ? err.message : "Strategy run failed";
      setError(msg);
      setPhase("failed");
      if (persistedId) await failStrategyReport(persistedId);
      throw err;
    }
  }, []);

  const loadReport = useCallback(
    (row: {
      business_idea: BusinessIdea;
      result: StrategyResult | null;
      plan_steps?: StrategyPlanStep[];
      used_fallback?: boolean;
      id?: string;
    }) => {
      if (!row.result) return;
      setResult(row.result);
      setSteps(row.plan_steps || []);
      setUsedFallback(Boolean(row.used_fallback));
      setReportId(row.id ?? null);
      setPhase("complete");
      setProgress(100);
      setError(null);
    },
    [],
  );

  const reset = useCallback(() => {
    cancel();
    setResult(null);
    setSteps([]);
    setError(null);
    setUsedFallback(false);
    setReportId(null);
  }, [cancel]);

  return {
    phase,
    progress,
    steps,
    result,
    error,
    usedFallback,
    reportId,
    run,
    cancel,
    reset,
    loadReport,
    isRunning: phase === "planning" || phase === "executing" || phase === "synthesizing",
  };
}
