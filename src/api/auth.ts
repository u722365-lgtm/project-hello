import { detectRuntimePlatform } from "@/lib/tauri/runtimePlatform";
import type { TauriLocalAuth, TauriOllamaClient } from "@/lib/tauri/types";

export interface AuthApi {
  biometric(reason?: string): Promise<boolean>;
  signIn(payload: { email: string; password: string }): Promise<{ success: boolean; error?: string }>;
  signOut(): Promise<void>;
}

import { supabase } from "@/integrations/supabase/client";

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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { success: !error, error: error?.message };
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };
}
