import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Network, Globe } from "lucide-react";
import { UnifiedHubShell } from "@/components/hubs/UnifiedHubShell";
import { DeepResearchPanel } from "@/components/chat/DeepResearchPanel";
import { ShadowBrowser } from "@/components/chat/ShadowBrowser";
import { KnowledgeHubPanel } from "@/components/hubs/panels/KnowledgeHubPanel";
import {
  parseResearchHubMode,
  type ResearchHubMode,
  RESEARCH_HUB_MODES,
} from "@/lib/hubs/researchHub";
import { PAGE_SEO } from "@/lib/seo";
import { queueChatInsert } from "@/lib/pendingChatInsert";

const ResearchHubPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = parseResearchHubMode(searchParams.get("tab"));
  const query = searchParams.get("q") || searchParams.get("topic") || "";
  const auto = searchParams.get("auto") === "1";

  const setMode = useCallback(
    (tab: ResearchHubMode) => {
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        p.set("tab", tab);
        return p;
      });
    },
    [setSearchParams],
  );

  const handleInsertToChat = useCallback(
    (content: string) => {
      queueChatInsert(content);
      navigate("/chatbot");
    },
    [navigate],
  );

  const icons: Record<ResearchHubMode, React.ReactNode> = {
    investigate: <Search className="h-4 w-4" />,
    knowledge: <Network className="h-4 w-4" />,
    browser: <Globe className="h-4 w-4" />,
  };

  return (
    <UnifiedHubShell
      title="Shadow Research"
      subtitle="Deep research, knowledge graph, and AI browser — unified"
      modes={RESEARCH_HUB_MODES.map((m) => ({ ...m, icon: icons[m.id] }))}
      activeMode={mode}
      onModeChange={setMode}
      seo={PAGE_SEO.research}
    >
      {mode === "investigate" && (
        <DeepResearchPanel
          embedded
          isOpen
          onClose={() => {}}
          onInsertToChat={handleInsertToChat}
          initialQuery={query}
          autoResearch={auto && !!query}
        />
      )}
      {mode === "knowledge" && <KnowledgeHubPanel />}
      {mode === "browser" && (
        <ShadowBrowser
          embedded
          isOpen
          onClose={() => {}}
          onInsertToChat={handleInsertToChat}
        />
      )}
    </UnifiedHubShell>
  );
};

export default ResearchHubPage;
