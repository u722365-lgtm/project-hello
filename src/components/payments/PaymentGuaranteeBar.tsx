import { Clock, RefreshCw, ShieldCheck, UserCheck } from "lucide-react";
import { PAYMENT_GUARANTEES } from "@/lib/payments/paymentTrustCopy";

const ICONS = {
  activation: Clock,
  refund: RefreshCw,
  founder: UserCheck,
  secure: ShieldCheck,
} as const;

export function PaymentGuaranteeBar() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {PAYMENT_GUARANTEES.map((item) => {
        const Icon = ICONS[item.id];
        return (
          <div
            key={item.id}
            className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.6)] p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg bg-primary/10 p-1.5">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <p className="font-semibold text-sm">{item.title}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
          </div>
        );
      })}
    </div>
  );
}
