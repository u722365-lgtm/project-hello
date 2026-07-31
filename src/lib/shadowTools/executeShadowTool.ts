import { supabase } from "@/integrations/supabase/client";
import type { ToolType } from "@/hooks/useToolOrchestrator";
import { buildExecutePath, inferDeliverableType } from "@/lib/execution/inferFromChat";
import type { DeliverableType } from "@/lib/execution/types";
import { chatAuthHeaders } from "./chatAuthHeaders";
import type { ExecuteShadowToolContext, ShadowToolResult } from "./types";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

async function parseChatJsonResponse(resp: Response): Promise<Record<string, unknown>> {
  const text = await resp.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { content: text };
  }
}

async function streamChatToText(body: Record<string, unknown>, accessToken?: string): Promise<string> {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: chatAuthHeaders({ accessToken }),
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.text().catch(() => "");
    throw new Error(err || `Request failed (${resp.status})`);
  }

  const contentType = resp.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await parseChatJsonResponse(resp);
    if (typeof data.content === "string") return data.content;
    if (typeof data.imageUrl === "string") return String(data.content || "Image generated.");
    return JSON.stringify(data, null, 2).slice(0, 12000);
  }

  const reader = resp.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value, { stream: true }).split("\n")) {
      if (line.startsWith("data: ") && line !== "data: [DONE]") {
        try {
          const data = JSON.parse(line.slice(6));
          const c = data.choices?.[0]?.delta?.content || data.choices?.[0]?.message?.content;
          if (c) full += c;
        } catch {
          /* ignore */
        }
      }
    }
  }
  return full;
}

function formatSearchResults(results: Array<{ title?: string; link?: string; snippet?: string }>): string {
  if (!results.length) return "No search results returned.";
  return results
    .map((r, i) => `${i + 1}. **${r.title || "Result"}**\n   ${r.link || ""}\n   ${r.snippet || ""}`)
    .join("\n\n");
}

const UI_ROUTES: Partial<Record<ToolType, { path: string; label: string }>> = {
  shadow_execution: { path: "/execute", label: "Shadow Execution" },
  mission_control: { path: "/execute", label: "Shadow Execution" },
  strategy_agent: { path: "/execute?mode=strategy_report", label: "Shadow Execution" },
  workspace: { path: "/workspace", label: "AI Workspace" },
  ide: { path: "/ide", label: "Code IDE" },
  computer_mode: { path: "/computer", label: "Computer Mode" },
  marketplace: { path: "/marketplace", label: "Marketplace" },
  presentation_builder: { path: "/forge?mode=slides", label: "Content Forge" },
  knowledge_vault: { path: "/research?tab=knowledge", label: "Shadow Research" },
  privacy_score: { path: "/security?tab=score", label: "Security Center" },
  referral: { path: "/referral", label: "Referral Program" },
  analytics: { path: "/insights?tab=usage", label: "Shadow Insights" },
  stealth_vault: { path: "/security?tab=vault", label: "Security Center" },
  api_marketplace: { path: "/developers", label: "Developers" },
  sovereign_models: { path: "/personal-llm", label: "Personal LLM" },
  eco_actions: { path: "/chatbot", label: "Eco Actions (switch mode to PPAG)" },
};

