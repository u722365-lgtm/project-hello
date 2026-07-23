// Scaffolding stub — the platform-specific auth backend is unused in web builds.
// Real auth flows use @/components/AuthProvider directly with the Supabase client.
export interface AuthApi {
  biometric(reason?: string): Promise<boolean>;
  signIn(payload: { email: string; password: string }): Promise<{ success: boolean; error?: string }>;
  signOut(): Promise<void>;
}

export async function auth(): Promise<AuthApi> {
  return {
    biometric: async () => false,
    signIn: async () => ({ success: false, error: "Local auth backend not available in this build." }),
    signOut: async () => {},
  };
}
