import { useEffect, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import {
  submitManualPayment,
  suggestedAmount,
  type ManualPaymentMethod,
} from "@/lib/payments/submitManualPayment";
import { Link } from "react-router-dom";
import { PaymentInvoiceSuccess } from "@/components/payments/PaymentInvoiceSuccess";

interface Props {
  planKey: string;
  defaultMethod?: ManualPaymentMethod;
  currency?: "USD" | "PKR";
  invoiceDraftId?: string | null;
}

export function PaymentReceiptForm({
  planKey,
  defaultMethod = "jazzcash",
  currency = "PKR",
  invoiceDraftId,
}: Props) {
  const { user, checkSubscription } = useAuth();
  const { toast } = useToast();
  const [method, setMethod] = useState<ManualPaymentMethod>(defaultMethod);
  const [amount, setAmount] = useState(String(suggestedAmount(planKey, currency)));
  const [txRef, setTxRef] = useState("");
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [invoiceResult, setInvoiceResult] = useState<{
    invoiceNumber: string;
    invoiceHtml: string;
    plan?: string;
  } | null>(null);

  useEffect(() => {
    setAmount(String(suggestedAmount(planKey, currency)));
  }, [planKey, currency]);

  if (!user) {
    return (
      <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground space-y-3">
        <p>Sign in to submit payment proof — we&apos;ll link it to your account automatically.</p>
        <Button asChild size="sm">
          <Link to={`/auth?redirect=${encodeURIComponent(`/founder-access?plan=${planKey}`)}`}>Sign in</Link>
        </Button>
      </div>
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

  const onSubmit = async () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const result = await submitManualPayment({
      planKey,
      paymentMethod: method,
      amount: parsed,
      currency,
      transactionReference: txRef || undefined,
      phone: phone || undefined,
      receiptFile: file,
      notes: notes || undefined,
      invoiceDraftId,
    });
    setSubmitting(false);
    if (!result.ok) {
      toast({ title: "Could not submit", description: result.error, variant: "destructive" });
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
        description: `Invoice ${result.invoiceNumber} emailed and sent to WhatsApp.`,
      });
      return;
    }

    toast({ title: "Submitted!", description: result.error ?? "Processing your invoice…" });
  };

  return (
    <div className="space-y-4 rounded-xl border border-primary/20 bg-card/60 p-4">
      <div>
        <h4 className="font-semibold text-sm">Detailed submission (optional)</h4>
        <p className="text-xs text-muted-foreground mt-1">
          Add transaction ID, phone, or notes if your bank or wallet requires extra details for verification.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Method</Label>
          <Select value={method} onValueChange={(v) => setMethod(v as ManualPaymentMethod)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jazzcash">JazzCash</SelectItem>
              <SelectItem value="easypaisa">Easypaisa</SelectItem>
              <SelectItem value="bank_transfer">Bank transfer</SelectItem>
              <SelectItem value="usdt">USDT (TRC20)</SelectItem>
              <SelectItem value="wise">Wise / SWIFT</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Amount ({currency})</Label>
          <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Transaction ID / reference</Label>
        <Input
          placeholder="e.g. TID123456789"
          value={txRef}
          onChange={(e) => setTxRef(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Your phone (optional)</Label>
        <Input placeholder="03XX XXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Receipt screenshot</Label>
        <Input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Upload className="h-3 w-3" /> {file.name}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Notes (optional)</Label>
        <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <Button className="w-full" onClick={() => void onSubmit()} disabled={submitting}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Submit receipt screenshot
      </Button>
    </div>
  );
}
