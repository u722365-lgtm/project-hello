import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { PAGE_SEO } from "@/lib/seo";
import { ShadowExecution } from "@/components/execution/ShadowExecution";
import ComingSoonPopup from "@/components/ComingSoonPopup";
import type { DeliverableType } from "@/lib/execution/types";

const MODES: DeliverableType[] = ["general", "strategy_report", "research_brief", "content_pack"];

function parseMode(raw: string | null): DeliverableType {
  if (raw && MODES.includes(raw as DeliverableType)) return raw as DeliverableType;
  if (raw === "strategy") return "strategy_report";
  return "general";
}

const ExecutePage = () => {
  const [params] = useSearchParams();
  const mode = parseMode(params.get("mode") || params.get("deliverable"));
  const goal = params.get("goal") ?? undefined;
  const [showPopup, setShowPopup] = useState(true);

  useEffect(() => {
    document.title = "Shadow Execution | ShadowTalk AI";
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead meta={PAGE_SEO.execute} />
      <Navigation />
      <main className="flex-1 pt-20">
        <ShadowExecution initialDeliverable={mode} initialGoal={goal} />
      </main>
      <Footer />
      {showPopup && (
        <ComingSoonPopup
          feature="Shadow Execution"
          description="Automated AI execution engine is being rebuilt. Strategy reports, research briefs, and content packs will be available soon. Stay tuned!"
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
};

export default ExecutePage;
