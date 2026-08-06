import type { RealtimeChannel, RealtimeChannelOptions } from "@backend/backend-js";
import { backend } from "@/integrations/local/client";

/** Per-user Realtime topic (must match `can_access_realtime_topic` in SQL migrations). */
export function userScopedRealtimeTopic(prefix: string, userId: string): string {
  return `${prefix}-${userId}`;
}

/** Realtime channel with authorization enforced via realtime.messages RLS */
export function privateRealtimeChannel(
  topic: string,
  options?: RealtimeChannelOptions,
): RealtimeChannel {
  return backend.channel(topic, {
    ...options,
    config: {
      ...options?.config,
      private: true,
    },
  });
}
