import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ComputerModePanel } from "@/components/computer/ComputerModePanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe } from "lucide-react";
import "@/index.css";

function ComputerFrameApp() {
  const isolated = typeof crossOriginIsolated !== "undefined" && crossOriginIsolated;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <a href="/computer">
              <ArrowLeft className="h-4 w-4 mr-1" />
              ShadowTalk
            </a>
          </Button>
          <span className="text-sm font-medium">Computer Mode (isolated shell)</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={isolated ? "text-emerald-500" : "text-amber-500"}>
            {isolated ? "● Cross-origin isolated" : "● Isolation pending — hard refresh if shell fails"}
          </span>
          <Button variant="outline" size="sm" asChild>
            <a href="/research?tab=browser">
              <Globe className="h-3.5 w-3.5 mr-1" />
              Web browser
            </a>
          </Button>
        </div>
      </header>
      <main className="p-4 max-w-5xl mx-auto">
        <ComputerModePanel embedded />
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ComputerFrameApp />
  </BrowserRouter>,
);
