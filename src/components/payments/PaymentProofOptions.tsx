import { MessageCircle, ArrowUpRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickReceiptUpload } from "@/components/payments/QuickReceiptUpload";
import {
  buildCheckoutWhatsAppMessage,
  buildCheckoutWhatsAppUrl,
} from "@/lib/payments/whatsappCheckout";
import type { ManualPaymentMethod } from "@/lib/payments/submitManualPayment";
import type { PaymentMethodId } from "@/lib/payments/paymentCredentials";

interface Props {
  planKey: string;
  currency: "USD" | "PKR";
  activePaymentMethod: PaymentMethodId;
  userEmail?: string | null;
}

function toManualMethod(method: PaymentMethodId): ManualPaymentMethod {
  switch (method) {
    case "mobile":
      return "jazzcash";
    case "bank":
      return "bank_transfer";
    case "crypto":
      return "usdt";
    case "wire":
      return "wise";
    default:
      return "bank_transfer";
  }
}

export function PaymentProofOptions({ planKey, currency, activePaymentMethod, userEmail }: Props) {
  const whatsappLink = buildCheckoutWhatsAppUrl({
    planKey,
    currency,
    userEmail,
  });
  const internationalWhatsappLink = buildCheckoutWhatsAppUrl({
    planKey,
    userEmail,
    international: true,
  });
  const previewMessage = buildCheckoutWhatsAppMessage({
    planKey,
    currency,
    userEmail,
  });

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.25)] p-4 space-y-4">
      <div>
        <h4 className="font-semibold text-sm">Submit your proof</h4>
        <p className="text-xs text-muted-foreground mt-1">
          Upload here for fastest activation, or open WhatsApp with a pre-filled message — no typing required.
        </p>
      </div>

      <QuickReceiptUpload
        planKey={planKey}
        currency={currency}
        defaultMethod={toManualMethod(activePaymentMethod)}
      />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[hsl(var(--muted)/0.25)] px-2 text-muted-foreground">Or WhatsApp</span>
        </div>
      </div>

      <div className="rounded-lg border border-border/50 bg-background/70 p-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
          Pre-filled message preview
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed italic">
          &ldquo;{previewMessage}&rdquo;
        </p>
      </div>

      <Button size="lg" variant="outline" className="w-full gap-2" asChild>
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="w-5 h-5 text-[#25D366]" />
          Open WhatsApp with message
          <ArrowUpRight className="w-4 h-4" />
        </a>
      </Button>

      <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground" asChild>
        <a href={internationalWhatsappLink} target="_blank" rel="noopener noreferrer">
          <Globe className="w-4 h-4" />
          International support (Wise / crypto)
        </a>
      </Button>
    </div>
  );
}
