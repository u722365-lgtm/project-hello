import type { ThemeColorTokens, ThemeDensity, ThemeMotionLevel, ThemeTemplate } from "./types";
import { parseImportedThemeFile } from "./downloadTheme";

export const CUSTOM_THEMES_LIBRARY_KEY = "shadowtalk_custom_themes_library";
export const CUSTOM_THEME_DRAFT_KEY = "shadowtalk_custom_theme_draft";

export type ColorHarmony = "analogous" | "complementary" | "triadic" | "split" | "monochrome";

export interface CustomThemeFormState {
  name: string;
  description: string;
  motion: ThemeMotionLevel;
  density: ThemeDensity;
  radiusRem: number;
  /** Hex colors for designer inputs */
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  success: string;
  warning: string;
}

export const DEFAULT_CUSTOM_FORM: CustomThemeFormState = {
  name: "My ShadowTalk Theme",
  description: "Custom palette designed in ShadowTalk",
  motion: "normal",
  density: "comfortable",
  radiusRem: 0.875,
  primary: "#22d3ee",
  secondary: "#a78bfa",
  accent: "#f472b6",
  background: "#08080c",
  foreground: "#f4f4f5",
  success: "#22c55e",
  warning: "#f59e0b",
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Parse #rgb or #rrggbb to HSL token string */
export function hexToHslToken(hex: string): string {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw.slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return "0 0% 50%";

  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function hslTokenToHex(token: string): string {
  const m = token.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  if (!m) return "#888888";
  const h = Number(m[1]) / 360;
  const s = Number(m[2]) / 100;
  const l = Number(m[3]) / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  let r: number;
  let g: number;
  let b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const v = Math.round(x * 255);
    return v.toString(16).padStart(2, "0");
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function parseHue(token: string): number {
  const h = Number(token.split(" ")[0]);
  return Number.isFinite(h) ? h : 0;
}

function hsl(h: number, s: number, l: number): string {
  return `${((h % 360) + 360) % 360} ${clamp(s, 0, 100)}% ${clamp(l, 0, 100)}%`;
}

/** Build full token set from key colors + auto-derived surfaces */
export function buildTokensFromForm(form: CustomThemeFormState): ThemeColorTokens {
  const primary = hexToHslToken(form.primary);
  const secondary = hexToHslToken(form.secondary);
  const accent = hexToHslToken(form.accent);
  const background = hexToHslToken(form.background);
  const foreground = hexToHslToken(form.foreground);
  const hue = parseHue(background);
  const bgParts = background.split(" ");
  const bgL = Number(bgParts[2]?.replace("%", "") || 5);

  return {
    background,
    foreground,
    card: hsl(hue, Number(bgParts[1]?.replace("%", "") || 10), bgL + 2),
    cardForeground: foreground,
    primary,
    primaryForeground: background,
    primaryGlow: hsl(parseHue(primary), 80, 62),
    secondary,
    secondaryForeground: background,
    muted: hsl(hue, 8, bgL + 7),
    mutedForeground: hsl(hue, 6, 58),
    accent,
    accentForeground: background,
    border: hsl(hue, 8, bgL + 11),
    ring: primary,
    success: hexToHslToken(form.success),
    warning: hexToHslToken(form.warning),
    sidebarBackground: hsl(hue, 10, bgL + 2),
    sidebarForeground: foreground,
    sidebarPrimary: primary,
    sidebarBorder: hsl(hue, 8, bgL + 11),
  };
}

export function formFromTemplate(template: ThemeTemplate): CustomThemeFormState {
  const t = template.tokens;
  return {
    name: `${template.name} (custom)`,
    description: template.description,
    motion: template.motion,
    density: template.density,
    radiusRem: template.radiusRem,
    primary: hslTokenToHex(t.primary),
    secondary: hslTokenToHex(t.secondary),
    accent: hslTokenToHex(t.accent),
    background: hslTokenToHex(t.background),
    foreground: hslTokenToHex(t.foreground),
    success: hslTokenToHex(t.success),
    warning: hslTokenToHex(t.warning),
  };
}

export function buildTemplateFromForm(form: CustomThemeFormState, id?: string): ThemeTemplate {
  const tokens = buildTokensFromForm(form);
  const slug = form.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 32);
  const themeId = id ?? `custom-${slug || "theme"}-${Date.now()}`;

  return {
    id: themeId,
    name: form.name.trim() || "Custom Theme",
    category: "Custom",
    description: form.description.trim() || "User-designed theme",
    version: 1,
    motion: form.motion,
    density: form.density,
    radiusRem: form.radiusRem,
    tokens,
    preview: [
      `hsl(${tokens.primary})`,
      `hsl(${tokens.secondary})`,
      `hsl(${tokens.accent})`,
      `hsl(${tokens.background})`,
    ],
  };
}

/** WCAG contrast ratio between two hex colors */
export function contrastRatio(hexA: string, hexB: string): number {
  const lum = (hex: string) => {
    const t = hexToHslToken(hex);
    const hexOut = hslTokenToHex(t);
    const raw = hexOut.replace("#", "");
    const n = parseInt(raw, 16);
    const chan = (c: number) => {
      const v = ((n >> c) & 255) / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * chan(16) + 0.7152 * chan(8) + 0.0722 * chan(0);
  };
  const l1 = lum(hexA);
  const l2 = lum(hexB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getContrastLabel(ratio: number): { label: string; ok: boolean } {
  if (ratio >= 7) return { label: "AAA", ok: true };
  if (ratio >= 4.5) return { label: "AA", ok: true };
  if (ratio >= 3) return { label: "Large text OK", ok: true };
  return { label: "Low contrast", ok: false };
}

export function applyHarmony(primaryHex: string, harmony: ColorHarmony): Pick<CustomThemeFormState, "secondary" | "accent"> {
  const primary = hexToHslToken(primaryHex);
  const h = parseHue(primary);
  const parts = primary.split(" ");
  const s = Number(parts[1]?.replace("%", "") || 70);
  const l = Number(parts[2]?.replace("%", "") || 55);

  switch (harmony) {
    case "complementary":
      return {
        secondary: hslTokenToHex(hsl(h + 180, s, l)),
        accent: hslTokenToHex(hsl(h + 150, s - 10, l + 8)),
      };
    case "triadic":
      return {
        secondary: hslTokenToHex(hsl(h + 120, s, l)),
        accent: hslTokenToHex(hsl(h + 240, s, l)),
      };
    case "split":
      return {
        secondary: hslTokenToHex(hsl(h + 150, s, l)),
        accent: hslTokenToHex(hsl(h + 210, s, l)),
      };
    case "monochrome":
      return {
        secondary: hslTokenToHex(hsl(h, s - 20, l + 12)),
        accent: hslTokenToHex(hsl(h, s - 35, l + 22)),
      };
    case "analogous":
    default:
      return {
        secondary: hslTokenToHex(hsl(h + 35, s, l)),
        accent: hslTokenToHex(hsl(h - 35, s, l + 5)),
      };
  }
}

export function randomizeForm(base: CustomThemeFormState): CustomThemeFormState {
  const hue = Math.floor(Math.random() * 360);
  const sat = 55 + Math.floor(Math.random() * 35);
  const primary = hslTokenToHex(hsl(hue, sat, 52));
  const harmony = applyHarmony(primary, ["analogous", "complementary", "triadic"][Math.floor(Math.random() * 3)] as ColorHarmony);
  return {
    ...base,
    name: `Random ${hue}°`,
    primary,
    ...harmony,
    background: hslTokenToHex(hsl(hue, 14, 4 + Math.floor(Math.random() * 4))),
    foreground: "#f4f4f5",
    radiusRem: [0.5, 0.75, 0.875, 1, 1.125][Math.floor(Math.random() * 5)],
    motion: (["calm", "normal", "energetic"] as const)[Math.floor(Math.random() * 3)],
    density: (["compact", "comfortable", "spacious"] as const)[Math.floor(Math.random() * 3)],
  };
}

export const QUICK_START_PRESETS: { id: string; label: string; form: Partial<CustomThemeFormState> }[] = [
  {
    id: "cyber",
    label: "Cyber Neural",
    form: {
      primary: "#22d3ee",
      secondary: "#818cf8",
      accent: "#e879f9",
      background: "#06060a",
      motion: "energetic",
    },
  },
  {
    id: "ember",
    label: "Ember Forge",
    form: {
      primary: "#fb923c",
      secondary: "#f87171",
      accent: "#fbbf24",
      background: "#0c0806",
      motion: "energetic",
    },
  },
  {
    id: "forest",
    label: "Forest Calm",
    form: {
      primary: "#4ade80",
      secondary: "#2dd4bf",
      accent: "#a3e635",
      background: "#050a08",
      motion: "calm",
    },
  },
  {
    id: "mono",
    label: "Mono Terminal",
    form: {
      primary: "#e4e4e7",
      secondary: "#a1a1aa",
      accent: "#fafafa",
      background: "#09090b",
      motion: "calm",
      density: "compact",
    },
  },
];

export function loadCustomThemesLibrary(): ThemeTemplate[] {
  try {
    const raw = localStorage.getItem(CUSTOM_THEMES_LIBRARY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ThemeTemplate[];
    return Array.isArray(parsed) ? parsed.filter((t) => t?.id && t?.tokens?.primary) : [];
  } catch {
    return [];
  }
}

export function saveCustomThemesLibrary(themes: ThemeTemplate[]): void {
  try {
    localStorage.setItem(CUSTOM_THEMES_LIBRARY_KEY, JSON.stringify(themes.slice(0, 30)));
  } catch {
    /* ignore */
  }
}

export function addCustomThemeToLibrary(template: ThemeTemplate): ThemeTemplate[] {
  const lib = loadCustomThemesLibrary();
  const without = lib.filter((t) => t.id !== template.id);
  const next = [template, ...without].slice(0, 30);
  saveCustomThemesLibrary(next);
  return next;
}

export function removeCustomThemeFromLibrary(id: string): ThemeTemplate[] {
  const next = loadCustomThemesLibrary().filter((t) => t.id !== id);
  saveCustomThemesLibrary(next);
  return next;
}

export function loadCustomThemeDraft(): CustomThemeFormState | null {
  try {
    const raw = localStorage.getItem(CUSTOM_THEME_DRAFT_KEY);
    if (!raw) return null;
    return { ...DEFAULT_CUSTOM_FORM, ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

export function saveCustomThemeDraft(form: CustomThemeFormState): void {
  try {
    localStorage.setItem(CUSTOM_THEME_DRAFT_KEY, JSON.stringify(form));
  } catch {
    /* ignore */
  }
}

export async function importThemeFromFile(file: File): Promise<ThemeTemplate | null> {
  const text = await file.text();
  const json = JSON.parse(text) as unknown;
  const parsed = parseImportedThemeFile(json);
  if (!parsed) return null;
  if (!parsed.id.startsWith("custom-")) {
    return { ...parsed, id: `custom-import-${Date.now()}`, category: "Custom" };
  }
  return parsed;
}

export function formFromImportedTemplate(template: ThemeTemplate): CustomThemeFormState {
  return formFromTemplate(template);
}
