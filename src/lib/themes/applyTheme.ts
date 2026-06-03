import type { ThemeTemplate } from "./types";
import { THEME_JSON_STORAGE_KEY, THEME_STORAGE_KEY } from "./types";

const TOKEN_MAP: Record<keyof ThemeTemplate["tokens"], string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  primaryGlow: "--primary-glow",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  border: "--border",
  ring: "--ring",
  success: "--success",
  warning: "--warning",
  sidebarBackground: "--sidebar-background",
  sidebarForeground: "--sidebar-foreground",
  sidebarPrimary: "--sidebar-primary",
  sidebarBorder: "--sidebar-border",
};

export function applyThemeTemplate(template: ThemeTemplate): void {
  const root = document.documentElement;
  for (const [key, cssVar] of Object.entries(TOKEN_MAP)) {
    const value = template.tokens[key as keyof ThemeTemplate["tokens"]];
    root.style.setProperty(cssVar, value);
  }
  root.style.setProperty("--radius", `${template.radiusRem}rem`);
  root.dataset.shadowtalkTemplate = template.id;
  root.dataset.shadowtalkMotion = template.motion;
  root.dataset.shadowtalkDensity = template.density;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, template.id);
    localStorage.setItem(THEME_JSON_STORAGE_KEY, JSON.stringify(template));
  } catch {
    /* ignore */
  }

  window.dispatchEvent(
    new CustomEvent("shadowtalk-theme-applied", { detail: { templateId: template.id } }),
  );
}

export function getActiveThemeId(): string | null {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function loadStoredThemeTemplate(): ThemeTemplate | null {
  try {
    const raw = localStorage.getItem(THEME_JSON_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ThemeTemplate;
  } catch {
    return null;
  }
}

export function restoreStoredTheme(): void {
  const stored = loadStoredThemeTemplate();
  if (stored?.tokens) applyThemeTemplate(stored);
}

export function clearAppliedTheme(): void {
  const root = document.documentElement;
  for (const cssVar of Object.values(TOKEN_MAP)) {
    root.style.removeProperty(cssVar);
  }
  root.style.removeProperty("--radius");
  delete root.dataset.shadowtalkTemplate;
  delete root.dataset.shadowtalkMotion;
  delete root.dataset.shadowtalkDensity;
  try {
    localStorage.removeItem(THEME_STORAGE_KEY);
    localStorage.removeItem(THEME_JSON_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
