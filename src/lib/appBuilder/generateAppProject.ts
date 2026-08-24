import { turboComplete } from "@/lib/turbo/turboEngine";
import { buildFallbackProject } from "./fallbackProject";
import { parseAppProjectResponse } from "./parseAppProject";
import type { AppPlatform, AppProject } from "./types";


const SYSTEM_PROMPT = `You are an expert full-stack developer building complete runnable apps for ShadowTalk IDE.
Respond with ONLY valid JSON (no markdown prose outside the JSON). Schema:
{
  "title": "Short app name",
  "platform": "web" | "mobile",
  "description": "One sentence",
  "files": [
    { "name": "index.html", "language": "html", "content": "..." },
    { "name": "style.css", "language": "css", "content": "..." },
    { "name": "app.js", "language": "javascript", "content": "..." },
    { "name": "README.md", "language": "markdown", "content": "..." }
  ]
}
Rules:
- Always include index.html, style.css, app.js, and README.md.
- Use vanilla HTML/CSS/JS only (no build step). React via CDN only if user explicitly asks.
- mobile: mobile-first UI, viewport meta, touch-friendly controls, bottom tab bar or similar native patterns, max-width ~430px feel.
- web: full desktop layout, nav, hero, sections, responsive CSS.
- Implement real UI for the user's request (not placeholder lorem only).
- Escape strings properly for JSON.`;

export interface GenerateAppProjectOptions {
  prompt: string;
  platform: AppPlatform;
  accessToken?: string | null;
  personality?: string;
  mode?: string;
  providerPayload?: Record<string, unknown>;
}

export async function generateAppProject(options: GenerateAppProjectOptions): Promise<AppProject> {
  const { prompt, platform, accessToken, personality = "professional", mode = "code" } = options;

  const userContent = `Platform: ${platform}
User request: ${prompt}

Generate a complete ${platform === "mobile" ? "mobile-first web app (PWA-style)" : "multi-page web application"} matching this request.`;

  const token = accessToken || import.meta.env.VITE_API_KEY;

  try {
    const resp = await turboComplete(
      SYSTEM_PROMPT,
      userContent
    );

    const raw = resp.content || "";
    const parsed = parseAppProjectResponse(raw, platform);
    if (parsed && parsed.files.length >= 2) {
      return { ...parsed, platform: parsed.platform || platform };
    }
  } catch (e) {
    console.warn("[appBuilder] Generation failed, using fallback:", e);
  }

  return buildFallbackProject(prompt, platform);
}
