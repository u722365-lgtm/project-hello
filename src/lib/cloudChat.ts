/**
 * Lovable Cloud AI chat — streaming client.
 *
 * Calls the `chat` edge function, which proxies the Lovable AI Gateway with
 * `stream: true`, and yields incremental text through `onDelta`.
 */

import { cloudAnonKey, cloudFunctionUrl } from "@/lib/cloudConfig";

export interface CloudChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CloudChatOptions {
  model?: string;
  temperature?: number;
  signal?: AbortSignal;
  /** Called with the full accumulated text on every delta. */
  onDelta?: (accumulated: string) => void;
}

export interface CloudChatResult {
  content: string;
  error?: string;
}

export function isCloudChatConfigured(): boolean {
  return Boolean(cloudFunctionUrl("chat"));
}

function getFunctionsUrl(): string {
  return cloudFunctionUrl("chat");
}

/** Stream a chat completion from the Lovable Cloud AI edge function. */
export async function streamCloudChat(
  messages: CloudChatMessage[],
  opts: CloudChatOptions = {},
): Promise<CloudChatResult> {
  const url = getFunctionsUrl();
  if (!url) {
    return { content: "", error: "Lovable Cloud AI is not configured." };
  }

  // Auth is handled outside Lovable Cloud, so there is never a Cloud session to
  // look up — skip the lookup entirely and authorize with the publishable key.
  const anonKey = cloudAnonKey();

  const maxRetries = 1;
  let attempt = 0;
  let resp: Response | null = null;
  
  while (attempt <= maxRetries) {
    try {
      resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          messages,
          ...(opts.model ? { model: opts.model } : {}),
          ...(typeof opts.temperature === "number" ? { temperature: opts.temperature } : {}),
        }),
        signal: opts.signal,
      });
      
      if (resp.ok || (resp.status !== 502 && resp.status !== 503 && resp.status !== 504)) {
        break; // Success or a non-retriable error
      }
    } catch (err) {
      if (attempt === maxRetries) throw err;
    }
    
    attempt++;
    if (attempt <= maxRetries) {
      await new Promise(r => setTimeout(r, 250));
    }
  }

  if (!resp || !resp.ok) {
    let message = `AI request failed (${resp?.status || 'Network Error'})`;
    try {
      const body = await resp?.json();
      message = body?.error || message;
    } catch {
      /* keep default */
    }
    if (resp.status === 429) message = "Rate limit reached — please try again in a moment.";
    if (resp.status === 402) message = message || "AI credits exhausted.";
    return { content: "", error: message };
  }

  if (!resp.body) return { content: "", error: "Empty response from AI service." };

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
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const parsed = JSON.parse(payload);
        const delta: string | undefined = parsed?.choices?.[0]?.delta?.content;
        if (delta) {
          content += delta;
          opts.onDelta?.(content);
        }
      } catch {
        /* partial JSON — ignore, next chunk completes it */
      }
    }
  }

  return { content };
}
