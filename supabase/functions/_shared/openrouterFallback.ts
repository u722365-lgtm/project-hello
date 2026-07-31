/**
 * Fallback chat completion for when the platform AI gateway is unavailable
 * (402 credits exhausted / 429 rate limited / 503).
 *
 * Order:
 *   1. Google Gemini (OpenAI-compatible endpoint) using `Gemini_1api`
 *   2. OpenRouter using `OPENROUTER_FALLBACK_KEY`
 *
 * Returns an OpenAI-compatible Response (streaming SSE or JSON) so callers
 * can pass it straight through to the browser.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const GEMINI_OPENAI_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

/** Gemini models tried in order (OpenAI-compatible endpoint). */
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.5-flash-lite"];

/** OpenRouter models tried in order (free slugs first, then cheap paid). */
const FALLBACK_MODELS = [
  "google/gemini-2.0-flash-exp:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen-2.5-72b-instruct:free",
];

export function hasOpenRouterFallback(): boolean {
  return !!Deno.env.get("OPENROUTER_FALLBACK_KEY") || !!Deno.env.get("Gemini_1api");
}

export interface FallbackMessage {
  role: string;
  content: unknown;
}

async function tryGemini(
  messages: FallbackMessage[],
  opts: { stream?: boolean; signal?: AbortSignal },
): Promise<Response | null> {
  const key = Deno.env.get("Gemini_1api");
  if (!key) return null;

  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(GEMINI_OPENAI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages,
          stream: opts.stream ?? true,
        }),
        signal: opts.signal,
      });

      if (res.ok) {
        console.log("[Fallback] Serving via Gemini", model);
        return res;
      }
      console.warn("[Fallback] Gemini model failed", model, res.status);
    } catch (err) {
      console.warn("[Fallback] Gemini request error", model, err);
    }
  }
  return null;
}

async function tryOpenRouter(
  messages: FallbackMessage[],
  opts: { stream?: boolean; signal?: AbortSignal },
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
        console.log("[Fallback] Serving via OpenRouter", model);
        return res;
      }
      console.warn("[Fallback] OpenRouter model failed", model, res.status);
    } catch (err) {
      console.warn("[Fallback] OpenRouter request error", model, err);
    }
  }
  return null;
}

export async function openRouterFallback(
  messages: FallbackMessage[],
  opts: { stream?: boolean; signal?: AbortSignal } = {},
): Promise<Response | null> {
  return (await tryGemini(messages, opts)) ?? (await tryOpenRouter(messages, opts));
}

/** Image models tried in order via the Gemini REST API. */
const GEMINI_IMAGE_MODELS = [
  "gemini-2.5-flash-image",
  "gemini-2.5-flash-image-preview",
  "gemini-2.0-flash-preview-image-generation",
];

/**
 * Direct Gemini image-generation fallback.
 * Returns a base64 data URL, or null when unavailable.
 */
export async function geminiImageFallback(prompt: string): Promise<string | null> {
  const key = Deno.env.get("Gemini_1api");
  if (!key) return null;

  for (const model of GEMINI_IMAGE_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
          }),
        },
      );
      if (!res.ok) {
        console.warn("[Fallback] Gemini image model failed", model, res.status);
        continue;
      }
      const json = await res.json();
      const parts = json?.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        const inline = part?.inlineData ?? part?.inline_data;
        if (inline?.data) {
          const mime = inline.mimeType ?? inline.mime_type ?? "image/png";
          console.log("[Fallback] Image served via Gemini", model);
          return `data:${mime};base64,${inline.data}`;
        }
      }
    } catch (err) {
      console.warn("[Fallback] Gemini image request error", model, err);
    }
  }
  return null;
}
