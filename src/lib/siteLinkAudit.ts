/** Known internal hrefs used across nav surfaces — validated in siteLinkAudit.test.ts */
export const CRITICAL_NAV_LINKS = [
  "/home",
  "/chatbot",
  "/execute",
  "/workspace",
  "/settings",
  "/profile",
  "/referral",
  "/sessions",
  "/self-healing",
  "/missioncontrol",
  "/billing",
  "/personal-llm",
] as const;

/** Legacy paths that must redirect via App.tsx (not 404) */
export const LEGACY_REDIRECT_PATHS = [
  "/missioncontrol",
  "/analytics",
  "/vault",
  "/trust",
  "/presentations",
  "/knowledge",
  "/enterprise-license",
] as const;

export function extractAppRoutePaths(appSource: string): string[] {
  const paths = new Set<string>();
  const re = /path="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(appSource)) !== null) {
    const p = m[1];
    if (!p.includes(":")) paths.add(p);
  }
  return [...paths];
}

/** Whether an internal href resolves to a defined route or legacy redirect */
export function isRoutableHref(href: string, appRoutePaths: readonly string[]): boolean {
  const clean = href.split("#")[0].split("?")[0];
  if (!clean.startsWith("/")) return false;
  if (appRoutePaths.includes(clean)) return true;
  if (LEGACY_REDIRECT_PATHS.includes(clean as (typeof LEGACY_REDIRECT_PATHS)[number])) return true;
  return false;
}
