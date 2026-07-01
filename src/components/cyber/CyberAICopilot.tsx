import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Brain, Send, Crosshair, Shield, FileText, Eye, Loader2,
  Sparkles, Terminal, AlertTriangle, BookOpen, Trash2, Skull,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import {
  getShadowSpectreHeadLabel,
  getShadowSpectreScope,
  routeShadowSpectreHead,
  streamShadowSpectre,
  type ShadowSpectreHead,
} from "@/lib/cyber/shadowspectre";
import { ShadowSpectreScopeBar } from "./ShadowSpectreScopeBar";

type Message = { role: "user" | "assistant"; content: string; head?: ShadowSpectreHead };

const modes: { id: ShadowSpectreHead; label: string; icon: typeof Brain; color: string }[] = [
  { id: "general", label: "General", icon: Brain, color: "text-primary" },
  { id: "recon", label: "Recon", icon: Eye, color: "text-blue-400" },
  { id: "exploit", label: "Exploit", icon: Crosshair, color: "text-destructive" },
  { id: "blue", label: "Blue", icon: Shield, color: "text-emerald-400" },
  { id: "ir", label: "IR", icon: AlertTriangle, color: "text-warning" },
  { id: "intel", label: "Intel", icon: BookOpen, color: "text-violet-400" },
  { id: "report", label: "Report", icon: FileText, color: "text-secondary" },
  { id: "grc", label: "GRC", icon: Shield, color: "text-cyan-400" },
  { id: "harden", label: "Harden", icon: Terminal, color: "text-amber-400" },
];

const quickPrompts = [
  "Analyze CVE-2026-0217 and suggest exploitation paths",
  "Generate a recon workflow for authorized scope",
  "Create a professional pentest report template",
  "Map this attack to MITRE ATT&CK: phishing → macro → powershell → mimikatz",
  "Suggest SQLi payloads for a login form with WAF bypass",
  "How to detect lateral movement in Windows event logs",
  "Generate a bug bounty report for an IDOR vulnerability",
  "SOC2 gap analysis for cloud IAM misconfigurations",
];

export default function CyberAICopilot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ShadowSpectreHead>("general");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessage: string) => {
    const userMsg: Message = { role: "user", content: userMessage };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsStreaming(true);

    const routedHead = mode === "general" ? routeShadowSpectreHead(userMessage) : mode;
    let assistantContent = "";

    try {
      const result = await streamShadowSpectre({
        messages: allMessages,
        head: routedHead,
        authorization: getShadowSpectreScope(),
        onToken: (delta) => {
          assistantContent += delta;
          setMessages([
            ...allMessages,
            { role: "assistant", content: assistantContent, head: routedHead },
          ]);
        },
      });

      if (!result.content) {
        setMessages([
          ...allMessages,
          { role: "assistant", content: "I couldn't generate a response. Please try again.", head: routedHead },
        ]);
      }
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Connection error");
      setMessages([
        ...allMessages,
        { role: "assistant", content: "Connection error. Please try again.", head: routedHead },
      ]);
    }
    setIsStreaming(false);
  };

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    void streamChat(input.trim());
  };

  return (
    <div className="space-y-4">
      <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Skull className="h-5 w-5 text-red-400" />
            ShadowSpectre Cyber Copilot
            <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400">
              UNCENSORED
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Domain-native security model — recon, exploit (authorized), blue team, IR, intel, reports, GRC, hardening.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <ShadowSpectreScopeBar activeHead={mode} />
          <div className="flex flex-wrap gap-1.5">
            {modes.map((m) => (
              <Button
                key={m.id}
                size="sm"
                variant={mode === m.id ? "default" : "outline"}
                className={cn("h-8 text-xs gap-1", mode !== m.id && m.color)}
                onClick={() => setMode(m.id)}
              >
                <m.icon className="h-3 w-3" />
                {m.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {quickPrompts.slice(0, 4).map((p) => (
          <Button key={p} variant="secondary" size="sm" className="text-xs h-auto py-1.5" onClick={() => void streamChat(p)}>
            <Sparkles className="h-3 w-3 mr-1" />
            {p.length > 48 ? `${p.slice(0, 48)}…` : p}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[380px] p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-12">
                <Brain className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">Ask ShadowSpectre anything in cybersecurity.</p>
                <p className="text-xs mt-1">Auto-routes to specialist heads when mode is General.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "rounded-lg p-3 text-sm",
                        msg.role === "user" ? "bg-primary/10 ml-8" : "bg-muted/50 mr-8",
                      )}
                    >
                      {msg.role === "assistant" && msg.head && (
                        <Badge variant="secondary" className="mb-2 text-[10px]">
                          {getShadowSpectreHeadLabel(msg.head)}
                        </Badge>
                      )}
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>

          <div className="border-t p-3 flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="CVE analysis, payloads, Sigma rules, pentest reports…"
              className="min-h-[44px] max-h-32 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button onClick={handleSend} disabled={isStreaming || !input.trim()} className="shrink-0">
              {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
            {messages.length > 0 && (
              <Button variant="ghost" size="icon" onClick={() => setMessages([])} title="Clear chat">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
