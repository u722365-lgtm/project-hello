import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { BarChart3, Activity, Radio } from "lucide-react";
import { UnifiedHubShell } from "@/components/hubs/UnifiedHubShell";
import AnalyticsPage from "@/pages/AnalyticsPage";
import DataInsightsPanel from "@/components/monetization/DataInsightsPanel";
import ShadowMemoryPage from "@/pages/ShadowMemoryPage";
import {
  parseInsightsHubMode,
  type InsightsHubMode,
  INSIGHTS_HUB_MODES,
} from "@/lib/hubs/insightsHub";

const InsightsHubPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = parseInsightsHubMode(searchParams.get("tab"));

  const setMode = useCallback(
    (tab: InsightsHubMode) => {
      setSearchParams({ tab });
    },
    [setSearchParams],
  );

  const icons: Record<InsightsHubMode, React.ReactNode> = {
    usage: <BarChart3 className="h-4 w-4" />,
    behavior: <Radio className="h-4 w-4" />,
    activity: <Activity className="h-4 w-4" />,
  };

  return (
    <UnifiedHubShell
      title="Shadow Insights"
      subtitle="Usage analytics, behavior reports, and activity log"
      modes={INSIGHTS_HUB_MODES.map((m) => ({ ...m, icon: icons[m.id] }))}
      activeMode={mode}
      onModeChange={setMode}
      seo={{
        title: "Shadow Insights — Usage & Activity Hub",
        description: "Unified analytics: usage charts, data insights, and shadow memory activity.",
      }}
    >
      {mode === "usage" && <AnalyticsPage embedded />}
      {mode === "behavior" && (
        <div className="h-full overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto">
          <DataInsightsPanel />
        </div>
      )}
      {mode === "activity" && <ShadowMemoryPage embedded />}
    </UnifiedHubShell>
  );
};

export default InsightsHubPage;
