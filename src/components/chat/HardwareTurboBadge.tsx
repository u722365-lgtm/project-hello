import { Zap, Cpu, Cloud, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHardwareIntelligence } from "@/hooks/useHardwareIntelligence";
import type { ExecutionPath } from "@/lib/hardwareIntelligence";

function pathIcon(path: ExecutionPath | undefined) {
  switch (path) {
    case "local-webgpu":
      return <Zap className="h-3 w-3" />;
    case "local-wasm":
      return <Cpu className="h-3 w-3" />;
    case "cloud":
      return <Cloud className="h-3 w-3" />;
    default:
      return <Zap className="h-3 w-3 opacity-70" />;
  }
}

function pathLabel(path: ExecutionPath | undefined, tier: string | undefined) {
  if (tier === "turbo") return "Turbo";
  if (path === "local-webgpu") return "GPU";
  if (path === "local-wasm") return "CPU";
  if (path === "cloud") return "Cloud";
  return "Auto";
}

export function HardwareTurboBadge() {
  const { profile, loading } = useHardwareIntelligence();

  if (loading && !profile) {
    return (
      <Badge variant="outline" className="gap-1 text-[10px] font-normal opacity-70">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="hidden sm:inline">Scanning…</span>
      </Badge>
    );
  }

  if (!profile) return null;

  const variant =
    profile.tier === "turbo"
      ? "default"
      : profile.tier === "cloud"
        ? "secondary"
        : "outline";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className="gap-1 text-[10px] font-medium cursor-default">
            {pathIcon(profile.path)}
            <span className="hidden sm:inline">{pathLabel(profile.path, profile.tier)}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs">
          <p className="font-medium">Speed path</p>
          <p className="text-muted-foreground mt-1">{profile.summary}</p>
          <p className="text-muted-foreground mt-1">
            CPU {profile.cpuScore}/100 · GPU {profile.gpuScore}/100
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
