/**
 * Odysseus-style local inference sidecar — talks to Ollama's OpenAI-compatible API.
 * Runs in Electron main process (no renderer CORS limits).
 */

export const DEFAULT_OLLAMA_BASE = "http://127.0.0.1:11434";
export const DEFAULT_OLLAMA_MODEL = "qwen2.5:7b";

export type OllamaConfig = {
  baseUrl: string;
  model: string;
};

export type OllamaStatus = {
  reachable: boolean;
  version?: string;
  models: string[];
  activeModel: string;
  baseUrl: string;
  error?: string;
};

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

let config: OllamaConfig = {
  baseUrl: DEFAULT_OLLAMA_BASE,
  model: DEFAULT_OLLAMA_MODEL,
};

export function getOllamaConfig(): OllamaConfig {
  return { ...config };
}

export function setOllamaConfig(partial: Partial<OllamaConfig>): OllamaConfig {
  if (partial.baseUrl) {
    config.baseUrl = partial.baseUrl.replace(/\/$/, "");
  }
  if (partial.model) {
    config.model = partial.model;
  }
  return getOllamaConfig();
}

function apiUrl(path: string): string {
  const base = config.baseUrl.replace(/\/$/, "");
  return `${base}${path}`;
}

export async function probeOllamaStatus(): Promise<OllamaStatus> {
  const baseUrl = config.baseUrl;
  try {
    const [versionRes, tagsRes] = await Promise.all([
      fetch(apiUrl("/api/version"), { signal: AbortSignal.timeout(4000) }),
      fetch(apiUrl("/api/tags"), { signal: AbortSignal.timeout(4000) }),
    ]);

    if (!versionRes.ok) {
      return {
        reachable: false,
        models: [],
        activeModel: config.model,
        baseUrl,
        error: `Ollama responded with ${versionRes.status}`,
      };
    }

    const versionJson = (await versionRes.json()) as { version?: string };
    let models: string[] = [];
    if (tagsRes.ok) {
      const tagsJson = (await tagsRes.json()) as { models?: Array<{ name: string }> };
      models = (tagsJson.models ?? []).map((m) => m.name);
    }

    const activeModel =
      models.find((m) => m === config.model || m.startsWith(`${config.model}:`)) ??
      models[0] ??
      config.model;

    if (activeModel !== config.model && models.length > 0) {
      config.model = activeModel;
    }

    return {
      reachable: true,
      version: versionJson.version,
      models,
      activeModel,
      baseUrl,
    };
  } catch (e) {
    return {
      reachable: false,
      models: [],
      activeModel: config.model,
      baseUrl,
      error: e instanceof Error ? e.message : "Ollama not reachable",
    };
  }
}

export async function pullOllamaModel(
  model: string,
  onProgress?: (status: string, percent?: number) => void,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(apiUrl("/api/pull"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: model, stream: true }),
    });
    if (!res.ok || !res.body) {
      return { ok: false, error: `Pull failed (${res.status})` };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line) as {
            status?: string;
            completed?: number;
            total?: number;
          };
          if (json.status) {
            const pct =
              json.total && json.completed
                ? Math.round((json.completed / json.total) * 100)
                : undefined;
            onProgress?.(json.status, pct);
          }
        } catch {
          // ignore malformed progress lines
        }
      }
    }

    config.model = model;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Pull failed" };
  }
}

export async function streamOllamaChat(
  messages: ChatMessage[],
  onToken: (token: string) => void,
  signal?: AbortSignal,
): Promise<{ ok: boolean; content: string; error?: string }> {
  let content = "";

  try {
    const res = await fetch(apiUrl("/v1/chat/completions"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        messages,
        stream: true,
        temperature: 0.7,
      }),
      signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, content: "", error: errText || `Ollama error ${res.status}` };
    }

    const reader = res.body?.getReader();
    if (!reader) {
      return { ok: false, content: "", error: "No response body from Ollama" };
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split("\n");
      buffer = parts.pop() ?? "";

      for (const line of parts) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") continue;

        try {
          const json = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const token = json.choices?.[0]?.delta?.content ?? "";
          if (token) {
            content += token;
            onToken(token);
          }
        } catch {
          // skip malformed SSE chunk
        }
      }
    }

    return { ok: true, content };
  } catch (e) {
    if (signal?.aborted) {
      return { ok: false, content, error: "Aborted" };
    }
    return {
      ok: false,
      content,
      error: e instanceof Error ? e.message : "Ollama chat failed",
    };
  }
}
