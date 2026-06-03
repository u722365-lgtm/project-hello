/** Build-time Supabase config (Vite inlines VITE_* at compile time). */

export function getSupabaseUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!url || url.includes("your-project")) {
    return "";
  }
  return url.replace(/\/$/, "");
}

export function getSupabaseAnonKey(): string {
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (!key || key.includes("your_anon_key")) {
    return "";
  }
  return key;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function getChatFunctionUrl(): string {
  const base = getSupabaseUrl();
  if (!base) return "";
  return `${base}/functions/v1/chat`;
}

export function getChatFetchHeaders(accessToken?: string | null): Record<string, string> {
  const anon = getSupabaseAnonKey();
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
  "Copy env.example to .env with your Supabase URL and anon key, then rebuild: npm run desktop:make";

/** Browser/network failures often surface as this generic message in Electron. */
export function formatChatFetchError(err: unknown): string {
  const msg =
    err instanceof Error ? err.message : "Error connecting to chat service.";
  if (msg === "Failed to fetch" || msg.includes("NetworkError")) {
    return (
      "Could not reach the chat service. Pull latest main, rebuild the installer (npm run desktop:make), " +
      "sign in, and optionally run: supabase functions deploy chat. See DESKTOP.md."
    );
  }
  return msg;
}
