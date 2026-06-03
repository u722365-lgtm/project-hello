/** Canonical installer filenames served from https://www.shadowtalk-ai.com/downloads/ */

export const DESKTOP_DOWNLOADS_PATH = "/downloads";

export type DesktopPlatform = "windows" | "mac" | "linux";

export interface DesktopInstallerMeta {
  platform: DesktopPlatform;
  filename: string;
  /** Same-origin URL when installers are staged under public/downloads/ */
  websiteUrl: string;
  label: string;
  description: string;
  fileExtension: string;
}

export const DESKTOP_INSTALLERS: Record<DesktopPlatform, DesktopInstallerMeta> = {
  windows: {
    platform: "windows",
    filename: "shadowtalk-setup.exe",
    websiteUrl: `${DESKTOP_DOWNLOADS_PATH}/shadowtalk-setup.exe`,
    label: "Windows",
    description: "64-bit installer (NSIS). Run setup, then launch ShadowTalk from Start.",
    fileExtension: "exe",
  },
  mac: {
    platform: "mac",
    filename: "shadowtalk-setup.dmg",
    websiteUrl: `${DESKTOP_DOWNLOADS_PATH}/shadowtalk-setup.dmg`,
    label: "macOS",
    description: "Disk image for Apple Silicon and Intel Macs. Open the DMG and drag ShadowTalk to Applications.",
    fileExtension: "dmg",
  },
  linux: {
    platform: "linux",
    filename: "shadowtalk-setup.AppImage",
    websiteUrl: `${DESKTOP_DOWNLOADS_PATH}/shadowtalk-setup.AppImage`,
    label: "Linux",
    description: "Portable AppImage. Mark executable (chmod +x) and run.",
    fileExtension: "AppImage",
  },
};

export const GITHUB_RELEASES_LATEST =
  "https://github.com/zain836/shadowtalk-ai-903ca615/releases/latest";

export interface DesktopDownloadsManifest {
  version: string;
  releasedAt: string;
  installers: Record<
    DesktopPlatform,
    {
      filename: string;
      websiteUrl: string;
      available: boolean;
      sizeBytes: number | null;
      sha256: string | null;
    }
  >;
  fallbackReleaseUrl: string;
}

export function detectDesktopPlatform(): DesktopPlatform | "unknown" {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  const platform = (navigator.platform ?? "").toLowerCase();
  if (ua.includes("win") || platform.includes("win")) return "windows";
  if (ua.includes("mac") || platform.includes("mac")) return "mac";
  if (ua.includes("linux") || platform.includes("linux")) return "linux";
  return "unknown";
}

export function installerDownloadUrl(
  platform: DesktopPlatform,
  manifest?: DesktopDownloadsManifest | null,
): string {
  const entry = manifest?.installers?.[platform];
  if (entry?.available) return entry.websiteUrl;
  return DESKTOP_INSTALLERS[platform].websiteUrl;
}
