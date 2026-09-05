import { backend } from "@/integrations/local/client";
import type { ToolType } from "@/hooks/useToolOrchestrator";
import { chatAuthHeaders } from "./chatAuthHeaders";
import type { ExecuteShadowToolContext, ShadowToolResult } from "./types";
import { turboComplete } from "@/lib/turbo/turboEngine";


function formatSearchResults(results: Array<{ title?: string; link?: string; snippet?: string }>): string {
  if (!results.length) return "No search results returned.";
  return results
    .map((r, i) => `${i + 1}. **${r.title || "Result"}**\n   ${r.link || ""}\n   ${r.snippet || ""}`)
    .join("\n\n");
}

const UI_ROUTES: Partial<Record<ToolType, { path: string; label: string }>> = {

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
      const query = (p.query as string) || message;
      const { data, error } = await backend.functions.invoke("web-search", {
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
      const query = (p.query as string) || message;
      const reportResp = await turboComplete(
        "You are a Deep Research AI assistant. Your goal is to synthesize the following query comprehensively. Mode: web",
        query
      );
      const report = reportResp.content;
      return { kind: "inline", tool, content: report || "Research returned no content." };
    }

    case "image_generator": {
      const imgPrompt = (p.prompt as string) || message;
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

    case "image_editor":
    case "image_edit" as any: {
      const imgData =
        (p.image as string) ||
        (ctx.attachment?.type === "image" && ctx.attachment.data
          ? `data:${ctx.attachment.mimeType};base64,${ctx.attachment.data}`
          : null);
      if (imgData) {
        const { callChatImageEdit } = await import("@/lib/chatImageApi");
        const editResp = await callChatImageEdit(
          imgData,
          message || (p.prompt as string) || "Enhance and stylize this image",
        );
        return {
          kind: "inline",
          tool,
          content: editResp.content,
          imageUrl: editResp.imageUrl,
        };
      }
      return {
        kind: "ui",
        tool,
        message: "Please attach an image to edit.",
        path: "/chatbot",
      };
    }

    case "image_decoder":
    case "visual_reasoning": {
      if (ctx.attachment?.type === "image" && ctx.attachment.data) {
        const { callChatImageAnalyze } = await import("@/lib/chatImageApi");
        const decodeResp = await callChatImageAnalyze(
          `data:${ctx.attachment.mimeType};base64,${ctx.attachment.data}`,
        );
        return {
          kind: "inline",
          tool,
          content: decodeResp.content,
          imageUrl: `data:${ctx.attachment.mimeType};base64,${ctx.attachment.data}`,
        };
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
        const { data, error } = await backend.functions.invoke("website-security-scan", {
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
        const { data, error } = await backend.functions.invoke("firecrawl-scrape", {
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
      const { data, error } = await backend.functions.invoke("code-runner", {
        body: { code, language: p.language || "javascript" },
      });
      if (error) throw new Error(error.message);
      const output = (data?.stdout || data?.output || JSON.stringify(data, null, 2)).slice(0, 12000);
      return { kind: "inline", tool, content: `### Code execution\n\n${output}` };
    }

    case "file_manager": {
      const action = p.action || "list";
      const { data, error } = await backend.functions.invoke("file-manager", {
        body: { action, path: p.path, content: p.content, name: p.name },
      });
      if (error) throw new Error(error.message);
      return { kind: "inline", tool, content: JSON.stringify(data, null, 2).slice(0, 12000) };
    }

    case "presentation_builder": {
      const topic = p.topic || message;
        return {
          kind: "inline",
          tool,
          content: `### Presentation outline: ${topic}\n\n\`\`\`json\n${JSON.stringify({ slides: [{ title: topic, bullets: ["Intro", "Body", "Conclusion"] }], export: "Use Presentations page to generate PPTX." }, null, 2)}\`\`\``,
        };
    }


    case "database_query":
    case "analytics_agent": {
      const query = p.query || message;
      const { data, error } = await backend.functions.invoke("postgres-query", {
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
      const { data, error } = await backend.functions.invoke("api-gateway", {
        body: { endpoint, method, body },
      });
      if (error) throw new Error(error.message);
      return {
        kind: "inline",
        tool,
        content: `### ${method} ${endpoint || "API workflow"}\n\n\`\`\`json\n${JSON.stringify(data, null, 2).slice(0, 12000)}\`\`\``,
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
