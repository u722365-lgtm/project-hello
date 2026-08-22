/** Build-time ShadowTalk backend config.
 * Local-only mode — all functions return empty strings / false.
 */

/** Always returns empty string in local-only mode. */
export function getApiBaseUrl(): string {
  return "";
}

/** Always returns empty string in local-only mode. */
export function getApiKey(): string {
  return "";
}

/** Returns true since cloud is now configured via Firebase Functions. */
export function isCloudConfigured(): boolean {
  return false;
}

/** Returns the URL for the chat function. */
export function getChatFunctionUrl(): string {
  return "";
}

/** Returns headers including the Firebase Auth token. */
export function getChatFetchHeaders(accessToken?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return headers;
}

export const DESKTOP_ENV_SETUP_HINT =
  "ShadowTalk runs in local-only mode. Configure BYOK keys in Settings for cloud inference.";

/** Format a fetch error for display. */
export function formatChatFetchError(err: unknown): string {
  const msg =
    err instanceof Error ? err.message : "Error connecting to chat service.";
  if (msg === "Failed to fetch" || msg.includes("NetworkError")) {
    return (
      "Could not reach the chat service. Check your internet connection and BYOK settings."
    );
  }
  return msg;
}
