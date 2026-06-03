/** Route-aware motion intensity for the whole app */
export type SiteMotionIntensity = "full" | "standard" | "minimal";

const MINIMAL_PATH_PREFIXES = ["/chatbot", "/admin", "/rooms/"];

export function getSiteMotionIntensity(pathname: string): SiteMotionIntensity {
  const path = pathname.split("?")[0].replace(/\/+$/, "") || "/";
  if (path === "/home" || path === "/") return "full";
  if (MINIMAL_PATH_PREFIXES.some((p) => path === p || path.startsWith(p))) return "minimal";
  return "standard";
}

export function shouldSkipGlobalScrollReveal(pathname: string): boolean {
  const path = pathname.split("?")[0].replace(/\/+$/, "") || "/";
  if (path === "/home" || path === "/") return true;
  return path === "/chatbot" || path.startsWith("/admin");
}
