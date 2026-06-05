export type ContentForgeMode = "slides" | "documents" | "beast" | "studio";

export const CONTENT_FORGE_MODES: {
  id: ContentForgeMode;
  label: string;
  description: string;
}[] = [
  {
    id: "slides",
    label: "Slides",
    description: "Kimi-class decks · PPTX · presenter mode",
  },
  {
    id: "documents",
    label: "Documents",
    description: "Long-form reports · Word · PDF",
  },
  {
    id: "beast",
    label: "Beast Mode",
    description: "Full document + slide deck in one run",
  },
  {
    id: "studio",
    label: "Studio",
    description: "Image editor + document transformation",
  },
];

export const BEAST_SESSION_KEY = "shadowtalk_beast_payload";

export function parseForgeMode(value: string | null): ContentForgeMode {
  if (value === "documents" || value === "beast" || value === "studio") return value;
  return "slides";
}

export function inferForgeModeFromTool(tool: string): ContentForgeMode {
  if (tool === "document_generator") return "documents";
  if (tool === "presentation_builder") return "slides";
  return "slides";
}

export interface BeastSessionPayload {
  topic: string;
  documentMarkdown: string;
  docType: string;
  savedAt: number;
}

export function saveBeastSession(payload: BeastSessionPayload): void {
  sessionStorage.setItem(BEAST_SESSION_KEY, JSON.stringify(payload));
}

export function loadBeastSession(): BeastSessionPayload | null {
  try {
    const raw = sessionStorage.getItem(BEAST_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BeastSessionPayload;
  } catch {
    return null;
  }
}
