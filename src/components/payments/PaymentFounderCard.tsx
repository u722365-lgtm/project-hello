import { Link } from "react-router-dom";
import { BadgeCheck, ExternalLink, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FOUNDER_CANONICAL } from "@/lib/founderIdentity";
import { buildCheckoutWhatsAppUrl } from "@/lib/payments/whatsappCheckout";

interface Props {
  planKey?: string;
}

export function PaymentFounderCard({ planKey = "pro" }: Props) {
  const whatsappLink = buildCheckoutWhatsAppUrl({ planKey, currency: "USD" });

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4">
      <div className="flex gap-3">
        <img
          src="/pwa-512x512.png"
          alt={FOUNDER_CANONICAL.fullName}
          className="h-14 w-14 rounded-xl border border-border/50 object-cover shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm">{FOUNDER_CANONICAL.fullName}</p>
            <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {FOUNDER_CANONICAL.jobTitle} · {FOUNDER_CANONICAL.location.city},{" "}
            {FOUNDER_CANONICAL.location.country}
          </p>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            You are paying the founder directly — not a faceless checkout page. Every receipt is
            reviewed by Zain before your plan goes live.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" asChild>
          <Link to="/zain-ahmed-fahad-patel">
            Verify founder
            <ExternalLink className="h-3 w-3" />
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" asChild>
          <Link to="/security?tab=trust">Trust center</Link>
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs" asChild>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-3 w-3 text-[#25D366]" />
            Ask before you pay
          </a>
        </Button>
      </div>
    </div>
  );
}
