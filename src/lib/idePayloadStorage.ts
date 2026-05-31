export const IDE_PAYLOAD_KEY = "shadowtalk_ide_payload";

export type IdeProjectFile = {
  name: string;
  language: string;
  content: string;
};

export type IdePayload = {
  code?: string;
  language?: string;
  /** Open live preview panel when landing (e.g. HTML from chat). */
  openPreview?: boolean;
  /** Multi-file app project from App Builder */
  project?: {
    title: string;
    platform?: "web" | "mobile";
    files: IdeProjectFile[];
  };
};

export function saveIdePayload(payload: IdePayload): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(IDE_PAYLOAD_KEY, JSON.stringify(payload));
}

export function loadIdePayload(): IdePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(IDE_PAYLOAD_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as IdePayload;
    sessionStorage.removeItem(IDE_PAYLOAD_KEY);
    return parsed;
  } catch {
    return null;
  }
}

export function openInIde(code: string, language: string, options?: { openPreview?: boolean }): void {
  saveIdePayload({ code, language, openPreview: options?.openPreview });
  window.location.assign("/ide");
}

export function openProjectInIde(
  project: NonNullable<IdePayload["project"]>,
  options?: { openPreview?: boolean },
): void {
  saveIdePayload({
    project,
    openPreview: options?.openPreview ?? true,
  });
  window.location.assign("/ide");
}
