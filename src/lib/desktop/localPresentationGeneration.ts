import type { PresentationData, ThemeKey } from "@/components/presentation/types";
import { THEMES } from "@/components/presentation/types";
import { postProcessPresentation } from "@/lib/presentation/slideQuality";
import { streamLocalAgentCompletion } from "@/lib/desktop/localAgentCompletion";
import {
  SLIDE_ANTI_OVERLAP_RULES,
  SLIDE_CONTENT_RULES,
  SLIDE_MASTER_TEMPLATE_RULES,
  SLIDE_VISUAL_RULES,
} from "@/lib/presentation/slideQuality";

export async function generateLocalPresentation(options: {
  topic: string;
  slideCount?: number;
  style?: ThemeKey;
  additionalContext?: string;
  signal?: AbortSignal;
}): Promise<PresentationData> {
  const { topic, slideCount = 10, style = "corporate", additionalContext, signal } = options;

  const prompt = `Create a professional presentation as JSON only.

Topic: ${topic}
Slides: ${slideCount}
Style: ${style}
${additionalContext ? `Context: ${additionalContext}` : ""}

${SLIDE_MASTER_TEMPLATE_RULES}
${SLIDE_ANTI_OVERLAP_RULES}
${SLIDE_CONTENT_RULES}
${SLIDE_VISUAL_RULES}

Return ONLY valid JSON:
{
  "title": "...",
  "slides": [
    {
      "title": "...",
      "subtitle": "...",
      "layout": "title|bullets|stats|process|closing",
      "html": "<div>...</div>",
      "speakerNotes": "..."
    }
  ]
}`;

  const raw = await streamLocalAgentCompletion(prompt, { signal });
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Local presentation model did not return JSON");

  let presentation: PresentationData;
  try {
    presentation = JSON.parse(jsonMatch[0]) as PresentationData;
  } catch {
    throw new Error("Failed to parse local presentation JSON");
  }

  if (!presentation.slides?.length) {
    throw new Error("No slides were generated locally");
  }

  const themeColors = THEMES[style] || THEMES.corporate;
  postProcessPresentation(presentation, {
    bg: themeColors.bg,
    accent: themeColors.accent,
    accentEnd: themeColors.accentEnd ?? themeColors.accent,
    text: themeColors.text,
    secondaryBg: themeColors.secondaryBg,
    cardBg: themeColors.secondaryBg,
    mutedText: themeColors.text,
  });

  return presentation;
}
