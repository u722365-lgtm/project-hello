import { detectRuntimePlatform } from "@/lib/tauri/runtimePlatform";
import type { TauriLocalAuth } from "@/lib/tauri/types";

export interface AuthApi {
  biometric(reason?: string): Promise<boolean>;
  signIn(payload: { email: string; password: string }): Promise<{ success: boolean; error?: string }>;
  signOut(): Promise<void>;
}

function getBackends() {
  return (typeof window !== 'undefined' ? (window as any).shadowtalkBackends : undefined) || {};
}

export async function auth(): Promise<AuthApi> {
  const platform = detectRuntimePlatform();
  if (platform === 'tauri') {
    const client = getBackends().localAuth as TauriLocalAuth | undefined;
    if (client) {
      return {
        biometric: (reason?: string) => client.authenticateWithBiometric(reason),
        signIn: async (payload) => {
          const result = await client.signInWithCredentials(payload);
          return { success: result.success, error: result.error };
        },
        signOut: () => client.signOut(),
      };
    }
  }

  return {
    biometric: async () => false,
    signIn: async ({ email, password }) => {
      const module = await import('@/lib/supabaseEnv');
      const client = module.getSupabase?.() ?? null;
      if (!client) {
        return { success: false, error: 'Supabase client is unavailable.' };
      }
      const { error } = await client.auth.signInWithPassword({ email, password });
      return { success: !error, error: error?.message };
    },
    signOut: async () => {
      try {
        const module = await import('@/lib/supabaseEnv');
        const client = module.getSupabase?.();
        if (client) {
          await client.auth.signOut();
        }
      } catch {
        // ignore
      }
    },
  };
}
