import type { MissionPlanStep } from "@/lib/see/types";
import type { BusinessIdea, StrategyResult } from "@/lib/strategy/types";

export type DeliverableType = "general" | "strategy_report" | "research_brief" | "content_pack";

export type ExecutionPlanStep = MissionPlanStep;

export type ExecutionRunInput = {
  deliverableType: DeliverableType;
  goal: string;
  title?: string;
  businessIdea?: BusinessIdea | null;
  autoApprove?: boolean;
  description?: string;
};

export type ExecutionDeliverable = {
  deliverableType: DeliverableType;
  markdown?: string;
  strategy?: StrategyResult;
  usedFallback?: boolean;
  stepOutputs?: string[];
};

export const DELIVERABLE_LABELS: Record<DeliverableType, string> = {
  general: "General mission",
  strategy_report: "Strategy report",
  research_brief: "Research brief",
  content_pack: "Content pack",
};
