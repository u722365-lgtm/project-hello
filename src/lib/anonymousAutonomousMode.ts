/**
 * ShadowTalk anonymous + autonomous policy — identity-optional, self-directed agents.
 * Default: on (consumer builds). Enterprise mode still requires work email.
 */

import type { User } from "@supabase/supabase-js";
import { isAutonomousModeEnabled } from "@/lib/autonomy/config";
import { shouldUseLocalMissionStore as sovereignLocalMissions } from "@/lib/desktop/sovereignAgentMode";

export const ANONYMOUS_AUTONOMOUS_KEY = "shadowtalk_anonymous_autonomous_v1";
export const AUTO_APPROVE_MISSIONS_KEY = "shadowtalk_auto_approve_missions_v1";
export const ANONYMOUS_SESSION_KEY = "shadowtalk_anonymous_session_id";

const LOCAL_MISSION_LIMIT = 50;

export function isAnonymousAutonomousEnabled(): boolean {
  if (import.meta.env.VITE_ENTERPRISE_MODE === "true") return false;
  try {
    const v = localStorage.getItem(ANONYMOUS_AUTONOMOUS_KEY);
    if (v === null) return true;
    return v === "1" || v === "true";
  } catch {
    return true;
  }
}

export function setAnonymousAutonomousEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(ANONYMOUS_AUTONOMOUS_KEY, enabled ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function shouldAutoApproveMissions(): boolean {
  if (!isAutonomousModeEnabled()) return false;
  try {
    const v = localStorage.getItem(AUTO_APPROVE_MISSIONS_KEY);
    if (v === null) return isAnonymousAutonomousEnabled();
    return v === "1" || v === "true";
  } catch {
    return isAnonymousAutonomousEnabled();
  }
}

export function setAutoApproveMissions(enabled: boolean): void {
  try {
    localStorage.setItem(AUTO_APPROVE_MISSIONS_KEY, enabled ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/** Stable device-scoped id for guest / offline paths (no email required). */
export function getAnonymousSessionId(): string {
  if (typeof localStorage === "undefined") return "anon_ephemeral";
  let sid = localStorage.getItem(ANONYMOUS_SESSION_KEY);
  if (!sid) {
    sid = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(ANONYMOUS_SESSION_KEY, sid);
  }
  return sid;
}

export function isIdentityOptionalUser(user: User | null | undefined, isAnonymous: boolean): boolean {
  if (!isAnonymousAutonomousEnabled()) return false;
  if (!user) return true;
  return isAnonymous;
}

export function shouldUseAnonymousMissionStore(): boolean {
  if (!isAnonymousAutonomousEnabled()) return sovereignLocalMissions();
  return true;
}

export function getLocalMissionQuotaInfo(): {
  used: number;
  limit: number;
  remaining: number;
  plan: "anonymous";
  resetDate: string;
} {
  const monthKey = new Date().toISOString().slice(0, 7);
  const storageKey = `shadowtalk_local_mission_quota_${monthKey}`;
  let used = 0;
  try {
    used = Number(localStorage.getItem(storageKey) || "0");
  } catch {
    used = 0;
  }
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
  return {
    used,
    limit: LOCAL_MISSION_LIMIT,
    remaining: Math.max(0, LOCAL_MISSION_LIMIT - used),
    plan: "anonymous",
    resetDate: nextMonth.toISOString(),
  };
}

export function consumeLocalMissionQuota(): void {
  const monthKey = new Date().toISOString().slice(0, 7);
  const storageKey = `shadowtalk_local_mission_quota_${monthKey}`;
  const current = Number(localStorage.getItem(storageKey) || "0");
  localStorage.setItem(storageKey, String(current + 1));
}

export function applyAnonymousAutonomousDefaults(): void {
  if (!isAnonymousAutonomousEnabled()) return;
  try {
    if (localStorage.getItem("shadowtalk_sovereign_agents") === null) {
      localStorage.setItem("shadowtalk_sovereign_agents", "1");
    }
    if (localStorage.getItem(AUTO_APPROVE_MISSIONS_KEY) === null) {
      localStorage.setItem(AUTO_APPROVE_MISSIONS_KEY, "1");
    }
  } catch {
    /* ignore */
  }
}

export function isAnonymousSession(user: User | null | undefined, isAnonymousFlag: boolean): boolean {
  if (!user) return true;
  return isAnonymousFlag || user.is_anonymous === true;
}
