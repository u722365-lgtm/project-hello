import { isShadowTalkDesktop } from "@/lib/desktopBridge";
import { fetchOllamaStatus } from "@/lib/desktop/ollamaInference";
import { updateOllamaCache } from "@/lib/desktop/sovereignMode";

/** Probe Ollama on desktop startup so routing can prefer local inference immediately. */
export async function warmSovereignDesktop(): Promise<void> {
  if (!isShadowTalkDesktop()) return;
  try {
    const status = await fetchOllamaStatus();
    if (status) updateOllamaCache(status);
  } catch {
    // Ollama optional — ignore probe failures at startup
  }
}
