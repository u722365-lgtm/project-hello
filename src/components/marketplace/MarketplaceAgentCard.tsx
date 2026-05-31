import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Download, Bot, Check, Loader2, Play, Code2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MarketplaceAgent } from "@/lib/marketplace/types";
import { resolveAgentRuntime } from "@/lib/marketplace/resolveAgentConfig";

const iconMap: Record<string, LucideIcon> = {
  Bot,
};

type Props = {
  agent: MarketplaceAgent;
  iconMap: Record<string, LucideIcon>;
  isInstalled: boolean;
  isLoading: boolean;
  onInstall: () => void;
  onUninstall: () => void;
  onRun: () => void;
  onOpenScript?: () => void;
  onTagClick: (tag: string) => void;
};

export function MarketplaceAgentCard({
  agent,
  iconMap: icons,
  isInstalled,
  isLoading,
  onInstall,
  onUninstall,
  onRun,
  onOpenScript,
  onTagClick,
}: Props) {
  const IconComp = icons[agent.icon] || Bot;
  const runtime = resolveAgentRuntime(agent);
  const hasScript = !!runtime?.ideScript;

  return (
    <Card className="hover:border-primary/30 transition-colors group flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <IconComp className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                <span className="truncate">{agent.name}</span>
                {agent.verified && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Verified
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground truncate">by {agent.author}</p>
            </div>
          </div>
          <Badge variant={agent.price === "Free" ? "outline" : "default"} className="text-xs shrink-0">
            {agent.price}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        <p className="text-sm text-muted-foreground mb-4 flex-1">{agent.description}</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {agent.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-[10px] cursor-pointer hover:bg-primary/10"
              onClick={() => onTagClick(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-500" /> {Number(agent.rating).toFixed(1)}
          </span>
          <span className="flex items-center gap-1">
            <Download className="h-3 w-3" /> {agent.downloads.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mt-auto">
          <Button size="sm" className="text-xs flex-1 min-w-[80px]" disabled={isLoading} onClick={onRun}>
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Play className="h-3 w-3 mr-1" />}
            Run
          </Button>
          {hasScript && onOpenScript && (
            <Button size="sm" variant="secondary" className="text-xs" disabled={isLoading} onClick={onOpenScript}>
              <Code2 className="h-3 w-3 mr-1" />
              Script
            </Button>
          )}
          {isInstalled ? (
            <Button size="sm" variant="outline" className="text-xs" disabled={isLoading} onClick={onUninstall}>
              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
              Installed
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="text-xs" disabled={isLoading} onClick={onInstall}>
              Install
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
