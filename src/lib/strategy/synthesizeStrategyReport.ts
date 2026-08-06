import { backend } from "@/integrations/local/client";
import type { BusinessIdea, StrategyResult } from "@/lib/strategy/types";
import { buildStrategyGoal } from "@/lib/strategy/goalContext";
import type { MissionPlanStep } from "@/lib/see/types";

function extractJsonObject<T>(text: string): T | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}

export async function synthesizeStrategyReport(
  idea: BusinessIdea,
  steps: MissionPlanStep[],
  signal?: AbortSignal,
): Promise<StrategyResult | null> {
  const stepDigest = steps
    .filter((s) => s.result)
    .map(
      (s, i) =>
        `### Step ${i + 1}: ${s.action}\nTool: ${s.tool_name}\n${s.result}\nSources: ${JSON.stringify(s.proof?.sources || [])}`,
    )
    .join("\n\n");

  const prompt = `You are a senior strategy consultant. Using ONLY the research below (cite real URLs from sources when present; mark missing data as estimates), produce ONE JSON object for this business.

${buildStrategyGoal(idea)}

Research steps:
${stepDigest || "No step output — use conservative estimates and empty sources array."}

JSON schema (exact keys):
{
  "executiveSummary": "string",
  "research": {
    "competitors": [{"name":"string","marketShare":number,"pricing":"string"}],
    "regulations": ["string"],
    "marketTrends": ["string"],
    "costs": [{"item":"string","cost":number}],
    "opportunities": ["string"],
    "threats": ["string"],
    "sources": [{"title":"string","url":"string","verified":true}]
  },
  "swot": { "strengths":[],"weaknesses":[],"opportunities":[],"threats":[] },
  "financialProjections": [{"month":"Month 1","revenue":number,"expenses":number,"profit":number}],
  "recommendations": ["string"],
  "riskAssessment": "string",
  "implementationPlan": ["string"]
}

financialProjections must have 12 months. sources[].verified is true only for real http URLs from research.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);

  try {
    const { data, error } = await backend.functions.invoke("chat", {
      body: {
        messages: [{ role: "user", content: prompt }],
        isResearch: true,
      },
    });
    if (error) throw new Error(error.message);
    const content = (data?.response || data?.text || "") as string;
    const parsed = extractJsonObject<StrategyResult>(content);
    return parsed;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", onAbort);
  }
}
