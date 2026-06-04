import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Rocket,
  Play,
  Square,
  Loader2,
  Plus,
  Target,
  Clock,
  Building2,
  FileText,
  AlertCircle,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { useMissions, Mission, MissionDeliverableType } from "@/hooks/useMissions";
import { useMissionExecutor } from "@/hooks/useMissionExecutor";
import { useMissionQuota } from "@/hooks/useMissionQuota";
import { buildStrategyGoal } from "@/lib/strategy/goalContext";
import type { BusinessIdea, StrategyResult } from "@/lib/strategy/types";
import {
  DELIVERABLE_LABELS,
  DeliverableType,
  EXECUTION_TEMPLATES,
  EXECUTION_TEMPLATE_CATEGORIES,
} from "@/lib/execution";
import { parseMissionResult } from "@/lib/execution/synthesizeDeliverable";
import { StrategyStepTimeline } from "@/components/strategy/StrategyStepTimeline";
import { StrategyDeliverableView } from "@/components/execution/StrategyDeliverableView";
import { ShareResultDialog } from "@/components/growth/ShareResultDialog";
import { useUserReferralCode } from "@/hooks/useUserReferralCode";
import type { MissionPlanStep } from "@/lib/see/types";

const industryOptions = [
  "Technology", "E-commerce", "Healthcare", "Food & Beverage",
  "Manufacturing", "Logistics & Delivery", "Education", "Real Estate",
  "Financial Services", "Retail", "Agriculture", "Entertainment",
];

const emptyIdea = (): BusinessIdea => ({
  name: "",
  description: "",
  location: "",
  industry: "",
  targetMarket: "",
  initialInvestment: "",
});

type ShadowExecutionProps = {
  initialDeliverable?: DeliverableType;
  initialGoal?: string;
  onClose?: () => void;
  embedded?: boolean;
};

