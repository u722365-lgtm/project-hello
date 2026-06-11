import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import {
  buildShadowSpectreSystemPrompt,
  routeShadowSpectreHead,
  SHADOWSPECTRE_FALLBACK_MODEL,
  SHADOWSPECTRE_MODEL,
  type AuthorizationContext,
  type ShadowSpectreHead,
} from "../_shared/shadowspectre.ts";

serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return handleCorsOptions(origin);
  const corsHeaders = getCorsHeaders(origin);

  try {
    const auth = await requireAuth(req, corsHeaders);
    if (!auth.authenticated) return auth.response;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const body = await req.json() as {
      messages?: { role: string; content: string }[];
      head?: string;
      authorization?: AuthorizationContext;
    };

    const messages = Array.isArray(body.messages) ? body.messages : [];
    const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const resolvedHead: ShadowSpectreHead = routeShadowSpectreHead(lastUser, body.head);
    const systemPrompt = buildShadowSpectreSystemPrompt(resolvedHead, body.authorization);

    const callModel = async (model: string) =>
      fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          stream: true,
          temperature: 0.35,
        }),
      });

    let response = await callModel(SHADOWSPECTRE_MODEL);
    if (!response.ok && response.status >= 500) {
      response = await callModel(SHADOWSPECTRE_FALLBACK_MODEL);
    }

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("[ShadowSpectre] AI gateway error:", status, errText);
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "X-ShadowSpectre-Head": resolvedHead,
      },
    });
  } catch (e) {
    console.error("[ShadowSpectre] error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
