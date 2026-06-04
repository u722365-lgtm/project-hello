import { generateExecutionPlan } from "@/lib/execution/generateExecutionPlan";
import { buildStrategyGoal } from "@/lib/strategy/goalContext";
import type { BusinessIdea } from "@/lib/strategy/types";
import type { MissionPlanStep } from "@/lib/see/types";

/** @deprecated Use generateExecutionPlan from @/lib/execution */
export async function generateStrategyPlan(
  idea: BusinessIdea,
  accessToken: string,
  signal?: AbortSignal,
): Promise<MissionPlanStep[]> {
  return generateExecutionPlan(buildStrategyGoal(idea), "strategy_report", accessToken, signal);
}
