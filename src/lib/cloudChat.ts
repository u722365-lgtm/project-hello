/**
 * ShadowTalk AI — Streaming chat client.
 *
 * Tries the primary cloud/edge chat endpoint if configured,
 * and seamlessly falls back to Turbo Engine (Groq / OpenAI)
 * with real-time SSE streaming through `onDelta`.
 */

import {
  resolveTurboKey,
  resolveOpenAIKey,
  GROQ_API_URL,
  OPENAI_API_URL,
  TURBO_MODEL_GROQ,
  TURBO_MODEL_OPENAI,
} from "@/lib/turbo/turboProviders";

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
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL ||
    resolveTurboKey() ||
    resolveOpenAIKey()
  );
}

function getFunctionsUrl(): string {
  const base = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/+$/, "") || "";
  return base ? `${base}/functions/v1/chat` : "";
}

async function readSseStream(
  body: ReadableStream<Uint8Array>,
  opts: CloudChatOptions
): Promise<CloudChatResult> {
  const reader = body.getReader();
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
        /* partial JSON — wait for next chunk */
      }
    }
  }

  return { content };
}

/** Directly stream from Groq or OpenAI via the Turbo Engine configuration */
async function streamDirectTurbo(
  messages: CloudChatMessage[],
  opts: CloudChatOptions = {}
): Promise<CloudChatResult> {
  const openAiKey = resolveOpenAIKey();
  const groqKey = resolveTurboKey();

  let endpoint = GROQ_API_URL;
  let key = groqKey;
  let model = opts.model || TURBO_MODEL_GROQ;

  // Use OpenAI if key available and model is GPT or no Groq key
  if (openAiKey && (opts.model?.includes("gpt") || !groqKey)) {
    endpoint = OPENAI_API_URL;
    key = openAiKey;
    model = opts.model || TURBO_MODEL_OPENAI;
  }

  if (!key) {
    return { content: "", error: "No AI API key configured. Check settings." };
  }

  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: typeof opts.temperature === "number" ? opts.temperature : 0.7,
        stream: true,
      }),
      signal: opts.signal,
    });

    if (!resp.ok) {
      // If primary failed and OpenAI is available as backup, attempt OpenAI
      if (openAiKey && key !== openAiKey) {
        try {
          const fallbackResp = await fetch(OPENAI_API_URL, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openAiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: TURBO_MODEL_OPENAI,
              messages,
              temperature: typeof opts.temperature === "number" ? opts.temperature : 0.7,
              stream: true,
            }),
            signal: opts.signal,
          });
          if (fallbackResp.ok && fallbackResp.body) {
            return await readSseStream(fallbackResp.body, opts);
          }
        } catch {
          // continue to normal error handling
        }
      }
      const errText = (await resp.text().catch(() => "")) || "AI request failed";
      return { content: "", error: `AI request failed (${resp.status}): ${errText.slice(0, 180)}` };
    }

    if (!resp.body) return { content: "", error: "Empty response from AI service." };
    return await readSseStream(resp.body, opts);
  } catch (err: any) {
    if (err?.name === "AbortError") throw err;
    return { content: "", error: err?.message || "AI stream error" };
  }
}

/** Stream a chat completion */
export async function streamCloudChat(
  messages: CloudChatMessage[],
  opts: CloudChatOptions = {},
): Promise<CloudChatResult> {
  const url = getFunctionsUrl();
  
  // If an external edge function is configured, try it first
  if (url) {
    const anonKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) || "";
    try {
      const resp = await fetch(url, {
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

      if (resp.ok && resp.body) {
        return await readSseStream(resp.body, opts);
      }
    } catch (err: any) {
      if (err?.name === "AbortError") throw err;
      console.warn("[CloudChat] Remote endpoint failed, using Turbo fallback:", err);
    }
  }

  // Fallback to Turbo Engine (Groq / OpenAI) which is directly accessible and lightning fast
  return await streamDirectTurbo(messages, opts);
}
