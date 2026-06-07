import { motion } from "framer-motion";
import { Check, ClipboardList, FileText, Loader2, Search, Sparkles } from "lucide-react";
import type { DocumentPipelinePhase } from "@/lib/unifiedDocumentPipeline";

const PHASES = [
  {
    key: "planning",
    label: "Planning",
    desc: "Decomposing your brief into sections and deliverable format",
    icon: ClipboardList,
  },
  {
    key: "researching",
    label: "Researching",
    desc: "Gathering cited sources and evidence (Manus-style)",
    icon: Search,
  },
  {
    key: "drafting",
    label: "Drafting",
    desc: "Writing publication-ready content (Kimi-style)",
    icon: FileText,
  },
  {
    key: "polishing",
    label: "Polishing",
    desc: "Applying professional formatting for Word/PDF export",
    icon: Sparkles,
  },
] as const;

interface DocumentGenerationProgressProps {
  phase: DocumentPipelinePhase;
  topic: string;
}

export function DocumentGenerationProgress({ phase, topic }: DocumentGenerationProgressProps) {
  if (phase === "idle" || phase === "done" || phase === "error") return null;

  const currentIndex = PHASES.findIndex((p) => p.key === phase);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-xl mx-auto py-8 px-4"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
          {(() => {
            const Icon = PHASES[safeIndex]?.icon ?? FileText;
            return <Icon className="w-8 h-8 text-primary animate-pulse" />;
          })()}
        </div>
        <h3 className="text-lg font-bold">{PHASES[safeIndex]?.label}</h3>
        <p className="text-sm text-muted-foreground mt-1">{PHASES[safeIndex]?.desc}</p>
      </div>

      <div className="space-y-2">
        {PHASES.map((p, i) => {
          const isComplete = i < safeIndex;
          const isCurrent = i === safeIndex;
          const Icon = p.icon;

          return (
            <div
              key={p.key}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                isCurrent
                  ? "border-primary/40 bg-primary/5"
                  : isComplete
                    ? "border-green-500/20 bg-green-500/5"
                    : "border-border/40 opacity-50"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isComplete
                    ? "bg-green-500/10 text-green-500"
                    : isCurrent
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isComplete ? (
                  <Check className="w-4 h-4" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{p.label}</p>
                <p className="text-xs text-muted-foreground truncate">{p.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-5 italic">
        Generating &ldquo;<span className="text-foreground font-medium">{topic}</span>&rdquo;
      </p>
    </motion.div>
  );
}
