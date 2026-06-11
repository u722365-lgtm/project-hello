import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

type OAuthProvider = "google" | "github" | "slack" | "notion";

interface StateData {
  userId: string;
  provider: OAuthProvider;
  scope?: string;
  returnTo?: string;
}

const REDIRECT_URI = `${Deno.env.get("SUPABASE_URL")}/functions/v1/oauth-callback`;

async function exchangeCode(
  provider: OAuthProvider,
  code: string,
): Promise<{ access_token: string; refresh_token?: string | null; expires_in?: number; error?: string }> {
  if (provider === "google") {
    const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
    if (!clientId || !clientSecret) return { access_token: "", error: "Google OAuth not configured" };

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    return res.json();
  }

  if (provider === "github") {
    const clientId = Deno.env.get("GITHUB_OAUTH_CLIENT_ID");
    const clientSecret = Deno.env.get("GITHUB_OAUTH_CLIENT_SECRET");
    if (!clientId || !clientSecret) return { access_token: "", error: "GitHub OAuth not configured" };

    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: REDIRECT_URI }),
    });
    const data = await res.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? null,
      expires_in: data.expires_in,
      error: data.error,
    };
  }

  if (provider === "slack") {
    const clientId = Deno.env.get("SLACK_OAUTH_CLIENT_ID");
    const clientSecret = Deno.env.get("SLACK_OAUTH_CLIENT_SECRET");
    if (!clientId || !clientSecret) return { access_token: "", error: "Slack OAuth not configured" };

    const res = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });
    const data = await res.json();
    if (!data.ok) return { access_token: "", error: data.error || "Slack token exchange failed" };
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? null,
      expires_in: undefined,
    };
  }

  if (provider === "notion") {
    const clientId = Deno.env.get("NOTION_OAUTH_CLIENT_ID");
    const clientSecret = Deno.env.get("NOTION_OAUTH_CLIENT_SECRET");
    if (!clientId || !clientSecret) return { access_token: "", error: "Notion OAuth not configured" };

    const credentials = btoa(`${clientId}:${clientSecret}`);
    const res = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });
    const data = await res.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? null,
      error: data.error,
    };
  }

  return { access_token: "", error: "Unknown provider" };
}

const VAULT_NAMES: Record<OAuthProvider, string> = {
  google: "Google Workspace",
  github: "GitHub",
  slack: "Slack",
  notion: "Notion",
};

const VAULT_TYPES: Record<OAuthProvider, string> = {
  google: "email",
  github: "custom",
  slack: "messaging",
  notion: "storage",
};

