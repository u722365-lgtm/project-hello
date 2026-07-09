const PAID_PLANS = new Set(["pro", "premium", "elite", "enterprise"]);

export interface InvoicePaymentRow {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  amount: number;
  currency: string;
  payment_method: string;
  plan_type: string;
  transaction_reference?: string | null;
  user_id?: string | null;
  created_at?: string;
}

export function buildInvoiceNumber(paymentId: string, createdAt = new Date()): string {
  const year = createdAt.getFullYear();
  const suffix = paymentId.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `ST-INV-${year}-${suffix}`;
}

export function buildPaymentReference(planKey: string, userId: string): string {
  const suffix = userId.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `ShadowTalk-${planKey.toUpperCase()}-${suffix}`;
}

export function buildInvoiceHtml(input: {
  invoiceNumber: string;
  payment: InvoicePaymentRow;
  planLabel: string;
  paymentReference: string;
  status: "draft" | "paid" | "activated";
}): string {
  const { invoiceNumber, payment, planLabel, paymentReference, status } = input;
  const issued = payment.created_at
    ? new Date(payment.created_at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })
    : new Date().toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });

  const statusLabel =
    status === "activated" ? "Activated" : status === "paid" ? "Payment received" : "Awaiting payment";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${invoiceNumber}</title></head>
<body style="font-family:system-ui,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111">
  <h1 style="margin:0 0 8px">ShadowTalk AI Invoice</h1>
  <p style="color:#555;margin:0 0 24px">${invoiceNumber} · ${statusLabel}</p>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <tr><td style="padding:8px 0;color:#666">Bill to</td><td style="padding:8px 0;text-align:right">${payment.name ?? payment.email}</td></tr>
    <tr><td style="padding:8px 0;color:#666">Email</td><td style="padding:8px 0;text-align:right">${payment.email}</td></tr>
    <tr><td style="padding:8px 0;color:#666">Plan</td><td style="padding:8px 0;text-align:right;font-weight:600">${planLabel}</td></tr>
    <tr><td style="padding:8px 0;color:#666">Amount</td><td style="padding:8px 0;text-align:right;font-weight:600">${payment.currency} ${Number(payment.amount).toLocaleString()}</td></tr>
    <tr><td style="padding:8px 0;color:#666">Method</td><td style="padding:8px 0;text-align:right">${payment.payment_method.replace(/_/g, " ")}</td></tr>
    <tr><td style="padding:8px 0;color:#666">Reference</td><td style="padding:8px 0;text-align:right;font-family:monospace">${paymentReference}</td></tr>
    ${payment.transaction_reference ? `<tr><td style="padding:8px 0;color:#666">Transaction ID</td><td style="padding:8px 0;text-align:right;font-family:monospace">${payment.transaction_reference}</td></tr>` : ""}
    <tr><td style="padding:8px 0;color:#666">Issued</td><td style="padding:8px 0;text-align:right">${issued}</td></tr>
  </table>
  <p style="font-size:14px;color:#444;line-height:1.5">Thank you for supporting ShadowTalk AI. If you have questions, reply on WhatsApp or email support@shadowtalk-ai.com.</p>
  <p style="font-size:12px;color:#888;margin-top:32px">ShadowTalk AI · Karachi, Pakistan · shadowtalk-ai.com</p>
</body></html>`;
}

export function planLabelFromKey(planKey: string): string {
  const map: Record<string, string> = {
    pro: "Pro Plan",
    premium: "Premium Plan",
    elite: "Elite Plan",
    enterprise: "Enterprise Plan",
  };
  return map[planKey] ?? `${planKey} Plan`;
}

export async function activateManualPayment(
  admin: { from: (table: string) => ReturnType<import("https://esm.sh/@supabase/supabase-js@2.57.2").SupabaseClient["from"]> },
  payment: InvoicePaymentRow,
  verifiedBy: string | null,
): Promise<{ userId: string | null; tier: string }> {
  let userId = payment.user_id ?? null;
  if (!userId && payment.email) {
    const { data: profile } = await admin.from("profiles").select("id").eq("email", payment.email).maybeSingle();
    userId = (profile as { id?: string } | null)?.id ?? null;
  }

  const plan = String(payment.plan_type ?? "pro");
  const tier = PAID_PLANS.has(plan) ? plan : "pro";
  const subscriptionEnd = new Date();
  subscriptionEnd.setDate(subscriptionEnd.getDate() + 32);

  if (userId) {
    await admin.from("subscribers").upsert(
      {
        user_id: userId,
        email: payment.email,
        subscribed: true,
        subscription_tier: tier,
        subscription_status: "active",
        subscription_end: subscriptionEnd.toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    await admin.from("user_notifications").insert({
      user_id: userId,
      title: `${tier.charAt(0).toUpperCase() + tier.slice(1)} plan activated`,
      message: `Invoice processed — your ${planLabelFromKey(tier)} is now active. Open chat to start using it.`,
      type: "billing",
      action_url: "/chatbot",
      metadata: { payment_id: payment.id, plan: tier, auto: true },
    });
  }

  await admin.from("manual_payments").update({
    status: "verified",
    verified_by: verifiedBy,
    verified_at: new Date().toISOString(),
    auto_activated_at: new Date().toISOString(),
    user_id: userId ?? payment.user_id,
  }).eq("id", payment.id);

  return { userId, tier };
}

export function founderWhatsAppAlertText(input: {
  invoiceNumber: string;
  email: string;
  planLabel: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentId: string;
  paymentReference: string;
}): string {
  return [
    "🧾 New ShadowTalk payment + invoice",
    `Invoice: ${input.invoiceNumber}`,
    `Plan: ${input.planLabel}`,
    `${input.currency} ${input.amount} via ${input.paymentMethod}`,
    `Customer: ${input.email}`,
    `Ref: ${input.paymentReference}`,
    `Payment ID: ${input.paymentId.slice(0, 8)}`,
    "Plan auto-activated after proof submitted.",
  ].join("\n");
}

export async function sendResendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const resendKey = Deno.env.get("RESEND_API_KEY") ?? Deno.env.get("Resend_api_key") ?? Deno.env.get("resend_api_key");
  if (!resendKey) return false;

  const from = Deno.env.get("RESEND_FROM") ?? "ShadowTalk AI <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  return res.ok;
}
