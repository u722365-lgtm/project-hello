import electronIsDev from 'electron-is-dev';
import { autoUpdater } from 'electron-updater';

/**
 * Optional GitHub auto-updates. Off by default until you publish releases
 * (set SHADOWTALK_AUTO_UPDATE=1 at build time or publish a GitHub Release).
 */
export function scheduleAutoUpdateCheck(): void {
  if (electronIsDev) return;

  const enabled = process.env.SHADOWTALK_AUTO_UPDATE === '1';
  if (!enabled) {
    return;
  }

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on('error', (err) => {
    console.warn('[ShadowTalk] Auto-update error:', err?.message ?? err);
  });

  void autoUpdater.checkForUpdates().catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('No published versions')) {
      console.info(
        '[ShadowTalk] No GitHub release yet — skipping updates. Publish v1.0.0 on GitHub to enable.',
      );
      return;
    }
    console.warn('[ShadowTalk] Update check failed:', msg);
  });
}
