import { backend } from "@/integrations/local/client";
import type { UserIdentity, Provider } from "@backend/backend-js";

export type AuthProvider = Extract<Provider, "google" | "apple" | "github" | "slack" | "notion">;

export async function getLinkedIdentities(): Promise<UserIdentity[]> {
  const { data: { user } } = await backend.auth.getUser();
  return user?.identities ?? [];
}

export function hasProvider(identities: UserIdentity[], provider: string): boolean {
  return identities.some((i) => i.provider === provider);
}

export async function linkAuthProvider(provider: AuthProvider): Promise<{ error?: string }> {
  try {
    const { data, error } = await backend.auth.linkIdentity({
      provider,
      options: {
        redirectTo: `${window.location.origin}/profile?tab=linked`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    if (data?.url) {
      window.location.href = data.url;
    }
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to connect" };
  }
}

export async function unlinkAuthProvider(identity: UserIdentity): Promise<{ error?: string }> {
  const { error } = await backend.auth.unlinkIdentity(identity);
  if (error) return { error: error.message };
  return {};
}
