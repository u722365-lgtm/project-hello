import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ArrowRight, Sparkles, Crown } from "lucide-react";
import {
  getPlanPsychology,
  getRiskReversalBullets,
  getSocialProofLine,
  getValueAnchorLine,
  RECOMMENDED_MONTHLY_PLAN,
  type MonthlyPlanId,
} from "@/lib/conversionPsychology";
import { usePlatformMetrics } from "@/hooks/usePlatformMetrics";

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
  requiredPlan?: MonthlyPlanId;
  limitReached?: boolean;
}

function UpgradePromptBody({
  onOpenChange,
  feature = "this feature",
  limitReached = false,
}: Omit<UpgradePromptProps, "open" | "requiredPlan">) {
  const navigate = useNavigate();
  const { totalUsers, isLoading } = usePlatformMetrics();
  const premium = getPlanPsychology(RECOMMENDED_MONTHLY_PLAN);

  const goPremium = () => {
    onOpenChange(false);
    navigate(`/founder-access?plan=${RECOMMENDED_MONTHLY_PLAN}`);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
            <Crown className="w-5 h-5 text-primary" />
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20">Best value</Badge>
        </div>
        <DialogTitle className="text-xl pr-6">
          {limitReached ? "Keep the conversation going" : `Unlock ${feature}`}
        </DialogTitle>
        <DialogDescription>
          {limitReached
            ? "Free tier resets at midnight. Premium removes daily caps and unlocks Mission Control workflows."
            : `We recommend Premium — unlimited messages plus the agentic tools ShadowTalk is built for.`}
        </DialogDescription>
        {!isLoading && (
          <p className="text-xs text-muted-foreground pt-1">{getSocialProofLine(totalUsers)}</p>
        )}
      </DialogHeader>

      <Card className="ring-2 ring-primary/40 border-primary/30">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-lg font-bold flex items-center gap-2">
                {premium.name}
                <Badge className="text-[10px]">Recommended</Badge>
              </p>
              <p className="text-xs text-muted-foreground mt-1">{getValueAnchorLine("premium")}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-3xl font-bold">${premium.price}</span>
              <span className="text-sm text-muted-foreground">/mo</span>
              <p className="text-[11px] text-primary font-medium">{premium.daily}/day</p>
            </div>
          </div>
          <ul className="space-y-2 mb-4">
            {premium.topFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Button className="w-full gap-2 btn-glow h-11" onClick={goPremium}>
            <Sparkles className="h-4 w-4" />
            Get Premium — ${premium.price}/mo
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <ul className="grid grid-cols-2 gap-2 px-1">
        {getRiskReversalBullets().map((b) => (
          <li key={b} className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Check className="h-3 w-3 text-success shrink-0" />
            {b}
          </li>
        ))}
      </ul>

      <p className="text-center text-xs text-muted-foreground">
        Budget option?{" "}
        <button
          type="button"
          className="text-primary hover:underline font-medium"
          onClick={() => {
            onOpenChange(false);
            navigate("/founder-access?plan=pro");
          }}
        >
          Pro $5/mo
        </button>
        {" · "}
        Need enterprise tools?{" "}
        <button
          type="button"
          className="text-primary hover:underline font-medium"
          onClick={() => {
            onOpenChange(false);
            navigate("/founder-access?plan=elite");
          }}
        >
          Elite $20/mo
        </button>
      </p>
    </DialogContent>
  );
}

export function UpgradePrompt({ open, onOpenChange, ...props }: UpgradePromptProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? <UpgradePromptBody onOpenChange={onOpenChange} {...props} /> : null}
    </Dialog>
  );
}
