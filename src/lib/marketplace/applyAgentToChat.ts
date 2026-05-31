import type { MarketplaceAgentRuntime } from "./types";

export function prependAgentSystemPrompt(
  messages: Array<{ role: string; content: string }>,
  runtime: MarketplaceAgentRuntime | null,
): Array<{ role: string; content: string }> {
  if (!runtime?.systemPrompt) return messages;

  const withoutSystem = messages.filter((m) => m.role !== "system");
  return [{ role: "system", content: runtime.systemPrompt }, ...withoutSystem];
}
