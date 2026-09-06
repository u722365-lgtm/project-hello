/**
 * Lovable Cloud AI image generation — streaming client.
 *
 * Calls the `generate-image` edge function, which proxies the Lovable AI
 * Gateway (`google/gemini-3-pro-image`) with `stream: true`. Preview frames
 * arrive progressively; the final frame is flagged with `isFinal`.
 */

import { flushSync } from "react-dom";
import { cloudAuthHeaders, cloudFunctionUrl } from "@/lib/cloudConfig";

export interface GenerateImageOptions {
  model?: string;
  /** Optional reference image (data URL) for image-to-image edits. */
  referenceImage?: string;
  signal?: AbortSignal;
  /** Called for every frame with a renderable data URL. */
  onFrame?: (dataUrl: string, isFinal: boolean) => void;
}

export function isCloudImageConfigured(): boolean {
  return Boolean(cloudFunctionUrl("generate-image"));
}

function getFunctionUrl(): string {
  return cloudFunctionUrl("generate-image");
}

function authHeaders() {
  return cloudAuthHeaders();
}

type Frame =
  | { type: "image_generation.partial_image"; b64_json: string }
  | { type: "image_generation.completed"; b64_json: string }
  | { type: "error"; error?: { message?: string } };

/**
 * Generate an image, streaming progressive previews.
 * Resolves with the final image as a `data:image/png;base64,...` URL.
 */
export async function generateCloudImage(
  prompt: string,
  opts: GenerateImageOptions = {},
): Promise<string> {
  const url = getFunctionUrl();
  if (!url) throw new Error("Image generation is not configured.");

  const requestBody = {
    prompt,
    ...(opts.model ? { model: opts.model } : {}),
    ...(opts.referenceImage ? { referenceImage: opts.referenceImage } : {}),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ ...requestBody, stream: true }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    let message = `Image generation failed (${res.status})`;
    try {
      const json = await res.json();
      message = json?.error || message;
    } catch { /* keep status message */ }
    throw new Error(message);
  }

  const emit = (b64: string, isFinal: boolean) => {
    const dataUrl = `data:image/png;base64,${b64}`;
    if (opts.onFrame) flushSync(() => opts.onFrame!(dataUrl, isFinal));
    return dataUrl;
  };

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let eventName = "";
  let last = "";
  let sawAny = false;
  let sawCompleted = false;
  let streamError: string | undefined;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      let idx: number;
      while ((idx = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, idx).replace(/\r$/, "");
        buffer = buffer.slice(idx + 1);
        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim();
          continue;
        }
        if (!line.startsWith("data:")) continue;
        const payloadText = line.slice(5).trim();
        if (!payloadText || payloadText === "[DONE]") continue;
        let payload: Frame | undefined;
        try {
          payload = JSON.parse(payloadText) as Frame;
        } catch {
          continue;
        }
        if (eventName === "error" || payload.type === "error") {
          sawAny = true;
          streamError =
            (payload as { error?: { message?: string } }).error?.message || "Image generation failed";
          continue;
        }
        const b64 = (payload as { b64_json?: string }).b64_json;
        if (!b64) continue;
        sawAny = true;
        const isFinal =
          eventName === "image_generation.completed" || payload.type === "image_generation.completed";
        last = emit(b64, isFinal);
        if (isFinal) sawCompleted = true;
      }
    }
  } finally {
    reader.cancel().catch(() => {});
  }

  if (streamError) throw new Error(streamError);

  if (!sawAny) {
    // Zero events = transport hiccup → replay once, non-streamed.
    const replay = await fetch(url, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ ...requestBody, stream: false }),
      signal: opts.signal,
    });
    if (!replay.ok) {
      let message = `Image generation failed (${replay.status})`;
      try {
        const json = await replay.json();
        message = json?.error || message;
      } catch { /* keep status message */ }
      throw new Error(message);
    }
    const json = (await replay.json()) as { data?: { b64_json?: string }[] };
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) throw new Error("Image generation returned no image");
    return emit(b64, true);
  }

  if (!sawCompleted && !last) throw new Error("Image stream ended without an image");
  return last;
}
