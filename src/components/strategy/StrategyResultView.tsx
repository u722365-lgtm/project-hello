import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StrategyResult } from "@/hooks/useStrategyRunner";
import { CheckCircle, AlertTriangle, Target, TrendingUp, Lightbulb, ShieldAlert } from "lucide-react";

export function StrategyResultView({ result }: { result: StrategyResult }) {
  if (!result) return null;

  return (
    <div className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-primary">
            <Target className="h-5 w-5" /> Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{result.executiveSummary}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-emerald-500">
              <TrendingUp className="h-4 w-4" /> Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.swot?.strengths?.map((s, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="mt-0.5">•</span> {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-rose-500/20 bg-rose-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-rose-500">
              <AlertTriangle className="h-4 w-4" /> Weaknesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.swot?.weaknesses?.map((w, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="mt-0.5">•</span> {w}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-cyan-500/20 bg-cyan-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-cyan-500">
              <Lightbulb className="h-4 w-4" /> Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.swot?.opportunities?.map((o, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="mt-0.5">•</span> {o}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-500">
              <ShieldAlert className="h-4 w-4" /> Threats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.swot?.threats?.map((t, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="mt-0.5">•</span> {t}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Market Research & Costs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Market Trends</h4>
            <div className="flex flex-wrap gap-2">
              {result.research?.marketTrends?.map((t, i) => (
                <Badge key={i} variant="secondary">{t}</Badge>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2">Estimated Costs</h4>
            <ul className="space-y-1">
              {result.research?.costs?.map((c, i) => (
                <li key={i} className="text-sm text-muted-foreground">- {c}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Implementation Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {result.implementationPlan?.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="mt-0.5">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">{step.phase}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
