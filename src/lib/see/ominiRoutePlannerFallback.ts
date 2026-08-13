/**
 * Bounded fallback for SEE planner ONLY.
 *
 * This intentionally does NOT replace normal chat.
 * It is only used when:
 * - platform/ShadowTalk completion fails for planning, and
 * - the caller opts in via env/config.
 *
 * Notes:
 * - 1.53B free tokens is a shared global pool, not a dedicated quota.
 * - Do not expose API keys or route non-SEE traffic through this path.
 */

const OMNIROUTE_URL = "https://api.omini-route.ai/v1/chat/completions";

export type OmniRoutePlannerResponse = {
  plan?: Array<{
    action: string;
    tool_name?: string;
    tool_params?: Record<string, string>;
    requires_approval?: boolean;
  }>;
  fallback: true;
};

export function isOmniRoutePlannerEnabled(): boolean {
  return import.meta.env.VITE_OMNIROUTE_ENABLED === "1";
}

export async function plannerOmniRouteFallback(
  goal: string,
  deliverableType: string,
  signal?: AbortSignal,
): Promise<OmniRoutePlannerResponse | null> {
  if (!isOmniRoutePlannerEnabled()) return null;

  const apiKey = import.meta.env.VITE_OMNIROUTE_API_KEY;
  if (!apiKey || typeof apiKey !== "string" || apiKey.length < 16) {
    console.warn("[omini-route] planner fallback skipped: missing/invalid API key");
    return null;
  }

  const typeRules =
    deliverableType === "strategy_report"
      ? "Deliverable: investor-ready strategy report. Use web_search, deep_research, then synthesis. 4-6 steps."
      : deliverableType === "research_brief"
        ? "Deliverable: research brief with citations. Use deep_research/web_search, then synthesis."
        : "Deliverable: actionable mission output. Use real tools/web_search/deep_research/scrape. End with synthesis/document_generator.";

  const body = {
    model: "google/gemini-2.5-flash",
    messages: [
      {
        role: "user",
        content: `You are the ShadowTalk SEE planner. Goal: ${goal}\n${typeRules}\nReturn ONLY JSON array: {action, tool_name, tool_params?, requires_approval?}.`,
      },
    ],
    max_tokens: 1200,
    temperature: 0.2,
  };

  try {
    const res = await fetch(OMNIROUTE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!res.ok) {
      console.warn("[omini-route] planner fallback non-ok", res.status);
      return null;
    }

    const data = (await res.json()) as Record<string, unknown>;
    const choices = Array.isArray(data.choices) ? data.choices : [];
    const firstChoice = choices[0];
    const message =
      firstChoice && typeof firstChoice === "object" && "message" in firstChoice
        ? (firstChoice as { message?: unknown }).message
        : undefined;
    const content =
      message && typeof message === "object" && "content" in message
        ? (message as { content?: unknown }).content
        : undefined;
    if (!content || typeof content !== "string") return null;

    const match = content.match(/\[[\s\S]*\]/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as OmniRoutePlannerResponse["plan"];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    return { plan: parsed, fallback: true };
  } catch (e) {
    console.warn("[omini-route] planner fallback failed", e);
    return null;
  }
}
