/**
 * Local mission tool executor — Odysseus-style offline agent tools.
 */

import { streamLocalAgentCompletion } from "@/lib/desktop/localAgentCompletion";
import { searchLocalMemories, formatMemoryContext } from "@/lib/desktop/localMemoryStore";
import { retrieveSovereignMemoryContext } from "@/lib/desktop/sovereignMemoryRag";
import { getDesktopAPI } from "@/lib/desktopBridge";
import type { MissionPlanStep, MissionStepProof, MissionToolName, ToolExecutionResult } from "@/lib/see/types";

const OFFLINE_ONLY_TOOLS: MissionToolName[] = [
  "send_email",
  "send_whatsapp",
  "read_emails",
  "get_calendar",
  "create_event",
  "get_contacts",
];

function inferQuery(step: MissionPlanStep, goal: string): string {
  return step.tool_params?.query?.trim() || step.action.slice(0, 200) || goal.slice(0, 200);
}

function inferUrl(step: MissionPlanStep, previousResults: string[]): string | null {
  if (step.tool_params?.url) return step.tool_params.url;
  const urlInAction = step.action.match(/https?:\/\/[^\s]+/i);
  if (urlInAction) return urlInAction[0];
  for (const r of [...previousResults].reverse()) {
    const m = r.match(/https?:\/\/[^\s)\]]+/i);
    if (m) return m[0];
  }
  return null;
}

async function localMemorySearch(query: string): Promise<{ text: string; proof: MissionStepProof }> {
  const memoryCtx = await retrieveSovereignMemoryContext(query);
  const results = await searchLocalMemories(query, 6, 0.25);
  const formatted = formatMemoryContext(results);
  const text =
    [memoryCtx, formatted].filter(Boolean).join("\n\n") ||
    `Offline search: no indexed local sources for "${query}". Proceed using model knowledge and label uncertain claims.`;
  return {
    text,
    proof: {
      tool_invoked: "local_memory_search",
      sources: results.map((r) => ({
        title: r.category,
        link: r.source ?? "local://memory",
        snippet: r.text.slice(0, 160),
      })),
    },
  };
}

async function fetchUrlText(url: string): Promise<string> {
  const api = getDesktopAPI();
  if (api?.fetchUrl) {
    const res = await api.fetchUrl(url);
    if (!res.ok) throw new Error(res.error ?? `Fetch failed (${res.status})`);
    return res.text;
  }
  if (!navigator.onLine) throw new Error("Offline — cannot fetch URL without desktop fetch API");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function executeLocalMissionTool(
  step: MissionPlanStep,
  goal: string,
  previousResults: string[],
  options?: { autoApprove?: boolean; signal?: AbortSignal },
): Promise<ToolExecutionResult> {
  const tool = (step.tool_name || "general") as MissionToolName;

  if (OFFLINE_ONLY_TOOLS.includes(tool)) {
    if (tool === "send_email" || tool === "email_composer") {
      const draft = await streamLocalAgentCompletion(
        `Draft email only (do not send) for mission goal: "${goal}"\nStep: ${step.action}\nContext:\n${previousResults.join("\n")}\n\nReturn: To, Subject, Body.`,
        { signal: options?.signal },
      );
      return {
        success: true,
        output: draft,
        proof: { tool_invoked: "email_composer_local" },
        requiresApproval: !options?.autoApprove,
      };
    }
    return {
      success: false,
      output: `${tool} requires cloud integrations — unavailable in sovereign offline mode.`,
      error: "OFFLINE_TOOL",
    };
  }

  try {
    switch (tool) {
      case "web_search":
      case "verification": {
        const { text, proof } = await localMemorySearch(inferQuery(step, goal));
        return { success: true, output: text, proof };
      }

      case "deep_research": {
        const query = inferQuery(step, goal);
        const { text, proof } = await localMemorySearch(query);
        const synthesis = await streamLocalAgentCompletion(
          `Synthesize deep research for goal: "${goal}"\n\nStep: ${step.action}\n\nLocal sources:\n${text}\n\nProvide an executive brief. Mark anything not in sources as inference.`,
          { signal: options?.signal },
        );
        return { success: true, output: synthesis, proof: { ...proof, raw_summary: text.slice(0, 2000) } };
      }

      case "web_scrape":
      case "data_extraction": {
        const url = inferUrl(step, previousResults);
        if (!url) {
          return { success: false, output: "No URL to scrape offline.", error: "NO_URL" };
        }
        const raw = await fetchUrlText(url);
        const excerpt = stripHtmlToText(raw).slice(0, 6000);
        return {
          success: true,
          output: `Scraped ${url}:\n\n${excerpt}`,
          proof: { tool_invoked: "local_fetch", urls: [url], raw_summary: excerpt.slice(0, 500) },
        };
      }

      case "security_audit": {
        const url = inferUrl(step, previousResults);
        if (!url) return { success: false, output: "Security audit requires a URL.", error: "NO_URL" };
        const output = await streamLocalAgentCompletion(
          `Perform a static security review checklist for ${url} based on URL patterns and general best practices. Note: offline mode cannot run live scans.`,
          { signal: options?.signal },
        );
        return { success: true, output, proof: { tool_invoked: "security_audit_local", urls: [url] } };
      }

      case "document_generator":
      case "code_analysis":
      case "synthesis":
      case "general":
      default: {
        const output = await streamLocalAgentCompletion(
          `Mission goal: "${goal}"
Current step: "${step.action}"
Tool: ${tool}

Previous step outputs:
${previousResults.length ? previousResults.map((r, i) => `### Step ${i + 1}\n${r}`).join("\n\n") : "None"}

Execute this step with concrete output. Cite local sources when relevant. No placeholders.`,
          { signal: options?.signal },
        );
        return { success: true, output, proof: { tool_invoked: `local_${tool}` } };
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Local tool execution failed";
    return { success: false, output: message, error: message };
  }
}
