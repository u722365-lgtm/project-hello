import { stringifyChatBody } from "@/lib/chatRequest";
import { buildFallbackProject } from "./fallbackProject";
import { parseAppProjectResponse } from "./parseAppProject";
import type { AppPlatform, AppProject } from "./types";

const CHAT_URL = '';

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

async function readNonStreamBody(resp: Response): Promise<string> {
  const contentType = resp.headers.get("content-type") || "";
  if (contentType.includes("text/event-stream")) {
    const reader = resp.body?.getReader();
    const decoder = new TextDecoder();
    let full = "";
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of decoder.decode(value).split("\n")) {
        if (line.startsWith("data: ") && line !== "data: [DONE]") {
          try {
            const data = JSON.parse(line.slice(6));
            const delta = data.choices?.[0]?.delta?.content ?? data.choices?.[0]?.message?.content;
            if (delta) full += delta;
          } catch {
            /* ignore */
          }
        }
      }
    }
    return full;
  }
  try {
    const json = (await resp.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      content?: string;
      error?: string;
    };
    if (json.error) throw new Error(json.error);
    return json.choices?.[0]?.message?.content ?? json.content ?? "";
  } catch {
    return await resp.text();
  }
}

export async function generateAppProject(options: GenerateAppProjectOptions): Promise<AppProject> {
  const { prompt, platform, accessToken, personality = "professional", mode = "code" } = options;

  const userContent = `Platform: ${platform}
User request: ${prompt}

Generate a complete ${platform === "mobile" ? "mobile-first web app (PWA-style)" : "multi-page web application"} matching this request.`;

  const token = accessToken || import.meta.env.VITE_API_KEY;

  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: stringifyChatBody({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        personality,
        mode,
        ...(options.providerPayload || {}),
      }),
    });

    if (!resp.ok) {
      throw new Error(`Chat API ${resp.status}`);
    }

    const raw = await readNonStreamBody(resp);
    const parsed = parseAppProjectResponse(raw, platform);
    if (parsed && parsed.files.length >= 2) {
      return { ...parsed, platform: parsed.platform || platform };
    }
  } catch (e) {
    console.warn("[appBuilder] Generation failed, using fallback:", e);
  }

  return buildFallbackProject(prompt, platform);
}
