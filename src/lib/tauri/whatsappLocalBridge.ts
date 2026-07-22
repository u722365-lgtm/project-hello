export interface TauriWhatsAppLocalBridge {
  getStatus(): Promise<{ ready: boolean; phone?: string; lastError?: string }>;
  openStatus(): Promise<{ ok: boolean; path?: string; error?: string }>;
  pair(command?: string, args?: string[]): Promise<{ ok: boolean; pid?: number; error?: string }>;
}

import { invoke } from "@tauri-apps/api/core";

function fallbackStatus(): { ready: boolean; phone?: string; lastError?: string } {
  return { ready: false, lastError: "Local fallback: not connected from TS bridge." };
}

export async function whatsappLocalBridge(): Promise<TauriWhatsAppLocalBridge> {
  try {
    const responder = (window as any).shadowtalkBackends?.whatsappLocalBridge;
    if (responder) return responder;
  } catch {
    // ignore
  }

  return {
    getStatus: async () => {
      try {
        const payload = await invoke<{
          status: string;
          ready: boolean;
          phone?: string;
          last_error?: string;
          note?: string;
          session_dir?: string;
        }>("whatsapp_status");
        return {
          ready: Boolean(payload?.ready),
          phone: payload?.phone,
          lastError: (payload as any)?.last_error || (payload as any)?.note,
        };
      } catch (e: any) {
        return { ready: false, lastError: e?.message || "Failed to load WhatsApp status." };
      }
    },
    openStatus: async () => {
      try {
        const payload = await invoke<{ ok: boolean; path?: string; error?: string }>(
          "whatsapp_open_status"
        );
        return payload || { ok: false, error: "No response from bridge." };
      } catch (e: any) {
        return { ok: false, error: e?.message || "Failed to open status folder." };
      }
    },
    pair: async (command?: string, args: string[] = []) => {
      try {
        const payload = await invoke<{ ok: boolean; pid?: number; error?: string }>(
          "whatsapp_pair",
          { command: command ?? null, args }
        );
        return payload || { ok: false, error: "No response from bridge." };
      } catch (e: any) {
        return { ok: false, error: e?.message || "Failed to start pairing." };
      }
    },
  };
}
