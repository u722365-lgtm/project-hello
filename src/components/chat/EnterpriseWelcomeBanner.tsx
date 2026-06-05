import { useState } from "react";
import { Building2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveEnterpriseTenant } from "@/lib/enterpriseTenants";

interface EnterpriseWelcomeBannerProps {
  email: string | null | undefined;
  displayName?: string;
}

export function EnterpriseWelcomeBanner({ email, displayName }: EnterpriseWelcomeBannerProps) {
  const tenant = resolveEnterpriseTenant(email);
  const [dismissed, setDismissed] = useState(() => {
    if (!tenant) return true;
    try {
      return sessionStorage.getItem(`enterprise-welcome-${tenant.id}`) === "1";
    } catch {
      return false;
    }
  });

  if (!tenant || dismissed) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(`enterprise-welcome-${tenant.id}`, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <div className="mx-3 md:mx-6 mb-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 flex items-start gap-3">
      <Building2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">
          Welcome{displayName ? `, ${displayName.split(" ")[0]}` : ""} — {tenant.welcomeTitle}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{tenant.welcomeSubtitle}</p>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={dismiss} aria-label="Dismiss">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
