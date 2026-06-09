import { useCallback, useEffect, useRef, useState } from "react";
import { Clapperboard, Download, Loader2, Pause, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFeatureGating } from "@/hooks/useFeatureGating";
import { FeatureLockedOverlay } from "@/components/chat/FeatureLockedOverlay";
import { canAccessVideoStudio, VIDEO_STUDIO_FEATURE_KEY } from "@/lib/videoGenerator/planAccess";
import { drawVideoFrame } from "@/lib/videoGenerator/drawFrame";
import { downloadBlob, exportViralShortMp4, type ExportProgress } from "@/lib/videoGenerator/exportMp4";
import { VARIANT_LABELS } from "@/lib/videoGenerator/scripts";
import {
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_TOTAL_FRAMES,
  VIDEO_WIDTH,
} from "@/lib/videoGenerator/timing";
import type { VideoHookVariant } from "@/lib/videoGenerator/types";
import { toast } from "sonner";

const VARIANTS: VideoHookVariant[] = ["privacy", "developer", "student"];

export function VideoStudioPanel() {
  const { userPlan, hasSpecialAccess, canAccess } = useFeatureGating();
  const hasAccess = canAccess(VIDEO_STUDIO_FEATURE_KEY) && canAccessVideoStudio(userPlan, hasSpecialAccess);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [variant, setVariant] = useState<VideoHookVariant>("privacy");
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const rafRef = useRef<number>(0);
  const lastTickRef = useRef(0);

  const paint = useCallback(
    (f: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      drawVideoFrame(ctx, f, variant);
    },
    [variant],
  );

  useEffect(() => {
    paint(frame);
  }, [frame, paint]);

  useEffect(() => {
    if (!playing) return;
    lastTickRef.current = performance.now();
    const tick = (now: number) => {
      const dt = now - lastTickRef.current;
      if (dt >= 1000 / VIDEO_FPS) {
        lastTickRef.current = now;
        setFrame((f) => (f + 1 >= VIDEO_TOTAL_FRAMES ? 0 : f + 1));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing]);

  const handleExport = async () => {
    if (!hasAccess) return;
    setExporting(true);
    setProgress({ phase: "loading", percent: 0, message: "Starting…" });
    try {
      const blob = await exportViralShortMp4(variant, setProgress);
      downloadBlob(blob, `shadowtalk-viral-${variant}.mp4`);
      toast.success("Video exported — ready to post!");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Export failed";
      toast.error(msg);
    } finally {
      setExporting(false);
      setProgress(null);
    }
  };

  const preview = (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex flex-col items-center gap-3 shrink-0">
        <div
          className="rounded-2xl overflow-hidden border border-border shadow-2xl bg-black"
          style={{ width: Math.min(360, VIDEO_WIDTH), aspectRatio: `${VIDEO_WIDTH}/${VIDEO_HEIGHT}` }}
        >
          <canvas
            ref={canvasRef}
            width={VIDEO_WIDTH}
            height={VIDEO_HEIGHT}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex items-center gap-2 w-full max-w-[360px]">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPlaying((p) => !p)}
            disabled={exporting}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <input
            type="range"
            min={0}
            max={VIDEO_TOTAL_FRAMES - 1}
            value={frame}
            className="flex-1 accent-primary"
            onChange={(e) => {
              setPlaying(false);
              setFrame(Number(e.target.value));
            }}
            disabled={exporting}
          />
          <span className="text-xs text-muted-foreground tabular-nums w-12">
            {(frame / VIDEO_FPS).toFixed(1)}s
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        <div className="space-y-2">
          <Label>Hook variant</Label>
          <Select value={variant} onValueChange={(v) => setVariant(v as VideoHookVariant)} disabled={exporting}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VARIANTS.map((v) => (
                <SelectItem key={v} value={v}>
                  {VARIANT_LABELS[v]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 text-sm text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">100% on-device.</strong> No API keys. Video renders in your
              browser with bundled voiceover + canvas animation.
            </p>
            <p>60s vertical short (9:16) — optimized for TikTok, Reels, and Shorts.</p>
          </CardContent>
        </Card>

        {exporting && progress && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progress.message}</span>
              <span>{progress.percent}%</span>
            </div>
            <Progress value={progress.percent} />
          </div>
        )}

        <Button className="w-full gap-2" size="lg" onClick={() => void handleExport()} disabled={exporting}>
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {exporting ? "Generating MP4…" : "Generate & download MP4"}
        </Button>
      </div>
    </div>
  );

  if (!hasAccess) {
    return (
      <FeatureLockedOverlay featureName="Shadow Video Studio" requiredPlan="pro">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clapperboard className="h-5 w-5" />
              Shadow Video Studio
            </CardTitle>
          </CardHeader>
          <CardContent>{preview}</CardContent>
        </Card>
      </FeatureLockedOverlay>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Clapperboard className="h-5 w-5 text-primary" />
            Shadow Video Studio
            <Badge variant="secondary" className="text-[10px]">Pro & Elite</Badge>
          </CardTitle>
          <Badge variant="outline" className="gap-1 text-[10px]">
            <Sparkles className="h-3 w-3" /> No API key
          </Badge>
        </div>
      </CardHeader>
      <CardContent>{preview}</CardContent>
    </Card>
  );
}
