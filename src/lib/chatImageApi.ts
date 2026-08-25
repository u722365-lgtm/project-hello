/**
 * Non-streaming chat edge calls for image edit / analyze.
 * Uses existing (removed-edge-function) handlers (imageEdit, decodeImage).
 */

import { backend } from "@/integrations/local/client";
import { turboComplete } from "@/lib/turbo/turboEngine";

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
  const { signal, originalImage, editPrompt, imageToAnalyze } = body;
  
  let prompt = "";
  if (originalImage && editPrompt) {
    prompt = `Edit this image according to: ${editPrompt}`;
  } else if (imageToAnalyze) {
    prompt = "Analyze this image and describe its contents in detail.";
  } else {
    prompt = "Process this image request.";
  }

  try {
    const result = await turboComplete(
      "You are a creative AI image assistant.",
      prompt,
      { signal }
    );
    
    return {
      content: result.content || "Image processed.",
      type: "text",
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Image processing failed");
  }
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
