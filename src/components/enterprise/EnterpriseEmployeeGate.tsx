import { useNavigate } from "react-router-dom";
import { Building2, Mail, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { SETTINGS_SPRING } from "@/lib/settingsMotion";
import type { EnterpriseTenant } from "@/lib/enterpriseTenants";

interface EnterpriseEmployeeGateProps {
  tenant: EnterpriseTenant | null;
  orgName: string;
}

export function EnterpriseEmployeeGate({ tenant, orgName }: EnterpriseEmployeeGateProps) {
  const navigate = useNavigate();
  const title = tenant?.welcomeTitle ?? `${orgName} AI Workspace`;

  return (
    <div className="flex-1 flex items-center justify-center p-6 min-h-0">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SETTINGS_SPRING}
        className="w-full max-w-md rounded-2xl border border-primary/25 bg-card/80 backdrop-blur-xl p-6 sm:p-8 shadow-elevated text-center space-y-5"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
          <Building2 className="h-7 w-7 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {tenant?.signInHint ??
              "Sign in with your company email to access unlimited AI chat, research, and documents."}
          </p>
        </div>
        <ul className="text-left text-xs text-muted-foreground space-y-2.5 py-1">
          <li className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            Unlimited messages — no daily caps for employees
          </li>
          <li className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            Your chats are tied to your work account and saved across devices
          </li>
          <li className="flex items-start gap-2">
            <Mail className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            Magic link sign-in — check your inbox after tapping below
          </li>
        </ul>
        <Button
          className="w-full rounded-full h-11 gap-2"
          onClick={() => navigate("/auth?mode=signin&enterprise=1")}
        >
          <Mail className="h-4 w-4" />
          Sign in with work email
        </Button>
      </motion.div>
    </div>
  );
}
