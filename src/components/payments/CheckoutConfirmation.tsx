import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

type Step = {
  id: string;
  label: string;
  description: string;
  state: 'pending' | 'active' | 'complete';
};

const STEP_ICONS: Record<string, typeof Circle> = {
  pending: Circle,
  active: Loader2,
  complete: CheckCircle2,
};

export function CheckoutConfirmation({
  planName,
  invoiceNumber,
  receiptSubmitted,
  paymentStatus,
}: {
  planName: string;
  invoiceNumber: string | null;
  receiptSubmitted: boolean;
  paymentStatus?: 'pending' | 'verified' | 'rejected';
}) {
  const steps: Step[] = [
    {
      id: 'plan',
      label: 'Plan selected',
      description: planName || 'Choose a plan',
      state: planName ? 'complete' : 'pending',
    },
    {
      id: 'invoice',
      label: 'Invoice generated',
      description: invoiceNumber ? `Invoice ${invoiceNumber}` : 'Generate invoice to see payment details',
      state: invoiceNumber ? 'complete' : planName ? 'active' : 'pending',
    },
    {
      id: 'receipt',
      label: 'Receipt submitted',
      description: receiptSubmitted ? 'Proof uploaded' : 'Upload proof after payment',
      state: receiptSubmitted ? 'complete' : invoiceNumber ? 'active' : 'pending',
    },
    {
      id: 'verified',
      label: 'Verified',
      description:
        paymentStatus === 'verified'
          ? 'Payment verified — plan activated'
          : paymentStatus === 'pending'
            ? 'Awaiting verification'
            : paymentStatus === 'rejected'
              ? 'Payment rejected'
              : 'We verify within 24h',
      state: paymentStatus === 'verified' ? 'complete' : receiptSubmitted ? 'active' : 'pending',
    },
  ];

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.6)] p-4 sm:p-5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Checkout status
      </p>
      <ol className="space-y-3">
        {steps.map((step) => {
          const Icon = STEP_ICONS[step.state];
          return (
            <motion.li
              key={step.id}
              className="flex items-start gap-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mt-0.5">
                <Icon
                  className={`h-4 w-4 ${
                    step.state === 'complete'
                      ? 'text-green-500'
                      : step.state === 'active'
                        ? 'text-primary animate-spin'
                        : 'text-muted-foreground'
                  }`}
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{step.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
