import { Bot, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useMarketplace } from "@/hooks/useMarketplace";
import { useFeatureGating } from "@/hooks/useFeatureGating";

export function InstalledAgentsPanel({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const { isProOrHigher } = useFeatureGating();
  const { installedAgents, installingId, runAgent, loading } = useMarketplace();

  if (loading || installedAgents.length === 0) {
    if (compact) return null;
    return (
      <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        <Bot className="h-5 w-5 mx-auto mb-2 opacity-50" />
        <p>No marketplace agents installed.</p>
        <Button variant="link" className="text-xs h-auto p-0 mt-1" onClick={() => navigate("/marketplace")}>
          Browse marketplace
        </Button>
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      {!compact && (
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
          Marketplace agents
        </p>
      )}
      {installedAgents.slice(0, compact ? 5 : 12).map((agent) => (
        <button
          key={agent.id}
          type="button"
          disabled={installingId === agent.id}
          onClick={() =>
            void runAgent(agent, { isProOrHigher, onNavigate: navigate })
          }
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] hover:bg-sidebar-accent/50 transition-colors disabled:opacity-50"
        >
          {installingId === agent.id ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          ) : (
            <Play className="h-3.5 w-3.5 text-primary shrink-0" />
          )}
          <span className="truncate flex-1">{agent.name}</span>
        </button>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-xs text-muted-foreground"
        onClick={() => navigate("/marketplace")}
      >
        All agents →
      </Button>
    </div>
  );
}
