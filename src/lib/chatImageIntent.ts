/** Detect what to do when the user attaches an image in chat */

export type ChatImageIntent = "edit" | "analyze" | "vision";

const IMAGE_EDIT =
  /\b(edit|change|modify|transform|remove|add|replace|make\s+(?:it|this|the)|turn\s+(?:it|this)|convert|enhance|upscale|fix|crop|retouch|recolor|colorize|erase|inpaint|outpaint|extend|expand|redraw|filter|background|black\s+and\s+white|b&w|cartoon|anime|sketch|oil\s+painting|watercolor)\b/i;

const ANALYZE_ONLY =
  /^(?:analyze|describe|decode|explain)(?:\s+(?:this|the))?(?:\s+image)?\??$|^what(?:'s| is)\s+this\??$|^tell\s+me\s+about\s+this(?:\s+image)?\??$/i;

export function detectChatImageIntent(message: string): ChatImageIntent {
  const text = message.trim();
  if (!text || ANALYZE_ONLY.test(text)) return "analyze";
  if (IMAGE_EDIT.test(text)) return "edit";
  return "vision";
}

export function defaultImagePrompt(intent: ChatImageIntent): string {
  if (intent === "edit") return "Enhance this image while keeping the main subject";
  if (intent === "analyze") return "Analyze and describe this image in detail";
  return "What can you tell me about this image?";
}
