export interface TauriWhatsAppLocalBridge {
  /** Request latest paired QR payload from Rasberry/WhatsApp Rust bridge */
  getQrPayload(): Promise<{ qr: string; expiresAt: string } | null>;
  /** Check current WhatsApp local bridge status */
  getStatus(): Promise<{ ready: boolean; phone?: string; lastError?: string }>;
  /** Disconnect local WhatsApp session */
  disconnect(): Promise<void>;
}
