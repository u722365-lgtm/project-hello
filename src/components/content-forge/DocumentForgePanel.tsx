import { useState, useEffect, useRef } from "react";
import {
  FileText, Download, Copy, Loader2, Sparkles, Check, RefreshCw, Wand2, FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { backend } from "@/integrations/local/client";
import { buildChatRequestBody } from "@/lib/chatRequest";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  KIMI_DOCUMENT_TYPES,
  KIMI_LENGTHS,
  downloadAsWordDoc,
  inferDocumentTypeFromMessage,
  type KimiDocumentType,
  type KimiToneType,
  type KimiLengthType,
} from "@/lib/kimiDocumentGeneration";
import { DOCUMENT_PROSE_CLASS } from "@/lib/professionalDocument";
import { downloadProfessionalPdf } from "@/lib/professionalPdfExport";
import {
  runUnifiedDocumentPipeline,
  shouldEnableResearch,
  type DocumentPipelinePhase,
} from "@/lib/unifiedDocumentPipeline";
import { DocumentGenerationProgress } from "@/components/content-forge/DocumentGenerationProgress";
import { Switch } from "@/components/ui/switch";

const TONES: { value: KimiToneType; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "academic", label: "Academic" },
  { value: "persuasive", label: "Persuasive" },
  { value: "creative", label: "Creative" },
];

const REVISE_ACTIONS = [
  { value: "make_formal", label: "More formal" },
  { value: "make_casual", label: "More casual" },
  { value: "expand", label: "Expand" },
  { value: "shorten", label: "Shorten" },
  { value: "add_toc", label: "Add TOC" },
  { value: "fix_grammar", label: "Fix grammar" },
  { value: "polish_professional", label: "Polish" },
] as const;

export interface DocumentForgePanelProps {
  initialPrompt?: string;
  autoGenerate?: boolean;
  initialDocType?: KimiDocumentType;
  onDocumentReady?: (content: string, docType: KimiDocumentType) => void;
}

