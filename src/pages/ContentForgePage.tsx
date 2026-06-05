import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Presentation, FileText, Sparkles, Palette } from "lucide-react";
import CreativeStudioPage from "@/pages/CreativeStudioPage";
import Navigation from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import PresentationBuilderPage from "@/pages/PresentationBuilderPage";
import { DocumentForgePanel } from "@/components/content-forge/DocumentForgePanel";
import { BeastForgePanel } from "@/components/content-forge/BeastForgePanel";
import {
  CONTENT_FORGE_MODES,
  parseForgeMode,
  type ContentForgeMode,
} from "@/lib/contentForge";
import { SEOHead } from "@/components/SEOHead";
import { PAGE_SEO } from "@/lib/seo";

const ContentForgePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = parseForgeMode(searchParams.get("mode"));
  const topic = searchParams.get("topic") || searchParams.get("q") || "";
  const auto = searchParams.get("auto") === "1";

  const setMode = useCallback(
    (next: ContentForgeMode) => {
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        p.set("mode", next);
        if (next === "slides" && p.get("load") !== "session") {
          p.delete("auto");
        }
        return p;
      });
    },
    [setSearchParams],
  );

  const handleBeastComplete = useCallback(
    (_slideCount: number) => {
      setSearchParams({ mode: "slides", load: "session" });
    },
    [setSearchParams],
  );

  const modeIcons: Record<ContentForgeMode, React.ReactNode> = {
    slides: <Presentation className="h-4 w-4" />,
    documents: <FileText className="h-4 w-4" />,
    beast: <Zap className="h-4 w-4" />,
    studio: <Palette className="h-4 w-4" />,
  };

  return (
    <div className="app-min-height bg-background flex flex-col">
      <SEOHead
        meta={{
          ...PAGE_SEO.presentations,
          title: "Shadow Content Forge — Slides, Documents & Beast Mode",
          description:
            "Unified AI content studio: Kimi-class presentations, long-form documents, and Beast Mode — document + deck in one run.",
        }}
      />
      <Navigation />
      <div className="pt-16 flex flex-col flex-1 min-h-0 app-shell-height">
        <div className="border-b border-border px-4 py-3 bg-card/60 backdrop-blur shrink-0">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-primary/20">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-bold flex items-center gap-2">
                  Shadow Content Forge
                  <Badge variant="secondary" className="text-[10px] font-normal">Unified</Badge>
                </h1>
                <p className="text-[11px] text-muted-foreground">Slides, documents, studio & Beast Mode — one workspace</p>
              </div>
            </div>

            <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-border/50">
              {CONTENT_FORGE_MODES.map((m) => {
                const active = mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    className={cn(
                      "relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                      active
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="forge-mode-pill"
                        className="absolute inset-0 rounded-lg bg-primary shadow-sm"
                        transition={{ type: "spring", stiffness: 480, damping: 36 }}
                      />
                    )}
                    <span className="relative flex items-center gap-1.5">
                      {modeIcons[m.id]}
                      {m.label}
                      {m.id === "beast" && (
                        <Zap className="h-3 w-3 text-amber-400 relative" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          {mode === "slides" && (
            <PresentationBuilderPage embedded />
          )}
          {mode === "documents" && (
            <DocumentForgePanel
              initialPrompt={topic}
              autoGenerate={auto && !!topic}
            />
          )}
          {mode === "beast" && (
            <BeastForgePanel initialTopic={topic} onComplete={handleBeastComplete} />
          )}
          {mode === "studio" && <CreativeStudioPage embedded />}
        </div>
      </div>
    </div>
  );
};

export default ContentForgePage;
