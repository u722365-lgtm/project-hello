import { useState, useEffect, useRef } from "react";
import {
  FileText, Download, Copy, Loader2, Sparkles, X, Check,
  RefreshCw, Wand2, FileDown, Printer, Globe, Palette, Layout
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
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  KIMI_DOCUMENT_TYPES,
  KIMI_LENGTHS,
  streamKimiDocument,
  inferDocumentTypeFromMessage,
  type KimiDocumentType,
  type KimiToneType,
  type KimiLengthType,
} from "@/lib/kimiDocumentGeneration";
import { DOCUMENT_PROSE_CLASS } from "@/lib/professionalDocument";
import {
  exportWorldClassPdf,
  printWorldClassDocument,
  exportWorldClassMarkdown,
  exportWorldClassPlainText,
  exportWorldClassWordDoc,
  exportWorldClassHtml,
  type DocumentTheme,
} from "@/lib/worldClassDocumentExport";

export interface DocumentGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentGenerated?: (content: string, type: string) => void;
  initialPrompt?: string;
  autoGenerate?: boolean;
  initialDocType?: KimiDocumentType;
}

const TONES: { value: KimiToneType; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "academic", label: "Academic" },
  { value: "persuasive", label: "Persuasive" },
  { value: "creative", label: "Creative" },
];