export async function executeShadowTool(
  tool: ToolType,
  params: Record<string, string> | undefined,
  message: string,
  ctx: ExecuteShadowToolContext
): Promise<ShadowToolResult> {
  const p = params || {};

  switch (tool) {
    case "web_search": {
      const query = p.query || message;
      const { data, error } = await supabase.functions.invoke("web-search", {
        body: { query, numResults: 6 },
      });
      if (error) throw new Error(error.message);
      const results = (data?.results || data?.items || []) as Array<{
        title?: string;
        link?: string;
        snippet?: string;
      }>;
      return {
        kind: "inline",
        tool,
        content: `### Web search: ${query}\n\n${formatSearchResults(results)}`,
      };
    }

    case "deep_research": {
      const query = p.query || message;
      const report = await streamChatToText(
        { deepResearch: true, researchQuery: query, searchMode: "web" },
        ctx.accessToken
      );
      return { kind: "inline", tool, content: report || "Research returned no content." };
    }

    case "image_generator": {
      const imgPrompt = p.prompt || message;
      const encoded = encodeURIComponent(`${imgPrompt}, high quality, detailed, 4k`);
      const seed = Math.floor(Math.random() * 999999);
      const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux`;
      return {
        kind: "inline",
        tool,
        content: `Generated image for: *${imgPrompt}*`,
        imageUrl,
      };
    }

    case "image_decoder":
    case "visual_reasoning": {
      if (ctx.attachment?.type === "image" && ctx.attachment.data) {
        const analysis = await streamChatToText(
          {
            decodeImage: true,
            imageToAnalyze: ctx.attachment.data,
            messages: [{ role: "user", content: message || "Analyze this image in detail." }],
            personality: ctx.personality,
          },
          ctx.accessToken
        );
        return { kind: "inline", tool, content: analysis };
      }
      return {
        kind: "ui",
        tool,
        message: "Attach an image to your message, or open Camera Analysis mode.",
        path: "/chatbot",
      };
    }

    case "security_audit": {
      const urlMatch = message.match(/https?:\/\/[^\s]+/i);
      const url = p.url || urlMatch?.[0];
      if (url) {
        const { data, error } = await supabase.functions.invoke("website-security-scan", {
          body: { url },
        });
        if (error) throw new Error(error.message);
        const summary =
          typeof data === "string"
            ? data
            : data?.report || data?.summary || JSON.stringify(data, null, 2).slice(0, 8000);
        return { kind: "inline", tool, content: `### Security audit: ${url}\n\n${summary}` };
      }
      return {
        kind: "chat_flags",
        tool,
        flags: { securityAudit: message, messages: [{ role: "user", content: message }] },
        preamble: "Running security audit on provided code/context…",
      };
    }

    case "shadow_browser": {
      const url = p.url || message.match(/https?:\/\/[^\s]+/i)?.[0];
      if (url) {
        const { data, error } = await supabase.functions.invoke("firecrawl-scrape", {
          body: { url, options: { formats: ["markdown"], onlyMainContent: true } },
        });
        if (error) throw new Error(error.message);
        const markdown = data?.markdown || data?.content || JSON.stringify(data, null, 2).slice(0, 8000);
        return {
          kind: "inline",
          tool,
          content: `### Scraped: ${url}\n\n${markdown}`,
        };
      }
      return {
        kind: "ui",
        tool,
        message: "Provide a URL to scrape.",
        path: "/browser",
      };
    }

    case "code_executor": {
      const code = p.code || message;
      const { data, error } = await supabase.functions.invoke("code-runner", {
        body: { code, language: p.language || "javascript" },
      });
      if (error) throw new Error(error.message);
      const output = (data?.stdout || data?.output || JSON.stringify(data, null, 2)).slice(0, 12000);
      return { kind: "inline", tool, content: `### Code execution\n\n${output}` };
    }

    case "file_manager": {
      const action = p.action || "list";
      const { data, error } = await supabase.functions.invoke("file-manager", {
        body: { action, path: p.path, content: p.content, name: p.name },
      });
      if (error) throw new Error(error.message);
      return { kind: "inline", tool, content: JSON.stringify(data, null, 2).slice(0, 12000) };
    }

    case "presentation_builder": {
      const topic = p.topic || message;
      try {
        const outline = buildExecutePath(message, "content_pack");
        return {
          kind: "inline",
          tool,
          content: `### Presentation outline: ${topic}\n\n\`\`\`json\n${JSON.stringify(outline, null, 2).slice(0, 8000)}\`\`\`\n\nOpen **Presentations** to export as PPTX.`,
        };
      } catch {
        return {
          kind: "inline",
          tool,
          content: `### Presentation outline: ${topic}\n\n\`\`\`json\n${JSON.stringify({ slides: [{ title: topic, bullets: ["Intro", "Body", "Conclusion"] }], export: "Use Presentations page to generate PPTX." }, null, 2)}\`\`\``,
        };
      }
    }

    case "database_query":
    case "analytics_agent": {
      const query = p.query || message;
      const { data, error } = await supabase.functions.invoke("postgres-query", {
        body: { query, limit: 25 },
      });
      if (error) throw new Error(error.message);
      const rows = Array.isArray(data) ? data : data?.rows || data?.results || [data];
      return {
        kind: "inline",
        tool,
        content: `### Query result\n\n\`\`\`json\n${JSON.stringify(rows, null, 2).slice(0, 12000)}\`\`\``,
      };
    }

    case "api_integrator":
    case "workflow_automation": {
      const endpoint = p.endpoint || p.url || "";
      const method = (p.method as string) || "POST";
      const body = p.body || { input: message };
      const { data, error } = await supabase.functions.invoke("api-gateway", {
        body: { endpoint, method, body },
      });
      if (error) throw new Error(error.message);
      return {
        kind: "inline",
        tool,
        content: `### ${method} ${endpoint || "API workflow"}\n\n\`\`\`json\n${JSON.stringify(data, null, 2).slice(0, 12000)}\`\`\``,
      };
    }

    case "shadow_execution":
    case "mission_control":
    case "strategy_agent": {
      const mode = tool === "strategy_agent"
        ? "strategy_report"
        : (p.mode as DeliverableType) || inferDeliverableType(message);
      return {
        kind: "ui",
        tool: "shadow_execution",
        path: UI_ROUTES[tool]?.path ?? "/execute",
        state: {
          mode,
          message,
          params: p,
        },
      };
    }

    default:
      return {
        kind: "inline",
        tool: "executor",
        content: `Shadow tool “${tool}” is not implemented yet.`,
      };
  }
}

export type { ExecuteShadowToolContext } from "./types";
