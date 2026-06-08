/**
 * Local LLM completions for agent loops (missions, forge, planning).
 */

import { runOllamaChat } from "@/lib/desktop/ollamaInference";
import { shouldUseLocalAgent } from "@/lib/desktop/sovereignAgentMode";
import { isOllamaInferenceReady } from "@/lib/desktop/sovereignMode";
import type { RouterMessage } from "@/lib/offline/hybridRouter";

export async function streamLocalAgentCompletion(
  userContent: string,
  options?: {
    systemPrompt?: string;
    signal?: AbortSignal;
    onToken?: (token: string) => void;
  },
): Promise<string> {
  const messages: RouterMessage[] = [];
  if (options?.systemPrompt) {
    messages.push({ role: "system", content: options.systemPrompt });
  }
  messages.push({ role: "user", content: userContent });

  const result = await runOllamaChat(messages, options?.onToken, options?.signal);
  if (!result.ok) {
    throw new Error(result.error ?? "Local agent completion failed");
  }
  return result.content;
}

export function canRunLocalAgentCompletion(): boolean {
  return shouldUseLocalAgent() && isOllamaInferenceReady();
}
