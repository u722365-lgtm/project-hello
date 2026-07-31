import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return handleCorsOptions(origin);
  const corsHeaders = getCorsHeaders(origin);

  const out: Record<string, unknown> = {};

  const orKey = Deno.env.get("OPENROUTER_FALLBACK_KEY");
  if (orKey) {
    try {
      const r = await fetch("https://openrouter.ai/api/v1/key", {
        headers: { Authorization: `Bearer ${orKey}` },
      });
      out.openrouterKey = { status: r.status, body: (await r.text()).slice(0, 400) };
    } catch (e) {
      out.openrouterKey = { error: String(e).slice(0, 200) };
    }
  }

  const gKey = Deno.env.get("Gemini_1api");
  out.hasGeminiKey = !!gKey;
  if (gKey) {
    for (const model of ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest"]) {
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${gKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "hi" }] }] }),
          },
        );
        out[`gemini:${model}`] = { status: r.status, body: (await r.text()).slice(0, 250) };
      } catch (e) {
        out[`gemini:${model}`] = { error: String(e).slice(0, 200) };
      }
    }
  }

  return new Response(JSON.stringify(out, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
