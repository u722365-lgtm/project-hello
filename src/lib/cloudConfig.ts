/**
 * Lovable Cloud AI endpoint config.
 *
 * The project URL and publishable key are public values (safe in the bundle).
 * They are hardcoded as fallbacks so builds made outside Lovable (Firebase
 * Hosting / Netlify CI, where VITE_* env vars are not injected) still reach the
 * ShadowTalk chat + image functions instead of silently failing.
 */

const FALLBACK_URL = "https://krsaqoitjivaexhepvll.supabase.co";
const FALLBACK_KEY = "sb_publishable_yEjCspr-LLB4ODTFtT_ygw_PPEO-nEG";

export function cloudBaseUrl(): string {
  const env = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || "";
  const base = env && !env.includes("placeholder") ? env : FALLBACK_URL;
  return base.replace(/\/+$/, "");
}

export function cloudAnonKey(): string {
  const env = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) || "";
  return env && !env.includes("placeholder") ? env : FALLBACK_KEY;
}

export function cloudFunctionUrl(name: string): string {
  return `${cloudBaseUrl()}/functions/v1/${name}`;
}

export function cloudAuthHeaders(): Record<string, string> {
  const key = cloudAnonKey();
  return {
    "Content-Type": "application/json",
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
}
