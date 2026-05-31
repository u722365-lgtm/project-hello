import { AGENT_RUNTIME_BY_ID, AGENT_RUNTIME_BY_NAME } from "./agentDefinitions";
import type { MarketplaceAgent, MarketplaceAgentRuntime } from "./types";

export function resolveAgentRuntime(agent: Pick<MarketplaceAgent, "id" | "name" | "agent_config">): MarketplaceAgentRuntime | null {
  const fromDb = agent.agent_config;
  if (fromDb && typeof fromDb === "object" && fromDb.systemPrompt) {
    return fromDb;
  }
  return AGENT_RUNTIME_BY_ID[agent.id] ?? AGENT_RUNTIME_BY_NAME[agent.name] ?? null;
}

export function agentRequiresPro(agent: Pick<MarketplaceAgent, "price">): boolean {
  const p = agent.price?.toLowerCase() ?? "";
  return p !== "free" && p !== "";
}
