import type { ThemeTemplate } from "./types";

export function downloadThemeTemplate(template: ThemeTemplate): void {
  const payload = {
    ...template,
    exportedAt: new Date().toISOString(),
    product: "ShadowTalk AI",
    applyHint: "Import in ShadowTalk → /templates → Apply Theme",
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `shadowtalk-theme-${template.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseImportedThemeFile(json: unknown): ThemeTemplate | null {
  if (!json || typeof json !== "object") return null;
  const t = json as ThemeTemplate;
  if (t.version !== 1 || !t.id || !t.tokens?.primary) return null;
  return t;
}
