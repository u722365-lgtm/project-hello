import type { BusinessIdea } from "@/lib/strategy/types";

export function buildStrategyGoal(idea: BusinessIdea): string {
  return [
    `Business: ${idea.name}`,
    `Description: ${idea.description}`,
    `Location: ${idea.location}`,
    `Industry: ${idea.industry}`,
    `Target market: ${idea.targetMarket || "General"}`,
    `Initial investment: ${idea.initialInvestment || "Not specified"}`,
  ].join("\n");
}
