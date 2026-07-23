// Scaffolding stub for platform tools bridge; production tools use direct edge functions.
export interface ToolsApi {
  getWhatsAppQr(): Promise<{ qr?: string; phone?: string } | null>;
  transcodeImage(
    input: { bytes: Uint8Array; mimeType: string },
    outputMime: string,
  ): Promise<{ success: boolean; error?: string }>;
}

export async function tools(): Promise<ToolsApi> {
  return {
    getWhatsAppQr: async () => null,
    transcodeImage: async () => ({ success: true }),
  };
}
