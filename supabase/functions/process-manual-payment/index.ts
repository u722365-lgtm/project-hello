import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { evolutionConfigured, evolutionSendText } from "../_shared/whatsappEvolution.ts";
import {
  activateManualPayment,
  buildInvoiceHtml,
  buildInvoiceNumber,
  buildPaymentReference,
  founderWhatsAppAlertText,
  planLabelFromKey,
  sendResendEmail,
  type InvoicePaymentRow,
} from "../_shared/manualPaymentInvoice.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FOUNDER_WHATSAPP = Deno.env.get("MANUAL_PAYMENT_FOUNDER_PHONE") ?? "923211798561";

async function notifyDiscord(payload: Record<string, unknown>, invoiceNumber: string): Promise<void> {
  const webhook = Deno.env.get("MANUAL_PAYMENT_DISCORD_WEBHOOK_URL") ?? Deno.env.get("DISCORD_WEBHOOK_URL");
  if (!webhook) return;

  const lines = [
    "**🧾 Invoice generated + plan auto-activated**",
    `Invoice: ${invoiceNumber}`,
    `Email: ${payload.email ?? "unknown"}`,
    `Plan: ${payload.planLabel ?? payload.planKey ?? "unknown"}`,
    `Amount: ${payload.currency ?? ""} ${payload.amount ?? ""}`,
    `Method: ${payload.paymentMethod ?? "unknown"}`,
    `Payment ID: ${payload.paymentId ?? ""}`,
  ];

  await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: lines.join("\n") }),
  });
}

async function notifyTelegram(text: string): Promise<void> {
  const token = Deno.env.get("MANUAL_PAYMENT_TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("MANUAL_PAYMENT_TELEGRAM_CHAT_ID");
  if (!token || !chatId) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

async function notifyFounderWhatsApp(text: string): Promise<void> {
  const instance = Deno.env.get("MANUAL_PAYMENT_WHATSAPP_INSTANCE");
  if (instance && evolutionConfigured()) {
    await evolutionSendText(instance, FOUNDER_WHATSAPP, text);
    return;
  }

  // Fallback: Telegram often mirrors to phone; Discord webhook is separate
}

async function notifyUserWhatsApp(phone: string | null | undefined, text: string): Promise<void> {
  if (!phone) return;
  const instance = Deno.env.get("MANUAL_PAYMENT_WHATSAPP_INSTANCE");
  if (instance && evolutionConfigured()) {
    await evolutionSendText(instance, phone, text);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const anon = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceRole);

    const { data: authData } = await anon.auth.getUser();
    const user = authData.user;
    if (!user) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const paymentId = String(body.paymentId ?? "");
    const invoiceDraftId = body.invoiceDraftId ? String(body.invoiceDraftId) : null;

    if (!paymentId) {
      return new Response(JSON.stringify({ ok: false, error: "paymentId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: payment, error: fetchErr } = await admin
      .from("manual_payments")
      .select("*")
      .eq("id", paymentId)
      .maybeSingle();

    if (fetchErr || !payment) {
      return new Response(JSON.stringify({ ok: false, error: "Payment not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payment.user_id && payment.user_id !== user.id) {
      return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const planKey = String(payment.plan_type ?? "pro");
    const planLabel = planLabelFromKey(planKey);
    const paymentReference = buildPaymentReference(planKey, payment.user_id ?? user.id);

    let invoiceNumber = payment.invoice_number as string | null;
    let invoiceHtml = payment.invoice_html as string | null;

    if (!invoiceNumber) {
      invoiceNumber = buildInvoiceNumber(paymentId, new Date(payment.created_at ?? Date.now()));
    }

    const paymentRow: InvoicePaymentRow = {
      id: paymentId,
      email: payment.email,
      name: payment.name,
      phone: payment.phone,
      amount: Number(payment.amount),
      currency: payment.currency,
      payment_method: payment.payment_method,
      plan_type: planKey,
      transaction_reference: payment.transaction_reference,
      user_id: payment.user_id,
      created_at: payment.created_at,
    };

    if (!invoiceHtml) {
      invoiceHtml = buildInvoiceHtml({
        invoiceNumber,
        payment: paymentRow,
        planLabel,
        paymentReference,
        status: "activated",
      });
    }

    let tier = planKey;
    let userId = payment.user_id as string | null;

    if (payment.status !== "verified") {
      const activation = await activateManualPayment(admin, paymentRow, user.id);
      tier = activation.tier;
      userId = activation.userId;
    } else {
      tier = PAID_PLAN(payment.plan_type);
    }

    const now = new Date().toISOString();
    await admin.from("manual_payments").update({
      invoice_number: invoiceNumber,
      invoice_html: invoiceHtml,
      invoice_sent_at: now,
    }).eq("id", paymentId);

    if (invoiceDraftId) {
      await admin.from("payment_invoice_drafts").update({
        status: "activated",
        manual_payment_id: paymentId,
        invoice_html: invoiceHtml,
        updated_at: now,
      }).eq("id", invoiceDraftId).eq("user_id", user.id);
    }

    const founderText = founderWhatsAppAlertText({
      invoiceNumber,
      email: payment.email,
      planLabel,
      amount: Number(payment.amount),
      currency: payment.currency,
      paymentMethod: payment.payment_method,
      paymentId,
      paymentReference,
    });

    const userText = [
      `✅ ShadowTalk invoice ${invoiceNumber}`,
      `Your ${planLabel} is now active.`,
      `Amount: ${payment.currency} ${payment.amount}`,
      `Reference: ${paymentReference}`,
      "Open shadowtalk-ai.com/chatbot to start.",
    ].join("\n");

    await Promise.allSettled([
      sendResendEmail(
        payment.email,
        `Your ShadowTalk invoice ${invoiceNumber} — ${planLabel} activated`,
        invoiceHtml,
      ),
      notifyDiscord(
        {
          email: payment.email,
          planLabel,
          planKey,
          amount: payment.amount,
          currency: payment.currency,
          paymentMethod: payment.payment_method,
          paymentId,
        },
        invoiceNumber,
      ),
      notifyTelegram(founderText),
      notifyFounderWhatsApp(founderText),
      notifyUserWhatsApp(payment.phone, userText),
    ]);

    return new Response(
      JSON.stringify({
        ok: true,
        paymentId,
        invoiceNumber,
        invoiceHtml,
        plan: tier,
        activated: true,
        paymentReference,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function PAID_PLAN(plan: unknown): string {
  const p = String(plan ?? "pro");
  return ["pro", "premium", "elite", "enterprise"].includes(p) ? p : "pro";
}
