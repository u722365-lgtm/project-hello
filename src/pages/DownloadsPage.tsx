import { useEffect, useMemo, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Monitor,
  FolderOpen,
  Bell,
  Zap,
  Shield,
  HardDrive,
  Terminal,
  Apple,
  Download,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDesktopApp } from "@/hooks/useDesktopApp";
import { SEOHead } from "@/components/SEOHead";
import {
  DESKTOP_INSTALLERS,
  GITHUB_RELEASES_LATEST,
  detectDesktopPlatform,
  installerDownloadUrl,
  type DesktopDownloadsManifest,
  type DesktopPlatform,
} from "@/lib/desktopDownloads";

const DESKTOP_FEATURES = [
  {
    icon: FolderOpen,
    title: "Native file access",
    description: "Open and save documents with your OS file picker — not limited to browser uploads.",
  },
  {
    icon: HardDrive,
    title: "Local data folder",
    description: "Vault exports, offline models, and caches live in a dedicated app data directory.",
  },
  {
    icon: Bell,
    title: "System notifications",
    description: "Agent completions and updates appear in your desktop notification center.",
  },
  {
    icon: Zap,
    title: "Tray & background",
    description: "Keep ShadowTalk in the system tray while agents run; return when tasks finish.",
  },
  {
    icon: Shield,
    title: "Stronger offline path",
    description: "On-device models and WebGPU work best in the desktop shell with persistent storage.",
  },
  {
    icon: Monitor,
    title: "Full workspace window",
    description: "1280×860 default layout tuned for chat, Mission Control, and multi-panel tools.",
  },
];

