import type { RealtimeChannel, RealtimeChannelOptions } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Per-user Realtime topic (must match `can_access_realtime_topic` in SQL migrations). */
export function userScopedRealtimeTopic(prefix: string, userId: string): string {
  return `${prefix}-${userId}`;
}

/** Realtime channel with authorization enforced via realtime.messages RLS */
export function privateRealtimeChannel(
  topic: string,
  options?: RealtimeChannelOptions,
): RealtimeChannel {
  return supabase.channel(topic, {
    ...options,
    config: {
      ...options?.config,
      private: true,
    },
  });
}
