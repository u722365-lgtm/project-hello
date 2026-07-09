import { useRef, useState } from "react";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import {
  submitManualPayment,
  suggestedAmount,
  type ManualPaymentMethod,
} from "@/lib/payments/submitManualPayment";
import { Link } from "react-router-dom";

interface Props {
  planKey: string;
  currency?: "USD" | "PKR";
  defaultMethod?: ManualPaymentMethod;
}

export function QuickReceiptUpload({
  planKey,
  currency = "PKR",
  defaultMethod = "bank_transfer",
}: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  if (!user) {
    return (
      <Button asChild variant="secondary" className="w-full gap-2">
        <Link to={`/auth?redirect=${encodeURIComponent(`/founder-access?plan=${planKey}`)}`}>
          Sign in to upload receipt
        </Link>
      </Button>
    );
  }

  if (submittedId) {
    return (
      <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-center space-y-2">
        <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
        <p className="font-medium text-sm">Receipt received — we&apos;ll verify within 24h</p>
        <p className="text-xs text-muted-foreground">Ref: {submittedId.slice(0, 8)}…</p>
      </div>
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
    });
    setSubmitting(false);

    if (!result.ok) {
      toast({ title: "Upload failed", description: result.error, variant: "destructive" });
      return;
    }

    setSubmittedId(result.id ?? null);
    window.dispatchEvent(new CustomEvent("manual-payment-submitted"));
    toast({
      title: "Receipt uploaded",
      description: "We notified the team — your plan will be activated after verification.",
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
