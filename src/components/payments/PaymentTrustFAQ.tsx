import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PAYMENT_TRUST_FAQ } from "@/lib/payments/paymentTrustCopy";

export function PaymentTrustFAQ() {
  return (
    <section className="max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold tracking-tight">Common questions before you pay</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Honest answers — manual checkout only works when you know what happens next.
        </p>
      </div>
      <Accordion type="single" collapsible className="space-y-2">
        {PAYMENT_TRUST_FAQ.map((item, index) => (
          <AccordionItem
            key={item.question}
            value={`payment-faq-${index}`}
            className="rounded-xl border border-border/50 bg-card/30 px-4"
          >
            <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-4">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
