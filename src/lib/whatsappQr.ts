import { backend } from "@/integrations/local/client";

export type WhatsAppQrStatus = "pending" | "scanned" | "connected" | "disconnected" | "expired";

export interface WhatsAppQrStartResult {
  success?: boolean;
  configured?: boolean;
  qrDataUrl?: string;
  pairingCode?: string;
  status?: WhatsAppQrStatus;
  phoneNumber?: string;
  error?: string;
}

async function callWhatsAppQr(action: string): Promise<WhatsAppQrStartResult> {
  const { data: { session } } = await backend.auth.getSession();
  if (!session) return { error: "Sign in required" };

  const response = await fetch(
    '',
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action }),
    },
  );

  return response.json();
}

export function startWhatsAppQrSession() {
  return callWhatsAppQr("start");
}

export function refreshWhatsAppQr() {
  return callWhatsAppQr("qr");
}

export function pollWhatsAppQrStatus() {
  return callWhatsAppQr("status");
}

export function unlinkWhatsAppQr() {
  return callWhatsAppQr("unlink");
}
