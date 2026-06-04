import { useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResearchPanel } from "@/components/strategy/ResearchPanel";
import { SWOTAnalysis } from "@/components/strategy/SWOTAnalysis";
import { StrategyCharts } from "@/components/strategy/StrategyCharts";
import { StrategyPDFGenerator } from "@/components/strategy/StrategyPDFGenerator";
import type { BusinessIdea, StrategyResult } from "@/lib/strategy/types";
import { BarChart3, Download, FileText, Search, Target } from "lucide-react";

type StrategyDeliverableViewProps = {
  businessIdea: BusinessIdea;
  result: StrategyResult;
};

export function StrategyDeliverableView({ businessIdea, result }: StrategyDeliverableViewProps) {
  const chartsRef = useRef<HTMLDivElement>(null);

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-1">
        <TabsTrigger value="overview" className="gap-1">
          <FileText className="h-3.5 w-3.5" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="research" className="gap-1">
          <Search className="h-3.5 w-3.5" />
          Research
        </TabsTrigger>
        <TabsTrigger value="swot" className="gap-1">
          <Target className="h-3.5 w-3.5" />
          SWOT
        </TabsTrigger>
        <TabsTrigger value="charts" className="gap-1">
          <BarChart3 className="h-3.5 w-3.5" />
          Charts
        </TabsTrigger>
        <TabsTrigger value="export" className="gap-1">
          <Download className="h-3.5 w-3.5" />
          Export
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <div className="prose prose-invert max-w-none text-sm whitespace-pre-wrap rounded-xl border border-border/50 p-6 bg-muted/20">
          {result.executiveSummary}
        </div>
      </TabsContent>
      <TabsContent value="research">
        <ResearchPanel
          research={result.research}
          isLoading={false}
          businessName={businessIdea.name}
          location={businessIdea.location}
        />
      </TabsContent>
      <TabsContent value="swot">
        <SWOTAnalysis swot={result.swot} />
      </TabsContent>
      <TabsContent value="charts">
        <div ref={chartsRef}>
          <StrategyCharts result={result} />
        </div>
      </TabsContent>
      <TabsContent value="export">
        <StrategyPDFGenerator businessIdea={businessIdea} result={result} chartsRef={chartsRef} />
      </TabsContent>
    </Tabs>
  );
}
