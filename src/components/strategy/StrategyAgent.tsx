import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useStrategyAccess } from "@/hooks/useStrategyAccess";
import { useStrategyRunner } from "@/hooks/useStrategyRunner";
import { useAuth } from "@/components/AuthProvider";
import {
  Brain,
  Search,
  BarChart3,
  FileText,
  Sparkles,
  Globe,
  TrendingUp,
  Target,
  Shield,
  Zap,
  Download,
  ChevronRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Building2,
  DollarSign,
  Users,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { StrategyCharts } from "./StrategyCharts";
import { StrategyPDFGenerator } from "./StrategyPDFGenerator";
import { ResearchPanel } from "./ResearchPanel";
import { SWOTAnalysis } from "./SWOTAnalysis";
import { BusinessSimulator } from "./BusinessSimulator";
import { ProactiveInsights } from "./ProactiveInsights";
import { AutonomousReferralEngine } from "./AutonomousReferralEngine";
import { StrategyStepTimeline } from "./StrategyStepTimeline";
import { StrategyReportHistory, type HistoryReport } from "./StrategyReportHistory";
import type { BusinessIdea, StrategyResult } from "@/lib/strategy/types";

export type { BusinessIdea, StrategyResult } from "@/lib/strategy/types";

const phaseInfo = {
  idle: { label: "Ready", icon: Brain, color: "text-muted-foreground" },
  planning: { label: "Planning research", icon: Brain, color: "text-violet-500" },
  executing: { label: "Running research steps", icon: Globe, color: "text-blue-500" },
  synthesizing: { label: "Building strategy report", icon: FileText, color: "text-orange-500" },
  complete: { label: "Strategy ready", icon: CheckCircle, color: "text-green-500" },
  failed: { label: "Run failed", icon: AlertCircle, color: "text-destructive" },
};

const industryOptions = [
  "Technology", "E-commerce", "Healthcare", "Food & Beverage", 
  "Manufacturing", "Logistics & Delivery", "Education", "Real Estate",
  "Financial Services", "Retail", "Agriculture", "Entertainment"
];

const ceoTemplates = [
  {
    name: "Board Meeting Prep",
    icon: "📊",
    description: "Board deck playbook with financials, KPIs, and action items",
    preset: {
      description: "Prepare a comprehensive board meeting package including: executive summary of quarterly performance, financial highlights (revenue, burn rate, runway), key metrics dashboard, strategic initiatives update, risk register, and proposed resolutions for board approval. Include a structured agenda and time allocations.",
      targetMarket: "Board of Directors, Investors",
    }
  },
  {
    name: "Financial Report Q-Review",
    icon: "💰",
    description: "Quarterly financial analysis with projections and variance reporting",
    preset: {
      description: "Generate a detailed quarterly financial review including: P&L analysis with year-over-year comparisons, cash flow statement, balance sheet highlights, budget vs actual variance analysis, unit economics breakdown, revenue growth trajectory, and 3-quarter forward projections with scenario modeling (base, optimistic, conservative).",
      targetMarket: "CFO, Finance Team, Investors",
    }
  },
  {
    name: "Investor Update",
    icon: "🚀",
    description: "Professional investor update email with metrics and milestones",
    preset: {
      description: "Create a concise investor update covering: headline metrics (MRR, ARR, growth rate, burn), key wins and milestones achieved, product updates and roadmap highlights, team growth, challenges and how they're being addressed, upcoming milestones and goals for next quarter, and any specific asks from investors.",
      targetMarket: "Investors, Advisory Board",
    }
  },
  {
    name: "Market Expansion Analysis",
    icon: "🌍",
    description: "Evaluate new market entry with regulatory and competitive landscape",
    preset: {
      description: "Conduct a comprehensive market expansion analysis including: total addressable market sizing, competitive landscape mapping, regulatory requirements and compliance costs, go-to-market strategy options, resource requirements, risk assessment, and phased entry timeline with milestones and decision gates.",
      targetMarket: "C-Suite, Strategy Team",
    }
  },
];

const StrategyAgent = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const chartsRef = useRef<HTMLDivElement>(null);
  const { canUseStrategy, recordUsage } = useStrategyAccess();
  const runner = useStrategyRunner();

  const phase = runner.phase;
  const progress = runner.progress;
  const result = runner.result;
  const error = runner.error;
  const usedFallback = runner.usedFallback;
  const steps = runner.steps;

  const [activeTab, setActiveTab] = useState("input");
  
  const [businessIdea, setBusinessIdea] = useState<BusinessIdea>({
    name: "",
    description: "",
    location: "",
    industry: "",
    targetMarket: "",
    initialInvestment: ""
  });
  
  const updateBusinessIdea = (field: keyof BusinessIdea, value: string) => {
    setBusinessIdea(prev => ({ ...prev, [field]: value }));
  };

  const validateInput = (): boolean => {
    if (!businessIdea.name.trim()) {
      toast({ title: "Missing Information", description: "Please enter your business name", variant: "destructive" });
      return false;
    }
    if (!businessIdea.description.trim()) {
      toast({ title: "Missing Information", description: "Please describe your business idea", variant: "destructive" });
      return false;
    }
    if (!businessIdea.location.trim()) {
      toast({ title: "Missing Information", description: "Please enter your target location", variant: "destructive" });
      return false;
    }
    if (!businessIdea.industry.trim()) {
      toast({ title: "Missing Information", description: "Please select an industry", variant: "destructive" });
      return false;
    }
    return true;
  };

  const runStrategyAgent = async () => {
    if (!validateInput()) return;
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Create a free account to run Strategy Agent.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    if (!canUseStrategy) return;

    setActiveTab("research");
    try {
      const out = await runner.run(businessIdea, user.id);
      if (!out) return;
      await recordUsage(businessIdea.name, businessIdea.industry);
      setActiveTab("overview");
      toast({
        title: "Strategy complete",
        description: out.usedFallback
          ? "Report saved with estimated sections — retry for more live sources."
          : "Your business strategy is ready with web-backed research.",
      });
    } catch {
      toast({
        title: "Strategy failed",
        description: error || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetAgent = () => {
    runner.reset();
    setActiveTab("input");
  };

  const openHistoryReport = (report: HistoryReport) => {
    setBusinessIdea(report.business_idea);
    runner.loadReport({
      id: report.id,
      business_idea: report.business_idea,
      result: report.result,
      plan_steps: report.plan_steps,
      used_fallback: report.used_fallback,
    });
    setActiveTab("overview");
  };

  const PhaseIcon = phaseInfo[phase]?.icon ?? Brain;
  const phaseMeta = phaseInfo[phase] ?? phaseInfo.idle;
  const isRunning = runner.isRunning;

  // No paywall — strategy agent is free for all logged-in users

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Business Intelligence</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
            ShadowTalk Strategy Agent
          </h1>
          
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Autonomous multi-step research with live web sources, SWOT and financials, saved report history, and PDF export.
          </p>
        </motion.div>

        {!user && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm">Sign in to run Strategy Agent and save reports.</p>
              <Button type="button" onClick={() => navigate("/auth")}>
                Sign in free
              </Button>
            </CardContent>
          </Card>
        )}

        {usedFallback && phase === "complete" && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90">
            Some sections use estimated data because live research did not complete. Run again for web-backed sources.
          </div>
        )}

        {/* Status Bar */}
        <Card className="border-2 border-primary/20 bg-card/80 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full bg-primary/10 ${phaseMeta.color}`}>
                  <PhaseIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{phaseMeta.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {phase === "idle" && "Enter your business details to begin"}
                    {phase === "planning" && "Building a research playbook…"}
                    {phase === "executing" && "Running web search and deep research steps…"}
                    {phase === "synthesizing" && "Compiling investor-ready report…"}
                    {phase === "complete" && "Your strategy is ready for review"}
                    {phase === "failed" && (error || "Something went wrong")}
                  </p>
                </div>
              </div>
              
              {phase !== "idle" && (
                <div className="flex items-center gap-4 min-w-[200px]">
                  <Progress value={progress} className="flex-1" />
                  <span className="text-sm font-medium">{progress}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 md:grid-cols-10 gap-2 h-auto p-2 bg-muted/50">
            <TabsTrigger value="input" className="gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Input</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="research" disabled={!result && !isRunning} className="gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Research</span>
            </TabsTrigger>
            <TabsTrigger value="overview" disabled={!result} className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="swot" disabled={!result} className="gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">SWOT</span>
            </TabsTrigger>
            <TabsTrigger value="charts" disabled={!result} className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Charts</span>
            </TabsTrigger>
            <TabsTrigger value="export" disabled={!result} className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </TabsTrigger>
            <TabsTrigger value="simulator" className="gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Simulator</span>
            </TabsTrigger>
            <TabsTrigger value="hype" className="gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Hype Engine</span>
            </TabsTrigger>
            <TabsTrigger value="referrals" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Referrals</span>
            </TabsTrigger>
          </TabsList>

          {/* Input Tab */}
          <TabsContent value="input">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* CEO Suite Templates */}
              <Card className="border-2 border-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-primary" />
                    CEO Suite — Quick Templates
                  </CardTitle>
                  <CardDescription>
                    CEO playbooks that pre-fill your goal. Click to auto-fill, then generate.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {ceoTemplates.map((template, i) => (
                      <button
                        key={i}
                        disabled={isRunning}
                        onClick={() => {
                          setBusinessIdea(prev => ({
                            ...prev,
                            description: template.preset.description,
                            targetMarket: template.preset.targetMarket,
                            name: prev.name || "My Company",
                          }));
                          toast({ title: `${template.icon} ${template.name}`, description: "Template applied. Fill in your company details and generate." });
                        }}
                        className="p-4 rounded-lg border border-border/50 hover:border-primary/40 hover:bg-primary/5 text-left transition-all disabled:opacity-50 group"
                      >
                        <span className="text-2xl mb-2 block">{template.icon}</span>
                        <p className="font-medium text-sm group-hover:text-primary transition-colors">{template.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Business Details
                  </CardTitle>
                  <CardDescription>
                    Tell us about your business idea and we'll generate a comprehensive strategy
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        Business Name *
                      </label>
                      <Input
                        placeholder="e.g., SwiftDrone Logistics"
                        value={businessIdea.name}
                        onChange={(e) => updateBusinessIdea("name", e.target.value)}
                        disabled={isRunning}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        Target Location *
                      </label>
                      <Input
                        placeholder="e.g., Karachi, Pakistan"
                        value={businessIdea.location}
                        onChange={(e) => updateBusinessIdea("location", e.target.value)}
                        disabled={isRunning}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        Industry *
                      </label>
                      <select
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        value={businessIdea.industry}
                        onChange={(e) => updateBusinessIdea("industry", e.target.value)}
                        disabled={isRunning}
                      >
                        <option value="">Select Industry</option>
                        {industryOptions.map(ind => (
                          <option key={ind} value={ind}>{ind}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        Target Market
                      </label>
                      <Input
                        placeholder="e.g., E-commerce businesses, Restaurants"
                        value={businessIdea.targetMarket}
                        onChange={(e) => updateBusinessIdea("targetMarket", e.target.value)}
                        disabled={isRunning}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        Initial Investment
                      </label>
                      <Input
                        placeholder="e.g., $50,000"
                        value={businessIdea.initialInvestment}
                        onChange={(e) => updateBusinessIdea("initialInvestment", e.target.value)}
                        disabled={isRunning}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Business Description *
                    </label>
                    <Textarea
                      placeholder="Describe your business idea in detail. What problem does it solve? What makes it unique? Who are your customers?"
                      value={businessIdea.description}
                      onChange={(e) => updateBusinessIdea("description", e.target.value)}
                      disabled={isRunning}
                      rows={4}
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
                      <AlertCircle className="h-5 w-5" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-4 pt-4">
                    <Button
                      onClick={runStrategyAgent}
                      disabled={isRunning}
                      size="lg"
                      className="flex-1 gap-2"
                    >
                      {!isRunning ? (
                        <>
                          <Zap className="h-5 w-5" />
                          Generate Strategy
                        </>
                      ) : (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      )}
                    </Button>
                    
                    {phase === "complete" && (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={resetAgent}
                        className="gap-2"
                      >
                        <RefreshCw className="h-5 w-5" />
                        Start Over
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="history">
            <StrategyReportHistory onOpen={openHistoryReport} />
          </TabsContent>

          {/* Research Tab */}
          <TabsContent value="research" className="space-y-4">
            {isRunning && steps.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Research steps</CardTitle>
                  <CardDescription>Live tools run in sequence — sources attach to your report.</CardDescription>
                </CardHeader>
                <CardContent>
                  <StrategyStepTimeline steps={steps} />
                </CardContent>
              </Card>
            )}
            <ResearchPanel 
              research={result?.research || null} 
              isLoading={isRunning}
              businessName={businessIdea.name}
              location={businessIdea.location}
            />
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview">
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className="border-2 border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Executive Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {result.executiveSummary}
                    </p>
                  </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Target className="h-5 w-5 text-green-500" />
                        Strategic Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 mt-1 text-primary shrink-0" />
                            <span className="text-sm text-muted-foreground">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Shield className="h-5 w-5 text-orange-500" />
                        Risk Assessment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {result.riskAssessment}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      Implementation Roadmap
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {result.implementationPlan.map((step, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">{i + 1}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{step}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* SWOT Tab */}
          <TabsContent value="swot">
            {result && <SWOTAnalysis swot={result.swot} businessName={businessIdea.name} />}
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts">
            {result && (
              <div ref={chartsRef}>
                <StrategyCharts 
                  financialProjections={result.financialProjections}
                  competitors={result.research.competitors}
                  costs={result.research.costs}
                />
              </div>
            )}
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export">
            {result && (
              <StrategyPDFGenerator
                businessIdea={businessIdea}
                result={result}
                chartsRef={chartsRef}
              />
            )}
          </TabsContent>

          {/* Simulator Tab */}
          <TabsContent value="simulator">
            <BusinessSimulator />
          </TabsContent>

          {/* Hype Engine Tab */}
          <TabsContent value="hype">
            <ProactiveInsights />
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals">
            <AutonomousReferralEngine />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StrategyAgent;
