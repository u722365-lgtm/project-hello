import { getDesktopAPI, isShadowTalkDesktop } from "@/lib/desktopBridge";
import { fetchOllamaStatus } from "@/lib/desktop/ollamaInference";
import { getStatus } from "@/lib/ollama/unifiedClient";
import { updateOllamaCache } from "@/lib/desktop/sovereignMode";

/** Probe Ollama on startup (web + desktop) so routing can prefer local inference immediately. */
export async function warmSovereignDesktop(): Promise<void> {
  try {
    if (isShadowTalkDesktop()) {
      const api = getDesktopAPI();
      const bootstrap = api ? await api.ollamaBootstrapSnapshot() : null;
      if (bootstrap?.reachable && bootstrap.models.length > 0) {
        const status = await fetchOllamaStatus();
        if (status) updateOllamaCache(status);
        return;
      }

      const status = await fetchOllamaStatus();
      if (status) updateOllamaCache(status);
      return;
    }

    await getStatus();
  } catch {
    // Ollama optional — ignore probe failures at startup
  }
}

/** @deprecated Use warmSovereignDesktop — alias for clarity */
export const warmOllamaProvider = warmSovereignDesktop;
