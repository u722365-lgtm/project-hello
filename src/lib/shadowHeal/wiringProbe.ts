import { probeSelfHealEndpoint } from "@/lib/selfHealing/probeSelfHeal";
import { isSelfHealRemoteEnabled } from "@/lib/selfHealing/selfHealConfig";

export type WiringIssue = {
  code: string;
  message: string;
  severity: "low" | "medium" | "high";
};

const SESSION_ROUTES_KEY = "shadowtalk_wiring_routes_checked";

export async function runWiringProbe(): Promise<WiringIssue[]> {
  const issues: WiringIssue[] = [];

  if (typeof window === "undefined") return issues;

  try {
    const probe = "__shadow_heal_probe__";
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
  } catch {
    issues.push({
      code: "local_storage_blocked",
      message: "localStorage unavailable — offline heal queue may fail",
      severity: "high",
    });
  }

  if (!isSelfHealRemoteEnabled()) {
    const ok = await probeSelfHealEndpoint();
    if (!ok) {
      issues.push({
        code: "self_heal_remote_down",
        message: "Self-heal edge endpoint not reachable",
        severity: "medium",
      });
    }
  }

  if ("caches" in window) {
    try {
      const keys = await caches.keys();
      if (keys.length > 40) {
        issues.push({
          code: "cache_bloat",
          message: `PWA cache has ${keys.length} entries`,
          severity: "low",
        });
      }
    } catch {
      /* ignore */
    }
  }

  // Once per session: verify SPA serves index for a sample critical route
  try {
    if (!sessionStorage.getItem(SESSION_ROUTES_KEY)) {
      const res = await fetch("/chatbot", { method: "HEAD", redirect: "manual" });
      sessionStorage.setItem(SESSION_ROUTES_KEY, "1");
      if (res.status === 404) {
        issues.push({
          code: "spa_route_missing",
          message: "SPA routing may be misconfigured (chatbot 404)",
          severity: "high",
        });
      }
    }
  } catch {
    issues.push({
      code: "spa_route_unreachable",
      message: "Could not verify SPA route health",
      severity: "medium",
    });
  }

  return issues;
}
