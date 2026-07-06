import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Workflow, Cloud, Shield, Zap, GitBranch, MessageSquare, Code2, CreditCard, Brain, Server, Lock } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";

type FlowId = "chat" | "mission" | "tools" | "api" | "local" | "payment";

interface Step {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  duration: number;
  details?: string[];
}

const FLOWS: Record<FlowId, { title: string; steps: Step[] }> = {
  chat: {
    title: "Encrypted Chat Flow",
    steps: [
      { id: "user-input", label: "User Message", description: "You type a message in the ShadowTalk chat UI", icon: <MessageSquare className="w-5 h-5" />, duration: 800, details: ["Encrypted client-side before sending", "No email or account required"] },
      { id: "routing", label: "Router", description: "System decides local vs cloud execution", icon: <GitBranch className="w-5 h-5" />, duration: 600, details: ["Hardware-aware routing", "Checks WebGPU/WASM availability"] },
      { id: "api-call", label: "API Gateway", description: "Routes to provider or local model", icon: <Cloud className="w-5 h-5" />, duration: 900, details: ["BYOK support", "Failover to local if cloud fails"] },
      { id: "encryption", label: "Encryption Layer", description: "End-to-end encryption applied", icon: <Lock className="w-5 h-5" />, duration: 500, details: ["AES-256-GCM", "Zero-knowledge architecture"] },
      { id: "response", label: "Response", description: "AI response streamed back to user", icon: <Bot className="w-5 h-5" />, duration: 1200, details: ["Streaming via SSE/WebSocket", "Markdown rendering"] },
      { id: "storage", label: "Memory Store", description: "Conversation saved locally", icon: <Server className="w-5 h-5" />, duration: 400, details: ["IndexedDB/localStorage", "User-controlled retention"] },
    ],
  },
  mission: {
    title: "Mission Control Flow",
    steps: [
      { id: "mission-create", label: "Mission Created", description: "User defines a multi-step mission", icon: <Workflow className="w-5 h-5" />, duration: 700, details: ["Goal + constraints + approval gates"] },
      { id: "planner", label: "Planner", description: "AI breaks mission into executable steps", icon: <Brain className="w-5 h-5" />, duration: 1000, details: ["Tool selection", "Dependency graph"] },
      { id: "tools", label: "Tool Execution", description: "Each step runs appropriate tools", icon: <Code2 className="w-5 h-5" />, duration: 1500, details: ["30+ tools", "Permission checks", "Sandboxing"] },
      { id: "approval", label: "Approval Gate", description: "Human confirmation if required", icon: <Shield className="w-5 h-5" />, duration: 800, details: ["Pause/resume", "Audit log"] },
      { id: "output", label: "Output", description: "Results aggregated and presented", icon: <Zap className="w-5 h-5" />, duration: 600, details: ["Reports", "Downloads", "Next mission suggestion"] },
    ],
  },
  tools: {
    title: "Tool Execution Flow",
    steps: [
      { id: "tool-request", label: "Tool Request", description: "User or AI requests a tool", icon: <Code2 className="w-5 h-5" />, duration: 500, details: ["Chat command or mission step"] },
      { id: "auth", label: "Auth Check", description: "Permission and plan validation", icon: <Lock className="w-5 h-5" />, duration: 400, details: ["Plan gating", "Rate limits"] },
      { id: "execute", label: "Execute", description: "Tool runs in sandbox", icon: <Zap className="w-5 h-5" />, duration: 1200, details: ["Isolated execution", "Timeout protection"] },
      { id: "result", label: "Result", description: "Output formatted and returned", icon: <GitBranch className="w-5 h-5" />, duration: 700, details: ["Structured output", "Error handling"] },
    ],
  },
  api: {
    title: "API Call Flow",
    steps: [
      { id: "api-key", label: "API Key", description: "BYOK key retrieved", icon: <Lock className="w-5 h-5" />, duration: 400, details: ["Encrypted storage", "Per-provider keys"] },
      { id: "request", label: "Request", description: "HTTP request built and signed", icon: <Cloud className="w-5 h-5" />, duration: 600, details: ["Headers", "Payload", "Retry config"] },
      { id: "provider", label: "Provider", description: "External API processes request", icon: <Server className="w-5 h-5" />, duration: 2000, details: ["OpenAI/Anthropic/Gemini", "Fallback chain"] },
      { id: "response", label: "Response", description: "Response parsed and normalized", icon: <GitBranch className="w-5 h-5" />, duration: 800, details: ["Schema validation", "Stream chunking"] },
    ],
  },
  local: {
    title: "Local Inference Flow",
    steps: [
      { id: "device-check", label: "Device Check", description: "Checks WebGPU/WASM support", icon: <Bot className="w-5 h-5" />, duration: 600, details: ["GPU detection", "Memory limits"] },
      { id: "model-load", label: "Model Load", description: "Downloads/caches model (~130MB)", icon: <Cloud className="w-5 h-5" />, duration: 1500, details: ["Partial loading", "Progressive download"] },
      { id: "inference", label: "Inference", description: "Runs locally on device", icon: <Brain className="w-5 h-5" />, duration: 2000, details: ["WebGPU pipeline", "No data leaves device"] },
      { id: "post-process", label: "Post-process", description: "Formats and returns result", icon: <Zap className="w-5 h-5" />, duration: 500, details: ["Token streaming", "Markdown rendering"] },
    ],
  },
  payment: {
    title: "Payment & Activation Flow",
    steps: [
      { id: "select", label: "Select Plan", description: "User chooses a plan", icon: <CreditCard className="w-5 h-5" />, duration: 500, details: ["Free/Pro/Premium/Elite"] },
      { id: "method", label: "Payment Method", description: "Choose JazzCash/Easypaisa/card/USDT", icon: <CreditCard className="w-5 h-5" />, duration: 700, details: ["Local + international support"] },
      { id: "checkout", label: "Checkout", description: "Payment submitted via gateway", icon: <Server className="w-5 h-5" />, duration: 2000, details: ["Lemonsqueezy + direct", "Receipt upload"] },
      { id: "verify", label: "Verify", description: "Payment verified", icon: <Shield className="w-5 h-5" />, duration: 1500, details: ["Manual review if needed", "Auto-activation on success"] },
      { id: "activate", label: "Activate", description: "Access granted immediately or within 2 hours", icon: <Zap className="w-5 h-5" />, duration: 600, details: ["Webhook + email confirmation"] },
    ],
  },
};

