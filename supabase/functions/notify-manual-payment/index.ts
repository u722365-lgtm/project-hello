import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function notifyDiscord(payload: Record<string, unknown>): Promise<void> {
  const webhook = Deno.env.get("MANUAL_PAYMENT_DISCORD_WEBHOOK_URL") ?? Deno.env.get("DISCORD_WEBHOOK_URL");
  if (!webhook) return;

  const lines = [
    "**New manual payment proof**",
    `Email: ${payload.email ?? "unknown"}`,
    `Plan: ${payload.planKey ?? "unknown"}`,
    `Amount: ${payload.currency ?? ""} ${payload.amount ?? ""}`,
    `Method: ${payload.paymentMethod ?? "unknown"}`,
    `Payment ID: ${payload.paymentId ?? ""}`,
    `Admin: /admin → Payments`,
  ];

  await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: lines.join("\n") }),
  });
}

async function notifyTelegram(payload: Record<string, unknown>): Promise<void> {
  const token = Deno.env.get("MANUAL_PAYMENT_TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("MANUAL_PAYMENT_TELEGRAM_CHAT_ID");
  if (!token || !chatId) return;

  const text = [
    "New ShadowTalk payment proof",
    `Email: ${payload.email}`,
    `Plan: ${payload.planKey}`,
    `${payload.currency} ${payload.amount} via ${payload.paymentMethod}`,
    `ID: ${payload.paymentId}`,
  ].join("\n");

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const anon = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: authData } = await anon.auth.getUser();
    if (!authData.user) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const payload = {
      paymentId: body.paymentId,
      email: body.email ?? authData.user.email,
      planKey: body.planKey,
      amount: body.amount,
      currency: body.currency,
      paymentMethod: body.paymentMethod,
    };

    await Promise.allSettled([notifyDiscord(payload), notifyTelegram(payload)]);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
