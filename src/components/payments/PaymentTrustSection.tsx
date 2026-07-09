import { BadgeCheck, Star, CheckCircle2 } from "lucide-react";
import { ABOUT_USER_FEEDBACK } from "@/lib/aboutUserFeedback";
import {
  PAYMENT_SOCIAL_PROOF,
  PAYMENT_VERIFICATION_FLOW,
} from "@/lib/payments/paymentTrustCopy";

const CHECKOUT_TESTIMONIALS = ABOUT_USER_FEEDBACK.slice(0, 3);

export function PaymentTrustSection() {
  return (
    <section className="mt-12 py-10 border-t border-[hsl(var(--border))] space-y-12">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-muted-foreground mb-4">
          <BadgeCheck className="h-4 w-4 text-primary" />
          {PAYMENT_SOCIAL_PROOF.badge} · {PAYMENT_SOCIAL_PROOF.support}
        </div>
        <h2 className="text-2xl font-bold tracking-tight">How we verify every payment</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl mx-auto">
          {PAYMENT_SOCIAL_PROOF.verifiedLabel}. No mystery wallets — a named founder reviews each transfer.
        </p>
      </div>

      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
        {PAYMENT_VERIFICATION_FLOW.map((step) => (
          <li
            key={step.step}
            className="relative rounded-2xl border border-border/50 bg-card/40 p-5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary mb-3">
              {step.step}
            </div>
            <p className="font-semibold text-sm">{step.title}</p>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{step.description}</p>
            {step.step === PAYMENT_VERIFICATION_FLOW.length && (
              <CheckCircle2 className="absolute top-4 right-4 h-4 w-4 text-green-500/80" />
            )}
          </li>
        ))}
      </ol>

      <div>
        <div className="text-center mb-8">
          <h3 className="text-xl font-bold tracking-tight">Real feedback from early users</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl mx-auto">
            These are real messages — not stock testimonials. Manual checkout is normal for early-stage founders in Pakistan.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 max-w-5xl mx-auto">
          {CHECKOUT_TESTIMONIALS.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-border/50 bg-card/40 p-5 flex flex-col"
            >
              {item.rating ? (
                <div className="flex items-center gap-1 mb-3 text-amber-500">
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
              ) : null}
              <p className="text-sm leading-relaxed flex-1">&ldquo;{item.quote}&rdquo;</p>
              <div className="mt-4 pt-4 border-t border-border/40">
                <p className="font-medium text-sm">{item.author}</p>
                <p className="text-xs text-muted-foreground">{item.role}</p>
                {item.highlight && (
                  <p className="text-[10px] text-primary mt-1">{item.highlight}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
