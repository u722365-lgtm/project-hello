import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

const emptyOk = (corsHeaders: Record<string, string>, warning?: string) =>
  new Response(
    JSON.stringify({ message: "", success: true, ...(warning ? { warning } : {}) }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );

serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }

  const corsHeaders = getCorsHeaders(origin);

  try {
    let body: Record<string, unknown> = {};
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return emptyOk(corsHeaders, "Invalid request body");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.warn("[proactive-ai] LOVABLE_API_KEY not configured");
      return emptyOk(corsHeaders, "Proactive AI not configured");
    }

    const triggerType = String(body.triggerType ?? "nudge");
    const currentPage = String(body.currentPage ?? "/");
    const mood = body.mood != null ? String(body.mood) : "neutral";
    const visitCount = typeof body.visitCount === "number" ? body.visitCount : 1;
    const pagesVisited = Array.isArray(body.pagesVisited)
      ? body.pagesVisited.map(String)
      : [];
    const scrollPercent = typeof body.scrollPercent === "number" ? body.scrollPercent : undefined;
    const extraContext = body.extraContext != null ? String(body.extraContext) : "";

    const hour = new Date().getHours();
    const timeLabel =
      hour < 5 ? "late night" :
      hour < 9 ? "early morning" :
      hour < 12 ? "morning" :
      hour < 14 ? "lunchtime" :
      hour < 17 ? "afternoon" :
      hour < 20 ? "evening" : "night";

    const systemPrompt = `You are a subtle, intelligent proactive assistant embedded in ShadowTalk AI — an advanced AI chatbot platform. Your job is to generate ONE short, contextual message (1-2 sentences max) that feels natural and helpful, not scripted or salesy.

Rules:
- Be conversational and human. Never sound like a chatbot or marketing copy.
- Match the user's detected mood and energy level.
- Reference specific context (page they're on, time of day, behavior) naturally.
- Vary your tone: sometimes curious, sometimes empathetic, sometimes playful, sometimes direct.
- Never use phrases like "I noticed you" or "It looks like you". Be more subtle.
- Include one relevant emoji at the start.
- Keep it under 140 characters when possible.
- Never be pushy about upgrades or sales unless the trigger is specifically about pricing.
- If the mood is frustrated, be empathetic and solution-oriented.
- If the mood is focused, be brief and non-intrusive.
- If the mood is bored, be intriguing.`;

    const userPrompt = `Generate a proactive message for this context:
- Trigger: ${triggerType}
- Current page: ${currentPage}
- User mood: ${mood}
- Time: ${timeLabel} (${hour}:00)
- Visit #${visitCount}
- Pages visited this session: ${pagesVisited.join(", ") || "none yet"}
- Scroll depth: ${scrollPercent ?? "unknown"}%
${extraContext ? `- Extra context: ${extraContext}` : ""}

Return ONLY the message text, nothing else.`;

    const { fetchChatWithFallback } = await import("../_shared/openrouterFallback.ts");
    const response = await fetchChatWithFallback({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 100,
      temperature: 0.9,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.warn("[proactive-ai] gateway non-ok", response.status, text.slice(0, 200));
      return emptyOk(corsHeaders);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ message, success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("proactive-ai error:", e);
    return emptyOk(corsHeaders);
  }
});
