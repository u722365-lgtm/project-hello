export type WorkspaceHubMode = "memory" | "explore" | "agents" | "automate";

export const WORKSPACE_HUB_MODES: { id: WorkspaceHubMode; label: string; description: string }[] = [
  { id: "memory", label: "Memory", description: "CRUD business facts for AI context" },
  { id: "explore", label: "Explore", description: "Visual memory explorer" },
  { id: "agents", label: "Agents", description: "Installed marketplace agents" },
  { id: "automate", label: "Automate", description: "Script automations" },
];

export function parseWorkspaceHubMode(
  value: string | null,
  legacyPanel?: string | null,
): WorkspaceHubMode {
  if (legacyPanel === "automation") return "automate";
  if (value === "explore" || value === "agents" || value === "automate") return value;
  return "memory";
}
