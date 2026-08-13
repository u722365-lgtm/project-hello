/**
 * Profile sync against the Supabase Cloud backend (Supabase).
 * Best-effort: never throws, never blocks auth hydration.
 */
import { backend } from '@/integrations/local/client';

export interface ProfileFields {
  email?: string;
  display_name?: string;
  avatar_url?: string;
}

export async function syncProfile(userId: string, fields: ProfileFields): Promise<void> {
  if (!userId) return;
  try {
    await backend
      .from('profiles')
      .upsert(
        {
          id: userId,
          email: fields.email ?? null,
          display_name: fields.display_name ?? null,
          avatar_url: fields.avatar_url ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      );
  } catch (err) {
    console.warn('[Auth] profile sync skipped:', err);
  }
}
