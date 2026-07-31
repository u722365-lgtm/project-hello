/**
 * OpenRouter fallback for when the platform AI gateway is unavailable
 * (402 credits exhausted / 429 rate limited / 503).
 *
 * Uses OPENROUTER_FALLBACK_KEY. Returns an OpenAI-compatible response
 * (streaming SSE or JSON) so callers can pass it straight through.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/** Free / low-cost OpenRouter models tried in order. */
const FALLBACK_MODELS = [
  "google/gemini-2.0-flash-exp:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen-2.5-72b-instruct:free",
];

export function hasOpenRouterFallback(): boolean {
  return !!Deno.env.get("OPENROUTER_FALLBACK_KEY");
}

export interface FallbackMessage {
  role: string;
  content: unknown;
}

export async function openRouterFallback(
  messages: FallbackMessage[],
  opts: { stream?: boolean; signal?: AbortSignal } = {},
): Promise<Response | null> {
  const key = Deno.env.get("OPENROUTER_FALLBACK_KEY");
  if (!key) return null;

  for (const model of FALLBACK_MODELS) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          "HTTP-Referer": "https://shadowtalk-ai.com",
          "X-Title": "ShadowTalk AI",
        },
        body: JSON.stringify({
          model,
          messages,
          stream: opts.stream ?? true,
        }),
        signal: opts.signal,
      });

      if (res.ok) {
        console.log("[OpenRouter Fallback] Serving via", model);
        return res;
      }
      console.warn("[OpenRouter Fallback] model failed", model, res.status);
    } catch (err) {
      console.warn("[OpenRouter Fallback] request error", model, err);
    }
  }

  return null;
}
