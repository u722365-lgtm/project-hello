import { useState, useCallback, useRef } from "react";
import { backend } from "@/integrations/local/client";
import { useToast } from "@/hooks/use-toast";
import { useMissions, Mission, MissionStep } from "./useMissions";
import { generateExecutionPlan } from "@/lib/execution/generateExecutionPlan";
import {
  buildMissionResultPayload,
  synthesizeDeliverable,
} from "@/lib/execution/synthesizeDeliverable";
import type { DeliverableType } from "@/lib/execution/types";
import type { BusinessIdea } from "@/lib/strategy/types";
import { updateLocalMission } from "@/lib/desktop/localMissionStore";
import { isAnonymousAutonomousEnabled } from "@/lib/anonymousAutonomousMode";
import { shouldUseLocalAgent, shouldUseLocalMissionStore } from "@/lib/desktop/sovereignAgentMode";
import { executeMissionTool } from "@/lib/see/missionToolExecutor";
import type { MissionPlanStep } from "@/lib/see/types";
import { trackAgenticEvent } from "@/lib/agenticMetrics";

export interface PendingApproval {
  missionId: string;
  stepIndex: number;
  step: MissionPlanStep;
}

interface ExecutionContext {
  missionId: string;
  accessToken: string;
  autoApprove: boolean;
}

function planToMissionSteps(steps: MissionPlanStep[]): MissionStep[] {
  return steps.map((s) => ({
    id: s.id,
    action: s.action,
    status: s.status as MissionStep["status"],
    result: s.result,
    duration_ms: s.duration_ms,
    tool_name: s.tool_name,
    requires_approval: s.requires_approval,
    tool_params: s.tool_params,
    proof: s.proof,
  }));
}

