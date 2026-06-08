import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/** Mark referral as subscribed when referred user converts */
export async function markReferralConversion(
  admin: SupabaseClient,
  referredUserId: string,
): Promise<{ updated: boolean }> {
  const { data: ref } = await admin
    .from("referrals")
    .select("id, referrer_id, status")
    .eq("referred_user_id", referredUserId)
    .in("status", ["pending", "signed_up"])
    .maybeSingle();

  if (!ref) return { updated: false };

  await admin
    .from("referrals")
    .update({
      status: "subscribed",
      converted_at: new Date().toISOString(),
    })
    .eq("id", ref.id);

  const { data: codeRow } = await admin
    .from("user_referral_codes")
    .select("id, successful_conversions")
    .eq("user_id", ref.referrer_id)
    .maybeSingle();

  if (codeRow) {
    await admin
      .from("user_referral_codes")
      .update({
        successful_conversions: (codeRow.successful_conversions ?? 0) + 1,
      })
      .eq("id", codeRow.id);
  }

  return { updated: true };
}
