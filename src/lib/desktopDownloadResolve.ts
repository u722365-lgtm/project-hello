import {
  DESKTOP_INSTALLERS,
  GITHUB_RELEASES_LATEST,
  type DesktopDownloadsManifest,
  type DesktopPlatform,
} from "./desktopDownloads";

export type DownloadSource = "website" | "github" | "unavailable";

export interface ResolvedDesktopDownload {
  platform: DesktopPlatform;
  filename: string;
  url: string | null;
  source: DownloadSource;
  sizeBytes: number | null;
  label: string;
}

const GITHUB_API_LATEST =
  "https://api.github.com/repos/zain836/shadowtalk-ai-903ca615/releases/latest";

let githubAssetsCache: { at: number; assets: { name: string; browser_download_url: string; size: number }[] } | null =
  null;

const GITHUB_CACHE_MS = 5 * 60 * 1000;

export async function probeWebsiteInstaller(websiteUrl: string): Promise<{
  available: boolean;
  sizeBytes: number | null;
}> {
  try {
    const res = await fetch(websiteUrl, { method: "HEAD", cache: "no-store" });
    if (!res.ok) return { available: false, sizeBytes: null };
    const len = res.headers.get("content-length");
    return {
      available: true,
      sizeBytes: len ? Number(len) : null,
    };
  } catch {
    return { available: false, sizeBytes: null };
  }
}

export async function fetchGithubReleaseAssets(): Promise<
  { name: string; browser_download_url: string; size: number }[]
> {
  if (githubAssetsCache && Date.now() - githubAssetsCache.at < GITHUB_CACHE_MS) {
    return githubAssetsCache.assets;
  }
  try {
    const res = await fetch(GITHUB_API_LATEST, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      assets?: { name: string; browser_download_url: string; size: number }[];
    };
    const assets = data.assets ?? [];
    githubAssetsCache = { at: Date.now(), assets };
    return assets;
  } catch {
    return [];
  }
}

export async function resolveDesktopDownload(
  platform: DesktopPlatform,
  manifest: DesktopDownloadsManifest | null,
): Promise<ResolvedDesktopDownload> {
  const meta = DESKTOP_INSTALLERS[platform];
  const manifestEntry = manifest?.installers?.[platform];

  let websiteOk = manifestEntry?.available ?? false;
  let sizeBytes = manifestEntry?.sizeBytes ?? null;

  if (!websiteOk) {
    const probe = await probeWebsiteInstaller(meta.websiteUrl);
    websiteOk = probe.available;
    if (probe.sizeBytes) sizeBytes = probe.sizeBytes;
  }

  if (websiteOk) {
    return {
      platform,
      filename: meta.filename,
      url: meta.websiteUrl,
      source: "website",
      sizeBytes,
      label: meta.label,
    };
  }

  const assets = await fetchGithubReleaseAssets();
  const asset = assets.find((a) => a.name === meta.filename);
  if (asset?.browser_download_url) {
    return {
      platform,
      filename: meta.filename,
      url: asset.browser_download_url,
      source: "github",
      sizeBytes: asset.size ?? null,
      label: meta.label,
    };
  }

  return {
    platform,
    filename: meta.filename,
    url: null,
    source: "unavailable",
    sizeBytes: null,
    label: meta.label,
  };
}

export function openFallbackReleases(manifest?: DesktopDownloadsManifest | null): void {
  window.open(manifest?.fallbackReleaseUrl ?? GITHUB_RELEASES_LATEST, "_blank", "noopener,noreferrer");
}
