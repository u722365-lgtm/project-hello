import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";

const JULES_BASE = "https://jules.googleapis.com/v1alpha";

type JulesAction =
  | "verify"
  | "listSources"
  | "createSession"
  | "getSession"
  | "listActivities"
  | "sendMessage"
  | "approvePlan";

async function julesFetch(
  apiKey: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${JULES_BASE}${path}`;
  return fetch(url, {
    ...init,
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

function sessionPath(sessionId: string): string {
  const id = sessionId.replace(/^sessions\//, "");
  return `/sessions/${encodeURIComponent(id)}`;
}

serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }

  const corsHeaders = getCorsHeaders(origin);
  const auth = await requireAuth(req, corsHeaders);
  if (!auth.authenticated) return auth.response;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const action = body.action as JulesAction;
    const userKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    const apiKey = userKey || (Deno.env.get("JULES_API_KEY") ?? "").trim();

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "Jules API key required. Add yours in IDE → Jules settings (jules.google.com/settings).",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let upstream: Response;

    switch (action) {
      case "verify":
        upstream = await julesFetch(apiKey, "/sessions?pageSize=1");
        break;

      case "listSources":
        upstream = await julesFetch(apiKey, "/sources?pageSize=50");
        break;

      case "createSession": {
        const { prompt, title, source, branch, requirePlanApproval, automationMode } = body;
        if (!prompt || typeof prompt !== "string" || prompt.length > 120_000) {
          return new Response(JSON.stringify({ error: "Invalid prompt (max 120k chars)" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const payload: Record<string, unknown> = {
          prompt,
          title: typeof title === "string" ? title.slice(0, 200) : "ShadowTalk IDE task",
        };

        if (typeof source === "string" && source.trim()) {
          payload.sourceContext = {
            source: source.startsWith("sources/") ? source : `sources/${source}`,
            githubRepoContext: {
              startingBranch: typeof branch === "string" && branch.trim() ? branch : "main",
            },
          };
        }

        if (requirePlanApproval === true) {
          payload.requirePlanApproval = true;
        }

        if (automationMode === "AUTO_CREATE_PR") {
          payload.automationMode = "AUTO_CREATE_PR";
        }

        upstream = await julesFetch(apiKey, "/sessions", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        break;
      }

      case "getSession": {
        const sessionId = body.sessionId;
        if (!sessionId) {
          return new Response(JSON.stringify({ error: "sessionId required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        upstream = await julesFetch(apiKey, sessionPath(sessionId));
        break;
      }

      case "listActivities": {
        const sessionId = body.sessionId;
        if (!sessionId) {
          return new Response(JSON.stringify({ error: "sessionId required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const pageSize = Math.min(Number(body.pageSize) || 50, 100);
        const createTime = typeof body.createTime === "string" ? body.createTime : "";
        const qs = createTime
          ? `?pageSize=${pageSize}&createTime=${encodeURIComponent(createTime)}`
          : `?pageSize=${pageSize}`;
        upstream = await julesFetch(apiKey, `${sessionPath(sessionId)}/activities${qs}`);
        break;
      }

      case "sendMessage": {
        const { sessionId, prompt } = body;
        if (!sessionId || !prompt) {
          return new Response(JSON.stringify({ error: "sessionId and prompt required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        upstream = await julesFetch(apiKey, `${sessionPath(sessionId)}:sendMessage`, {
          method: "POST",
          body: JSON.stringify({ prompt: String(prompt).slice(0, 20_000) }),
        });
        break;
      }

      case "approvePlan": {
        const sessionId = body.sessionId;
        if (!sessionId) {
          return new Response(JSON.stringify({ error: "sessionId required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        upstream = await julesFetch(apiKey, `${sessionPath(sessionId)}:approvePlan`, {
          method: "POST",
          body: "{}",
        });
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const text = await upstream.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!upstream.ok) {
      const errMsg =
        typeof data === "object" && data !== null && "error" in data
          ? String((data as { error?: { message?: string } }).error?.message ?? upstream.statusText)
          : upstream.statusText;
      return new Response(JSON.stringify({ error: errMsg, details: data }), {
        status: upstream.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("jules-agent error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