export function DocumentForgePanel({
  initialPrompt,
  autoGenerate,
  initialDocType,
  onDocumentReady,
}: DocumentForgePanelProps) {
  const { toast } = useToast();
  const abortRef = useRef<AbortController | null>(null);

  const [docType, setDocType] = useState<KimiDocumentType>(initialDocType || "report");
  const [tone, setTone] = useState<KimiToneType>("professional");
  const [length, setLength] = useState<KimiLengthType>("medium");
  const [topic, setTopic] = useState(initialPrompt || "");
  const [audience, setAudience] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [enableResearch, setEnableResearch] = useState<boolean | undefined>(undefined);
  const [generatedContent, setGeneratedContent] = useState("");
  const [previousContent, setPreviousContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevising, setIsRevising] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "raw">("preview");
  const [wordCount, setWordCount] = useState(0);
  const [pipelinePhase, setPipelinePhase] = useState<DocumentPipelinePhase>("idle");

  useEffect(() => {
    if (initialPrompt) {
      setTopic(initialPrompt);
      const inferred = inferDocumentTypeFromMessage(initialPrompt);
      if (inferred) setDocType(inferred);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (initialDocType) setDocType(initialDocType);
  }, [initialDocType]);

  useEffect(() => {
    setWordCount(generatedContent ? generatedContent.split(/\s+/).filter(Boolean).length : 0);
  }, [generatedContent]);

  useEffect(() => {
    if (autoGenerate && topic.trim() && !isGenerating && !generatedContent) {
      void generateDocument();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerate, topic]);

  const generateDocument = async () => {
    if (!topic.trim()) {
      toast({ title: "Enter a topic", variant: "destructive" });
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setIsGenerating(true);
    setGeneratedContent("");
    setPipelinePhase("planning");

    try {
      const { data: { session } } = await backend.auth.getSession();
      const result = await runUnifiedDocumentPipeline({
        topic,
        docType,
        tone,
        length,
        audience: audience || undefined,
        additionalContext,
        enableResearch,
        accessToken: session?.access_token,
        signal: abortRef.current.signal,
        onPhase: setPipelinePhase,
        onChunk: setGeneratedContent,
      });

      const label = KIMI_DOCUMENT_TYPES.find((d) => d.type === docType)?.label ?? "Document";
      toast({
        title: "Document ready",
        description: result.researchBrief
          ? `${label} drafted with research-backed evidence.`
          : `Your ${label} is ready to export.`,
      });
      onDocumentReady?.(result.content, docType);
      return result.content;
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      setPipelinePhase("error");
      toast({
        title: "Generation failed",
        description: "Could not generate document. Try again or use a shorter length.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
      setPipelinePhase("idle");
    }
  };

  const reviseDocument = async (action: string) => {
    if (!generatedContent.trim()) return;
    setIsRevising(true);
    setPreviousContent(generatedContent);
    try {
      const { data, error } = await backend.functions.invoke("document-ai", {
        body: buildChatRequestBody({ action, content: generatedContent }),
      });
      if (error) throw error;
      if (data?.result) {
        setGeneratedContent(data.result);
        toast({ title: "Document updated" });
        onDocumentReady?.(data.result, docType);
      }
    } catch {
      toast({ title: "Revision failed", variant: "destructive" });
      setGeneratedContent(previousContent);
    } finally {
      setIsRevising(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAsMarkdown = () => {
    const blob = new Blob([generatedContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docType}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsPDF = () => {
    downloadProfessionalPdf(generatedContent, `${docType}-${Date.now()}.pdf`);
    toast({ title: "PDF downloaded" });
  };

  return (
    <div className="responsive-split-row h-full overflow-hidden">
      <div className="responsive-side-panel border-r border-b md:border-b-0 p-4 space-y-4 overflow-y-auto max-h-[42dvh] md:max-h-none bg-card/30">
        <div className="flex items-center gap-2 pb-2 border-b border-border/50">
          <FileText className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-semibold">Document Studio</p>
            <p className="text-[10px] text-muted-foreground">Word · PDF · Markdown</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</label>
          <Select value={docType} onValueChange={(v) => setDocType(v as KimiDocumentType)}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {KIMI_DOCUMENT_TYPES.map((d) => (
                <SelectItem key={d.type} value={d.type} className="text-xs">{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tone</label>
            <Select value={tone} onValueChange={(v) => setTone(v as KimiToneType)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Length</label>
            <Select value={length} onValueChange={(v) => setLength(v as KimiLengthType)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {KIMI_LENGTHS.map((l) => (
                  <SelectItem key={l.value} value={l.value} className="text-xs">
                    {l.label} ({l.words})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Topic</label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Describe the document you need..."
            className="text-sm h-9"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Audience</label>
          <Input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="e.g. Board of directors, legal team..."
            className="text-sm h-9"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Requirements</label>
          <Textarea
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            placeholder="Sections, citations, standards to reuse..."
            className="min-h-[80px] text-sm resize-none"
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
          <div>
            <p className="text-xs font-medium">Research first</p>
            <p className="text-[10px] text-muted-foreground">Gather web evidence before drafting</p>
          </div>
          <Switch
            checked={enableResearch ?? shouldEnableResearch(docType, length)}
            onCheckedChange={(v) => setEnableResearch(v)}
          />
        </div>

        <Button onClick={() => void generateDocument()} disabled={isGenerating || !topic.trim()} className="w-full h-9 text-sm">
          {isGenerating ? (
            <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Writing...</>
          ) : (
            <><Sparkles className="h-3.5 w-3.5 mr-2" />Generate</>
          )}
        </Button>

        {generatedContent && (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Revise</p>
            <div className="flex flex-wrap gap-1">
              {REVISE_ACTIONS.map((a) => (
                <Button
                  key={a.value}
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] px-2"
                  disabled={isRevising}
                  onClick={() => void reviseDocument(a.value)}
                >
                  <Wand2 className="h-3 w-3 mr-1" />
                  {a.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/20">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1 text-xs rounded-md ${activeTab === "preview" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}
            >
              Preview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("raw")}
              className={`px-3 py-1 text-xs rounded-md ${activeTab === "raw" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}
            >
              Markdown
            </button>
          </div>
          <div className="flex items-center gap-2">
            {generatedContent && (
              <Badge variant="secondary" className="text-[10px]">{wordCount.toLocaleString()} words</Badge>
            )}
            {generatedContent && (
              <div className="flex gap-1.5 flex-wrap justify-end">
                <Button variant="outline" size="sm" onClick={() => void copyToClipboard()} className="h-7 text-xs px-2">
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button variant="outline" size="sm" onClick={downloadAsMarkdown} className="h-7 text-xs px-2">
                  <Download className="h-3 w-3 mr-1" />.md
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadAsWordDoc(generatedContent, `${docType}-${Date.now()}`)} className="h-7 text-xs px-2">
                  <FileDown className="h-3 w-3 mr-1" />Word
                </Button>
                <Button variant="outline" size="sm" onClick={downloadAsPDF} className="h-7 text-xs px-2">
                  <Download className="h-3 w-3 mr-1" />PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => void generateDocument()} disabled={isGenerating} className="h-7 text-xs px-2">
                  <RefreshCw className="h-3 w-3 mr-1" />Regenerate
                </Button>
              </div>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 bg-neutral-100/40 dark:bg-black/30">
          <div className="max-w-[8.5in] mx-auto p-6 md:p-10">
            {generatedContent ? (
              activeTab === "preview" ? (
                <div className="bg-white dark:bg-neutral-900 shadow-xl border border-neutral-200/90 dark:border-neutral-800 rounded-sm px-8 py-10 md:px-12 md:py-14 min-h-[11in]">
                  <div className={DOCUMENT_PROSE_CLASS}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedContent}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <pre className="text-xs font-mono whitespace-pre-wrap bg-muted/50 p-4 rounded-lg border">{generatedContent}</pre>
              )
            ) : isGenerating ? (
              <DocumentGenerationProgress phase={pipelinePhase} topic={topic} />
            ) : (
              <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground text-center">
                <FileText className="h-12 w-12 opacity-30 mb-4" />
                <p className="font-medium text-sm">Kimi + Manus unified pipeline</p>
                <p className="text-xs mt-1 max-w-sm">Plan → research → draft → polish → Word/PDF export</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
