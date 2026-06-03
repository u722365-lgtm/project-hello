import { useCallback, useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  openFallbackReleases,
  resolveDesktopDownload,
  type ResolvedDesktopDownload,
} from "@/lib/desktopDownloadResolve";
import type { DesktopDownloadsManifest, DesktopPlatform } from "@/lib/desktopDownloads";

type DesktopDownloadButtonProps = {
  platform: DesktopPlatform;
  manifest: DesktopDownloadsManifest | null;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "secondary" | "outline";
  className?: string;
  label?: string;
};

export function DesktopDownloadButton({
  platform,
  manifest,
  size = "sm",
  variant = "default",
  className,
  label = "Download setup",
}: DesktopDownloadButtonProps) {
  const { toast } = useToast();
  const [resolved, setResolved] = useState<ResolvedDesktopDownload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void resolveDesktopDownload(platform, manifest).then((r) => {
      if (!cancelled) {
        setResolved(r);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [platform, manifest]);

  const handleClick = useCallback(() => {
    if (!resolved || resolved.source === "unavailable" || !resolved.url) {
      toast({
        title: "Installer not published yet",
        description:
          "shadowtalk-setup.exe must be built on Windows and deployed to the site (see steps below), or attached to a GitHub Release.",
        variant: "destructive",
      });
      openFallbackReleases(manifest);
      return;
    }

    if (resolved.source === "github") {
      toast({
        title: "Downloading from GitHub Releases",
        description: `Starting ${resolved.filename}…`,
      });
    }

    const a = document.createElement("a");
    a.href = resolved.url;
    a.rel = "noopener noreferrer";
    if (resolved.source === "website") {
      a.download = resolved.filename;
    } else {
      a.target = "_blank";
    }
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [resolved, manifest, toast]);

  const unavailable = !loading && resolved?.source === "unavailable";

  return (
    <Button
      type="button"
      size={size}
      variant={unavailable ? "secondary" : variant}
      className={className}
      disabled={loading}
      onClick={handleClick}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      {loading ? "Checking…" : label}
    </Button>
  );
}

export default DesktopDownloadButton;
