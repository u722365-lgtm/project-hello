import { supabase } from "@/integrations/supabase/client";
import {
  clearStoredReferralCode,
  getStoredReferralCode,
} from "@/hooks/useReferralTracking";

/** Attribute signup to stored ?ref= code via edge function (service-role insert). */
export async function applyReferralOnSignup(): Promise<void> {
  const code = getStoredReferralCode();
  if (!code) return;

  try {
    const { data, error } = await supabase.functions.invoke("record-referral", {
      body: { referral_code: code },
    });
    if (!error && data?.ok) {
      clearStoredReferralCode();
    }
  } catch {
    /* offline ok */
  }
}
