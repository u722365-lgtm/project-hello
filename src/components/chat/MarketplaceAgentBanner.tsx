import { Bot, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MarketplaceAgentRuntime } from "@/lib/marketplace/types";

type Props = {
  agentName: string;
  runtime: MarketplaceAgentRuntime;
  onClear: () => void;
  onStarterSelect: (prompt: string) => void;
};

export function MarketplaceAgentBanner({
  agentName,
  runtime,
  onClear,
  onStarterSelect,
}: Props) {
  return (
    <div className="mx-4 md:mx-6 mb-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Bot className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{agentName}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {runtime.welcomeMessage ?? "Agent active — specialized instructions applied to this chat."}
            </p>
          </div>
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      {runtime.starterPrompts?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {runtime.starterPrompts.slice(0, 3).map((p) => (
            <Badge
              key={p}
              variant="secondary"
              className="text-[10px] cursor-pointer font-normal hover:bg-primary/20"
              onClick={() => onStarterSelect(p)}
            >
              {p.length > 48 ? `${p.slice(0, 48)}…` : p}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
