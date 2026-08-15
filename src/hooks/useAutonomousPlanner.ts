import { useCallback, useRef } from "react";
import { useToolOrchestrator, type ToolDetectionResult } from "@/hooks/useToolOrchestrator";
import {
  planToolRoute,
  criticizeOutcome,
  plannerStepToDetection,
  type PlannerPlan,
  type PlannerStep,
} from "@/lib/autonomy/llmToolPlanner";
import { getGoalsContextForPlanner } from "@/lib/autonomy/goalPersistence";
import { shouldUseCognitiveLoop } from "@/lib/autonomy/cognitiveLoopDetector";
import { trackAgenticEvent } from "@/lib/agenticMetrics";

export interface AutonomousPlanResult {
  detection: ToolDetectionResult;
  plan: PlannerPlan | null;
  usedLlm: boolean;
  needsCognitiveLoop: boolean;
  criticSummary?: string;
}

/**
 * Cheap local pre-filter: does this message look like it might need a tool?
 * Only these turns pay for the LLM planner round-trip.
 */
const TOOL_INTENT_RE =
  /\b(search|google|look ?up|latest|news|today'?s|browse|website|url|http|research|cite|source|image|picture|photo|draw|generate|render|logo|document|report|essay|pdf|docx|slide|deck|presentation|spreadsheet|chart|graph|calculate|compute|convert|plan|strategy|roadmap|analy[sz]e|audit|scrape|crawl|build me|create a|make me)\b/i;

function hasToolIntentSignal(message: string): boolean {
  return TOOL_INTENT_RE.test(message);
}


/**
 * Planner → (executor via dispatch) → critic loop entry point.
 * Returns best tool detection for the message.
 */
export function useAutonomousPlanner() {
  const { detectTool } = useToolOrchestrator();
  const cacheRef = useRef<Map<string, AutonomousPlanResult>>(new Map());

  const resolveDetection = useCallback(
    async (message: string, signal?: AbortSignal): Promise<AutonomousPlanResult> => {
      const key = message.trim().slice(0, 200);
      const cached = cacheRef.current.get(key);
      if (cached) return cached;

      const needsCognitiveLoop = shouldUseCognitiveLoop(message);

      // SPEED: the LLM planner is a full extra round-trip to (removed-edge-function)
      // that ran BEFORE every single message — adding ~1s to every reply, even
      // for "hi". Plain conversational turns can never route to a tool, so skip
      // the planner entirely unless the regex detector or the cognitive-loop
      // detector sees tool intent.
      const regexFirst = detectTool(message);
      if (!needsCognitiveLoop && !regexFirst.tool && !hasToolIntentSignal(message)) {
        const fast: AutonomousPlanResult = {
          detection: regexFirst,
          plan: null,
          usedLlm: false,
          needsCognitiveLoop: false,
        };
        cacheRef.current.set(key, fast);
        return fast;
      }

      let plan: PlannerPlan | null = null;
      let usedLlm = false;


      try {
        plan = await planToolRoute(
          message,
          { recentGoals: getGoalsContextForPlanner() },
          signal,
        );
        usedLlm = Boolean(plan);
        if (plan) trackAgenticEvent("tool_detected", { tool: "llm_planner", source: "planner" });
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          console.warn("[AutonomousPlanner] LLM plan failed, using regex:", e);
        }
      }

      const loopFlag = needsCognitiveLoop || Boolean(plan?.needsCognitiveLoop);

      let detection: ToolDetectionResult;

      if (loopFlag) {
        detection = {
          tool: "cognitive_loop",
          confidence: 92,
          autoExecute: true,
          originalMessage: message,
          params: { query: message },
        };
      } else if (plan?.steps?.length) {
        detection = plannerStepToDetection(plan.steps[0], message);
        if (plan.confidence < 55) {
          const regex = detectTool(message);
          if (regex.tool && regex.confidence > detection.confidence) {
            detection = regex;
            usedLlm = false;
          }
        }
      } else {
        detection = detectTool(message);
      }

      const result: AutonomousPlanResult = {
        detection,
        plan,
        usedLlm,
        needsCognitiveLoop: loopFlag,
      };
      cacheRef.current.set(key, result);
      if (cacheRef.current.size > 40) {
        const first = cacheRef.current.keys().next().value;
        if (first) cacheRef.current.delete(first);
      }
      return result;
    },
    [detectTool],
  );

  const runCritic = useCallback(
    async (
      userMessage: string,
      step: PlannerStep,
      outcomeSummary: string,
      signal?: AbortSignal,
    ) => criticizeOutcome(userMessage, step, outcomeSummary, signal),
    [],
  );

  return { resolveDetection, runCritic };
}
