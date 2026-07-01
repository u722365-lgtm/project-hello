import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isLemonCheckoutAvailable, startLemonCheckout } from "@/lib/payments/lemonCheckout";
import { useToast } from "@/hooks/use-toast";

interface Props {
  planKey: string;
}

export function InternationalCardButton({ planKey }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const available = isLemonCheckoutAvailable(planKey);

  if (!available) return null;

  const onPay = async () => {
    setLoading(true);
    const result = await startLemonCheckout(planKey);
    setLoading(false);
    if (!result.ok) {
      toast({ title: "Card checkout unavailable", description: result.error, variant: "destructive" });
      return;
    }
    if (result.url) window.location.href = result.url;
  };

  return (
    <Button variant="default" className="w-full gap-2" onClick={() => void onPay()} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
      Pay with card (US / international)
    </Button>
  );
}