function formatBytes(bytes: number | null): string {
  if (bytes == null || bytes <= 0) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function PlatformIcon({ platform }: { platform: DesktopPlatform }) {
  if (platform === "windows") return <Monitor className="h-4 w-4 text-primary" />;
  if (platform === "mac") return <Apple className="h-4 w-4 text-primary" />;
  return <Terminal className="h-4 w-4 text-primary" />;
}

const DownloadsPage = () => {
  const navigate = useNavigate();
  const { isDesktop, info } = useDesktopApp();
  const detected = useMemo(() => detectDesktopPlatform(), []);
  const [manifest, setManifest] = useState<DesktopDownloadsManifest | null>(null);

  useEffect(() => {
    fetch("/downloads/manifest.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setManifest(data as DesktopDownloadsManifest | null))
      .catch(() => setManifest(null));
  }, []);

  const primaryPlatform =
    detected !== "unknown" ? detected : ("windows" as DesktopPlatform);

  const primaryMeta = DESKTOP_INSTALLERS[primaryPlatform];
  const primaryUrl = installerDownloadUrl(primaryPlatform, manifest);
  const primaryAvailable = manifest?.installers?.[primaryPlatform]?.available ?? false;
  const primarySize = manifest?.installers?.[primaryPlatform]?.sizeBytes ?? null;

  const platforms = (["windows", "mac", "linux"] as const).map((platform) => {
    const meta = DESKTOP_INSTALLERS[platform];
    const entry = manifest?.installers?.[platform];
    return {
      platform,
      meta,
      url: installerDownloadUrl(platform, manifest),
      available: entry?.available ?? false,
      sizeBytes: entry?.sizeBytes ?? null,
      filename: meta.filename,
    };
  });

  return (
    <>
      <SEOHead
        meta={{
          title: "Download ShadowTalk Desktop — Windows, macOS, Linux",
          description:
            "Download shadowtalk-setup.exe and installers for Mac and Linux. Install ShadowTalk AI as desktop software from the official downloads page.",
          keywords: [
            "ShadowTalk download",
            "shadowtalk-setup.exe",
            "ShadowTalk desktop",
            "Windows installer",
          ],
          canonical: "https://www.shadowtalk-ai.com/downloads",
        }}
      />
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-16 max-w-5xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 border-primary/40">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Official installers
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Download <span className="gradient-text">ShadowTalk</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Install ShadowTalk like any other desktop app — run{" "}
              <code className="text-sm bg-muted/60 px-1.5 py-0.5 rounded">shadowtalk-setup.exe</code> on
              Windows, or grab the macOS and Linux builds below.
            </p>
            {manifest?.version && (
              <p className="text-xs text-muted-foreground mt-3">
                Current release: v{manifest.version}
                {manifest.releasedAt ? ` · ${manifest.releasedAt}` : ""}
              </p>
            )}
          </div>

          {isDesktop ? (
            <Card className="mb-10 border-primary/30 bg-primary/5">
              <CardContent className="pt-6">
                <p className="text-center text-sm">
                  You are running <strong>ShadowTalk Desktop</strong>
                  {info?.appVersion ? ` v${info.appVersion}` : ""} on{" "}
                  <strong>{info?.platform ?? "desktop"}</strong>.
                </p>
                <div className="flex justify-center mt-4">
                  <Button onClick={() => navigate("/chatbot")}>Open workspace</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="mb-8 border-primary/30 bg-gradient-to-br from-primary/10 via-card/80 to-secondary/5">
                <CardContent className="pt-8 pb-8 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    {detected !== "unknown"
                      ? `Recommended for your device (${primaryMeta.label})`
                      : "Recommended download"}
                  </p>
                  <Button
                    size="lg"
                    className="btn-glow gap-2 h-12 px-8 text-base"
                    asChild
                  >
                    <a href={primaryUrl} download={primaryMeta.filename}>
                      <Download className="h-5 w-5" />
                      Download {primaryMeta.filename}
                    </a>
                  </Button>
                  {primarySize ? (
                    <p className="text-xs text-muted-foreground mt-2">{formatBytes(primarySize)}</p>
                  ) : null}
                  {!primaryAvailable && (
                    <p className="text-xs text-amber-500/90 mt-3 flex items-center justify-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Installer not on CDN yet — try{" "}
                      <a
                        href={manifest?.fallbackReleaseUrl ?? GITHUB_RELEASES_LATEST}
                        className="underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        GitHub Releases
                      </a>{" "}
                      or build locally.
                    </p>
                  )}
                  {primaryAvailable && (
                    <p className="text-xs text-primary mt-3 flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Ready to install from shadowtalk-ai.com
                    </p>
                  )}
                  <div className="flex flex-wrap justify-center gap-3 mt-6">
                    <Button variant="outline" onClick={() => navigate("/chatbot")}>
                      Use browser app
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-3 gap-4 mb-12">
                {platforms.map(({ platform, meta, url, available, sizeBytes, filename }) => (
                  <Card
                    key={platform}
                    className={
                      platform === primaryPlatform && detected !== "unknown"
                        ? "border-primary/40 ring-1 ring-primary/20"
                        : "border-border/60"
                    }
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <PlatformIcon platform={platform} />
                        {meta.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <p>{meta.description}</p>
                      <code className="block text-xs bg-muted/40 px-2 py-1 rounded break-all">
                        {filename}
                      </code>
                      {sizeBytes ? (
                        <p className="text-xs">{formatBytes(sizeBytes)}</p>
                      ) : null}
                      <Button
                        size="sm"
                        variant={available ? "default" : "secondary"}
                        className="w-full gap-1.5"
                        asChild
                      >
                        <a href={url} download={filename}>
                          <Download className="h-3.5 w-3.5" />
                          Download setup
                        </a>
                      </Button>
                      {!available && (
                        <p className="text-[10px] text-muted-foreground">
                          File hosts at{" "}
                          <span className="font-mono">/downloads/{filename}</span> after release staging.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="mb-12 border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Direct download URLs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs font-mono text-muted-foreground">
                  {(["windows", "mac", "linux"] as const).map((p) => (
                    <p key={p} className="break-all">
                      https://www.shadowtalk-ai.com{DESKTOP_INSTALLERS[p].websiteUrl}
                    </p>
                  ))}
                </CardContent>
              </Card>
            </>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {DESKTOP_FEATURES.map((f) => (
              <Card key={f.title} className="border-border/50">
                <CardContent className="pt-6">
                  <f.icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Terminal className="h-5 w-5" />
                For developers — build &amp; stage installers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Build branded installers, copy them to the website, and deploy:
              </p>
              <pre className="rounded-lg bg-muted/50 p-4 text-xs overflow-x-auto font-mono">
                {`npm install
npm run desktop:install
npm run desktop:make      # per OS: .exe / .dmg / AppImage
npm run desktop:stage     # → public/downloads/shadowtalk-setup.*`}
              </pre>
              <p className="text-xs text-muted-foreground">
                See <code>public/downloads/README.md</code> and <code>DESKTOP.md</code>.
              </p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default DownloadsPage;
