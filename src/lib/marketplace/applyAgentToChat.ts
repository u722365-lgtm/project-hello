import type { MarketplaceAgentRuntime } from "./types";

export function prependAgentSystemPrompt<T extends { role: string; content: unknown }>(
  messages: T[],
  runtime: MarketplaceAgentRuntime | null,
): T[] {
  if (!runtime?.systemPrompt) return messages;

  const withoutSystem = messages.filter((m) => m.role !== "system");
  return [{ role: "system", content: runtime.systemPrompt } as unknown as T, ...withoutSystem];
}
