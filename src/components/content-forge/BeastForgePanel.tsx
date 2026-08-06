import { useState } from "react";
import { motion } from "framer-motion";
import {
  Zap, FileText, Presentation, Loader2, Sparkles, ArrowRight, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { backend } from "@/integrations/local/client";
import GenerationProgress, { type GenerationPhase } from "@/components/presentation/GenerationProgress";
import {
  KIMI_DOCUMENT_TYPES,
  KIMI_LENGTHS,
  type KimiDocumentType,
  type KimiToneType,
  type KimiLengthType,
} from "@/lib/kimiDocumentGeneration";
import { runUnifiedDocumentPipeline } from "@/lib/unifiedDocumentPipeline";
import {
  generateKimiPresentation,
  savePresentationToSession,
  type KimiPresentationMode,
  KIMI_PRESENTATION_MODES,
} from "@/lib/kimiPresentation";
import { saveBeastSession } from "@/lib/contentForge";
import type { ThemeKey } from "@/components/presentation/types";
import { THEMES as THEME_MAP } from "@/components/presentation/types";

type BeastPhase = "idle" | "document" | "slides" | "complete";

export interface BeastForgePanelProps {
  initialTopic?: string;
  onComplete: (slideCount: number) => void;
}

export function BeastForgePanel({ initialTopic = "", onComplete }: BeastForgePanelProps) {
  const { toast } = useToast();
  const [topic, setTopic] = useState(initialTopic);
  const [additionalContext, setAdditionalContext] = useState("");
  const [docType, setDocType] = useState<KimiDocumentType>("report");
  const [tone, setTone] = useState<KimiToneType>("professional");
  const [length, setLength] = useState<KimiLengthType>("long");
  const [slideCount, setSlideCount] = useState("12");
  const [style, setStyle] = useState<ThemeKey>("corporate");
  const [presentationMode, setPresentationMode] = useState<KimiPresentationMode>("adaptive");
  const [phase, setPhase] = useState<BeastPhase>("idle");
  const [slideGenPhase, setSlideGenPhase] = useState<GenerationPhase>("idle");
  const [documentPreview, setDocumentPreview] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [slideCountResult, setSlideCountResult] = useState(0);
  const [busy, setBusy] = useState(false);

  const runBeast = async () => {
    if (!topic.trim()) {
      toast({ title: "Enter a topic", variant: "destructive" });
      return;
    }

    setBusy(true);
    setPhase("document");
    setDocumentPreview("");
    setWordCount(0);
    setSlideCountResult(0);

    try {
      const { data: { session } } = await backend.auth.getSession();
      const { content: doc } = await runUnifiedDocumentPipeline({
        topic,
        docType,
        tone,
        length,
        additionalContext,
        accessToken: session?.access_token,
        onChunk: (chunk) => {
          setDocumentPreview(chunk);
          setWordCount(chunk.split(/\s+/).filter(Boolean).length);
        },
      });

      saveBeastSession({
        topic,
        documentMarkdown: doc,
        docType,
        savedAt: Date.now(),
      });

      setPhase("slides");
      setSlideGenPhase("researching");
      const timers = [
        setTimeout(() => setSlideGenPhase("structuring"), 5000),
        setTimeout(() => setSlideGenPhase("designing"), 12000),
        setTimeout(() => setSlideGenPhase("polishing"), 22000),
      ];

      const deck = await generateKimiPresentation({
        topic,
        slideCount: parseInt(slideCount, 10) || 12,
        style,
        mode: presentationMode,
        additionalContext,
        sourceDocument: doc.slice(0, 14000),
      });

      timers.forEach(clearTimeout);
      setSlideGenPhase("done");

      const slides = (deck.slides || []).map((s, i) => ({
        ...s,
        id: s.id || `slide-${i}-${Date.now()}`,
      }));
      savePresentationToSession({ ...deck, slides }, style);
      setSlideCountResult(slides.length);
      setPhase("complete");

      toast({
        title: "Beast mode complete",
        description: `${wordCount.toLocaleString()} word document + ${slides.length} slides ready.`,
      });
      onComplete(slides.length);
    } catch (err) {
      console.error("[BeastForge]", err);
      setPhase("idle");
      setSlideGenPhase("idle");
      toast({
        title: "Beast run failed",
        description: err instanceof Error ? err.message : "Try a shorter document length.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
      setSlideGenPhase("idle");
    }
  };

  const isRunning = busy || phase === "document" || phase === "slides";

  return (
    <div className="h-full overflow-y-auto p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center border border-primary/30 shadow-[0_0_40px_hsl(var(--primary)/0.15)]"
          >
            <Zap className="h-8 w-8 text-primary" />
          </motion.div>
          <h2 className="text-2xl font-bold tracking-tight">Beast Mode</h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            One run produces a publication-ready document <strong>and</strong> a research-backed slide deck
            derived from it — document first, then slides.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="gap-1"><FileText className="h-3 w-3" /> Document</Badge>
            <ArrowRight className="h-3 w-3" />
            <Badge variant="outline" className="gap-1"><Presentation className="h-3 w-3" /> Slides</Badge>
          </div>
        </div>

        {phase === "complete" ? (
          <Card className="p-8 text-center space-y-4 border-emerald-500/30 bg-emerald-500/5">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <h3 className="text-xl font-bold">Deliverables ready</h3>
            <p className="text-sm text-muted-foreground">
              {wordCount.toLocaleString()} words · {slideCountResult} slides · open the Slides tab to edit and export PPTX
            </p>
            <Button onClick={() => onComplete(slideCountResult)} className="gap-2">
              <Presentation className="h-4 w-4" />
              Open slide editor
            </Button>
          </Card>
        ) : isRunning ? (
          <div className="space-y-6">
            {phase === "document" && (
              <Card className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Phase 1 — Writing document…
                  {wordCount > 0 && <Badge variant="secondary">{wordCount.toLocaleString()} words</Badge>}
                </div>
                {documentPreview && (
                  <pre className="text-xs font-mono whitespace-pre-wrap max-h-48 overflow-y-auto bg-muted/40 p-3 rounded-lg border">
                    {documentPreview.slice(-1200)}
                  </pre>
                )}
              </Card>
            )}
            {phase === "slides" && (
              <GenerationProgress phase={slideGenPhase} topic={topic} />
            )}
          </div>
        ) : (
          <Card className="p-6 md:p-8 space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Topic / project</label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Series A pitch for climate-tech SaaS"
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Document type</label>
                <Select value={docType} onValueChange={(v) => setDocType(v as KimiDocumentType)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {KIMI_DOCUMENT_TYPES.slice(0, 10).map((d) => (
                      <SelectItem key={d.type} value={d.type}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Document length</label>
                <Select value={length} onValueChange={(v) => setLength(v as KimiLengthType)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {KIMI_LENGTHS.filter((l) => l.value !== "brief").map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label} ({l.words})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Slide count</label>
                <Select value={slideCount} onValueChange={setSlideCount}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["8", "10", "12", "15", "20"].map((n) => (
                      <SelectItem key={n} value={n}>{n} slides</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Deck theme</label>
                <Select value={style} onValueChange={(v) => setStyle(v as ThemeKey)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(THEME_MAP).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Tone</label>
                <Select value={tone} onValueChange={(v) => setTone(v as KimiToneType)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="persuasive">Persuasive</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Slide style</label>
                <Select value={presentationMode} onValueChange={(v) => setPresentationMode(v as KimiPresentationMode)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {KIMI_PRESENTATION_MODES.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Extra context</label>
              <Textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="Audience, data points, brand voice..."
                rows={3}
              />
            </div>

            <Button onClick={() => void runBeast()} disabled={!topic.trim()} className="w-full h-12 text-base gap-2">
              <Sparkles className="h-5 w-5" />
              Unleash Beast Mode
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
