export type ThemeMotionLevel = "calm" | "normal" | "energetic";
export type ThemeDensity = "compact" | "comfortable" | "spacious";

export interface ThemeColorTokens {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  primaryGlow: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  ring: string;
  success: string;
  warning: string;
  sidebarBackground: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarBorder: string;
}

export interface ThemeTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  version: 1;
  motion: ThemeMotionLevel;
  density: ThemeDensity;
  radiusRem: number;
  tokens: ThemeColorTokens;
  /** Hex swatches for gallery preview */
  preview: [string, string, string, string];
}

export const THEME_STORAGE_KEY = "shadowtalk_active_theme_id";
export const THEME_JSON_STORAGE_KEY = "shadowtalk_active_theme_json";