const FLOW_ORDER: FlowId[] = ["chat", "mission", "tools", "api", "local", "payment"];

const FLOW_LABELS: Record<FlowId, string> = {
  chat: "Chat",
  mission: "Missions",
  tools: "Tools",
  api: "API",
  local: "Local AI",
  payment: "Payment",
};

const BackendFlowsPage = () => {
  const [activeFlow, setActiveFlow] = useState<FlowId>("chat");
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const flow = FLOWS[activeFlow];
  const totalSteps = flow.steps.length;

  useEffect(() => {
    setActiveStepIndex(0);
  }, [activeFlow]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setActiveStepIndex((prev) => (prev + 1) % totalSteps);
    }, flow.steps[activeStepIndex]?.duration || 1000);
    return () => clearTimeout(timeout);
  }, [activeFlow, activeStepIndex]);

  return (
    <>
      <SEOHead
        meta={{
          title: "ShadowTalk Backend Flows — Animated Architecture",
          description: "Visual guide to ShadowTalk backend flows: chat, missions, tools, API, local inference, and payment.",
          noIndex: false,
        }}
      />

      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold mb-2"
          >
            Backend Flows
          </motion.h1>
          <p className="text-muted-foreground mb-6">
            Animated visualization of how ShadowTalk handles requests end-to-end.
          </p>

          <div className="flex flex-wrap gap-2 mb-8">
            {FLOW_ORDER.map((id) => (
              <Button
                key={id}
                variant={activeFlow === id ? "default" : "outline"}
                onClick={() => setActiveFlow(id)}
                className="gap-2"
              >
                {FLOW_LABELS[id]}
              </Button>
            ))}
          </div>

          <motion.div
            layout
            className="rounded-2xl border bg-card/60 p-6 md:p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                {activeFlow === "chat" && <MessageSquare className="w-5 h-5" />}
                {activeFlow === "mission" && <Workflow className="w-5 h-5" />}
                {activeFlow === "tools" && <Code2 className="w-5 h-5" />}
                {activeFlow === "api" && <Cloud className="w-5 h-5" />}
                {activeFlow === "local" && <Brain className="w-5 h-5" />}
                {activeFlow === "payment" && <CreditCard className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{flow.title}</h2>
                <p className="text-sm text-muted-foreground">Step {activeStepIndex + 1} of {totalSteps}</p>
              </div>
            </div>

            <div className="relative min-h-[260px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeFlow}-${activeStepIndex}`}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35 }}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4"
                >
                  <div className="md:col-span-4 flex items-center justify-center">
                    <div className="w-28 h-28 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                      {flow.steps[activeStepIndex].icon}
                    </div>
                  </div>
                  <div className="md:col-span-8 space-y-3">
                    <h3 className="text-base font-semibold">{flow.steps[activeStepIndex].label}</h3>
                    <p className="text-sm text-muted-foreground">{flow.steps[activeStepIndex].description}</p>
                    {flow.steps[activeStepIndex].details?.length ? (
                      <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
                        {flow.steps[activeStepIndex].details!.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-8">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {flow.steps.map((step, idx) => (
                  <div key={step.id} className="flex items-center gap-2 min-w-fit">
                    <div
                      className={`h-2 w-2 rounded-full transition-colors ${
                        idx <= activeStepIndex ? "bg-primary" : "bg-muted"
                      }`}
                    />
                    <span className={`text-xs ${idx === activeStepIndex ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.label}
                    </span>
                    {idx < totalSteps - 1 && <span className="text-muted-foreground/50 mx-1">→</span>}
                  </div>
                ))}
              </div>
              <div className="mt-4 h-1 w-full bg-muted/60 rounded overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${((activeStepIndex + 1) / totalSteps) * 100}%` }}
                  transition={{ duration: 0.35 }}
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 grid gap-4 md:grid-cols-3"
          >
            <div className="rounded-xl border bg-card/60 p-4">
              <h3 className="text-sm font-semibold mb-2">Privacy-first architecture</h3>
              <p className="text-xs text-muted-foreground">Encryption by default, local-first execution, and zero-knowledge design where possible.</p>
            </div>
            <div className="rounded-xl border bg-card/60 p-4">
              <h3 className="text-sm font-semibold mb-2">Agentic execution</h3>
              <p className="text-xs text-muted-foreground">Not single-turn chat. Missions break work into tools, approvals, and verifiable outputs.</p>
            </div>
            <div className="rounded-xl border bg-card/60 p-4">
              <h3 className="text-sm font-semibold mb-2">Business model layers</h3>
              <p className="text-xs text-muted-foreground">Free tier + Pro/Premium/Elite + document jobs + 20-40% recurring affiliate program.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default BackendFlowsPage;
