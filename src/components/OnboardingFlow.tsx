import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { WelcomeDialog } from "@/components/chat/WelcomeDialog";

export const WELCOME_SEEN_KEY = "shadowtalk_welcome_seen";

const OnboardingFlow = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (location.pathname === "/auth") return;
    try {
      if (!localStorage.getItem(WELCOME_SEEN_KEY)) {
        setOpen(true);
      }
    } catch {
      // private mode — skip
    }
  }, [location.pathname]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      try {
        localStorage.setItem(WELCOME_SEEN_KEY, "true");
      } catch {
        // ignore
      }
    }
  };

  return <WelcomeDialog open={open} onOpenChange={handleOpenChange} />;
};

export default OnboardingFlow;
