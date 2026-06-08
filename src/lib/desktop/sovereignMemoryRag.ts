/**
 * Sovereign memory RAG — indexes chat locally and injects retrieved context into on-device inference.
 */

import { isShadowTalkDesktop } from "@/lib/desktopBridge";
import {
  formatMemoryContext,
  searchLocalMemories,
  upsertLocalMemory,
  type MemoryCategory,
} from "@/lib/desktop/localMemoryStore";
import { isSovereignModeEnabled, shouldPreferOllamaInference } from "@/lib/desktop/sovereignMode";
import type { RouterMessage } from "@/lib/offline/hybridRouter";

const INDEX_ENABLED_KEY = "shadowtalk_sovereign_memory_index";

export function isSovereignMemoryEnabled(): boolean {
  if (!isShadowTalkDesktop()) return false;
  const stored = localStorage.getItem(INDEX_ENABLED_KEY);
  if (stored === "0") return false;
  return true;
}

export function setSovereignMemoryEnabled(enabled: boolean): void {
  localStorage.setItem(INDEX_ENABLED_KEY, enabled ? "1" : "0");
}

export function shouldUseLocalMemoryRag(): boolean {
  if (!isShadowTalkDesktop()) return false;
  if (!isSovereignMemoryEnabled()) return false;
  return isSovereignModeEnabled() || shouldPreferOllamaInference();
}

export async function indexSovereignMemory(
  text: string,
  opts: { category?: MemoryCategory; source?: string; id?: string } = {},
): Promise<void> {
  if (!shouldUseLocalMemoryRag()) return;
  const trimmed = text.trim();
  if (trimmed.length < 12) return;
  try {
    await upsertLocalMemory({
      text: trimmed,
      category: opts.category ?? "chat",
      source: opts.source,
      id: opts.id,
    });
  } catch (e) {
    console.warn("[SovereignMemory] Index failed:", e);
  }
}

export async function retrieveSovereignMemoryContext(query: string): Promise<string> {
  if (!shouldUseLocalMemoryRag()) return "";
  try {
    const results = await searchLocalMemories(query, 5, 0.3);
    return formatMemoryContext(results);
  } catch (e) {
    console.warn("[SovereignMemory] Retrieve failed:", e);
    return "";
  }
}

export async function augmentMessagesWithLocalMemory(
  messages: RouterMessage[],
): Promise<RouterMessage[]> {
  if (!shouldUseLocalMemoryRag()) return messages;

  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  if (!lastUser.trim()) return messages;

  const memoryContext = await retrieveSovereignMemoryContext(lastUser);
  if (!memoryContext) return messages;

  const systemIdx = messages.findIndex((m) => m.role === "system");
  if (systemIdx >= 0) {
    const merged = [...messages];
    merged[systemIdx] = {
      ...merged[systemIdx],
      content: `${merged[systemIdx].content}\n\n${memoryContext}`,
    };
    return merged;
  }

  return [{ role: "system", content: memoryContext }, ...messages];
}
