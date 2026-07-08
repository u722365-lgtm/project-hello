import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Download, Settings2, WifiOff, Loader2, Check, Zap } from "lucide-react";
import { useQuickOfflineModels } from "@/hooks/useQuickOfflineModels";

/**
 * Fast-download small models + one-click offline chat configuration.
 * Avoids multi-GB Gemma downloads that crash browsers near GPU init (~85%).
 */
export function QuickOfflineModelsCard() {
  const {
    models,
    cached,
    progress,
    loadingId,
    activeModelId,
    forceOffline,
    download,
    configureForChat,
    disconnectCloud,
    isModelReady,
  } = useQuickOfflineModels();

  return (
    <Card className="border-emerald-500/30 bg-emerald-500/5">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Zap className="h-5 w-5 text-emerald-500" />
          <CardTitle>Quick offline models</CardTitle>
          {forceOffline && (
            <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-500/40">
              <WifiOff className="h-3 w-3 mr-1" />
              Cloud disconnected
            </Badge>
          )}
        </div>
        <CardDescription>
          Small models download in minutes. Use <strong>Configure</strong> to load the model in chat and
          disconnect from the cloud (on-device only). Large Gemma models below can crash weak devices — start here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {models.map((model) => {
          const isCached = cached[model.id];
          const isLoading = loadingId === model.id;
          const isActive = activeModelId === model.id && forceOffline;
          const isReady = isModelReady(model.id);
          const showProgress = isLoading && progress?.modelId === model.id;

          return (
            <div
              key={model.id}
              className="rounded-lg border border-border/50 bg-background/40 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{model.name}</span>
                    {model.badge && (
                      <Badge variant="outline" className="text-[10px] border-emerald-500/40">
                        {model.badge}
                      </Badge>
                    )}
                    {isCached && !isLoading && (
                      <Badge variant="secondary" className="text-[10px]">
                        Cached
                      </Badge>
                    )}
                    {isActive && (
                      <Badge className="text-[10px] bg-emerald-600/30 text-emerald-300">
                        Active in chat
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{model.description}</p>
                  <p className="text-[11px] text-muted-foreground">~{model.sizeMB} MB</p>
                </div>
              </div>

              {showProgress && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{progress?.message}</span>
                    <span>{progress?.percent ?? 0}%</span>
                  </div>
                  <Progress value={progress?.percent ?? 0} className="h-2" />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!!loadingId}
                  onClick={() => void download(model)}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {isCached ? "Re-download" : "Download"}
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={!!loadingId}
                  onClick={() => void configureForChat(model)}
                >
                  {isReady || isCached ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Settings2 className="h-4 w-4 mr-2" />
                  )}
                  Configure
                </Button>
              </div>
            </div>
          );
        })}

        {forceOffline && (
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={disconnectCloud}>
            Re-enable cloud chat (turn off offline-only)
          </Button>
        )}

        <p className="text-[11px] text-muted-foreground">
          Tip: If a large model fails near 85%, your browser ran out of GPU memory. Use SmolLM Nano first —
          it is the same model used for silent bootstrap and works on most phones and laptops.
        </p>
      </CardContent>
    </Card>
  );
}

export default QuickOfflineModelsCard;
