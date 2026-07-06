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
  type DesktopDownloadsManifest,
  type DesktopPlatform,
} from "@/lib/desktopDownloads";
import {
  openFallbackReleases,
  resolveDesktopDownload,
  type ResolvedDesktopDownload,
} from "@/lib/desktopDownloadResolve";
import { DesktopDownloadButton } from "@/components/downloads/DesktopDownloadButton";
import { useToast } from "@/hooks/use-toast";
import { PAGE_SEO } from "@/lib/seo";

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
  const { toast } = useToast();
  const { isDesktop, info } = useDesktopApp();
  const detected = useMemo(() => detectDesktopPlatform(), []);
  const [manifest, setManifest] = useState<DesktopDownloadsManifest | null>(null);
  const [primaryResolved, setPrimaryResolved] = useState<ResolvedDesktopDownload | null>(null);
  const [checkingPrimary, setCheckingPrimary] = useState(true);

  const primaryPlatform =
    detected !== "unknown" ? detected : ("windows" as DesktopPlatform);

  const primaryMeta = DESKTOP_INSTALLERS[primaryPlatform];

  useEffect(() => {
    fetch("/downloads/manifest.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setManifest(data as DesktopDownloadsManifest | null))
      .catch(() => setManifest(null));
  }, []);

  useEffect(() => {
    setCheckingPrimary(true);
    void resolveDesktopDownload(primaryPlatform, manifest).then((r) => {
      setPrimaryResolved(r);
      setCheckingPrimary(false);
    });
  }, [primaryPlatform, manifest]);

  const primaryAvailable = primaryResolved?.source !== "unavailable" && Boolean(primaryResolved?.url);
  const primarySize = primaryResolved?.sizeBytes ?? null;

  const handlePrimaryDownload = () => {
    if (!primaryResolved?.url) {
      toast({
        title: "Installer not on the website yet",
        description:
          "Build shadowtalk-setup.exe on a Windows PC (see below), then deploy. You do not send the file to an AI — you publish it via git deploy or GitHub Releases.",
        variant: "destructive",
      });
      openFallbackReleases(manifest);
      return;
    }
    if (primaryResolved.source === "github") {
      toast({ title: "Downloading from GitHub", description: primaryResolved.filename });
    }
    const a = document.createElement("a");
    a.href = primaryResolved.url;
    a.rel = "noopener noreferrer";
    if (primaryResolved.source === "website") a.download = primaryResolved.filename;
    else a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <>
      <SEOHead meta={PAGE_SEO.downloads} structuredData={undefined} />
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
                    disabled={checkingPrimary}
                    onClick={handlePrimaryDownload}
                  >
                    <Download className="h-5 w-5" />
                    {checkingPrimary
                      ? "Checking installer…"
                      : `Download ${primaryMeta.filename}`}
                  </Button>
                  {primarySize ? (
                    <p className="text-xs text-muted-foreground mt-2">{formatBytes(primarySize)}</p>
                  ) : null}
                  {!checkingPrimary && !primaryAvailable && (
                    <p className="text-xs text-amber-500/90 mt-3 max-w-md mx-auto leading-relaxed">
                      <AlertCircle className="h-3.5 w-3.5 inline mr-1 align-text-bottom" />
                      No installer is hosted yet. The site owner must build{" "}
                      <code className="text-[10px]">{primaryMeta.filename}</code> on Windows and deploy it
                      (steps below). Clicking download opens GitHub Releases if a build exists there.
                    </p>
                  )}
                  {!checkingPrimary && primaryAvailable && (
                    <p className="text-xs text-primary mt-3 flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {primaryResolved?.source === "website"
                        ? "Ready to install from shadowtalk-ai.com"
                        : "Downloading from GitHub Releases"}
                    </p>
                  )}
                  <div className="flex flex-wrap justify-center gap-3 mt-6">
                    <Button variant="outline" onClick={() => navigate("/chatbot")}>
                      Use browser app
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-8 border-amber-500/30 bg-amber-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Site owner — how to publish installers</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-3">
                  <p>
                    Download buttons only work after <strong>you</strong> build the setup file on a real
                    Windows / Mac / Linux machine. You do <strong>not</strong> email the .exe to an AI — you
                    deploy it with your website or GitHub Releases.
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>On a Windows PC: clone the repo, run <code>npm run desktop:make</code></li>
                    <li>Run <code>npm run desktop:stage</code> (copies to <code>public/downloads/</code>)</li>
                    <li>Commit, push, and redeploy shadowtalk-ai.com — or upload the same file to GitHub Releases</li>
                  </ol>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-3 gap-4 mb-12">
                {(["windows", "mac", "linux"] as const).map((platform) => {
                  const meta = DESKTOP_INSTALLERS[platform];
                  return (
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
                          {meta.filename}
                        </code>
                        <DesktopDownloadButton
                          platform={platform}
                          manifest={manifest}
                          className="w-full gap-1.5"
                          label="Download setup"
                        />
                      </CardContent>
                    </Card>
                  );
                })}
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
