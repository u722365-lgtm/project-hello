/** Paths that open straight into the chat workspace — no global BootScreen. */
export function shouldSkipBootScreen(
  pathname: string = typeof window !== "undefined" ? window.location.pathname : "",
): boolean {
  const path = pathname.split("?")[0].replace(/\/+$/, "") || "/";
  return path === "/" || path === "/chatbot";
}
