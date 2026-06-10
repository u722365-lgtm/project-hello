import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import {
  evolutionSendText,
  jidToPhone,
} from "../_shared/whatsappEvolution.ts";
import {
  handleWhatsAppCommand,
  processWhatsAppAIChat,
} from "../_shared/whatsappChat.ts";

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }

  const secret = Deno.env.get("EVOLUTION_WEBHOOK_SECRET");
  if (secret) {
    const incoming = req.headers.get("x-webhook-secret");
    if (incoming !== secret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const payload = await req.json();
    const event = payload.event as string | undefined;
    const instanceName = (payload.instance as string | undefined)
      ?? (payload.instanceName as string | undefined)
      ?? (payload.data as { instance?: string })?.instance;

    if (!instanceName) {
      return ok(corsHeaders);
    }

    if (event === "connection.update" || event === "CONNECTION_UPDATE") {
      await handleConnectionUpdate(supabase, instanceName, payload);
      return ok(corsHeaders);
    }

    if (event === "messages.upsert" || event === "MESSAGES_UPSERT") {
      await handleIncomingMessage(supabase, instanceName, payload, supabaseUrl, serviceKey);
      return ok(corsHeaders);
    }

    return ok(corsHeaders);
  } catch (error) {
    console.error("[whatsapp-qr-webhook]", error);
    return ok(corsHeaders);
  }
});

async function handleConnectionUpdate(
  supabase: ReturnType<typeof createClient>,
  instanceName: string,
  payload: Record<string, unknown>,
) {
  const data = (payload.data ?? payload) as Record<string, unknown>;
  const state = String(data.state ?? data.status ?? "").toLowerCase();

  if (state !== "open") return;

  const ownerJid = String(data.owner ?? data.wuid ?? data.instance?.owner ?? "");
  const phone = ownerJid ? jidToPhone(ownerJid) : undefined;

  await supabase
    .from("whatsapp_links")
    .update({
      is_verified: true,
      qr_status: "connected",
      wa_jid: ownerJid || null,
      ...(phone ? { phone_number: phone } : {}),
    })
    .eq("instance_name", instanceName)
    .eq("is_active", true);

  const { data: link } = await supabase
    .from("whatsapp_links")
    .select("user_id")
    .eq("instance_name", instanceName)
    .eq("is_active", true)
    .maybeSingle();

  if (link?.user_id) {
    await supabase.from("shadow_vault_connections").upsert(
      {
        user_id: link.user_id,
        service_name: "WhatsApp",
        service_type: "messaging",
        is_connected: true,
        is_active: true,
        sync_status: "synced",
      },
      { onConflict: "user_id,service_name" },
    );
  }
}

async function handleIncomingMessage(
  supabase: ReturnType<typeof createClient>,
  instanceName: string,
  payload: Record<string, unknown>,
  supabaseUrl: string,
  serviceKey: string,
) {
  const rawData = payload.data;
  const messages = Array.isArray(rawData) ? rawData : rawData ? [rawData] : [];

  const { data: link } = await supabase
    .from("whatsapp_links")
    .select("*")
    .eq("instance_name", instanceName)
    .eq("is_active", true)
    .eq("is_verified", true)
    .maybeSingle();

  if (!link) return;

  for (const item of messages) {
    const msg = item as Record<string, unknown>;
    const key = msg.key as { fromMe?: boolean; remoteJid?: string } | undefined;
    if (key?.fromMe) continue;

    const remoteJid = key?.remoteJid ?? "";
    if (remoteJid.includes("@g.us")) continue;

    const message = msg.message as Record<string, unknown> | undefined;
    const body =
      (message?.conversation as string | undefined)
      ?? (message?.extendedTextMessage as { text?: string } | undefined)?.text
      ?? (message?.imageMessage as { caption?: string } | undefined)?.caption
      ?? "";

    const text = body.trim();
    if (!text) continue;

    await supabase
      .from("whatsapp_links")
      .update({
        last_message_at: new Date().toISOString(),
        message_count: (link.message_count || 0) + 1,
      })
      .eq("id", link.id);

    const replyTo = jidToPhone(remoteJid).replace(/\D/g, "");

    let response: string;
    if (text.startsWith("/")) {
      response = await handleWhatsAppCommand(supabase, text, link.user_id, supabaseUrl, serviceKey);
    } else {
      response = await processWhatsAppAIChat(text, link.user_id, supabaseUrl, serviceKey);
    }

    await evolutionSendText(instanceName, replyTo, response);
  }
}

function ok(corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
