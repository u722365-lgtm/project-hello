const ENABLED_KEY = "shadowtalk_self_heal_remote_enabled";
const DISABLED_KEY = "shadowtalk_self_heal_remote_disabled";

/** Remote self-heal edge calls are opt-in after a successful health probe */
export function isSelfHealRemoteEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(DISABLED_KEY) === "1") return false;
  if (import.meta.env.VITE_SELF_HEAL_ENABLED === "true") return true;
  return localStorage.getItem(ENABLED_KEY) === "1";
}

export function markSelfHealRemoteEnabled(): void {
  try {
    localStorage.setItem(ENABLED_KEY, "1");
    localStorage.removeItem(DISABLED_KEY);
  } catch {
    /* ignore */
  }
}

export function markSelfHealRemoteDisabled(): void {
  try {
    localStorage.setItem(DISABLED_KEY, "1");
    localStorage.removeItem(ENABLED_KEY);
  } catch {
    /* ignore */
  }
}

export function shouldIgnoreCapturedError(message: string, sourceFile?: string): boolean {
  const blob = `${message} ${sourceFile ?? ""}`.toLowerCase();
  return (
    blob.includes("self-heal") ||
    blob.includes("shadowtalk_errors") ||
    blob.includes("shadowtalk_fix_proposals") ||
    blob.includes("index-source")
  );
}
