import { supabase } from "@/integrations/supabase/client";

/** Variant IDs — set in Supabase secrets + optional Vite env for UI hints */
const VARIANT_BY_PLAN: Record<string, string | undefined> = {
  pro: import.meta.env.VITE_LEMONSQUEEZY_VARIANT_PRO,
  premium: import.meta.env.VITE_LEMONSQUEEZY_VARIANT_PREMIUM,
  elite: import.meta.env.VITE_LEMONSQUEEZY_VARIANT_ELITE,
};

export function isLemonCheckoutAvailable(planKey: string): boolean {
  const v = VARIANT_BY_PLAN[planKey];
  return Boolean(v && String(v).length > 0);
}

export async function startLemonCheckout(planKey: string): Promise<{ ok: boolean; url?: string; error?: string }> {
  const variantId = VARIANT_BY_PLAN[planKey];
  if (!variantId) {
    return { ok: false, error: "Card checkout is not configured yet. Use JazzCash, Easypaisa, or USDT below." };
  }

  const { data, error } = await supabase.functions.invoke("lemonsqueezy-checkout", {
    body: { variantId },
  });

  if (error) return { ok: false, error: error.message };
  if (!data?.url) return { ok: false, error: data?.error ?? "Could not start card checkout" };
  return { ok: true, url: data.url };
}
