/** ShadowTalk brand tokens (from src/index.css) */
export const colors = {
  background: "#07070a",
  foreground: "#f5f5f5",
  primary: "#1ac8ff",
  primaryGlow: "#4dd6ff",
  secondary: "#a855f7",
  accent: "#f43f9f",
  destructive: "#ef4444",
  muted: "#8b8b9a",
  card: "#0c0c10",
  border: "#222228",
  success: "#22c55e",
} as const;

export const fonts = {
  sans: "Inter, system-ui, -apple-system, sans-serif",
  mono: "JetBrains Mono, monospace",
} as const;

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION_SECONDS = 60;
export const DURATION_FRAMES = FPS * DURATION_SECONDS;
