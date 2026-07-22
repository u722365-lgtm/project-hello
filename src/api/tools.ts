import { detectRuntimePlatform } from "@/lib/tauri/runtimePlatform";
import type {
  TauriLocalAuth,
  TauriOllamaClient,
  TauriSecureStore,
  TauriWhatsAppLocalBridge,
  TauriMediaPipeline,
} from "@/lib/tauri/types";

export interface AuthApi {
  biometric(reason?: string): Promise<boolean>;
  signIn(payload: { email: string; password: string }): Promise<{ success: boolean; error?: string }>;
  signOut(): Promise<void>;
}

export interface ChatApi {
  streamCompletion(params: {
    model: string;
    prompt: string;
    context?: number[];
    options?: Record<string, unknown>;
  }): Promise<AsyncIterable<string>>;
}

export interface ToolsApi {
  getWhatsAppQr(): Promise<{ qr?: string; phone?: string } | null>;
  transcodeImage(input: { bytes: Uint8Array; mimeType: string }, outputMime: string): Promise<{ success: boolean; error?: string }>;
}

function getBackends() {
  return (typeof window !== 'undefined' ? (window as any).shadowtalkBackends : undefined) || {};
}

export async function auth(): Promise<AuthApi> {
  const platforms = detectRuntimePlatform();
  if (platforms === 'tauri') {
    const client = (getBackends().localAuth as TauriLocalAuth | undefined);
    if (client) {
      return {
        biometric: (reason?: string) => client.authenticateWithBiometric(reason),
        signIn: (payload) =>
          client
            .signInWithCredentials(payload)
            .then((r) => ({ success: r.success, error: r.error }))
            .catch((e: any) => ({ success: false as const, error: e?.message || 'String error' })),
        signOut: () => client.signOut(),
      };
    }
  }

  // Default Supabase-backed implementation for web.
  const { getSupabase } = await import('@/lib/supabaseEnv');
  const supabase = getSupabase();

  return {
    biometric: async () => false,
    signIn: async ({ email, password }) => {
      // TODO[rust]: replace with dedicated Supabase auth endpoint.
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { success: !error, error: error?.message };
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };
}

export async function chat(): Promise<ChatApi> {
  const platforms = detectRuntimePlatform();
  if (platforms === 'tauri') {
    const client = (getBackends().ollamaClient as TauriOllamaClient | undefined);
    if (client) {
      return {
        streamCompletion: async (params) => client.streamCompletion(params),
      };
    }
  }

  // TODO[rust]: Rust offline chat backend not yet connected.
  const { streamChatCompletion } = await import('@/lib/chatRequest');
  return {
    streamCompletion: async (params) => streamChatCompletion(params),
  };
}

export async function tools(): Promise<ToolsApi> {
  const platforms = detectRuntimePlatform();
  if (platforms === 'tauri') {
    const {
      whatsappLocalBridge,
      mediaPipeline,
    } = getBackends() as {
      whatsappLocalBridge?: TauriWhatsAppLocalBridge;
      mediaPipeline?: TauriMediaPipeline;
    };

    if (whatsappLocalBridge && mediaPipeline) {
      return {
        getWhatsAppQr: async () => {
          const qr = await whatsappLocalBridge.getQrPayload();
          if (!qr) return null;
          return { qr: qr.qr };
        },
        transcodeImage: async ({ bytes, mimeType }, outputMime) => {
          const result = await mediaPipeline.transcode(
            { mimeType: mimeType as any, bytes },
            outputMime as any,
          );
          if (!result.success) return { success: false as const, error: result.error };
          return { success: true as const };
        },
      };
    }
  }

  // Supabase edge-function-backed tools fallback.
  const { getChatFetchHeaders, getChatFunctionUrl } = await import('@/lib/supabaseEnv');
  return {
    getWhatsAppQr: async () => {
      const res = await fetch(getChatFunctionUrl() + '/whatsapp-qr', {
        method: 'POST',
        headers: getChatFetchHeaders(),
      });
      if (!res.ok) return null;
      const payload = await res.json().catch(() => null);
      if (payload?.qr) return { qr: String(payload.qr) };
      return null;
    },
    transcodeImage: async () => ({ success: true }),
  };
}
