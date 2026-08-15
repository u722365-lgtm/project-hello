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

/** Always returns false — no cloud configured. */
export function isCloudConfigured(): boolean {
  return false;
}

/** Always returns empty string. */
export function getChatFunctionUrl(): string {
  return "";
}

/** Returns minimal headers (no auth). */
export function getChatFetchHeaders(_accessToken?: string | null): Record<string, string> {
  return {
    "Content-Type": "application/json",
  };
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
