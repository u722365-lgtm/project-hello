import { detectComplexTask } from "@/lib/see/complexTaskDetector";
import type { DeliverableType } from "@/lib/execution/types";

const STRATEGY_SIGNALS =
  /\b(swot|business\s+plan|investor(?:\s+update)?|board\s+meeting|go[- ]?to[- ]?market|market\s+expansion|competitive\s+(?:analysis|intelligence)|startup\s+strategy|financial\s+projection|pitch\s+deck|strategy\s+report)\b/i;

const RESEARCH_BRIEF_SIGNALS =
  /\b(research\s+brief|executive\s+brief|multi[- ]source\s+research|deep\s+research\s+report|cite\s+sources|literature\s+review)\b/i;

const CONTENT_SIGNALS =
  /\b(blog\s+post|social\s+media\s+content|content\s+(?:pipeline|calendar|pack)|seo\s+optimized\s+article|week\s+of\s+posts)\b/i;

const EXPLICIT_EXECUTE =
  /\b(shadow\s+execution|\/execute|run\s+(?:on\s+)?execute|open\s+execute)\b/i;

export function inferDeliverableType(message: string): DeliverableType {
  const text = message.trim();
  if (STRATEGY_SIGNALS.test(text)) return "strategy_report";
  if (RESEARCH_BRIEF_SIGNALS.test(text)) return "research_brief";
  if (CONTENT_SIGNALS.test(text)) return "content_pack";
  return "general";
}

export type ShadowExecutionChatDetection = {
  use: boolean;
  confidence: number;
  reason: string;
  deliverableType: DeliverableType;
  autoRoute: boolean;
};

/** When chat should open Shadow Execution instead of a one-shot reply */
export function detectShadowExecutionFromChat(message: string): ShadowExecutionChatDetection {
  const text = message.trim();
  const deliverableType = inferDeliverableType(text);
  const complex = detectComplexTask(text);

  if (EXPLICIT_EXECUTE.test(text)) {
    return {
      use: true,
      confidence: 0.99,
      reason: "Explicit Shadow Execution request",
      deliverableType,
      autoRoute: true,
    };
  }

  if (complex.useSEE && complex.confidence >= 0.55) {
    return {
      use: true,
      confidence: complex.confidence,
      reason: complex.reason,
      deliverableType,
      autoRoute: complex.confidence >= 0.72,
    };
  }

  if (STRATEGY_SIGNALS.test(text) && text.length >= 40) {
    return {
      use: true,
      confidence: 0.78,
      reason: "Business strategy deliverable detected",
      deliverableType: "strategy_report",
      autoRoute: text.length >= 80,
    };
  }

  if (RESEARCH_BRIEF_SIGNALS.test(text)) {
    return {
      use: true,
      confidence: 0.75,
      reason: "Research brief deliverable detected",
      deliverableType: "research_brief",
      autoRoute: true,
    };
  }

  return {
    use: false,
    confidence: 0,
    reason: "Standard chat response",
    deliverableType: "general",
    autoRoute: false,
  };
}

export function buildExecutePath(goal: string, deliverableType: DeliverableType): string {
  const params = new URLSearchParams();
  params.set("mode", deliverableType);
  if (goal.trim()) params.set("goal", goal.trim().slice(0, 2000));
  return `/execute?${params.toString()}`;
}
