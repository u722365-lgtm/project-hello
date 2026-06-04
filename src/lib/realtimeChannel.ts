import type { RealtimeChannel, RealtimeChannelOptions } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