function parseReturnTo(state: string | null): string | undefined {
  if (!state) return undefined;
  try {
    const parsed = JSON.parse(atob(state)) as StateData;
    return parsed.returnTo?.startsWith("/") ? parsed.returnTo : undefined;
  } catch {
    return undefined;
  }
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const returnToFromState = parseReturnTo(state);

    if (error) {
      return new Response(renderErrorPage(error, returnToFromState), {
        headers: { "Content-Type": "text/html" },
      });
    }

    if (!code || !state) {
      return new Response(renderErrorPage("Missing authorization code or state", returnToFromState), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    let stateData: StateData;
    try {
      stateData = JSON.parse(atob(state));
    } catch {
      return new Response(renderErrorPage("Invalid state parameter", returnToFromState), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    const returnTo = stateData.returnTo?.startsWith("/") ? stateData.returnTo : undefined;

    const tokens = await exchangeCode(stateData.provider, code);
    if (tokens.error || !tokens.access_token) {
      return new Response(
        renderErrorPage(tokens.error || "Token exchange failed", returnTo, stateData.provider),
        { status: 400, headers: { "Content-Type": "text/html" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const tokenData = {
      user_id: stateData.userId,
      provider: stateData.provider,
      scope: stateData.scope ?? "default",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      expires_at: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("oauth_tokens")
      .select("id")
      .eq("user_id", stateData.userId)
      .eq("provider", stateData.provider)
      .maybeSingle();

    const dbError = existing
      ? (await supabase.from("oauth_tokens").update(tokenData).eq("id", existing.id)).error
      : (await supabase.from("oauth_tokens").insert(tokenData)).error;

    if (dbError) {
      console.error("[OAuth Callback] Database error:", dbError);
      return new Response(
        renderErrorPage("Failed to save authorization", returnTo, stateData.provider),
        { status: 500, headers: { "Content-Type": "text/html" } },
      );
    }

    await supabase.from("shadow_vault_connections").upsert(
      {
        user_id: stateData.userId,
        service_name: VAULT_NAMES[stateData.provider],
        service_type: VAULT_TYPES[stateData.provider],
        is_connected: true,
        is_active: true,
        sync_status: "idle",
      },
      { onConflict: "user_id,service_name" },
    );

    const appOrigin = Deno.env.get("APP_URL") || "https://shadowtalk-ai.lovable.app";
    const previewOrigin = Deno.env.get("PREVIEW_APP_URL") ||
      "https://id-preview--0497e2a8-1dfb-4b9b-b437-30ee6b3f7741.lovable.app";

    return new Response(
      renderSuccessPage(appOrigin, previewOrigin, stateData.provider, returnTo),
      { headers: { "Content-Type": "text/html" } },
    );
  } catch (err) {
    console.error("[OAuth Callback] Error:", err);
    return new Response(renderErrorPage("An unexpected error occurred"), {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }
});

function buildReturnUrl(appOrigin: string, previewOrigin: string, returnTo: string | undefined, provider: string): string {
  const base = appOrigin.replace(/\/$/, "");
  const path =
    returnTo && returnTo.startsWith("/") ? returnTo : "/profile?tab=linked";
  const url = new URL(path, base);
  url.searchParams.set("oauth", "success");
  url.searchParams.set("provider", provider);
  return url.toString();
}

function renderSuccessPage(
  appOrigin: string,
  previewOrigin: string,
  provider: string,
  returnTo?: string,
): string {
  const redirectUrl = buildReturnUrl(appOrigin, previewOrigin, returnTo, provider);
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Connected - ShadowTalk AI</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
    .box { text-align: center; padding: 2rem; max-width: 360px; }
    h1 { font-size: 1.25rem; }
    p { color: #a1a1aa; font-size: 0.9rem; }
  </style>
  <script>
    const provider = "${provider}";
    const redirectUrl = ${JSON.stringify(redirectUrl)};
    const origins = ["${appOrigin}", "${previewOrigin}", window.location.origin];
    let redirected = false;
    if (window.opener) {
      origins.forEach(origin => {
        try { window.opener.postMessage({ type: "oauth-success", provider }, origin); } catch (e) {}
      });
      setTimeout(() => { try { window.close(); } catch (e) { window.location.replace(redirectUrl); } }, 800);
    } else {
      window.location.replace(redirectUrl);
      redirected = true;
    }
    setTimeout(() => { if (!redirected) window.location.replace(redirectUrl); }, 2500);
  </script>
</head>
<body>
  <div class="box">
    <h1>Connected successfully</h1>
    <p>Returning you to ShadowTalk…</p>
  </div>
</body>
</html>`;
}

function renderErrorPage(error: string, returnTo?: string, provider?: string): string {
  const safe = error.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const appOrigin = Deno.env.get("APP_URL") || "https://shadowtalk-ai.lovable.app";
  const path = returnTo && returnTo.startsWith("/") ? returnTo : "/chatbot";
  const failUrl = new URL(path, appOrigin.replace(/\/$/, ""));
  failUrl.searchParams.set("oauth", "error");
  failUrl.searchParams.set("message", error.slice(0, 200));
  if (provider) failUrl.searchParams.set("provider", provider);
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Authorization Failed</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
    .box { text-align: center; padding: 2rem; max-width: 360px; }
    .err { color: #fca5a5; font-size: 0.85rem; margin: 1rem 0; }
  </style>
  <script>
    const failUrl = ${JSON.stringify(failUrl.toString())};
    if (window.opener) {
      try { window.opener.postMessage({ type: "oauth-error", error: "${safe}" }, "*"); } catch (e) {}
      setTimeout(() => { try { window.close(); } catch (e) { window.location.replace(failUrl); } }, 800);
    } else {
      window.location.replace(failUrl);
    }
  </script>
</head>
<body>
  <div class="box">
    <h1>Authorization failed</h1>
    <p class="err">${safe}</p>
    <p style="color:#a1a1aa;font-size:0.85rem">Returning to ShadowTalk…</p>
  </div>
</body>
</html>`;
}
