import { useEffect, useState } from "react";
import { CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import {
  fetchUserRecentPayments,
  paymentStatusLabel,
  paymentStatusTone,
  type UserPaymentRow,
} from "@/lib/payments/fetchUserPayments";

const TONE_STYLES = {
  pending: "border-amber-500/30 bg-amber-500/5 text-amber-700",
  success: "border-green-500/30 bg-green-500/5 text-green-700",
  warning: "border-destructive/30 bg-destructive/5 text-destructive",
} as const;

const TONE_ICONS = {
  pending: Clock,
  success: CheckCircle2,
  warning: AlertCircle,
} as const;

export function PaymentStatusPanel() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<UserPaymentRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setPayments([]);
      return;
    }

    const load = () => {
      setLoading(true);
      void fetchUserRecentPayments(3).then((rows) => {
        setPayments(rows);
        setLoading(false);
      });
    };

    load();
    const onSubmitted = () => load();
    window.addEventListener("manual-payment-submitted", onSubmitted);
    return () => window.removeEventListener("manual-payment-submitted", onSubmitted);
  }, [user]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="rounded-xl border border-border/50 p-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your payment status…
      </div>
    );
  }

  if (payments.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-3">
      <div>
        <p className="font-semibold text-sm">Your payment status</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Track verification — no guessing if we received your transfer.
        </p>
      </div>
      <ul className="space-y-2">
        {payments.map((payment) => {
          const tone = paymentStatusTone(payment.status);
          const Icon = TONE_ICONS[tone];
          return (
            <li
              key={payment.id}
              className={`rounded-lg border px-3 py-2.5 flex items-start gap-2.5 ${TONE_STYLES[tone]}`}
            >
              <Icon className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="min-w-0 text-xs">
                <p className="font-medium capitalize">
                  {paymentStatusLabel(payment.status)} · {payment.plan_type}
                </p>
                <p className="opacity-80 mt-0.5">
                  {payment.currency} {payment.amount.toLocaleString()} via {payment.payment_method.replace("_", " ")}
                </p>
                <p className="opacity-70 mt-0.5 font-mono">Ref {payment.id.slice(0, 8)}…</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
