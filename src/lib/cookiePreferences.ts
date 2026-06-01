export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export const COOKIE_CONSENT_KEY = "shadowtalk_cookie_consent";
export const COOKIE_PREFERENCES_KEY = "shadowtalk_cookie_preferences";

const DEFAULT_PREFS: CookiePreferences = {
  necessary: true,
  analytics: true,
  marketing: false,
  preferences: true,
};

export function getCookiePreferences(): CookiePreferences {
  if (typeof window === "undefined") return { ...DEFAULT_PREFS };
  try {
    const raw = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<CookiePreferences>;
    return { ...DEFAULT_PREFS, ...parsed, necessary: true };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function setCookiePreferences(prefs: CookiePreferences): void {
  const next: CookiePreferences = { ...prefs, necessary: true };
  localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(next));
  localStorage.setItem(COOKIE_CONSENT_KEY, "true");
}

export function updateCookiePreferences(partial: Partial<CookiePreferences>): CookiePreferences {
  const next = { ...getCookiePreferences(), ...partial, necessary: true };
  setCookiePreferences(next);
  return next;
}
