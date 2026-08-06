/** Build-time ShadowTalk backend config (Vite inlines VITE_* at compile time). */

export function getApiBaseUrl(): string {
  const url = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (!url || url.includes("your-project")) {
    return "";
  }
  return url.replace(/\/$/, "");
}

export function getApiKey(): string {
  const key = import.meta.env.VITE_API_KEY as string | undefined;
  if (!key || key.includes("your_anon_key")) {
    return "";
  }
  return key;
}

export function isCloudConfigured(): boolean {
  return Boolean(getApiBaseUrl() && getApiKey());
}

export function getChatFunctionUrl(): string {
  const base = getApiBaseUrl();
  if (!base) return "";
  return `${base}/functions/v1/chat`;
}

export function getChatFetchHeaders(accessToken?: string | null): Record<string, string> {
  const anon = getApiKey();
  const token = accessToken || anon;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (anon) {
    headers.apikey = anon;
  }
  return headers;
}

export const DESKTOP_ENV_SETUP_HINT =
  "Copy env.example to .env with your ShadowTalk backend URL and anon key, then rebuild: npm run desktop:make";

/** Browser/network failures often surface as this generic message in Electron. */
export function formatChatFetchError(err: unknown): string {
  const msg =
    err instanceof Error ? err.message : "Error connecting to chat service.";
  if (msg === "Failed to fetch" || msg.includes("NetworkError")) {
    return (
      "Could not reach the chat service. Quit the app, reinstall the latest shadowtalk-setup.exe, " +
      "then sign in from Settings. See DESKTOP.md."
    );
  }
  return msg;
}
