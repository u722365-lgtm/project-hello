/**
 * Auto-recovery primitives applied at runtime based on AI-approved fix proposals.
 * Listens to proposed `runtime_handler` shapes from the self-heal edge function.
 */
import { supabase } from "@/integrations/supabase/client";

interface RuntimeHandler {
  action: "retry" | "fallback" | "silence" | "reload";
  details?: string;
  pattern?: string;
}

const APPLIED_KEY = "shadowtalk_self_heal_applied";

function loadApplied(): Record<string, RuntimeHandler> {
  try {
    return JSON.parse(localStorage.getItem(APPLIED_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveApplied(map: Record<string, RuntimeHandler>) {
  localStorage.setItem(APPLIED_KEY, JSON.stringify(map));
}

/** Subscribes to approved runtime fixes and applies them locally */
export function startAutoRecoverySync() {
  if (typeof window === "undefined") return;
  let stopped = false;

  const pull = async () => {
    if (stopped) return;
    try {
      const { data, error } = await supabase
        .from("shadowtalk_fix_proposals")
        .select("id, runtime_handler, error_id, status, patch_strategy")
        .eq("status", "approved")
        .eq("patch_strategy", "runtime_recover")
        .limit(50);
      if (error || !data) return;

      const map = loadApplied();
      for (const p of data) {
        if (!p.runtime_handler) continue;
        map[p.id] = p.runtime_handler as unknown as RuntimeHandler;
      }
      saveApplied(map);
    } catch {
      /* offline ok */
    }
  };

  void pull();
  const t = setInterval(pull, 60_000);
  return () => {
    stopped = true;
    clearInterval(t);
  };
}

/** Check whether a given error message matches any applied auto-recovery handler */
export function findHandlerFor(message: string): RuntimeHandler | null {
  const map = loadApplied();
  const lower = message.toLowerCase();
  for (const h of Object.values(map)) {
    if (h.pattern && lower.includes(h.pattern.toLowerCase())) return h;
  }
  // Generic transient network / 5xx recovery when any retry handler was approved
  if (/\b(failed to fetch|network|502|503|504|timeout)\b/i.test(message)) {
    const retry = Object.values(map).find((h) => h.action === "retry");
    if (retry) return retry;
  }
  return null;
}

/** Wraps an async call with auto-retry + fallback if a handler exists */
export async function withSelfHeal<T>(
  fn: () => Promise<T>,
  opts: { fallback?: () => Promise<T>; label?: string } = {},
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const handler = findHandlerFor(msg);
    if (handler?.action === "retry") {
      await new Promise((r) => setTimeout(r, 800));
      try {
        return await fn();
      } catch {
        await new Promise((r) => setTimeout(r, 1600));
        return fn();
      }
    }
    if (handler?.action === "fallback" && opts.fallback) {
      return opts.fallback();
    }
    if (handler?.action === "silence") {
      return undefined as unknown as T;
    }
    throw err;
  }
}
