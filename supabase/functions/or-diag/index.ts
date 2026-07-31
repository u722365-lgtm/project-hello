import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return handleCorsOptions(origin);
  const corsHeaders = getCorsHeaders(origin);

  const key = Deno.env.get("OPENROUTER_FALLBACK_KEY");
  if (!key) {
    return new Response(JSON.stringify({ hasKey: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const models = [
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "qwen/qwen-2.5-72b-instruct:free",
    "deepseek/deepseek-chat-v3-0324:free",
    "meta-llama/llama-3.2-3b-instruct:free",
  ];

  const results: Record<string, unknown> = {};
  for (const model of models) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          "HTTP-Referer": "https://shadowtalk-ai.com",
          "X-Title": "ShadowTalk AI",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "hi" }],
          stream: false,
          max_tokens: 8,
        }),
      });
      const text = await res.text();
      results[model] = { status: res.status, body: text.slice(0, 300) };
    } catch (e) {
      results[model] = { error: String(e).slice(0, 200) };
    }
  }

  return new Response(JSON.stringify({ hasKey: true, results }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
