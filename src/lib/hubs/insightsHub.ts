export type InsightsHubMode = "usage" | "behavior" | "activity";

export const INSIGHTS_HUB_MODES: { id: InsightsHubMode; label: string; description: string }[] = [
  { id: "usage", label: "Usage", description: "Messages, tokens, models" },
  { id: "behavior", label: "Behavior", description: "Anonymized data insights" },
  { id: "activity", label: "Activity", description: "Shadow memory log" },
];

export function parseInsightsHubMode(value: string | null): InsightsHubMode {
  if (value === "behavior" || value === "activity") return value;
  return "usage";
}
