import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import {
  buildInvoiceHtml,
  buildInvoiceNumber,
  buildPaymentReference,
  planLabelFromKey,
} from "../_shared/manualPaymentInvoice.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const anon = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: authData } = await anon.auth.getUser();
    const user = authData.user;
    if (!user) {
      return new Response(JSON.stringify({ ok: false, error: "Sign in to generate an invoice" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const planKey = String(body.planKey ?? "pro");
    const paymentMethod = String(body.paymentMethod ?? "bank_transfer");
    const amount = Number(body.amount ?? 0);
    const currency = String(body.currency ?? "PKR");

    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const draftId = crypto.randomUUID();
    const invoiceNumber = buildInvoiceNumber(draftId);
    const paymentReference = buildPaymentReference(planKey, user.id);
    const planLabel = planLabelFromKey(planKey);

    const paymentRow = {
      id: draftId,
      email: user.email ?? "",
      name: (user.user_metadata?.full_name as string | undefined) ?? null,
      amount,
      currency,
      payment_method: paymentMethod,
      plan_type: planKey,
      user_id: user.id,
      created_at: new Date().toISOString(),
    };

    const invoiceHtml = buildInvoiceHtml({
      invoiceNumber,
      payment: paymentRow,
      planLabel,
      paymentReference,
      status: "draft",
    });

    const { data, error } = await anon.from("payment_invoice_drafts").insert({
      id: draftId,
      user_id: user.id,
      plan_key: planKey,
      payment_method: paymentMethod,
      amount,
      currency,
      invoice_number: invoiceNumber,
      invoice_html: invoiceHtml,
      payment_reference: paymentReference,
      status: "draft",
    }).select("id, invoice_number, payment_reference").single();

    if (error) {
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        invoiceId: data.id,
        invoiceNumber: data.invoice_number,
        paymentReference: data.payment_reference,
        invoiceHtml,
        planLabel,
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
