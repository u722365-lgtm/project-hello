import { supabase } from "@/integrations/supabase/client";

export interface PaymentInvoiceResult {
  ok: boolean;
  invoiceId?: string;
  invoiceNumber?: string;
  paymentReference?: string;
  invoiceHtml?: string;
  planLabel?: string;
  error?: string;
}

export interface ProcessPaymentResult {
  ok: boolean;
  paymentId?: string;
  invoiceNumber?: string;
  invoiceHtml?: string;
  plan?: string;
  activated?: boolean;
  paymentReference?: string;
  error?: string;
}

export async function createPaymentInvoice(input: {
  planKey: string;
  paymentMethod: string;
  amount: number;
  currency: "USD" | "PKR";
}): Promise<PaymentInvoiceResult> {
  const { data, error } = await supabase.functions.invoke("create-payment-invoice", {
    body: input,
  });

  if (error) return { ok: false, error: error.message };
  if (!data?.ok) return { ok: false, error: data?.error ?? "Could not create invoice" };

  return {
    ok: true,
    invoiceId: data.invoiceId,
    invoiceNumber: data.invoiceNumber,
    paymentReference: data.paymentReference,
    invoiceHtml: data.invoiceHtml,
    planLabel: data.planLabel,
  };
}

export async function processManualPaymentAutomation(input: {
  paymentId: string;
  invoiceDraftId?: string | null;
}): Promise<ProcessPaymentResult> {
  const { data, error } = await supabase.functions.invoke("process-manual-payment", {
    body: input,
  });

  if (error) return { ok: false, error: error.message };
  if (!data?.ok) return { ok: false, error: data?.error ?? "Could not process payment" };

  return {
    ok: true,
    paymentId: data.paymentId,
    invoiceNumber: data.invoiceNumber,
    invoiceHtml: data.invoiceHtml,
    plan: data.plan,
    activated: data.activated,
    paymentReference: data.paymentReference,
  };
}

export function downloadInvoiceHtml(invoiceHtml: string, invoiceNumber: string): void {
  const blob = new Blob([invoiceHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${invoiceNumber}.html`;
  anchor.click();
  URL.revokeObjectURL(url);
}
