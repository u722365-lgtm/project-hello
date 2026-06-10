import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import {
  evolutionConfigured,
  instanceNameForUser,
  evolutionCreateInstance,
  evolutionConnectQr,
  evolutionConnectionState,
  evolutionDeleteInstance,
  jidToPhone,
} from "../_shared/whatsappEvolution.ts";

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }

  const auth = await requireAuth(req, corsHeaders);
  if (!auth.authenticated) return auth.response;

  const userId = auth.userId!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    await checkRateLimit(userId, supabase);

    if (!evolutionConfigured()) {
      return json(
        {
          error: "WhatsApp QR is not configured. Add EVOLUTION_API_URL and EVOLUTION_API_KEY in project secrets.",
          configured: false,
        },
        503,
        corsHeaders,
      );
    }

    const { action } = await req.json();
    const instanceName = instanceNameForUser(userId);
    const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-qr-webhook`;

    switch (action) {
      case "start":
        return await handleStart(supabase, userId, instanceName, webhookUrl, corsHeaders);
      case "qr":
        return await handleQr(supabase, userId, instanceName, corsHeaders);
      case "status":
        return await handleStatus(supabase, userId, instanceName, corsHeaders);
      case "unlink":
        return await handleUnlink(supabase, userId, instanceName, corsHeaders);
      default:
        return json({ error: "Unknown action" }, 400, corsHeaders);
    }
  } catch (error) {
    console.error("[whatsapp-qr]", error);
    return json(
      { error: error instanceof Error ? error.message : "Request failed" },
      500,
      corsHeaders,
    );
  }
});

async function handleStart(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  instanceName: string,
  webhookUrl: string,
  corsHeaders: Record<string, string>,
) {
  await supabase
    .from("whatsapp_links")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("is_active", true);

  const created = await evolutionCreateInstance(instanceName, webhookUrl);
  if (!created.ok) {
    return json({ error: created.error ?? "Could not create WhatsApp session" }, 502, corsHeaders);
  }

  const placeholderPhone = `+qr-${userId.slice(0, 8)}`;

  const { error: insertError } = await supabase.from("whatsapp_links").insert({
    user_id: userId,
    phone_number: placeholderPhone,
    connection_type: "qr",
    instance_name: instanceName,
    qr_status: "pending",
    is_verified: false,
    is_active: true,
  });

  if (insertError) {
    console.error("[whatsapp-qr] insert error:", insertError);
    return json({ error: insertError.message }, 500, corsHeaders);
  }

  const qr = await evolutionConnectQr(instanceName);
  if (qr.error && !qr.qrDataUrl) {
    return json({ error: qr.error }, 502, corsHeaders);
  }

  return json(
    {
      success: true,
      instanceName,
      qrDataUrl: qr.qrDataUrl,
      pairingCode: qr.pairingCode,
      status: "pending",
    },
    200,
    corsHeaders,
  );
}

async function handleQr(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  instanceName: string,
  corsHeaders: Record<string, string>,
) {
  const qr = await evolutionConnectQr(instanceName);
  if (qr.error && !qr.qrDataUrl) {
    return json({ error: qr.error }, 502, corsHeaders);
  }

  await supabase
    .from("whatsapp_links")
    .update({ qr_status: "pending" })
    .eq("user_id", userId)
    .eq("instance_name", instanceName)
    .eq("is_active", true);

  return json(
    {
      success: true,
      qrDataUrl: qr.qrDataUrl,
      pairingCode: qr.pairingCode,
      status: "pending",
    },
    200,
    corsHeaders,
  );
}

async function handleStatus(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  instanceName: string,
  corsHeaders: Record<string, string>,
) {
  const conn = await evolutionConnectionState(instanceName);

  if (conn.state === "open") {
    const phone = conn.ownerJid ? jidToPhone(conn.ownerJid) : undefined;

    await supabase
      .from("whatsapp_links")
      .update({
        is_verified: true,
        qr_status: "connected",
        wa_jid: conn.ownerJid ?? null,
        ...(phone ? { phone_number: phone } : {}),
      })
      .eq("user_id", userId)
      .eq("instance_name", instanceName)
      .eq("is_active", true);

    await upsertVaultConnection(supabase, userId);

    return json(
      {
        success: true,
        status: "connected",
        phoneNumber: phone,
        state: conn.state,
      },
      200,
      corsHeaders,
    );
  }

  const qrStatus = conn.state === "connecting" ? "scanned" : conn.state === "close" ? "disconnected" : "pending";

  await supabase
    .from("whatsapp_links")
    .update({ qr_status: qrStatus })
    .eq("user_id", userId)
    .eq("instance_name", instanceName)
    .eq("is_active", true);

  return json(
    {
      success: true,
      status: qrStatus,
      state: conn.state,
    },
    200,
    corsHeaders,
  );
}

async function handleUnlink(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  instanceName: string,
  corsHeaders: Record<string, string>,
) {
  try {
    await evolutionDeleteInstance(instanceName);
  } catch (e) {
    console.warn("[whatsapp-qr] delete instance:", e);
  }

  await supabase
    .from("whatsapp_links")
    .update({ is_active: false, qr_status: "disconnected" })
    .eq("user_id", userId)
    .eq("is_active", true);

  await supabase
    .from("shadow_vault_connections")
    .update({ is_connected: false, is_active: false })
    .eq("user_id", userId)
    .eq("service_name", "WhatsApp");

  return json({ success: true }, 200, corsHeaders);
}

async function upsertVaultConnection(
  supabase: ReturnType<typeof createClient>,
  userId: string,
) {
  await supabase.from("shadow_vault_connections").upsert(
    {
      user_id: userId,
      service_name: "WhatsApp",
      service_type: "messaging",
      is_connected: true,
      is_active: true,
      sync_status: "synced",
    },
    { onConflict: "user_id,service_name" },
  );
}

function json(data: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
