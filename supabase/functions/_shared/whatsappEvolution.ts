/** Evolution API v2 client for WhatsApp Web QR sessions */

export function evolutionConfigured(): boolean {
  return Boolean(Deno.env.get("EVOLUTION_API_URL") && Deno.env.get("EVOLUTION_API_KEY"));
}

export function instanceNameForUser(userId: string): string {
  return `st-${userId.replace(/-/g, "").slice(0, 28)}`;
}

function baseUrl(): string {
  const url = Deno.env.get("EVOLUTION_API_URL")?.replace(/\/$/, "");
  if (!url) throw new Error("EVOLUTION_API_URL not configured");
  return url;
}

function apiKey(): string {
  const key = Deno.env.get("EVOLUTION_API_KEY");
  if (!key) throw new Error("EVOLUTION_API_KEY not configured");
  return key;
}

async function evolutionFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("apikey", apiKey());
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${baseUrl()}${path}`, { ...init, headers });
}

export async function evolutionCreateInstance(
  instanceName: string,
  webhookUrl: string,
): Promise<{ ok: boolean; error?: string }> {
  const webhookSecret = Deno.env.get("EVOLUTION_WEBHOOK_SECRET") ?? "";

  const body = {
    instanceName,
    qrcode: true,
    integration: "WHATSAPP-BAILEYS",
    webhook: {
      url: webhookUrl,
      byEvents: false,
      base64: false,
      headers: webhookSecret ? { "x-webhook-secret": webhookSecret } : {},
      events: ["CONNECTION_UPDATE", "MESSAGES_UPSERT"],
    },
  };

  const res = await evolutionFetch("/instance/create", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (res.ok) return { ok: true };

  const err = await res.json().catch(() => ({}));
  const message = (err as { message?: string }).message ?? res.statusText;

  // Instance may already exist — treat as success
  if (res.status === 403 || /already exists/i.test(message)) {
    return { ok: true };
  }

  return { ok: false, error: message };
}

export async function evolutionConnectQr(instanceName: string): Promise<{
  qrDataUrl?: string;
  pairingCode?: string;
  error?: string;
}> {
  const res = await evolutionFetch(`/instance/connect/${instanceName}`, { method: "GET" });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return { error: (data as { message?: string }).message ?? "Failed to fetch QR code" };
  }

  const base64 = (data as { base64?: string }).base64;
  const code = (data as { code?: string; pairingCode?: string }).pairingCode
    ?? (data as { code?: string }).code;

  let qrDataUrl: string | undefined;
  if (base64) {
    qrDataUrl = base64.startsWith("data:") ? base64 : `data:image/png;base64,${base64}`;
  }

  return { qrDataUrl, pairingCode: code };
}

export async function evolutionConnectionState(instanceName: string): Promise<{
  state: "open" | "close" | "connecting" | "unknown";
  ownerJid?: string;
}> {
  const res = await evolutionFetch(`/instance/connectionState/${instanceName}`, { method: "GET" });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) return { state: "unknown" };

  const instance = (data as { instance?: { state?: string; owner?: string; wuid?: string } }).instance
    ?? (data as { state?: string });
  const raw = (instance as { state?: string }).state ?? (data as { state?: string }).state ?? "unknown";
  const ownerJid = (instance as { owner?: string }).owner
    ?? (instance as { wuid?: string }).wuid;

  const state = raw === "open" ? "open" : raw === "connecting" ? "connecting" : raw === "close" ? "close" : "unknown";
  return { state, ownerJid };
}

export async function evolutionDeleteInstance(instanceName: string): Promise<void> {
  await evolutionFetch(`/instance/delete/${instanceName}`, { method: "DELETE" });
}

export async function evolutionSendText(
  instanceName: string,
  number: string,
  text: string,
): Promise<boolean> {
  const digits = number.replace(/\D/g, "");
  const res = await evolutionFetch(`/message/sendText/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({ number: digits, text }),
  });
  return res.ok;
}

export function jidToPhone(jid: string): string {
  const local = jid.split("@")[0]?.split(":")[0] ?? jid;
  const digits = local.replace(/\D/g, "");
  return digits ? `+${digits}` : jid;
}
