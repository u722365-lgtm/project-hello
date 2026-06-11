import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skull, Send, Loader2, X, Crosshair, Shield, FileText, Eye, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  getShadowSpectreHeadLabel,
  getShadowSpectreScope,
  hasAcceptedShadowSpectreTerms,
  routeShadowSpectreHead,
  streamShadowSpectre,
  type ShadowSpectreHead,
} from "@/lib/cyber/shadowspectre";
import { ShadowSpectreScopeBar } from "./ShadowSpectreScopeBar";
import { ShadowSpectreTermsDialog } from "./ShadowSpectreTermsDialog";

type Msg = { role: "user" | "assistant"; content: string; head?: ShadowSpectreHead };

const QUICK_PROMPTS = [
  { icon: Eye, label: "Recon workflow for authorized scope" },
  { icon: Crosshair, label: "SQLi → RCE chain with detection rules" },
  { icon: Shield, label: "MITRE map: phishing → macro → C2" },
  { icon: FileText, label: "Pentest executive summary template" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ShadowSpectrePanel({ open, onClose }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [activeHead, setActiveHead] = useState<ShadowSpectreHead>("general");
  const [showTerms, setShowTerms] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !hasAcceptedShadowSpectreTerms()) setShowTerms(true);
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    if (!hasAcceptedShadowSpectreTerms()) {
      setShowTerms(true);
      return;
    }

    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);

    const head = routeShadowSpectreHead(text);
    setActiveHead(head);
    let assistant = "";

    try {
      const result = await streamShadowSpectre({
        messages: next,
        head,
        authorization: getShadowSpectreScope(),
        onToken: (t) => {
          assistant += t;
          setMessages([...next, { role: "assistant", content: assistant, head }]);
        },
      });
      setActiveHead(result.head);
      if (!assistant) {
        setMessages([...next, { role: "assistant", content: "No response generated. Try again.", head }]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Connection failed";
      toast.error(msg);
      setMessages([...next, { role: "assistant", content: `**Error:** ${msg}`, head }]);
    }
    setStreaming(false);
  };

  if (!open) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="w-full max-w-3xl h-[min(85vh,720px)] rounded-3xl border border-red-500/25 bg-[#0d0d0f]/98 flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Skull className="h-5 w-5 text-red-400" />
                <span className="font-semibold">ShadowSpectre</span>
                <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400">
                  UNCENSORED · CYBER
                </Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="px-4 pt-3">
              <ShadowSpectreScopeBar activeHead={activeHead} />
            </div>

            <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef as React.RefObject<HTMLDivElement>}>
              {messages.length === 0 ? (
                <div className="space-y-4 py-8">
                  <div className="font-mono text-xs text-red-400/80 space-y-1">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-3.5 w-3.5" />
                      shadowspectre@shadowtalk:~$
                    </div>
                    <div>{">"} model.load ShadowSpectre-Ω .. OK</div>
                    <div>{">"} heads: recon | exploit | blue | ir | intel | report | grc | harden</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {QUICK_PROMPTS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => void send(p.label)}
                        className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-left text-sm hover:bg-white/10 transition-colors"
                      >
                        <p.icon className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-2xl px-4 py-3 text-sm",
                        m.role === "user"
                          ? "bg-primary/10 ml-8"
                          : "bg-white/5 border border-white/10 mr-4",
                      )}
                    >
                      {m.role === "assistant" && m.head && (
                        <Badge variant="secondary" className="mb-2 text-[10px]">
                          {getShadowSpectreHeadLabel(m.head)}
                        </Badge>
                      )}
                      <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t border-white/10 flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask ShadowSpectre — recon, exploit chains, IR, CVE, reports…"
                className="min-h-[44px] max-h-28 resize-none bg-white/5 border-white/10"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
              />
              <Button
                onClick={() => void send(input)}
                disabled={streaming || !input.trim()}
                className="shrink-0 bg-red-600 hover:bg-red-700"
              >
                {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <ShadowSpectreTermsDialog
        open={showTerms}
        onAccepted={() => setShowTerms(false)}
        onDecline={() => {
          setShowTerms(false);
          onClose();
        }}
      />
    </>
  );
}
