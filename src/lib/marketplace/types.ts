import type { ChatMode } from "@/components/chat/ModeSelector";

export type MarketplacePersonality =
  | "friendly"
  | "professional"
  | "creative"
  | "meticulous"
  | "pragmatic";

export type MarketplaceAgentRuntime = {
  version: 1;
  systemPrompt: string;
  chatMode?: ChatMode;
  personality?: MarketplacePersonality;
  starterPrompts: string[];
  /** Open IDE with this script when user taps "Open script" (scripts category). */
  ideScript?: { filename: string; language: string; content: string };
  welcomeMessage?: string;
};

export type MarketplaceAgent = {
  id: string;
  name: string;
  description: string;
  category: string;
  author: string;
  downloads: number;
  rating: number;
  price: string;
  tags: string[];
  icon: string;
  verified: boolean;
  agent_config?: MarketplaceAgentRuntime | null;
};

export type InstalledMarketplaceAgent = MarketplaceAgent & {
  installed_at?: string;
};
