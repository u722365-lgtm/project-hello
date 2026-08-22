import type { DeliverableType } from "./types";

export interface ShadowExecutionChatDetection {
  use: boolean;
  confidence: number;
  reason: string;
  autoRoute: boolean;
  deliverableType: DeliverableType;
}

export function detectShadowExecutionFromChat(message: string): ShadowExecutionChatDetection {
  const lowercase = message.toLowerCase();
  let deliverableType: DeliverableType = "general";
  
  if (lowercase.includes("strategy") || lowercase.includes("business plan") || lowercase.includes("swot")) {
    deliverableType = "strategy_report";
  } else if (lowercase.includes("research") || lowercase.includes("investigate") || lowercase.includes("brief")) {
    deliverableType = "research_brief";
  } else if (lowercase.includes("content") || lowercase.includes("marketing pack") || lowercase.includes("article")) {
    deliverableType = "content_pack";
  }

  const use = lowercase.includes("execute") || lowercase.includes("mission") || lowercase.includes("see") || message.length > 120;

  return {
    use,
    confidence: use ? 0.8 : 0.0,
    reason: "Heuristic chat detection",
    autoRoute: use,
    deliverableType,
  };
}

export function buildExecutePath(goal: string, mode: DeliverableType = "general"): string {
  return `/missioncontrol?goal=${encodeURIComponent(goal)}`;
}

export function inferDeliverableType(message: string): DeliverableType {
  const lowercase = message.toLowerCase();
  if (lowercase.includes("strategy") || lowercase.includes("business plan") || lowercase.includes("swot")) {
    return "strategy_report";
  }
  if (lowercase.includes("research") || lowercase.includes("investigate") || lowercase.includes("brief")) {
    return "research_brief";
  }
  if (lowercase.includes("content") || lowercase.includes("marketing pack") || lowercase.includes("article")) {
    return "content_pack";
  }
  return "general";
}
