import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, Server, CheckCircle2, XCircle, Download, Trash2, ExternalLink, RefreshCw, Sparkles } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  getStatus,
  configure,
  pullModel,
  deleteModel,
  getOllamaUrl,
  getOllamaModel,
  isOllamaChatEnabled,
  setOllamaChatEnabled,
  runtimeIsDesktop,
} from "@/lib/ollama/unifiedClient";
import type { OllamaStatus } from "@/lib/desktop/ollamaInference";

const POPULAR_MODELS = [
  { name: "llama3.2:3b", size: "2.0 GB", desc: "Fast, general-purpose. Great starter." },
  { name: "llama3.1:8b", size: "4.7 GB", desc: "Balanced quality + speed." },
  { name: "qwen2.5:7b", size: "4.4 GB", desc: "Strong coding + reasoning." },
  { name: "mistral:7b", size: "4.1 GB", desc: "Reliable general model." },
  { name: "phi3:mini", size: "2.3 GB", desc: "Tiny, runs on modest hardware." },
  { name: "gemma2:2b", size: "1.6 GB", desc: "Google's small model." },
];

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
};

export default function LocalModelsPage() {
  const [status, setStatus] = useState<OllamaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState(getOllamaUrl());
  const [activeModel, setActiveModel] = useState(getOllamaModel());
  const [chatEnabled, setChatEnabled] = useState(isOllamaChatEnabled());
  const [pullName, setPullName] = useState("");
  const [pullingModel, setPullingModel] = useState<string | null>(null);
  const [pullStatus, setPullStatus] = useState("");
  const [pullPercent, setPullPercent] = useState<number | undefined>(undefined);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getStatus();
      setStatus(s);
      if (s.activeModel) setActiveModel(s.activeModel);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveUrl = async () => {
    await configure({ baseUrl });
    toast.success("Ollama URL saved");
    refresh();
  };

  const selectModel = async (model: string) => {
    setActiveModel(model);
    await configure({ model });
    toast.success(`Active model: ${model}`);
  };

  const toggleChat = (v: boolean) => {
    setChatEnabled(v);
    setOllamaChatEnabled(v);
    toast.success(
      v ? "Ollama is the default AI provider" : "Cloud AI is now the default — Ollama disabled",
    );
  };

  const runPull = async (name: string) => {
    const target = name.trim();
    if (!target) return;
    setPullingModel(target);
    setPullStatus("starting…");
    setPullPercent(undefined);
    const res = await pullModel(target, (s, pct) => {
      setPullStatus(s);
      setPullPercent(pct);
    });
    setPullingModel(null);
    if (res.ok) {
      toast.success(`Downloaded ${target}`);
      setPullName("");
      refresh();
    } else {
      toast.error(res.error ?? "Pull failed");
    }
  };

  const removeModel = async (name: string) => {
    if (!confirm(`Delete ${name}? This frees disk space but you'll need to re-download to use it.`)) return;
    const res = await deleteModel(name);
    if (res.ok) {
      toast.success(`Deleted ${name}`);
      refresh();
    } else {
      toast.error(res.error ?? "Delete failed");
    }
  };

  const reachable = status?.reachable ?? false;
  const desktop = runtimeIsDesktop();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        <motion.div {...fadeUp} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Server className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Local Models · Ollama</h1>
          </div>
          <p className="text-muted-foreground">
            Ollama is ShadowTalk&apos;s default AI provider. Chat runs locally when Ollama is
            connected; cloud is used only as a fallback.
          </p>
        </motion.div>

        {/* Connection */}
        <motion.div {...fadeUp}>
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Connection
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : reachable ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Connected
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" /> Not reachable
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {desktop
                      ? "Using the built-in Ollama sidecar bundled with the desktop app."
                      : "Connect to your local `ollama serve` process."}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!desktop && (
                <div className="space-y-2">
                  <Label htmlFor="ollama-url">Ollama base URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="ollama-url"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="http://127.0.0.1:11434"
                    />
                    <Button onClick={saveUrl}>Save</Button>
                  </div>
                </div>
              )}

              {status?.version && (
                <p className="text-sm text-muted-foreground">
                  Ollama v{status.version} · {status.models.length} model
                  {status.models.length === 1 ? "" : "s"} installed
                </p>
              )}

              {!reachable && !loading && !desktop && (
                <Alert variant="destructive">
                  <AlertTitle>Can't reach Ollama</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>{status?.error ?? "The Ollama daemon isn't responding."}</p>
                    <div className="text-xs bg-background/60 rounded p-2 font-mono">
                      # 1. Install: https://ollama.com/download
                      <br />
                      # 2. Start with CORS allowed for the browser:
                      <br />
                      OLLAMA_ORIGINS='*' ollama serve
                    </div>
                    <a
                      href="https://ollama.com/download"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm underline"
                    >
                      Install Ollama <ExternalLink className="h-3 w-3" />
                    </a>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Active model + chat toggle */}
        {reachable && (
          <motion.div {...fadeUp}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Active model</CardTitle>
                <CardDescription>
                  This model handles chats when local inference is enabled.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Select value={activeModel} onValueChange={selectModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {(status?.models ?? []).map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                      {(!status?.models || status.models.length === 0) && (
                        <SelectItem value="__none__" disabled>
                          No models installed
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                  <div className="space-y-1">
                    <Label htmlFor="ollama-chat" className="text-base cursor-pointer">
                      Ollama as default AI provider
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      On by default. ShadowTalk routes chat through your local Ollama model when
                      connected; cloud is the fallback. Specialized tools (Deep Research, Strategy
                      Agent, image generation) still use the cloud.
                    </p>
                  </div>
                  <Switch id="ollama-chat" checked={chatEnabled} onCheckedChange={toggleChat} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Installed models */}
        {reachable && status && status.models.length > 0 && (
          <motion.div {...fadeUp}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Installed models</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {status.models.map((m) => (
                  <div
                    key={m}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="font-mono text-sm">{m}</span>
                      {m === activeModel && <Badge variant="secondary">active</Badge>}
                    </div>
                    <div className="flex gap-2">
                      {m !== activeModel && (
                        <Button variant="ghost" size="sm" onClick={() => selectModel(m)}>
                          Use
                        </Button>
                      )}
                      {!desktop && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeModel(m)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Pull models */}
        {reachable && (
          <motion.div {...fadeUp}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Download a model</CardTitle>
                <CardDescription>Pull any model from the Ollama library.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={pullName}
                    onChange={(e) => setPullName(e.target.value)}
                    placeholder="e.g. llama3.2:3b"
                    disabled={!!pullingModel}
                  />
                  <Button onClick={() => runPull(pullName)} disabled={!!pullingModel || !pullName.trim()}>
                    {pullingModel === pullName ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span className="ml-2">Pull</span>
                  </Button>
                </div>

                {pullingModel && (
                  <div className="space-y-2 rounded-md border p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono">{pullingModel}</span>
                      <span className="text-muted-foreground">{pullStatus}</span>
                    </div>
                    {pullPercent !== undefined && <Progress value={pullPercent} />}
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium mb-2">Popular models</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {POPULAR_MODELS.map((m) => {
                      const installed = status?.models.includes(m.name);
                      return (
                        <button
                          key={m.name}
                          onClick={() => !installed && runPull(m.name)}
                          disabled={!!pullingModel || installed}
                          className="text-left rounded-md border p-3 hover:bg-accent disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-sm">{m.name}</span>
                            <span className="text-xs text-muted-foreground">{m.size}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{m.desc}</p>
                          {installed && (
                            <Badge variant="secondary" className="mt-2">
                              installed
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div {...fadeUp}>
          <Alert>
            <AlertTitle>Privacy note</AlertTitle>
            <AlertDescription>
              Ollama runs entirely on your machine. When "Use Ollama for chat" is on, your prompts
              and responses never leave your device. Specialized ShadowTalk tools that require
              cloud APIs (search, deep research, image generation) still call the network — they'll
              tell you before doing so.
            </AlertDescription>
          </Alert>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
