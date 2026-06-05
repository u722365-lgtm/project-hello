/** Shared breakpoint values — keep in sync with tailwind.config.ts screens */
export const BREAKPOINTS = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1400,
} as const;

export const MOBILE_BREAKPOINT = BREAKPOINTS.md;

export function isMobileViewport(width = typeof window !== "undefined" ? window.innerWidth : BREAKPOINTS.md): boolean {
  return width < MOBILE_BREAKPOINT;
}

export function isTabletViewport(width = typeof window !== "undefined" ? window.innerWidth : BREAKPOINTS.lg): boolean {
  return width >= MOBILE_BREAKPOINT && width < BREAKPOINTS.lg;
}
