import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import {
  submitManualPayment,
  suggestedAmount,
  type ManualPaymentMethod,
} from "@/lib/payments/submitManualPayment";
import { PaymentInvoiceSuccess } from "@/components/payments/PaymentInvoiceSuccess";
import { Link } from "react-router-dom";

interface Props {
  planKey: string;
  currency?: "USD" | "PKR";
  defaultMethod?: ManualPaymentMethod;
  invoiceDraftId?: string | null;
}

export function QuickReceiptUpload({
  planKey,
  currency = "PKR",
  defaultMethod = "bank_transfer",
  invoiceDraftId,
}: Props) {
  const { user, checkSubscription } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [invoiceResult, setInvoiceResult] = useState<{
    invoiceNumber: string;
    invoiceHtml: string;
    plan?: string;
  } | null>(null);

  if (!user) {
    return (
      <Button asChild variant="secondary" className="w-full gap-2">
        <Link to={`/auth?redirect=${encodeURIComponent(`/founder-access?plan=${planKey}`)}`}>
          Sign in to upload receipt
        </Link>
      </Button>
    );
  }

  if (invoiceResult) {
    return (
      <PaymentInvoiceSuccess
        invoiceNumber={invoiceResult.invoiceNumber}
        invoiceHtml={invoiceResult.invoiceHtml}
        plan={invoiceResult.plan}
        onContinue={() => void checkSubscription()}
      />
    );
  }

  const onUpload = async () => {
    if (!file) {
      fileInputRef.current?.click();
      return;
    }

    setSubmitting(true);
    const result = await submitManualPayment({
      planKey,
      paymentMethod: defaultMethod,
      amount: suggestedAmount(planKey, currency),
      currency,
      receiptFile: file,
      notes: "Quick receipt upload from founder-access",
      invoiceDraftId,
    });
    setSubmitting(false);

    if (!result.ok) {
      toast({ title: "Upload failed", description: result.error, variant: "destructive" });
      return;
    }

    window.dispatchEvent(new CustomEvent("manual-payment-submitted"));
    await checkSubscription();

    if (result.invoiceNumber && result.invoiceHtml) {
      setInvoiceResult({
        invoiceNumber: result.invoiceNumber,
        invoiceHtml: result.invoiceHtml,
        plan: result.plan,
      });
      toast({
        title: "Plan activated",
        description: `Invoice ${result.invoiceNumber} sent to your email and our WhatsApp.`,
      });
      return;
    }

    toast({
      title: "Receipt uploaded",
      description: result.error ?? "Processing your invoice — refresh in a moment.",
    });
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      {file && (
        <p className="text-xs text-muted-foreground flex items-center gap-1 px-1">
          <Upload className="h-3 w-3" />
          {file.name}
        </p>
      )}
      <Button className="w-full gap-2" onClick={() => void onUpload()} disabled={submitting}>
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        Upload Receipt Screenshot
      </Button>
    </div>
  );
}
