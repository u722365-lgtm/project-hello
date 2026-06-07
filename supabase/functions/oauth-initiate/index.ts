import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";

type OAuthProvider = "google" | "github" | "slack" | "notion";

const REDIRECT_URI = `${Deno.env.get("SUPABASE_URL")}/functions/v1/oauth-callback`;

const GOOGLE_SCOPES = {
  gmail:
    "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send",
  calendar:
    "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events",
  both: [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/contacts.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
  ].join(" "),
};

function buildAuthUrl(provider: OAuthProvider, userId: string, scopeKey: string): string | null {
  const state = btoa(JSON.stringify({ userId, provider, scope: scopeKey }));

  if (provider === "google") {
    const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
    if (!clientId) return null;
    const scope =
      GOOGLE_SCOPES[scopeKey as keyof typeof GOOGLE_SCOPES] ?? GOOGLE_SCOPES.both;
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", REDIRECT_URI);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", scope);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("state", state);
    return url.toString();
  }

  if (provider === "github") {
    const clientId = Deno.env.get("GITHUB_OAUTH_CLIENT_ID");
    if (!clientId) return null;
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", REDIRECT_URI);
    url.searchParams.set("scope", "read:user repo");
    url.searchParams.set("state", state);
    return url.toString();
  }

  if (provider === "slack") {
    const clientId = Deno.env.get("SLACK_OAUTH_CLIENT_ID");
    if (!clientId) return null;
    const url = new URL("https://slack.com/oauth/v2/authorize");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", REDIRECT_URI);
    url.searchParams.set("scope", "chat:write,channels:read,users:read");
    url.searchParams.set("state", state);
    return url.toString();
  }

  if (provider === "notion") {
    const clientId = Deno.env.get("NOTION_OAUTH_CLIENT_ID");
    if (!clientId) return null;
    const url = new URL("https://api.notion.com/v1/oauth/authorize");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", REDIRECT_URI);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("owner", "user");
    url.searchParams.set("state", state);
    return url.toString();
  }

  return null;
}

function renderMisusePage(): string {
  const appUrl = Deno.env.get("APP_URL") || "https://www.shadowtalk-ai.com/profile?tab=linked";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ShadowTalk — Connect accounts</title>
  <meta http-equiv="refresh" content="3;url=${appUrl}">
  <style>
    body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; padding: 1.5rem; }
    .box { text-align: center; max-width: 420px; }
    p { color: #a1a1aa; line-height: 1.5; }
    a { color: #a78bfa; }
  </style>
</head>
<body>
  <div class="box">
    <h1>Open ShadowTalk to connect</h1>
    <p>This link must be started from the app (Profile → Linked accounts). Redirecting you back…</p>
    <p><a href="${appUrl}">Continue in ShadowTalk</a></p>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }

  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "GET") {
    return new Response(renderMisusePage(), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const auth = await requireAuth(req, corsHeaders);
    if (!auth.authenticated) return auth.response;

    let body: { provider?: string; scope?: string };
    try {
      body = (await req.json()) as { provider?: string; scope?: string };
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body", message: "Send { provider, scope? }" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const oauthProvider = body.provider as OAuthProvider;

    if (!oauthProvider || !["google", "github", "slack", "notion"].includes(oauthProvider)) {
      return new Response(
        JSON.stringify({ error: "Provider not supported", message: "Use google, github, slack, or notion" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const scopeKey = body.scope || (oauthProvider === "google" ? "both" : "default");
    const authUrl = buildAuthUrl(oauthProvider, auth.userId, scopeKey);

    if (!authUrl) {
      return new Response(
        JSON.stringify({
          error: "OAuth not configured",
          message: `${oauthProvider} OAuth credentials are not set on the server`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ authUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[OAuth Initiate] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