const THEMES: { value: DocumentTheme; label: string }[] = [
  { value: "executive", label: "Executive Sapphire" },
  { value: "obsidian", label: "Obsidian Cyber (Dark)" },
  { value: "minimal", label: "Minimalist Slate" },
  { value: "academic", label: "Academic Research" },
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

export const DocumentGenerator = ({
  isOpen,
  onClose,
  onDocumentGenerated,
  initialPrompt,
  autoGenerate,
  initialDocType,
}: DocumentGeneratorProps) => {
  const { toast } = useToast();
  const abortRef = useRef<AbortController | null>(null);

  const [docType, setDocType] = useState<KimiDocumentType>(initialDocType || "article");
  const [tone, setTone] = useState<KimiToneType>("professional");
  const [length, setLength] = useState<KimiLengthType>("medium");
  const [theme, setTheme] = useState<DocumentTheme>("executive");
  const [includeCover, setIncludeCover] = useState(true);
  const [topic, setTopic] = useState(initialPrompt || "");
  const [additionalContext, setAdditionalContext] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [previousContent, setPreviousContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevising, setIsRevising] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "raw">("preview");
  const [wordCount, setWordCount] = useState(0);

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
    if (autoGenerate && topic.trim() && isOpen && !isGenerating && !generatedContent) {
      generateDocument();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerate, topic, isOpen]);

  const generateDocument = async () => {
    if (!topic.trim()) {
      toast({ title: "Enter a topic", variant: "destructive" });
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setIsGenerating(true);
    setGeneratedContent("");

    try {
      const { data: { session } } = await backend.auth.getSession();
      const content = await streamKimiDocument({
        topic,
        docType,
        tone,
        length,
        additionalContext,
        accessToken: session?.access_token,
        signal: abortRef.current.signal,
        onChunk: setGeneratedContent,
      });

      const label = KIMI_DOCUMENT_TYPES.find((d) => d.type === docType)?.label ?? "Document";
      toast({ title: "Document ready", description: `Your ${label} is ready to export.` });
      onDocumentGenerated?.(content, docType);
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      console.error("Document generation error:", error);
      toast({
        title: "Generation failed",
        description: "Could not generate document. Try again or use a shorter length.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
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
        onDocumentGenerated?.(data.result, docType);
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

  const baseFilename = `${docType}-${Date.now()}`;

  const downloadAsPDF = () => {
    exportWorldClassPdf(generatedContent, `${baseFilename}.pdf`, {
      theme,
      includeCoverPage: includeCover,
      classification: "Executive Brief",
    });
    toast({ title: "Ultra-HD PDF Downloaded" });
  };

  const printDocument = () => {
    printWorldClassDocument(generatedContent, {
      theme,
      includeCoverPage: includeCover,
    });
  };

  const downloadAsWord = () => {
    exportWorldClassWordDoc(generatedContent, `${baseFilename}.doc`, {
      classification: "Executive Brief",
    });
    toast({ title: "Word Document Downloaded" });
  };

  const downloadAsMarkdown = () => {
    exportWorldClassMarkdown(generatedContent, `${baseFilename}.md`, {
      theme,
    });
    toast({ title: "GFM Markdown Downloaded" });
  };

  const downloadAsPlainText = () => {
    exportWorldClassPlainText(generatedContent, `${baseFilename}.txt`);
    toast({ title: "Executive Plain Text Downloaded" });
  };

  const downloadAsHtml = () => {
    exportWorldClassHtml(generatedContent, `${baseFilename}.html`, {
      theme,
    });
    toast({ title: "Web Document Downloaded" });
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/98 backdrop-blur-md z-50 flex flex-col"
    >
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/40 bg-card/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
            <FileText className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm flex items-center gap-2 text-foreground">
              Document Studio
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">World-Class Edition</Badge>
            </h2>
            <p className="text-xs text-muted-foreground">Publication-grade documents &bull; PDF &bull; Word &bull; Markdown &bull; HTML &bull; Print</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {generatedContent && (
            <span className="text-xs text-muted-foreground font-mono bg-muted/40 px-2 py-0.5 rounded">
              {wordCount.toLocaleString()} words
            </span>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 responsive-split-row overflow-hidden min-h-0">
        {/* Left Settings Sidebar */}
        <div className="responsive-side-panel border-r border-b md:border-b-0 p-4 space-y-4 overflow-y-auto max-h-[42dvh] md:max-h-none bg-card/20">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Document Type</label>
            <Select value={docType} onValueChange={(v) => setDocType(v as KimiDocumentType)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
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
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Design Style / Theme</label>
            <Select value={theme} onValueChange={(v) => setTheme(v as DocumentTheme)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {THEMES.map((th) => (
                  <SelectItem key={th.value} value={th.value} className="text-xs">{th.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/30">
            <span className="text-xs font-medium text-foreground">Include Cover Page</span>
            <input
              type="checkbox"
              checked={includeCover}
              onChange={(e) => setIncludeCover(e.target.checked)}
              className="h-4 w-4 rounded accent-primary cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Topic / Directive</label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Q3 Strategic AI Infrastructure Roadmap"
              className="text-sm h-9"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Specific Requirements</label>
            <Textarea
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Key statistics, sections, target audience, competitive constraints..."
              className="min-h-[80px] text-sm resize-none"
            />
          </div>

          <Button onClick={generateDocument} disabled={isGenerating || !topic.trim()} className="w-full h-9 text-sm shadow-md">
            {isGenerating ? (
              <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Composing Document...</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5 mr-2" />Generate Document</>
            )}
          </Button>

          {generatedContent && (
            <div className="space-y-2 pt-2 border-t border-border/30">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Instant Refinements</p>
              <div className="flex flex-wrap gap-1">
                {REVISE_ACTIONS.map((a) => (
                  <Button
                    key={a.value}
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] px-2"
                    disabled={isRevising}
                    onClick={() => reviseDocument(a.value)}
                  >
                    <Wand2 className="h-3 w-3 mr-1" />
                    {a.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Preview Canvas */}
        <div className="flex-1 flex flex-col min-w-0 bg-neutral-100/30 dark:bg-black/20">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-card/50">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  activeTab === "preview" ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Rendered Preview
              </button>
              <button
                onClick={() => setActiveTab("raw")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  activeTab === "raw" ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Markdown Code
              </button>
            </div>
            {generatedContent && (
              <div className="flex gap-1.5 flex-wrap justify-end">
                <Button variant="outline" size="sm" onClick={copyToClipboard} className="h-7 text-xs px-2" title="Copy Markdown">
                  {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button variant="outline" size="sm" onClick={downloadAsPDF} className="h-7 text-xs px-2.5 font-medium" title="Ultra-HD PDF">
                  <Download className="h-3 w-3 mr-1 text-primary" />PDF
                </Button>
                <Button variant="outline" size="sm" onClick={printDocument} className="h-7 text-xs px-2" title="Print / Vector PDF">
                  <Printer className="h-3 w-3 mr-1 text-blue-500" />Print
                </Button>
                <Button variant="outline" size="sm" onClick={downloadAsWord} className="h-7 text-xs px-2" title="Word Document">
                  <FileDown className="h-3 w-3 mr-1 text-indigo-500" />Word
                </Button>
                <Button variant="outline" size="sm" onClick={downloadAsMarkdown} className="h-7 text-xs px-2" title="Markdown File">
                  <FileText className="h-3 w-3 mr-1 text-emerald-500" />.md
                </Button>
                <Button variant="outline" size="sm" onClick={downloadAsPlainText} className="h-7 text-xs px-2" title="Executive Plain Text">
                  <FileText className="h-3 w-3 mr-1 text-amber-500" />.txt
                </Button>
                <Button variant="outline" size="sm" onClick={downloadAsHtml} className="h-7 text-xs px-2" title="Standalone Web Document">
                  <Globe className="h-3 w-3 mr-1 text-cyan-500" />HTML
                </Button>
                <Button variant="outline" size="sm" onClick={generateDocument} disabled={isGenerating} className="h-7 text-xs px-2">
                  <RefreshCw className="h-3 w-3 mr-1" />Redraft
                </Button>
              </div>
            )}
          </div>

          <ScrollArea className="flex-1">
            <div className="max-w-[8.5in] mx-auto p-4 sm:p-8">
              {generatedContent ? (
                activeTab === "preview" ? (
                  <div className="bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200/90 dark:border-neutral-800 rounded-sm px-8 py-10 md:px-14 md:py-14 min-h-[11in]">
                    {includeCover && (
                      <div className="mb-10 pb-8 border-b-2 border-primary/20">
                        <div className="inline-block px-2.5 py-0.5 mb-3 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded-md">
                          {docType.replace(/_/g, " ").toUpperCase()}
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 mb-2">
                          {topic}
                        </h1>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 italic mb-6">
                          Publication-Quality Autonomous Formulation &bull; ShadowTalk AI Intelligence
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs">
                          <div><span className="block text-[9px] uppercase font-bold text-neutral-400">Author</span><span className="font-semibold text-neutral-800 dark:text-neutral-200">ShadowTalk AI</span></div>
                          <div><span className="block text-[9px] uppercase font-bold text-neutral-400">Date</span><span className="font-semibold text-neutral-800 dark:text-neutral-200">{new Date().toLocaleDateString()}</span></div>
                          <div><span className="block text-[9px] uppercase font-bold text-neutral-400">Theme</span><span className="font-semibold text-neutral-800 dark:text-neutral-200 capitalize">{theme}</span></div>
                          <div><span className="block text-[9px] uppercase font-bold text-neutral-400">Word Count</span><span className="font-semibold text-neutral-800 dark:text-neutral-200">{wordCount.toLocaleString()} words</span></div>
                        </div>
                      </div>
                    )}
                    <div className={DOCUMENT_PROSE_CLASS}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedContent}</ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <pre className="text-xs font-mono whitespace-pre-wrap bg-card p-6 rounded-xl border border-border/40 leading-relaxed shadow-sm">{generatedContent}</pre>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-[55vh] text-muted-foreground text-center">
                  <FileText className="h-12 w-12 opacity-30 mb-4" />
                  <p className="font-semibold text-base text-foreground">Document Studio</p>
                  <p className="text-xs mt-1 max-w-sm text-muted-foreground">Enter your topic on the left to synthesize publication-grade reports, proposals, whitepapers, and contracts.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </motion.div>
  );
};

export default DocumentGenerator;
