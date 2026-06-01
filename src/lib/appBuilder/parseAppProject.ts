import type { AppPlatform, AppProject, AppProjectFile } from "./types";

function normalizeFile(raw: Record<string, unknown>): AppProjectFile | null {
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const content = typeof raw.content === "string" ? raw.content : "";
  if (!name || !content) return null;
  const language =
    typeof raw.language === "string"
      ? raw.language.trim()
      : name.includes(".")
        ? name.split(".").pop() || "plaintext"
        : "plaintext";
  return { name, language, content };
}

function coerceProject(
  parsed: Record<string, unknown>,
  fallbackPlatform: AppPlatform,
): AppProject | null {
  const filesRaw = parsed.files;
  if (!Array.isArray(filesRaw) || filesRaw.length === 0) return null;

  const files: AppProjectFile[] = [];
  for (const item of filesRaw) {
    if (!item || typeof item !== "object") continue;
    const file = normalizeFile(item as Record<string, unknown>);
    if (file) files.push(file);
  }
  if (files.length === 0) return null;

  const platform =
    parsed.platform === "mobile" || parsed.platform === "web"
      ? parsed.platform
      : fallbackPlatform;

  const title =
    typeof parsed.title === "string" && parsed.title.trim()
      ? parsed.title.trim().slice(0, 80)
      : "Generated App";

  const description =
    typeof parsed.description === "string" ? parsed.description.trim() : undefined;

  if (!files.some((f) => f.name === "index.html")) {
    files.unshift({
      name: "index.html",
      language: "html",
      content:
        "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>App</title>\n  <link rel=\"stylesheet\" href=\"style.css\">\n</head>\n<body>\n  <div id=\"app\"></div>\n  <script src=\"app.js\"></script>\n</body>\n</html>",
    });
  }

  return { title, platform, description, files };
}

function extractJsonBlob(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return null;
}

export function parseAppProjectResponse(
  raw: string,
  fallbackPlatform: AppPlatform,
): AppProject | null {
  const blob = extractJsonBlob(raw);
  if (!blob) return null;
  try {
    const parsed = JSON.parse(blob) as Record<string, unknown>;
    return coerceProject(parsed, fallbackPlatform);
  } catch {
    return null;
  }
}
