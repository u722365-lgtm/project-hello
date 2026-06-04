import type { MissionPlanStep } from "@/lib/see/types";

export interface BusinessIdea {
  name: string;
  description: string;
  location: string;
  industry: string;
  targetMarket: string;
  initialInvestment: string;
}

export interface ResearchData {
  competitors: Array<{ name: string; marketShare: number; pricing: string }>;
  regulations: string[];
  marketTrends: string[];
  costs: Array<{ item: string; cost: number }>;
  opportunities: string[];
  threats: string[];
  sources: Array<{ title: string; url: string; verified?: boolean }>;
}

export interface FinancialProjection {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface SWOTData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface StrategyResult {
  executiveSummary: string;
  research: ResearchData;
  swot: SWOTData;
  financialProjections: FinancialProjection[];
  recommendations: string[];
  riskAssessment: string;
  implementationPlan: string[];
}

export type StrategyRunnerPhase =
  | "idle"
  | "planning"
  | "executing"
  | "synthesizing"
  | "complete"
  | "failed";

export type StrategyPlanStep = MissionPlanStep;

export interface StrategyReportRow {
  id: string;
  title: string;
  business_idea: BusinessIdea;
  result: StrategyResult | null;
  plan_steps: StrategyPlanStep[];
  status: string;
  used_fallback: boolean;
  created_at: string;
}
