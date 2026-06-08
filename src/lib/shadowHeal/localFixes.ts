import type { WiringIssue } from "./wiringProbe";
import { markSelfHealRemoteEnabled } from "@/lib/selfHealing/selfHealConfig";
import { probeSelfHealEndpoint } from "@/lib/selfHealing/probeSelfHeal";
import { setTrafficLevel } from "./shadowHealConfig";

export type FixResult = { code: string; applied: boolean; detail?: string };

export async function applyLocalFixes(issues: WiringIssue[]): Promise<FixResult[]> {
  const results: FixResult[] = [];

  for (const issue of issues) {
    if (issue.code === "self_heal_remote_down") {
      const ok = await probeSelfHealEndpoint();
      results.push({
        code: issue.code,
        applied: ok,
        detail: ok ? "Re-enabled remote self-heal" : "Still unreachable",
      });
      if (ok) markSelfHealRemoteEnabled();
      continue;
    }

    if (issue.code === "cache_bloat" && "caches" in window) {
      try {
        const keys = await caches.keys();
        const stale = keys.filter((k) => k.includes("workbox-precache") === false).slice(0, 10);
        await Promise.all(stale.map((k) => caches.delete(k)));
        results.push({ code: issue.code, applied: true, detail: `Cleared ${stale.length} caches` });
      } catch {
        results.push({ code: issue.code, applied: false });
      }
      continue;
    }

    if (issue.code.startsWith("route_unreachable_") || issue.code.startsWith("route_missing_")) {
      // Report to remote heal queue — no safe client-side route repair
      results.push({ code: issue.code, applied: false, detail: "Reported for remote analysis" });
      continue;
    }
  }

  return results;
}

export function applyTrafficMitigations(level: "normal" | "elevated" | "critical"): void {
  setTrafficLevel(level);
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  if (level === "critical") {
    root.classList.add("shadow-heal-reduce-motion");
    root.dataset.shadowDeferChrome = "1";
  } else if (level === "elevated") {
    root.classList.add("shadow-heal-reduce-motion");
    root.dataset.shadowDeferChrome = "0";
  } else {
    root.classList.remove("shadow-heal-reduce-motion");
    delete root.dataset.shadowDeferChrome;
  }
}
