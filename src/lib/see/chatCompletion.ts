import { canRunLocalAgentCompletion, streamLocalAgentCompletion } from "@/lib/desktop/localAgentCompletion";
import { stringifyChatBody } from "@/lib/chatRequest";
import { chat as ollamaChat, getStatus as getOllamaStatus } from "@/lib/ollama/unifiedClient";
import { isOllamaInferenceReady, shouldPreferOllamaInference } from "@/lib/desktop/sovereignMode";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

async function tryOllamaFallback(userContent: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const status = await getOllamaStatus();
    if (!status.reachable) return null;
    const res = await ollamaChat(
      [{ role: "user", content: userContent }],
      { signal },
    );
    if (res.ok && res.content) return res.content;
  } catch {
    /* ollama not available — continue */
  }
  return null;
}

export async function streamChatCompletion(
  accessToken: string,
  userContent: string,
  options?: { model?: string; mode?: string; signal?: AbortSignal }
): Promise<string> {
  if (canRunLocalAgentCompletion()) {
    return streamLocalAgentCompletion(userContent, { signal: options?.signal });
  }

  // Ollama default provider — try before cloud when the local daemon is ready.
  if (shouldPreferOllamaInference() && isOllamaInferenceReady()) {
    const local = await tryOllamaFallback(userContent, options?.signal);
    if (local !== null) return local;
  }

  const response = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    },
    body: stringifyChatBody({
      messages: [{ role: "user", content: userContent }],
      model: options?.model ?? "google/gemini-2.5-flash",
      mode: options?.mode ?? "general",
      stream: true,
    }),
    signal: options?.signal,
  });

  if (!response.ok) {
    // Cloud credits exhausted / rate limited — try local Ollama as last resort.
    if (response.status === 402 || response.status === 429 || response.status === 503) {
      const local = await tryOllamaFallback(userContent, options?.signal);
      if (local !== null) return local;
    }
    const errText = await response.text().catch(() => "");
    if (response.status === 429) throw new Error("Rate limit reached. Please wait a minute before retrying.");
    if (response.status === 402) throw new Error("AI credits exhausted for this workspace. Add credits to continue.");
    if (response.status === 401 || response.status === 403) throw new Error("Sign in required to run this mission.");
    if (response.status >= 500) throw new Error("AI service is temporarily unavailable. Please retry shortly.");
    throw new Error(errText || `Chat request failed (${response.status})`);
  }


  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let fullContent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });

    for (const line of chunk.split("\n")) {
      if (line.startsWith("data: ") && line !== "data: [DONE]") {
        try {
          const data = JSON.parse(line.slice(6));
          const content =
            data.choices?.[0]?.delta?.content || data.choices?.[0]?.message?.content;
          if (content) fullContent += content;
        } catch {
          /* ignore malformed SSE */
        }
      }
    }
  }

  return fullContent;
}

export function extractJsonArray<T>(text: string): T[] | null {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T[];
  } catch {
    return null;
  }
}
