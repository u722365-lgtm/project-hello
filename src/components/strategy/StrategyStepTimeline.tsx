import { CheckCircle, Circle, Loader2, XCircle } from "lucide-react";
import type { StrategyPlanStep } from "@/lib/strategy/types";

type StrategyStepTimelineProps = {
  steps: StrategyPlanStep[];
};

export function StrategyStepTimeline({ steps }: StrategyStepTimelineProps) {
  if (!steps.length) return null;

  return (
    <div className="space-y-2">
      {steps.map((step) => {
        const icon =
          step.status === "completed" ? (
            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
          ) : step.status === "running" ? (
            <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
          ) : step.status === "failed" ? (
            <XCircle className="h-4 w-4 text-destructive shrink-0" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
          );

        const sourceCount = step.proof?.sources?.length ?? 0;

        return (
          <div
            key={step.id}
            className="flex items-start gap-3 rounded-lg border border-border/40 bg-muted/20 px-3 py-2"
          >
            {icon}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug">{step.action}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {step.tool_name.replace("_", " ")}
                {sourceCount > 0 ? ` · ${sourceCount} source${sourceCount === 1 ? "" : "s"}` : ""}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
