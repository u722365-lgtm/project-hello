import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EnterpriseTenant } from "@/lib/enterpriseTenants";
import { SETTINGS_SPRING } from "@/lib/settingsMotion";

const STORAGE_KEY = "shadowtalk_enterprise_onboarding_done";

interface EnterpriseOnboardingProps {
  tenant: EnterpriseTenant;
}

export function EnterpriseOnboarding({ tenant }: EnterpriseOnboardingProps) {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(`${STORAGE_KEY}_${tenant.id}`) !== "1";
    } catch {
      return true;
    }
  });
  const [step, setStep] = useState(0);

  if (!open || tenant.onboardingSteps.length === 0) return null;

  const current = tenant.onboardingSteps[step];
  const isLast = step >= tenant.onboardingSteps.length - 1;

  const finish = () => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_${tenant.id}`, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 bg-background/70 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16 }}
          transition={SETTINGS_SPRING}
          className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-elevated p-5 sm:p-6 relative"
        >
          <button
            type="button"
            onClick={finish}
            className="absolute right-3 top-3 p-2 rounded-lg text-muted-foreground hover:text-foreground"
            aria-label="Skip tour"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="text-xs font-medium text-primary mb-1">
            {tenant.name} · Step {step + 1} of {tenant.onboardingSteps.length}
          </p>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-lg font-semibold pr-8">{current.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{current.body}</p>
            </motion.div>
          </AnimatePresence>
          <div className="flex items-center justify-between mt-6 gap-3">
            <div className="flex gap-1.5">
              {tenant.onboardingSteps.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? "w-6 bg-primary" : "w-1.5 bg-muted"
                  }`}
                />
              ))}
            </div>
            <Button
              className="rounded-full gap-1"
              onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
            >
              {isLast ? "Get started" : "Next"}
              {!isLast && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
