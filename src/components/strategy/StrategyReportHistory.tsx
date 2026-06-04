import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { History, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/AuthProvider";
import { listStrategyReports, deleteStrategyReport } from "@/lib/strategy/strategyReports";
import type { BusinessIdea, StrategyResult, StrategyPlanStep } from "@/lib/strategy/types";
import { useToast } from "@/hooks/use-toast";

export type HistoryReport = {
  id: string;
  title: string;
  business_idea: BusinessIdea;
  result: StrategyResult | null;
  plan_steps: StrategyPlanStep[];
  used_fallback: boolean;
  created_at: string;
};

type StrategyReportHistoryProps = {
  onOpen: (report: HistoryReport) => void;
};

export function StrategyReportHistory({ onOpen }: StrategyReportHistoryProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<HistoryReport[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setReports([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const rows = await listStrategyReports(user.id);
    setReports(
      rows.map((r) => ({
        id: r.id,
        title: r.title,
        business_idea: r.business_idea as BusinessIdea,
        result: r.result as StrategyResult | null,
        plan_steps: (r.plan_steps as StrategyPlanStep[]) || [],
        used_fallback: Boolean(r.used_fallback),
        created_at: r.created_at,
      })),
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleDelete = async (id: string) => {
    await deleteStrategyReport(id);
    toast({ title: "Report deleted" });
    void refresh();
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          Sign in to view saved strategy reports.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Report history
        </CardTitle>
        <CardDescription>Open a past strategy or delete it.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && reports.length === 0 && (
          <p className="text-sm text-muted-foreground">No saved reports yet. Generate your first strategy.</p>
        )}
        {reports.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border/50 p-3 hover:bg-muted/30"
          >
            <div className="min-w-0">
              <p className="font-medium truncate">{r.title}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(r.created_at), "MMM d, yyyy")}
                {r.used_fallback ? " · estimated data" : " · live research"}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button type="button" size="sm" variant="outline" onClick={() => onOpen(r)}>
                <FileText className="h-3.5 w-3.5 mr-1" />
                Open
              </Button>
              <Button type="button" size="icon" variant="ghost" onClick={() => void handleDelete(r.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
