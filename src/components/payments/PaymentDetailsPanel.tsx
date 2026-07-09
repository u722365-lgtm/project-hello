import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Landmark, Smartphone, Wallet, Globe, FileText, Shield, Lock, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import {
  PAYMENT_CREDENTIALS,
  buildPaymentReference,
  type PaymentMethodId,
} from "@/lib/payments/paymentCredentials";
import { PKR_MONTHLY, type PaidPlanId } from "@/lib/payments/planPricing";

const invoiceButtonLabels: Record<PaymentMethodId, string> = {
  bank: "Generate Bank Transfer Invoice",
  mobile: "Generate Mobile Wallet Invoice",
  crypto: "Generate Crypto Transfer Invoice",
  wire: "Generate Wire Transfer Invoice",
};

const invoiceMethodLabels: Record<PaymentMethodId, string> = {
  bank: "bank transfer",
  mobile: "mobile wallet",
  crypto: "crypto",
  wire: "wire transfer",
};

const paymentMethods = [
  { id: "bank" as const, name: "Bank Transfer", icon: Landmark, badge: "Local", desc: "Meezan Bank" },
  { id: "mobile" as const, name: "Mobile Wallet", icon: Smartphone, badge: "Instant", desc: "EasyPaisa / JazzCash" },
  { id: "crypto" as const, name: "Crypto", icon: Wallet, badge: "Global", desc: "USDT (TRC20)" },
  { id: "wire" as const, name: "Wire Transfer", icon: Globe, badge: "International", desc: "SWIFT / Wise" },
];

interface Props {
  planKey: string;
  selectedProductName: string;
  activePaymentMethod: PaymentMethodId;
  onPaymentMethodChange: (id: PaymentMethodId) => void;
}

