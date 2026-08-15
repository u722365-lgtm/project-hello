/**
 * Profile sync — no-op in local-only mode.
 * Never throws, never blocks.
 */

export interface ProfileFields {
  email?: string;
  display_name?: string;
  avatar_url?: string;
}

export async function syncProfile(_userId: string, _fields: ProfileFields): Promise<void> {
  // No-op in local-only mode
}
