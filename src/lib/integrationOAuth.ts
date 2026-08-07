import { backend, isConfigured } from "@/integrations/local/client";
import { getApiBaseUrl } from "@/lib/cloudEnv";

export type IntegrationProvider = "google" | "github" | "slack" | "notion";

export type OAuthConnectResult = {
  ok: boolean;
  provider?: IntegrationProvider;
  error?: string;
  redirecting?: boolean;
};

const REDIRECT_PATH = "/profile?tab=linked";

/** Google OAuth popups fail under COOP same-origin (ERR_BLOCKED_BY_RESPONSE). */
const REDIRECT_PROVIDERS: IntegrationProvider[] = ["google"];

export function getLinkedProfileUrl(): string {
  return `${window.location.origin}${REDIRECT_PATH}`;
}

function getOAuthReturnPath(): string {
  return `${window.location.pathname}${window.location.search}`;
}

/** Start OAuth for workspace integrations (Gmail, GitHub, Slack, Notion). */
export async function connectIntegration(
  provider: IntegrationProvider,
  scope?: string,
): Promise<OAuthConnectResult> {
  const { data: { session } } = await backend.auth.getSession();
  if (!session) {
    return { ok: false, error: "Sign in required" };
  }

  const returnTo = getOAuthReturnPath();

  const baseUrl = getApiBaseUrl();
  if (!baseUrl || !isConfigured) {
    return { ok: false, error: "Supabase not configured" };
  }

  const resp = await fetch(`${baseUrl}/functions/v1/oauth-initiate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ provider, scope: scope ?? "default", returnTo }),
  });

  const data = (await resp.json()) as { authUrl?: string; error?: string; message?: string };
  if (!data.authUrl) {
    return {
      ok: false,
      error: data.message || data.error || (resp.ok ? "Could not start OAuth" : `OAuth service error (${resp.status})`),
    };
  }

  if (REDIRECT_PROVIDERS.includes(provider)) {
    sessionStorage.setItem("shadowtalk_oauth_return", returnTo);
    window.location.assign(data.authUrl);
    return { ok: false, error: "Redirecting to Google…", redirecting: true };
  }

  return openOAuthPopup(data.authUrl, provider);
}

export function openOAuthPopup(authUrl: string, provider: IntegrationProvider): Promise<OAuthConnectResult> {
  return new Promise((resolve) => {
    const popup = window.open(authUrl, `${provider}-oauth`, "width=520,height=720,noopener");
    if (!popup) {
      window.location.assign(authUrl);
      resolve({ ok: false, error: "Redirecting for authorization…", redirecting: true });
      return;
    }

    const timeout = window.setTimeout(() => {
      cleanup();
      resolve({ ok: false, error: "Authorization timed out" });
    }, 120_000);

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "oauth-success" && event.data?.provider === provider) {
        cleanup();
        resolve({ ok: true, provider });
      } else if (event.data?.type === "oauth-error") {
        cleanup();
        resolve({ ok: false, error: String(event.data.error || "Authorization failed") });
      }
    };

    const poll = window.setInterval(() => {
      if (popup.closed) {
        cleanup();
        resolve({ ok: false, error: "Window closed before authorization completed" });
      }
    }, 500);

    const cleanup = () => {
      window.clearTimeout(timeout);
      window.clearInterval(poll);
      window.removeEventListener("message", onMessage);
    };

    window.addEventListener("message", onMessage);
  });
}

export async function disconnectIntegration(provider: IntegrationProvider): Promise<void> {
  const { data: { user } } = await backend.auth.getUser();
  if (!user) return;

  await backend.from("oauth_tokens").delete().eq("user_id", user.id).eq("provider", provider);

  await backend
    .from("shadow_vault_connections")
    .update({ is_connected: false, is_active: false })
    .eq("user_id", user.id)
    .eq("service_name", providerDisplayName(provider));
}

export async function fetchConnectedIntegrations(): Promise<{
  oauth: string[];
  whatsapp: boolean;
}> {
  const { data: { user } } = await backend.auth.getUser();
  if (!user) return { oauth: [], whatsapp: false };

  const [{ data: tokens }, { data: wa }] = await Promise.all([
    backend.from("oauth_tokens").select("provider").eq("user_id", user.id),
    backend
      .from("whatsapp_links")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .eq("is_verified", true)
      .maybeSingle(),
  ]);

  return {
    oauth: (tokens ?? []).map((t) => t.provider),
    whatsapp: Boolean(wa),
  };
}

function providerDisplayName(provider: IntegrationProvider): string {
  const map: Record<IntegrationProvider, string> = {
    google: "Google Workspace",
    github: "GitHub",
    slack: "Slack",
    notion: "Notion",
  };
  return map[provider];
}

export async function upsertVaultConnection(provider: IntegrationProvider): Promise<void> {
  const { data: { user } } = await backend.auth.getUser();
  if (!user) return;

  const serviceType =
    provider === "github"
      ? "custom"
      : provider === "slack"
        ? "messaging"
        : provider === "notion"
          ? "storage"
          : "email";

  await backend.from("shadow_vault_connections").upsert(
    {
      user_id: user.id,
      service_name: providerDisplayName(provider),
      service_type: serviceType,
      is_connected: true,
      is_active: true,
      sync_status: "idle",
    },
    { onConflict: "user_id,service_name" },
  );
}