export const useMissionExecutor = () => {
  const { toast } = useToast();
  const { updateMissionStatus, addAction, updateAction } = useMissions();

  const [isExecuting, setIsExecuting] = useState(false);
  const [currentMissionId, setCurrentMissionId] = useState<string | null>(null);
  const [pendingApproval, setPendingApproval] = useState<PendingApproval | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const missionRef = useRef<Mission | null>(null);
  const stepsRef = useRef<MissionPlanStep[]>([]);
  const resultsRef = useRef<string[]>([]);
  const contextRef = useRef<ExecutionContext | null>(null);

  const persistSteps = useCallback(
    async (missionId: string, steps: MissionPlanStep[], extra?: Record<string, unknown>) => {
      const payload = {
        steps: planToMissionSteps(steps),
        ...extra,
      };
      if (missionId.startsWith("local-mission-")) {
        await updateLocalMission(missionId, payload);
        return;
      }
      await backend
        .from("missions")
        .update({
          steps: JSON.parse(JSON.stringify(payload.steps)),
          ...extra,
        })
        .eq("id", missionId);
    },
    [],
  );

  const runStep = useCallback(
    async (
      stepIndex: number,
      goal: string,
      ctx: ExecutionContext,
      forceApprove = false
    ): Promise<"ok" | "paused" | "failed"> => {
      const steps = stepsRef.current;
      const step = steps[stepIndex];
      const previousResults = resultsRef.current;
      const startTime = Date.now();

      steps[stepIndex] = { ...step, status: "running" };
      stepsRef.current = steps;
      await persistSteps(ctx.missionId, steps, {
        current_step: stepIndex,
        progress: Math.round((stepIndex / steps.length) * 100),
      });

      const action = await addAction(ctx.missionId, "execute_step", step.action, {
        tool_name: step.tool_name,
        input_data: { goal, tool_params: step.tool_params },
        requires_approval: step.requires_approval,
      });
      if (action) await updateAction(action.id, "running");

      const toolResult = await executeMissionTool(step, goal, ctx.accessToken, previousResults, {
        autoApprove: ctx.autoApprove || forceApprove,
        signal: abortRef.current?.signal,
      });

      if (toolResult.requiresApproval && !ctx.autoApprove && !forceApprove) {
        steps[stepIndex] = {
          ...step,
          status: "awaiting_approval",
          result: toolResult.output,
        };
        stepsRef.current = steps;
        await persistSteps(ctx.missionId, steps, { status: "paused" });
        await updateMissionStatus(ctx.missionId, "paused", { steps: planToMissionSteps(steps) });

        if (action) {
          await updateAction(action.id, "success", {
            output_data: { output: toolResult.output, awaiting_approval: true },
            duration_ms: Date.now() - startTime,
          });
        }

        setPendingApproval({ missionId: ctx.missionId, stepIndex, step: steps[stepIndex] });
        setIsExecuting(false);
        return "paused";
      }

      const duration = Date.now() - startTime;

      if (toolResult.success) {
        steps[stepIndex] = {
          ...step,
          status: "completed",
          result: toolResult.output,
          duration_ms: duration,
          proof: toolResult.proof,
        };
        resultsRef.current = [...previousResults, toolResult.output];
        stepsRef.current = steps;

        if (action) {
          await updateAction(action.id, "success", {
            output_data: { output: toolResult.output, proof: toolResult.proof },
            duration_ms: duration,
          });
        }
        return "ok";
      }

      steps[stepIndex] = { ...step, status: "failed", result: toolResult.output, duration_ms: duration };
      stepsRef.current = steps;
      if (action) {
        await updateAction(action.id, "failed", {
          error_message: toolResult.error || toolResult.output,
          duration_ms: duration,
        });
      }
      return "failed";
    },
    [addAction, persistSteps, updateAction, updateMissionStatus]
  );

  const finishMission = useCallback(
    async (mission: Mission, ctx: ExecutionContext): Promise<string> => {
      const results = resultsRef.current;
      const steps = stepsRef.current;
      const dtype = (mission.deliverable_type || "general") as DeliverableType;
      const businessIdea = mission.business_idea as unknown as BusinessIdea | undefined;

      const deliverable = await synthesizeDeliverable({
        deliverableType: dtype,
        goal: mission.goal,
        steps,
        accessToken: ctx.accessToken,
        businessIdea: businessIdea ?? null,
        signal: abortRef.current?.signal,
      });

      const resultPayload = buildMissionResultPayload(deliverable);
      const markdown =
        deliverable.markdown ||
        deliverable.strategy?.executiveSummary ||
        "";

      await trackAgenticEvent("mission_complete", { missionId: mission.id });
      await updateMissionStatus(mission.id, "completed", {
        result: resultPayload,
        progress: 100,
        completed_at: new Date().toISOString(),
        actual_duration_ms:
          Date.now() - new Date(mission.started_at || mission.created_at).getTime(),
        steps: planToMissionSteps(steps),
        used_fallback: deliverable.usedFallback ?? false,
        deliverable_markdown: markdown,
      } as Partial<Mission>);

      toast({
        title: dtype === "strategy_report" ? "Strategy complete" : "Execution complete",
        description: `"${mission.title}" finished with verified steps.`,
      });
      return markdown;
    },
    [toast, updateMissionStatus]
  );

  const runStepsFrom = useCallback(
    async (startIndex: number, skipAtIndex?: number): Promise<string | null> => {
      const mission = missionRef.current;
      const ctx = contextRef.current;
      if (!mission || !ctx) return null;

      const steps = stepsRef.current;
      let i = startIndex;

      if (skipAtIndex !== undefined) {
        steps[skipAtIndex] = { ...steps[skipAtIndex], status: "skipped" };
        stepsRef.current = steps;
        await persistSteps(ctx.missionId, steps);
      }

      trackAgenticEvent("mission_start", { missionId: mission.id });
      setIsExecuting(true);
      setCurrentMissionId(mission.id);
      await updateMissionStatus(mission.id, "running");

      for (; i < steps.length; i++) {
        if (abortRef.current?.signal.aborted) {
          await updateMissionStatus(mission.id, "cancelled");
          setIsExecuting(false);
          setCurrentMissionId(null);
          return null;
        }

        const outcome = await runStep(i, mission.goal, ctx);
        if (outcome === "paused") return null;

        await persistSteps(ctx.missionId, stepsRef.current, {
          progress: Math.round(((i + 1) / steps.length) * 100),
        });
      }

      const final = await finishMission(mission, ctx);
      setIsExecuting(false);
      setCurrentMissionId(null);
      abortRef.current = null;
      return final;
    },
    [finishMission, persistSteps, runStep, updateMissionStatus]
  );

  const executeMission = useCallback(
    async (mission: Mission): Promise<string | null> => {
      if (isExecuting) {
        toast({ title: "Already executing", description: "Wait for the current mission to finish." });
        return null;
      }

      const isLocalMission = mission.id.startsWith("local-mission-");
      const {
        data: { session },
      } = await backend.auth.getSession();
      if (
        !session &&
        !isLocalMission &&
        !shouldUseLocalAgent() &&
        !shouldUseLocalMissionStore() &&
        !isAnonymousAutonomousEnabled()
      ) {
        toast({ title: "Sign in required", variant: "destructive" });
        return null;
      }

      const ctx: ExecutionContext = {
        missionId: mission.id,
        accessToken: session?.access_token ?? "local-desktop",
        autoApprove: mission.auto_approve,
      };

      abortRef.current = new AbortController();
      missionRef.current = mission;
      contextRef.current = ctx;
      setIsExecuting(true);
      setCurrentMissionId(mission.id);
      setPendingApproval(null);

      try {
        await updateMissionStatus(mission.id, "running", {
          started_at: new Date().toISOString(),
        });
        await addAction(mission.id, "planning", "Generating execution plan with real tools");

        const steps = await generateExecutionPlan(
          mission.goal,
          (mission.deliverable_type || "general") as DeliverableType,
          ctx.accessToken,
          abortRef.current.signal,
        );
        stepsRef.current = steps;
        resultsRef.current = [];

        if ((steps[0] as (typeof steps)[number] & { _planFallback?: boolean })?._planFallback) {
          toast({
            title: "Using default plan",
            description:
              "Planner LLM was unavailable — running with a standard research plan. Results are still real.",
          });
        }

        await persistSteps(mission.id, steps, { progress: 5 });

        return await runStepsFrom(0);
      } catch (error) {
        console.error("Mission execution error:", error);
        await updateMissionStatus(mission.id, "failed", {
          error_message: error instanceof Error ? error.message : "Unknown error",
        });
        toast({
          title: "Mission failed",
          description: error instanceof Error ? error.message : "Execution error",
          variant: "destructive",
        });
        setIsExecuting(false);
        setCurrentMissionId(null);
        return null;
      }
    },
    [addAction, isExecuting, persistSteps, runStepsFrom, toast, updateMissionStatus]
  );

  const approvePendingStep = useCallback(async (): Promise<string | null> => {
    if (!pendingApproval || !missionRef.current || !contextRef.current) return null;
    const idx = pendingApproval.stepIndex;
    setPendingApproval(null);
    if (!abortRef.current) abortRef.current = new AbortController();

    const outcome = await runStep(idx, missionRef.current.goal, contextRef.current, true);
    if (outcome === "paused") return null;
    return runStepsFrom(idx + 1);
  }, [pendingApproval, runStep, runStepsFrom]);

  const rejectPendingStep = useCallback(async (): Promise<string | null> => {
    if (!pendingApproval) return null;
    const idx = pendingApproval.stepIndex;
    setPendingApproval(null);
    if (!abortRef.current) abortRef.current = new AbortController();
    return runStepsFrom(idx + 1, idx);
  }, [pendingApproval, runStepsFrom]);

  const cancelExecution = useCallback(() => {
    abortRef.current?.abort();
    setPendingApproval(null);
    setIsExecuting(false);
    setCurrentMissionId(null);
  }, []);

  return {
    isExecuting,
    currentMissionId,
    pendingApproval,
    executeMission,
    approvePendingStep,
    rejectPendingStep,
    cancelExecution,
  };
};
