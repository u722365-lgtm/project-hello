import { supabase } from "@/integrations/supabase/client";
import { buildStrategyGoal } from "@/lib/strategy/goalContext";
import type { BusinessIdea, StrategyPlanStep, StrategyResult } from "@/lib/strategy/types";
import { parseMissionResult } from "@/lib/execution/synthesizeDeliverable";

/** @deprecated Writes go to unified `missions` table */
export async function createStrategyReport(
  userId: string,
  idea: BusinessIdea,
  planSteps: StrategyPlanStep[],
): Promise<string | null> {
  const { data, error } = await supabase
    .from("missions")
    .insert({
      user_id: userId,
      title: idea.name || "Strategy report",
      goal: buildStrategyGoal(idea),
      business_idea: idea as unknown as Record<string, unknown>,
      steps: planSteps as unknown as Record<string, unknown>[],
      deliverable_type: "strategy_report",
      status: "running",
    })
    .select("id")
    .single();

  if (error) {
    console.warn("[strategy] create mission failed", error);
    return null;
  }
  return data?.id ?? null;
}

export async function finalizeStrategyReport(
  reportId: string,
  result: StrategyResult,
  planSteps: StrategyPlanStep[],
  usedFallback: boolean,
): Promise<void> {
  await supabase
    .from("missions")
    .update({
      result: {
        deliverable_type: "strategy_report",
        strategy: result,
        markdown: result.executiveSummary,
        used_fallback: usedFallback,
      } as unknown as Record<string, unknown>,
      steps: planSteps as unknown as Record<string, unknown>[],
      status: "completed",
      used_fallback: usedFallback,
      deliverable_markdown: result.executiveSummary,
      progress: 100,
      updated_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
    .eq("id", reportId);
}

export async function failStrategyReport(reportId: string): Promise<void> {
  await supabase
    .from("missions")
    .update({ status: "failed", updated_at: new Date().toISOString() })
    .eq("id", reportId);
}

export async function listStrategyReports(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from("missions")
    .select(
      "id, title, business_idea, result, steps, status, used_fallback, created_at, deliverable_type",
    )
    .eq("user_id", userId)
    .eq("deliverable_type", "strategy_report")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[strategy] list missions failed", error);
    return [];
  }
  return (data ?? []).map((row) => {
    const parsed = parseMissionResult(row.result as Record<string, unknown> | undefined);
    return {
      id: row.id,
      title: row.title,
      business_idea: row.business_idea,
      result: parsed.strategy ?? (row.result as StrategyResult | null),
      plan_steps: (row.steps as StrategyPlanStep[]) || [],
      used_fallback: Boolean(row.used_fallback),
      created_at: row.created_at,
    };
  });
}

export async function deleteStrategyReport(reportId: string): Promise<void> {
  await supabase.from("missions").delete().eq("id", reportId);
}
