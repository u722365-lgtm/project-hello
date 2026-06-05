import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Brain, Network, Store, Workflow } from "lucide-react";
import { UnifiedHubShell } from "@/components/hubs/UnifiedHubShell";
import WorkspacePage from "@/pages/WorkspacePage";
import BusinessMemoryExplorer from "@/components/chat/BusinessMemoryExplorer";
import { InstalledAgentsPanel } from "@/components/marketplace/InstalledAgentsPanel";
import { ScriptAutomation } from "@/components/chat/ScriptAutomation";
import {
  parseWorkspaceHubMode,
  type WorkspaceHubMode,
  WORKSPACE_HUB_MODES,
} from "@/lib/hubs/workspaceHub";

const WorkspaceHubPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = parseWorkspaceHubMode(searchParams.get("tab"), searchParams.get("panel"));

  const setMode = useCallback(
    (tab: WorkspaceHubMode) => {
      setSearchParams({ tab });
    },
    [setSearchParams],
  );

  const icons: Record<WorkspaceHubMode, React.ReactNode> = {
    memory: <Brain className="h-4 w-4" />,
    explore: <Network className="h-4 w-4" />,
    agents: <Store className="h-4 w-4" />,
    automate: <Workflow className="h-4 w-4" />,
  };

  return (
    <UnifiedHubShell
      title="Shadow Workspace"
      subtitle="Business memory, agents, and automations — one hub"
      modes={WORKSPACE_HUB_MODES.map((m) => ({ ...m, icon: icons[m.id] }))}
      activeMode={mode}
      onModeChange={setMode}
      seo={{
        title: "Shadow Workspace — Memory, Agents & Automations",
        description: "Unified AI workspace: business memory, explorer, installed agents, and script automations.",
      }}
    >
      {mode === "memory" && <WorkspacePage embedded />}
      {mode === "explore" && (
        <div className="h-full p-4 md:p-6 overflow-hidden">
          <div className="h-[calc(100vh-10rem)]">
            <BusinessMemoryExplorer />
          </div>
        </div>
      )}
      {mode === "agents" && (
        <div className="h-full overflow-y-auto p-4 md:p-6 max-w-4xl mx-auto">
          <InstalledAgentsPanel />
        </div>
      )}
      {mode === "automate" && (
        <div className="h-full overflow-y-auto p-4 md:p-6">
          <ScriptAutomation onClose={() => {}} onRunScript={() => {}} />
        </div>
      )}
    </UnifiedHubShell>
  );
};

export default WorkspaceHubPage;
