import { loadConfig } from "./config.js";
import { assertCloudAllowed } from "./pledge.js";
import type { ChatMessage } from "./ollama.js";

function getApiEnv(): { url: string; anonKey: string; accessToken?: string } {
  const cfg = loadConfig();
  const url =
    process.env.SHADOWTALK_API_URL ||
    process.env.VITE_API_BASE_URL ||
    cfg.backend?.url ||
    "";
  const anonKey =
    process.env.SHADOWTALK_ANON_KEY ||
    process.env.VITE_API_KEY ||
    cfg.backend?.anonKey ||
    "";
  const accessToken =
    process.env.SHADOWTALK_ACCESS_TOKEN || cfg.backend?.accessToken;

  if (!url || !anonKey) {
    throw new Error(
      "ShadowTalk backend not configured. Set SHADOWTALK_API_URL and SHADOWTALK_ANON_KEY, or use config set backend.url",
    );
  }

  return { url: url.replace(/\/$/, ""), anonKey, accessToken };
}

export async function streamCloudChat(
  messages: ChatMessage[],
  onToken: (token: string) => void,
  opts?: { personality?: string; mode?: string },
): Promise<{ ok: boolean; content: string; error?: string }> {
  assertCloudAllowed("cloud chat");

  const { url, anonKey, accessToken } = getApiEnv();
  const token = accessToken || anonKey;
  let content = "";

  const res = await fetch(`${url}/functions/v1/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
    },
    body: JSON.stringify({
      messages,
      personality: opts?.personality ?? "professional",
      mode: opts?.mode ?? "general",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, content: "", error: errText || `Chat API error ${res.status}` };
  }

  const reader = res.body?.getReader();
  if (!reader) {
    return { ok: false, content: "", error: "No response body" };
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    for (const line of buffer.split("\n")) {
      if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
      try {
        const json = JSON.parse(line.slice(6)) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const tokenStr = json.choices?.[0]?.delta?.content ?? "";
        if (tokenStr) {
          content += tokenStr;
          onToken(tokenStr);
        }
      } catch {
        // skip
      }
    }
    buffer = "";
  }

  return { ok: true, content };
}
