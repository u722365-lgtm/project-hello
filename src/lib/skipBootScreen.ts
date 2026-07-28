import { isLeanMotionEnabled } from "@/lib/perf/leanMotion";

/** Paths that open without the cinematic BootScreen. */
export function shouldSkipBootScreen(
  pathname: string = typeof window !== "undefined" ? window.location.pathname : "",
): boolean {
  // Lean motion: skip boot everywhere — it costs ~2s and heavy GPU paint.
  if (isLeanMotionEnabled()) return true;

  const path = pathname.split("?")[0].replace(/\/+$/, "") || "/";
  return path === "/" || path === "/chatbot" || path === "/home" || path === "/auth";
}
