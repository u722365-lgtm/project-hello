/**
 * Non-streaming chat edge calls for image edit / analyze.
 * Uses existing (removed-edge-function) handlers (imageEdit, decodeImage).
 */

import { backend } from "@/integrations/local/client";
import { stringifyChatBody } from "@/lib/chatRequest";
import { getChatFetchHeaders, getChatFunctionUrl } from "@/lib/cloudEnv";
import { selfHealedFetch } from "@/lib/selfHealing/selfHealedFetch";

export interface ChatImageResult {
  content: string;
  imageUrl?: string;
  type: "image" | "analysis" | "text";
}

export async function callChatImageEdit(
  originalImage: string,
  editPrompt: string,
  signal?: AbortSignal,
): Promise<ChatImageResult> {
  return callChatImageMode({
    imageEdit: true,
    originalImage,
    editPrompt,
    signal,
  });
}

export async function callChatImageAnalyze(
  imageToAnalyze: string,
  signal?: AbortSignal,
): Promise<ChatImageResult> {
  return callChatImageMode({
    decodeImage: true,
    imageToAnalyze,
    signal,
  });
}

async function callChatImageMode(body: Record<string, unknown> & { signal?: AbortSignal }): Promise<ChatImageResult> {
  const { signal, ...payload } = body;
  const chatUrl = getChatFunctionUrl();

  const { data: { session } } = await backend.auth.getSession();
  const resp = await selfHealedFetch(chatUrl, {
    method: "POST",
    headers: getChatFetchHeaders(session?.access_token),
    body: stringifyChatBody({
      messages: [],
      personality: "creative",
      mode: "general",
      ...payload,
    }),
    signal,
  });

  if (!resp.ok) {
    let detail = "Image request failed";
    try {
      const err = await resp.json();
      detail = typeof err.error === "string" ? err.error : detail;
    } catch {
      detail = (await resp.text().catch(() => "")) || detail;
    }
    throw new Error(detail);
  }

  const data = await resp.json();
  return {
    type: data.type === "image" ? "image" : data.type === "analysis" ? "analysis" : "text",
    content: data.content || data.analysis || "",
    imageUrl: data.imageUrl,
  };
}

/** Build multimodal user content for vision Q&A in streaming chat */
export function buildVisionUserMessage(
  text: string,
  imageDataUrl: string,
): { role: "user"; content: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> } {
  return {
    role: "user",
    content: [
      { type: "text", text: text.trim() || "What can you tell me about this image?" },
      { type: "image_url", image_url: { url: imageDataUrl } },
    ],
  };
}
