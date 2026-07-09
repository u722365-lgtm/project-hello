import { supabase } from "@/integrations/supabase/client";
import { normalizePlanType, planDisplayName, PKR_MONTHLY, resolvePlanAmountUsd, type PaidPlanId } from "./planPricing";

export type ManualPaymentMethod = "bank_transfer" | "easypaisa" | "jazzcash" | "usdt" | "wise" | "other";

export interface SubmitManualPaymentInput {
  planKey: string;
  paymentMethod: ManualPaymentMethod;
  amount: number;
  currency: "USD" | "PKR";
  transactionReference?: string;
  phone?: string;
  name?: string;
  receiptFile?: File | null;
  notes?: string;
}

export async function submitManualPayment(
  input: SubmitManualPaymentInput,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user?.email) {
    return { ok: false, error: "Sign in to submit payment proof." };
  }

  let receiptPath: string | null = null;
  if (input.receiptFile) {
    const ext = input.receiptFile.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${Date.now()}-receipt.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("payment-receipts")
      .upload(path, input.receiptFile, { upsert: false });
    if (uploadError) {
      return { ok: false, error: `Receipt upload failed: ${uploadError.message}` };
    }
    receiptPath = path;
  }

  const planType = normalizePlanType(input.planKey);

  const { data, error } = await supabase
    .from("manual_payments")
    .insert({
      email: user.email,
      name: input.name ?? user.user_metadata?.full_name ?? null,
      phone: input.phone ?? null,
      payment_method: input.paymentMethod,
      amount: input.amount,
      currency: input.currency,
      transaction_reference: input.transactionReference ?? null,
      receipt_url: receiptPath,
      plan_type: planType,
      status: "pending",
      user_id: user.id,
      notes: input.notes ?? `Plan: ${planDisplayName(input.planKey)}`,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  void supabase.functions
    .invoke("notify-manual-payment", {
      body: {
        paymentId: data.id,
        email: user.email,
        planKey: input.planKey,
        amount: input.amount,
        currency: input.currency,
        paymentMethod: input.paymentMethod,
      },
    })
    .catch(() => {
      /* notification is best-effort */
    });

  return { ok: true, id: data.id };
}

export function suggestedAmount(planKey: string, currency: "USD" | "PKR"): number {
  const plan = normalizePlanType(planKey);
  if (currency === "PKR" && (plan === "pro" || plan === "premium" || plan === "elite")) {
    return PKR_MONTHLY[plan as PaidPlanId];
  }
  return resolvePlanAmountUsd(planKey);
}
