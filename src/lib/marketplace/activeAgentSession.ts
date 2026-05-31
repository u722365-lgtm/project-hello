import type { MarketplaceAgent } from "./types";
import { resolveAgentRuntime } from "./resolveAgentConfig";

const ACTIVE_KEY = "shadowtalk_active_marketplace_agent";

export type ActiveMarketplaceSession = {
  agentId: string;
  agentName: string;
  category: string;
  startedAt: number;
};

export function setActiveMarketplaceAgent(agent: MarketplaceAgent): void {
  const runtime = resolveAgentRuntime(agent);
  const session: ActiveMarketplaceSession = {
    agentId: agent.id,
    agentName: agent.name,
    category: agent.category,
    startedAt: Date.now(),
  };
  sessionStorage.setItem(ACTIVE_KEY, JSON.stringify(session));
  if (runtime) {
    sessionStorage.setItem(`${ACTIVE_KEY}_runtime`, JSON.stringify(runtime));
  }
}

export function getActiveMarketplaceSession(): ActiveMarketplaceSession | null {
  try {
    const raw = sessionStorage.getItem(ACTIVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveMarketplaceSession;
  } catch {
    return null;
  }
}

export function clearActiveMarketplaceAgent(): void {
  sessionStorage.removeItem(ACTIVE_KEY);
  sessionStorage.removeItem(`${ACTIVE_KEY}_runtime`);
}

export function getCachedActiveRuntime(): import("./types").MarketplaceAgentRuntime | null {
  try {
    const raw = sessionStorage.getItem(`${ACTIVE_KEY}_runtime`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
