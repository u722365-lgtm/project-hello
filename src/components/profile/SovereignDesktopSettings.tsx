import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  Server,
  Download,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { useSovereignDesktop } from "@/hooks/useSovereignDesktop";
import { useToast } from "@/hooks/use-toast";
import { isShadowTalkDesktop, getDesktopAPI } from "@/lib/desktopBridge";
import type { SovereignRoutingMode } from "@/lib/desktop/sovereignMode";

const OLLAMA_DOWNLOAD = "https://ollama.com/download";

export function SovereignDesktopSettings() {
  const {
    available,
    status,
    routingMode,
    recommended,
    compatible,
    pulling,
    pullStatus,
    ollamaUrl,
    ollamaModel,
    refresh,
    updateRouting,
    updateOllamaEndpoint,
    downloadModel,
    isOllamaReady,
  } = useSovereignDesktop();
  const { toast } = useToast();
  const [urlDraft, setUrlDraft] = useState(ollamaUrl);
  const [modelDraft, setModelDraft] = useState(ollamaModel);

  if (!isShadowTalkDesktop() && !available) {
    return null;
  }

  const onSaveEndpoint = async () => {
    await updateOllamaEndpoint(urlDraft.trim(), modelDraft.trim());
    toast({ title: "Ollama endpoint saved", description: "Connection refreshed." });
  };

  const onPullRecommended = async () => {
    const model = recommended?.id ?? modelDraft;
    const result = await downloadModel(model);
    if (result.ok) {
      toast({ title: "Model ready", description: `${model} is available for sovereign chat.` });
    } else {
      toast({
        title: "Download failed",
        description: result.error ?? "Could not pull model from Ollama.",
        variant: "destructive",
      });
    }
  };

  const openOllamaDownload = () => {
    const api = getDesktopAPI();
    if (api) void api.openExternal(OLLAMA_DOWNLOAD);
    else window.open(OLLAMA_DOWNLOAD, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
      <CardHeader>
        <div className="flex items-center gap-2 flex-wrap">
          <Shield className="h-5 w-5 text-amber-500" />
          <CardTitle>Sovereign Desktop (Ollama)</CardTitle>
          <Badge variant={isOllamaReady ? "default" : "secondary"}>
            {isOllamaReady ? "Ollama connected" : "Ollama not detected"}
          </Badge>
        </div>
        <CardDescription>
          Odysseus-style local inference for desktop. Chat runs through Ollama on your machine — no cloud
          required when sovereign mode is on.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3 text-xs space-y-1">
          <div className="font-medium text-foreground">Recommended for your hardware</div>
          {recommended ? (
            <p className="text-muted-foreground">
              {recommended.label} ({recommended.id}) — {recommended.description} (~{recommended.sizeGB} GB)
            </p>
          ) : (
            <p className="text-muted-foreground">Scanning hardware profile…</p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-md border p-2">
            <div className="text-muted-foreground">Ollama server</div>
            <div className="font-medium">{status?.reachable ? `v${status.version ?? "?"}` : "Not reachable"}</div>
          </div>
          <div className="rounded-md border p-2">
            <div className="text-muted-foreground">Active model</div>
            <div className="font-medium">{status?.activeModel ?? modelDraft}</div>
          </div>
          <div className="rounded-md border p-2 sm:col-span-2">
            <div className="text-muted-foreground">Installed models</div>
            <div className="font-medium">
              {status?.models?.length ? status.models.join(", ") : "None — pull a model below"}
            </div>
          </div>
        </div>

        {!status?.reachable && (
          <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <div className="space-y-2">
              <p>
                Install Ollama and start it, then point ShadowTalk at{" "}
                <code className="text-[10px]">http://127.0.0.1:11434</code>.
              </p>
              <Button size="sm" variant="outline" onClick={openOllamaDownload}>
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Get Ollama
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Label>Ollama endpoint</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)} placeholder="http://127.0.0.1:11434" />
            <Input value={modelDraft} onChange={(e) => setModelDraft(e.target.value)} placeholder="qwen2.5:7b" />
            <Button variant="outline" onClick={() => void onSaveEndpoint()}>
              <Server className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Desktop routing</Label>
          <RadioGroup
            value={routingMode}
            onValueChange={(v) => updateRouting(v as SovereignRoutingMode)}
            className="grid sm:grid-cols-3 gap-2"
          >
            {[
              {
                id: "auto",
                title: "Auto",
                desc: "Use Ollama when available; cloud for complex tasks.",
              },
              {
                id: "sovereign",
                title: "Sovereign",
                desc: "Keep chat on-device. No cloud unless Ollama fails.",
              },
              {
                id: "cloud-only",
                title: "Cloud only",
                desc: "Disable Ollama routing entirely.",
              },
            ].map((opt) => (
              <label
                key={opt.id}
                htmlFor={`sov-${opt.id}`}
                className="flex flex-col gap-1 rounded-md border p-3 cursor-pointer hover:border-amber-500/50"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem id={`sov-${opt.id}`} value={opt.id} />
                  <span className="font-medium text-sm">{opt.title}</span>
                </div>
                <span className="text-xs text-muted-foreground">{opt.desc}</span>
              </label>
            ))}
          </RadioGroup>
        </div>

        {compatible.length > 0 && (
          <div className="space-y-2">
            <Label>Compatible models</Label>
            <div className="flex flex-wrap gap-2">
              {compatible.map((m) => (
                <Button
                  key={m.id}
                  size="sm"
                  variant={modelDraft === m.id ? "default" : "outline"}
                  onClick={() => setModelDraft(m.id)}
                >
                  {m.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {pulling && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">{pullStatus}</div>
            <Progress value={undefined} className="animate-pulse" />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void onPullRecommended()} disabled={pulling || !status?.reachable}>
            {pulling ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Pull {recommended?.id ?? "model"}
          </Button>
          <Button variant="outline" onClick={() => void refresh()} disabled={pulling}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh status
          </Button>
        </div>

        {isOllamaReady && routingMode === "sovereign" && (
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Sovereign desktop active — chat stays on your machine.
          </div>
        )}

        {status?.error && (
          <p className="text-xs text-destructive">{status.error}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default SovereignDesktopSettings;
