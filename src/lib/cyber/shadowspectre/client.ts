import { backend } from "@/integrations/local/client";
import { getFirebaseFunctionUrl, getChatFetchHeaders } from "@/lib/cloudEnv";
import type { AuthorizationContext, ShadowSpectreHead, ShadowSpectreMessage } from "./types";

export type StreamShadowSpectreOptions = {
  messages: ShadowSpectreMessage[];
  head?: ShadowSpectreHead | string;
  authorization?: AuthorizationContext | null;
  onToken: (token: string) => void;
  signal?: AbortSignal;
};

export async function streamShadowSpectre(
  options: StreamShadowSpectreOptions,
): Promise<{ content: string; head: ShadowSpectreHead }> {
  const { messages, head, authorization, onToken, signal } = options;

  const { data: { session } } = await backend.auth.getSession();
  const token = session?.access_token;
  
  if (!token) {
    throw new Error("Unauthorized. Sign in to use ShadowSpectre.");
  }

  const url = getFirebaseFunctionUrl("chat");
  const headers = getChatFetchHeaders(token);

  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      messages: messages.filter((m) => m.role !== "system"),
      model: "google/gemini-2.0-flash", // Default model for shadowspectre
      personality: head ?? "general",
      stream: true,
      authorization: authorization ?? undefined,
    }),
    signal,
  });

  const contentType = resp.headers.get("content-type") ?? "";

  if (!resp.ok || !resp.body) {
    let detail = `ShadowSpectre request failed (${resp.status})`;
    try {
      const err = (await resp.json()) as { error?: string };
      if (err.error) detail = err.error;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }

  // requireAuth failures return 200 + JSON (not SSE)
  if (contentType.includes("application/json")) {
    const err = (await resp.json()) as { error?: string };
    throw new Error(err.error ?? "Sign in required to use ShadowSpectre.");
  }

  const resolvedHead = (resp.headers.get("X-ShadowSpectre-Head") ?? head ?? "general") as ShadowSpectreHead;
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") break;
      try {
        const parsed = JSON.parse(jsonStr) as { choices?: { delta?: { content?: string } }[] };
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          content += delta;
          onToken(delta);
        }
      } catch {
        // partial SSE chunk
      }
    }
  }

  return { content, head: resolvedHead };
}
