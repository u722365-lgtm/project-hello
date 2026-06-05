export type ResearchHubMode = "investigate" | "knowledge" | "browser";

export const RESEARCH_HUB_MODES: { id: ResearchHubMode; label: string; description: string }[] = [
  { id: "investigate", label: "Deep Research", description: "Multi-source cited research" },
  { id: "knowledge", label: "Knowledge", description: "Graph + local knowledge base" },
  { id: "browser", label: "Browser", description: "AI web browser & scrape" },
];

export function parseResearchHubMode(value: string | null): ResearchHubMode {
  if (value === "knowledge" || value === "browser") return value;
  return "investigate";
}
