import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import {
  buildShadowSpectreSystemPrompt,
  routeShadowSpectreHead,
  SHADOWSPECTRE_MODEL,
  type ShadowSpectreHead,
} from "../_shared/shadowspectre.ts";

/** Legacy alias — forwards to ShadowSpectre prompts and routing. */
const LEGACY_MODE_MAP: Record<string, ShadowSpectreHead> = {
  general: "general",
  recon: "recon",
  exploit: "exploit",
  incident: "ir",
  report: "report",
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return handleCorsOptions(origin);
  const corsHeaders = getCorsHeaders(origin);

  try {
    const auth = await requireAuth(req, corsHeaders);
    if (!auth.authenticated) return auth.response;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { messages, mode, context, authorization } = await req.json();
    const lastUser = [...(messages ?? [])].reverse().find((m: { role: string }) => m.role === "user")?.content ?? "";
    const legacyHead = LEGACY_MODE_MAP[mode || "general"] ?? "general";
    const resolvedHead = routeShadowSpectreHead(lastUser, legacyHead);
    const systemPrompt = buildShadowSpectreSystemPrompt(resolvedHead, authorization);
    const contextNote = context ? `\n\nAdditional context: ${context}` : "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: SHADOWSPECTRE_MODEL,
        messages: [
          { role: "system", content: systemPrompt + contextNote },
          ...messages,
        ],
        stream: true,
        temperature: 0.35,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", status, errText);
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("cyber-ai-copilot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
