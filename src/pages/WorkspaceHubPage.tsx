import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { PAGE_SEO } from "@/lib/seo";
import { queueChatInsert } from "@/lib/pendingChatInsert";

const WorkspaceHubPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = parseWorkspaceHubMode(searchParams.get("tab"), searchParams.get("panel"));

  const setMode = useCallback(
    (tab: WorkspaceHubMode) => {
      setSearchParams({ tab });
    },
    [setSearchParams],
  );

  const handleRunScript = useCallback(
    (scriptCode: string) => {
      queueChatInsert(
        `Execute this workspace automation script:\n\n\`\`\`\n${scriptCode}\n\`\`\``,
      );
      navigate("/chatbot");
    },
    [navigate],
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
      seo={PAGE_SEO.workspace}
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
          <ScriptAutomation embedded onClose={() => {}} onRunScript={handleRunScript} />
        </div>
      )}
    </UnifiedHubShell>
  );
};

export default WorkspaceHubPage;
