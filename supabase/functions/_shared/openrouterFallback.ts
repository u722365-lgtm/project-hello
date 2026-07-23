/**
 * Shared OpenRouter fallback for edge functions.
 *
 * When Lovable AI Gateway returns 402 (credits exhausted), 429 (rate limit),
 * or 503 (upstream down), retry the same body against OpenRouter using a
 * FREE model. Requires OPENROUTER_FALLBACK_KEY.
 *
 * Free-tier OpenRouter models (as of 2026-07):
 *   - google/gemini-2.0-flash-exp:free      (fast, general chat)
 *   - meta-llama/llama-3.3-70b-instruct:free (higher quality)
 *   - deepseek/deepseek-chat-v3.1:free       (reasoning/code)
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const FREE_MODEL_MAP: Record<string, string> = {
  // OpenAI family → free Gemini Flash (best free general model)
  "openai/gpt-5.5": "google/gemini-2.0-flash-exp:free",
  "openai/gpt-5.4": "google/gemini-2.0-flash-exp:free",
  "openai/gpt-5.4-mini": "google/gemini-2.0-flash-exp:free",
  "openai/gpt-5.4-nano": "google/gemini-2.0-flash-exp:free",
  "openai/gpt-5": "google/gemini-2.0-flash-exp:free",
  "openai/gpt-5-mini": "google/gemini-2.0-flash-exp:free",
  "openai/gpt-5-nano": "google/gemini-2.0-flash-exp:free",
  // Gemini → free Gemini
  "google/gemini-2.5-pro": "google/gemini-2.0-flash-exp:free",
  "google/gemini-2.5-flash": "google/gemini-2.0-flash-exp:free",
  "google/gemini-2.5-flash-lite": "google/gemini-2.0-flash-exp:free",
  "google/gemini-3-flash-preview": "google/gemini-2.0-flash-exp:free",
  "google/gemini-3.1-pro-preview": "google/gemini-2.0-flash-exp:free",
};

const DEFAULT_FREE_MODEL = "google/gemini-2.0-flash-exp:free";

export function mapToFreeModel(model?: string): string {
  if (!model) return DEFAULT_FREE_MODEL;
  return FREE_MODEL_MAP[model] ?? DEFAULT_FREE_MODEL;
}

export function isRetryableStatus(status: number): boolean {
  return status === 402 || status === 429 || status === 503;
}

/**
 * Call OpenRouter free model with the same messages. Set `stream: true` to
 * pass through an SSE stream, otherwise returns a Response with a single
 * JSON body. Returns null if fallback is unavailable or fails.
 */
export async function openRouterFreeFallback(
  body: {
    model?: string;
    messages: Array<{ role: string; content: unknown }>;
    stream?: boolean;
    temperature?: number;
    max_tokens?: number;
  },
): Promise<Response | null> {
  const key = Deno.env.get("OPENROUTER_FALLBACK_KEY");
  if (!key) return null;

  try {
    const resp = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://shadowtalk-ai.com",
        "X-Title": "ShadowTalk AI",
      },
      body: JSON.stringify({
        ...body,
        model: mapToFreeModel(body.model),
      }),
    });
    if (!resp.ok) {
      console.warn("[openRouterFreeFallback] non-ok", resp.status);
      return null;
    }
    return resp;
  } catch (err) {
    console.error("[openRouterFreeFallback] error", err);
    return null;
  }
}
