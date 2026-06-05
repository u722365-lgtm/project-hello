import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { EnterpriseTenant } from "@/lib/enterpriseTenants";

interface EnterpriseHelpFabProps {
  tenant: EnterpriseTenant;
}

export function EnterpriseHelpFab({ tenant }: EnterpriseHelpFabProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="fixed right-4 z-40 h-11 w-11 rounded-full shadow-lg border-primary/30 bg-background/90 backdrop-blur-md safe-bottom"
          style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
          aria-label="Employee help"
        >
          <HelpCircle className="h-5 w-5 text-primary" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[75dvh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
        <SheetHeader>
          <SheetTitle>{tenant.name} — Quick help</SheetTitle>
        </SheetHeader>
        <ul className="mt-4 space-y-4">
          {tenant.helpTips.map((tip) => (
            <li key={tip.title} className="rounded-xl border border-border/50 bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">{tip.title}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tip.body}</p>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
