import { CheckCircle2, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadInvoiceHtml } from "@/lib/payments/paymentInvoice";
import { Link } from "react-router-dom";

interface Props {
  invoiceNumber: string;
  invoiceHtml: string;
  plan?: string;
  onContinue?: () => void;
}

export function PaymentInvoiceSuccess({ invoiceNumber, invoiceHtml, plan, onContinue }: Props) {
  return (
    <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-5 space-y-4 text-center">
      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
      <div>
        <p className="font-semibold text-lg">Invoice generated & plan activated</p>
        <p className="text-sm text-muted-foreground mt-1">
          {plan ? (
            <>
              Your <span className="font-medium text-foreground capitalize">{plan}</span> plan is live.
            </>
          ) : (
            "Your plan is now active."
          )}{" "}
          Invoice <span className="font-mono">{invoiceNumber}</span> was emailed to you and sent to our team on WhatsApp.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => downloadInvoiceHtml(invoiceHtml, invoiceNumber)}
        >
          <Download className="h-4 w-4" />
          Download invoice
        </Button>
        <Button className="gap-2" asChild onClick={onContinue}>
          <Link to="/chatbot">
            <Sparkles className="h-4 w-4" />
            Open chat
          </Link>
        </Button>
      </div>
    </div>
  );
}