export function PaymentDetailsPanel({
  planKey,
  selectedProductName,
  activePaymentMethod,
  onPaymentMethodChange,
}: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [revealedMethods, setRevealedMethods] = useState<Set<PaymentMethodId>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const paymentReference = useMemo(
    () => buildPaymentReference(planKey, user?.id),
    [planKey, user?.id],
  );

  const isRevealed = revealedMethods.has(activePaymentMethod);

  useEffect(() => {
    setRevealedMethods(new Set());
  }, [planKey, activePaymentMethod]);

  const revealDetails = () => {
    if (!user) {
      toast({
        title: "Sign in to reveal payment details",
        description: "We link your transfer to your account for faster activation.",
        variant: "destructive",
      });
      return;
    }
    setRevealedMethods((prev) => new Set(prev).add(activePaymentMethod));
    toast({
      title: "Payment invoice generated",
      description: "Use the reference below so we can match your transfer quickly.",
    });
  };

  const copyToClipboard = (text: string, field: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({ title: "Copied", description: `${field} copied to clipboard` });
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isActive = activePaymentMethod === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onPaymentMethodChange(method.id)}
              className={`rounded-xl p-3 text-left border-2 transition-all ${
                isActive
                  ? "border-primary bg-[hsl(var(--primary)/0.08)]"
                  : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.3)]"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-sm font-medium">{method.name}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{method.desc}</p>
              <Badge variant="outline" className="mt-2 text-[9px]">{method.badge}</Badge>
            </button>
          );
        })}
      </div>

      {!isRevealed ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2">
              <Shield className="h-5 w-5 text-amber-500" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">Payment details are protected</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                For security, account numbers, IBANs, and wallet addresses stay hidden until you
                generate an invoice. This prevents scrapers from harvesting your payment details.
                Selected plan:{" "}
                <span className="font-medium text-foreground">{selectedProductName}</span> via{" "}
                <span className="font-medium text-foreground">
                  {invoiceMethodLabels[activePaymentMethod]}
                </span>
                .
              </p>
            </div>
          </div>
          <Button className="w-full gap-2" onClick={revealDetails}>
            <FileText className="h-4 w-4" />
            {invoiceButtonLabels[activePaymentMethod]}
          </Button>
          {!user && (
            <p className="text-xs text-center text-muted-foreground">
              Sign in first so we can tie your payment to your account.
            </p>
          )}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activePaymentMethod}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/5 px-3 py-2 text-xs text-green-600">
              <Lock className="h-3.5 w-3.5" />
              Invoice active — reference: <span className="font-mono font-semibold">{paymentReference}</span>
            </div>

            {activePaymentMethod === "bank" && (
              <>
                <PaymentDetailRow label="Bank" value={PAYMENT_CREDENTIALS.bank.bankName} onCopy={() => copyToClipboard(PAYMENT_CREDENTIALS.bank.bankName, "Bank")} copied={copiedField === "Bank"} />
                <PaymentDetailRow label="Account title" value={PAYMENT_CREDENTIALS.bank.accountName} onCopy={() => copyToClipboard(PAYMENT_CREDENTIALS.bank.accountName, "Account title")} copied={copiedField === "Account title"} />
                <PaymentDetailRow label="Account number" value={PAYMENT_CREDENTIALS.bank.accountNumber} onCopy={() => copyToClipboard(PAYMENT_CREDENTIALS.bank.accountNumber, "Account number")} copied={copiedField === "Account number"} mono />
                <PaymentDetailRow label="IBAN" value={PAYMENT_CREDENTIALS.bank.iban} onCopy={() => copyToClipboard(PAYMENT_CREDENTIALS.bank.iban, "IBAN")} copied={copiedField === "IBAN"} mono />
                <PaymentDetailRow label="Reference" value={paymentReference} onCopy={() => copyToClipboard(paymentReference, "Reference")} copied={copiedField === "Reference"} mono />
              </>
            )}

            {activePaymentMethod === "mobile" && (
              <>
                <PaymentDetailRow label="JazzCash" value={PAYMENT_CREDENTIALS.mobile.jazzcash} onCopy={() => copyToClipboard(PAYMENT_CREDENTIALS.mobile.jazzcash, "JazzCash")} copied={copiedField === "JazzCash"} mono />
                <PaymentDetailRow label="Easypaisa" value={PAYMENT_CREDENTIALS.mobile.easypaisa} onCopy={() => copyToClipboard(PAYMENT_CREDENTIALS.mobile.easypaisa, "Easypaisa")} copied={copiedField === "Easypaisa"} mono />
                <PaymentDetailRow label="Account title" value={PAYMENT_CREDENTIALS.mobile.accountName} onCopy={() => copyToClipboard(PAYMENT_CREDENTIALS.mobile.accountName, "Wallet name")} copied={copiedField === "Wallet name"} />
                {(["pro", "premium", "elite"] as PaidPlanId[]).includes(planKey as PaidPlanId) && (
                  <p className="text-xs text-muted-foreground pt-1">
                    Send Rs {PKR_MONTHLY[planKey as PaidPlanId].toLocaleString()} for {selectedProductName}
                  </p>
                )}
              </>
            )}

            {activePaymentMethod === "crypto" && (
              <>
                <PaymentDetailRow label="USDT address" value={PAYMENT_CREDENTIALS.crypto.usdt} onCopy={() => copyToClipboard(PAYMENT_CREDENTIALS.crypto.usdt, "USDT")} copied={copiedField === "USDT"} mono />
                <PaymentDetailRow label="Network" value={PAYMENT_CREDENTIALS.crypto.network} onCopy={() => copyToClipboard(PAYMENT_CREDENTIALS.crypto.network, "Network")} copied={copiedField === "Network"} />
              </>
            )}

            {activePaymentMethod === "wire" && (
              <>
                <PaymentDetailRow label="Bank" value={PAYMENT_CREDENTIALS.wire.bankName} onCopy={() => copyToClipboard(PAYMENT_CREDENTIALS.wire.bankName, "Intl bank")} copied={copiedField === "Intl bank"} />
                <PaymentDetailRow label="SWIFT" value={PAYMENT_CREDENTIALS.wire.swift} onCopy={() => copyToClipboard(PAYMENT_CREDENTIALS.wire.swift, "SWIFT")} copied={copiedField === "SWIFT"} mono />
                <PaymentDetailRow label="IBAN" value={PAYMENT_CREDENTIALS.wire.iban} onCopy={() => copyToClipboard(PAYMENT_CREDENTIALS.wire.iban, "Intl IBAN")} copied={copiedField === "Intl IBAN"} mono />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function PaymentDetailRow({
  label,
  value,
  onCopy,
  copied,
  mono = false,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] group hover:border-[hsl(var(--primary)/0.3)] transition-colors">
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
        <p className={`font-medium truncate mt-0.5 ${mono ? "font-mono text-sm" : ""}`}>{value}</p>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onCopy}>
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}
