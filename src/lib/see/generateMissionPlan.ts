import { generateExecutionPlan } from "@/lib/execution/generateExecutionPlan";
import type { MissionPlanStep } from "./types";

/** @deprecated Use generateExecutionPlan from @/lib/execution */
export async function generateMissionPlan(
  goal: string,
  accessToken: string,
  signal?: AbortSignal,
): Promise<MissionPlanStep[]> {
  return generateExecutionPlan(goal, "general", accessToken, signal);
}
