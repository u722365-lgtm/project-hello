import { evolutionConfigured, evolutionSendText, instanceNameForUser } from "./whatsappEvolution.ts";

const MAX_ATTEMPTS = 4;
const BASE_DELAY_MS = 1200;
const MAX_DELAY_MS = 12000;

export type WhatsAppCategory = "payment" | "launch" | "otp" | "support" | "system";

export type SendWhatsAppOptions = {
  category?: WhatsAppCategory;
  referenceId?: string;
  userId?: string;
  provider?: "evolution" | "twilio";
  instanceName?: string;
  attempts?: number;
};

export async function sendWhatsAppWithRetry(
  toNumber: string,
  text: string,
  opts: SendWhatsAppOptions = {},
): Promise<{ ok: boolean; error?: string; logId?: string }> {
  const digits = toNumber.replace(/\D/g, "");
  if (!digits) return { ok: false, error: "Invalid phone number" };

  const provider = opts.provider ?? (evolutionConfigured() ? "evolution" : "twilio");
  const attempts = opts.attempts ?? MAX_ATTEMPTS;
  const category = opts.category ?? "system";
  const instanceName = opts.instanceName ?? (opts.userId ? instanceNameForUser(opts.userId) : null);

  const log = await insertLog({
    provider,
    instance_name: instanceName,
    phone_number: `+${digits}`,
    direction: "outbound",
    category,
    reference_id: opts.referenceId ?? null,
    status: "queued",
    attempts: 0,
    payload: { to: `+${digits}`, text },
  });

  let lastError: string | undefined;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    let sent = false;
    if (provider === "evolution") {
      if (!evolutionConfigured()) {
        lastError = "Evolution not configured";
      } else {
        sent = await evolutionSendText(instanceName ?? "", `+${digits}`, text);
        lastError = sent ? undefined : "Evolution send failed";
      }
    } else {
      sent = await sendViaTwilio(`+${digits}`, text);
      lastError = sent ? undefined : "Twilio send failed";
    }

    await updateLog(log.id, {
      attempts: attempt,
      status: sent ? "sent" : "failed",
      provider_status: sent ? "sent" : lastError,
      last_error: lastError,
    });

    if (sent) return { ok: true, logId: log.id };

    if (attempt < attempts) {
      await sleep(Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), MAX_DELAY_MS));
      await updateLog(log.id, { status: "retrying" });
    }
  }

  return { ok: false, error: lastError ?? "Send failed after retries", logId: log.id };
}

async function sendViaTwilio(toNumber: string, body: string): Promise<boolean> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_WHATSAPP_NUMBER")?.replace("whatsapp:", "") || "";
  if (!accountSid || !authToken || !from) return false;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const form = new URLSearchParams({
    To: `whatsapp:${toNumber}`,
    From: `whatsapp:${from}`,
    Body: body,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: "Basic " + btoa(`${accountSid}:${authToken}`), "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  const data = await res.json().catch(() => ({}));
  return res.ok && Boolean((data as { sid?: string }).sid);
}

type LogRow = {
  id: string;
  provider: string;
  instance_name: string | null;
  phone_number: string;
  direction: string;
  category: string;
  reference_id: string | null;
  status: string;
  attempts: number;
  last_error: string | null;
  payload: Record<string, unknown>;
};

async function insertLog(row: Omit<LogRow, "id">) {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return { id: "local-" + Math.random().toString(36).slice(2) };

  const supabase = createSupabaseAdmin(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data, error } = await supabase.from("whatsapp_message_log").insert(row).select("id").single();
  if (error) return { id: "local-" + Math.random().toString(36).slice(2) };
  return data as { id: string };
}

async function updateLog(id: string, patch: Partial<LogRow>) {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || id.startsWith("local-")) return;

  const supabase = createSupabaseAdmin(SUPABASE_URL, SERVICE_ROLE_KEY);
  await supabase.from("whatsapp_message_log").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
}

function createSupabaseAdmin(url: string, key: string) {
  return createClient(url, key, { global: { headers: { apikey: key, Authorization: `Bearer ${key}` } } });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