export function ShadowExecution({
  initialDeliverable = "general",
  initialGoal,
  onClose,
  embedded = false,
}: ShadowExecutionProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const referralCode = useUserReferralCode();
  const { missions, activeMission, fetchActions, createMission, setActiveMission } = useMissions();
  const { isExecuting, executeMission, cancelExecution } = useMissionExecutor();
  const { canCreateMission, consumeMission } = useMissionQuota();

  const [deliverableType, setDeliverableType] = useState<DeliverableType>(initialDeliverable);
  const [goal, setGoal] = useState(initialGoal || "");
  const [title, setTitle] = useState("");
  const [autoApprove, setAutoApprove] = useState(false);
  const [activeTab, setActiveTab] = useState("run");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [shareOpen, setShareOpen] = useState(false);
  const [businessIdea, setBusinessIdea] = useState<BusinessIdea>(emptyIdea());

  useEffect(() => {
    if (initialGoal) setGoal(initialGoal);
  }, [initialGoal]);

  useEffect(() => {
    if (activeMission) void fetchActions(activeMission.id);
  }, [activeMission, fetchActions]);

  const isStrategy = deliverableType === "strategy_report";

  const validateStrategy = (): boolean => {
    if (!businessIdea.name.trim() || !businessIdea.description.trim() || !businessIdea.location.trim() || !businessIdea.industry.trim()) {
      toast({ title: "Missing business details", description: "Name, description, location, and industry are required.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleRun = async () => {
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      navigate("/auth");
      return;
    }
    if (isStrategy && !validateStrategy()) return;
    if (!isStrategy && !goal.trim()) {
      toast({ title: "Enter a goal", variant: "destructive" });
      return;
    }
    if (!canCreateMission) {
      toast({ title: "Quota reached", description: "Upgrade for more executions this month.", variant: "destructive" });
      return;
    }

    const runGoal = isStrategy ? buildStrategyGoal(businessIdea) : goal.trim();
    const runTitle = title.trim() || businessIdea.name || runGoal.slice(0, 60);

    const mission = await createMission(runTitle, runGoal, {
      auto_approve: autoApprove,
      deliverable_type: deliverableType as MissionDeliverableType,
      business_idea: isStrategy ? (businessIdea as unknown as Record<string, unknown>) : undefined,
      description: isStrategy ? businessIdea.description : undefined,
    });

    if (mission) {
      setActiveMission(mission);
      setActiveTab("live");
      await consumeMission();
      void executeMission(mission);
    }
  };

  const parsedActive = parseMissionResult(activeMission?.result);
  const strategyResult = parsedActive.strategy;
  const strategyIdea = (activeMission?.business_idea as BusinessIdea | undefined) ?? businessIdea;

  const filteredTemplates =
    templateFilter === "all"
      ? EXECUTION_TEMPLATES
      : EXECUTION_TEMPLATES.filter((t) => t.category === templateFilter);

  const openMission = (m: Mission) => {
    setActiveMission(m);
    setActiveTab("deliverable");
    if (m.deliverable_type === "strategy_report" && m.business_idea) {
      setBusinessIdea(m.business_idea as BusinessIdea);
      setDeliverableType("strategy_report");
    }
  };

  const liveSteps = (activeMission?.steps || []) as MissionPlanStep[];

  return (
    <div className={embedded ? "space-y-6" : "min-h-screen bg-gradient-to-br from-background via-background to-violet-500/5 p-4 md:p-8"}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 mb-3">
              <Rocket className="h-4 w-4 text-violet-400" />
              <span className="text-xs font-medium text-violet-300">Shadow Execution · S.E.E.</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">One engine. Any deliverable.</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Merged Strategy Agent + Mission Control — autonomous plans, live web research, and investor-ready outputs.
            </p>
          </div>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>

        {!user && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-4 flex justify-between items-center gap-3 flex-wrap">
              <p className="text-sm">Sign in to run Shadow Execution and save history.</p>
              <Button onClick={() => navigate("/auth")}>Sign in</Button>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="run" className="gap-1">
              <Plus className="h-4 w-4" />
              Run
            </TabsTrigger>
            <TabsTrigger value="live" className="gap-1">
              {isExecuting && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
              <Target className="h-4 w-4" />
              Live
            </TabsTrigger>
            <TabsTrigger value="deliverable" className="gap-1">
              <FileText className="h-4 w-4" />
              Deliverable
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1">
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="run" className="space-y-6 mt-4">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(DELIVERABLE_LABELS) as DeliverableType[]).map((d) => (
                <Button
                  key={d}
                  type="button"
                  size="sm"
                  variant={deliverableType === d ? "default" : "outline"}
                  onClick={() => setDeliverableType(d)}
                  disabled={isExecuting}
                >
                  {DELIVERABLE_LABELS[d]}
                </Button>
              ))}
            </div>

            {isStrategy && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Business context
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <Input placeholder="Business name *" value={businessIdea.name} onChange={(e) => setBusinessIdea((p) => ({ ...p, name: e.target.value }))} disabled={isExecuting} />
                  <Input placeholder="Location *" value={businessIdea.location} onChange={(e) => setBusinessIdea((p) => ({ ...p, location: e.target.value }))} disabled={isExecuting} />
                  <select className="h-10 rounded-md border border-input bg-background px-3 text-sm md:col-span-2" value={businessIdea.industry} onChange={(e) => setBusinessIdea((p) => ({ ...p, industry: e.target.value }))} disabled={isExecuting}>
                    <option value="">Industry *</option>
                    {industryOptions.map((i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                  <Textarea className="md:col-span-2" placeholder="Business description *" rows={3} value={businessIdea.description} onChange={(e) => setBusinessIdea((p) => ({ ...p, description: e.target.value }))} disabled={isExecuting} />
                  <Input placeholder="Target market" value={businessIdea.targetMarket} onChange={(e) => setBusinessIdea((p) => ({ ...p, targetMarket: e.target.value }))} disabled={isExecuting} />
                  <Input placeholder="Initial investment" value={businessIdea.initialInvestment} onChange={(e) => setBusinessIdea((p) => ({ ...p, initialInvestment: e.target.value }))} disabled={isExecuting} />
                </CardContent>
              </Card>
            )}

            {!isStrategy && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Goal</label>
                <Textarea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What should Shadow Execution accomplish?" rows={4} disabled={isExecuting} />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4">
              <Input className="max-w-xs" placeholder="Optional title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isExecuting} />
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
                Auto-approve sensitive tools
              </label>
              <Button size="lg" className="gap-2 ml-auto" onClick={() => void handleRun()} disabled={isExecuting}>
                {isExecuting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                Run execution
              </Button>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Templates</CardTitle>
                <div className="flex flex-wrap gap-1 pt-2">
                  {EXECUTION_TEMPLATE_CATEGORIES.map((c) => (
                    <Button key={c.key} type="button" size="sm" variant={templateFilter === c.key ? "secondary" : "ghost"} onClick={() => setTemplateFilter(c.key)}>
                      {c.label}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredTemplates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={isExecuting}
                    className="text-left p-3 rounded-lg border border-border/50 hover:border-violet-500/40 hover:bg-violet-500/5 transition-colors disabled:opacity-50"
                    onClick={() => {
                      setDeliverableType(t.deliverableType);
                      if (t.ceoPreset) {
                        setBusinessIdea((p) => ({
                          ...p,
                          description: t.ceoPreset!.description,
                          targetMarket: t.ceoPreset!.targetMarket,
                          name: p.name || "My Company",
                        }));
                      } else {
                        setGoal(t.prompt);
                      }
                      toast({ title: t.label, description: "Template applied." });
                    }}
                  >
                    <span className="text-xl">{t.icon}</span>
                    <p className="font-medium text-sm mt-1">{t.label}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="live" className="mt-4 space-y-4">
            {activeMission ? (
              <>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start gap-2 flex-wrap">
                      <div>
                        <h3 className="font-semibold">{activeMission.title}</h3>
                        <Badge variant="outline" className="mt-1">{DELIVERABLE_LABELS[activeMission.deliverable_type || "general"]}</Badge>
                      </div>
                      <Badge>{activeMission.status}</Badge>
                    </div>
                    <Progress value={activeMission.progress} className="mt-3 h-2" />
                    {isExecuting && (
                      <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={cancelExecution}>
                        <Square className="h-3 w-3" />
                        Cancel
                      </Button>
                    )}
                  </CardContent>
                </Card>
                <StrategyStepTimeline steps={liveSteps} />
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No active run. Start one from the Run tab.</p>
            )}
          </TabsContent>

          <TabsContent value="deliverable" className="mt-4 space-y-4">
            {activeMission?.used_fallback && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm flex gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Some sections use estimated data — re-run for more live sources.
              </div>
            )}
            {strategyResult && activeMission?.deliverable_type === "strategy_report" ? (
              <StrategyDeliverableView businessIdea={strategyIdea} result={strategyResult} />
            ) : parsedActive.markdown ? (
              <div className="prose prose-invert max-w-none text-sm whitespace-pre-wrap rounded-xl border p-6 bg-muted/20">
                {parsedActive.markdown}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Complete an execution to view deliverables here.</p>
            )}
            {activeMission?.status === "completed" && (
              <Button variant="secondary" className="gap-2" onClick={() => setShareOpen(true)}>
                <Share2 className="h-4 w-4" />
                Share result
              </Button>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-2">
            {missions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No executions yet.</p>
            ) : (
              missions.map((m) => (
                <Card key={m.id} className="cursor-pointer hover:border-violet-500/30" onClick={() => openMission(m)}>
                  <CardContent className="py-3 flex justify-between items-center gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{m.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {DELIVERABLE_LABELS[(m.deliverable_type || "general") as DeliverableType]} · {new Date(m.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">{m.status}</Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ShareResultDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        kind="mission"
        title={activeMission?.title || "Shadow Execution complete"}
        subtitle={activeMission?.goal?.slice(0, 120)}
        referralCode={referralCode}
      />
    </div>
  );
}
