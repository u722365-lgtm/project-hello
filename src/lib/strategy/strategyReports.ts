import { supabase } from "@/integrations/supabase/client";
import type { BusinessIdea, StrategyPlanStep, StrategyResult } from "@/lib/strategy/types";

export async function createStrategyReport(
  userId: string,
  idea: BusinessIdea,
  planSteps: StrategyPlanStep[],
): Promise<string | null> {
  const { data, error } = await supabase
    .from("strategy_reports")
    .insert({
      user_id: userId,
      title: idea.name || "Strategy report",
      business_idea: idea as unknown as Record<string, unknown>,
      plan_steps: planSteps as unknown as Record<string, unknown>[],
      status: "running",
    })
    .select("id")
    .single();

  if (error) {
    console.warn("[strategy] create report failed", error);
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
    .from("strategy_reports")
    .update({
      result: result as unknown as Record<string, unknown>,
      plan_steps: planSteps as unknown as Record<string, unknown>[],
      status: "completed",
      used_fallback: usedFallback,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId);
}

export async function failStrategyReport(reportId: string): Promise<void> {
  await supabase
    .from("strategy_reports")
    .update({ status: "failed", updated_at: new Date().toISOString() })
    .eq("id", reportId);
}

export async function listStrategyReports(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from("strategy_reports")
    .select("id, title, business_idea, result, plan_steps, status, used_fallback, created_at")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[strategy] list reports failed", error);
    return [];
  }
  return data ?? [];
}

export async function deleteStrategyReport(reportId: string): Promise<void> {
  await supabase.from("strategy_reports").delete().eq("id", reportId);
}
