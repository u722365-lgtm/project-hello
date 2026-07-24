import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { WelcomeDialog } from "@/components/chat/WelcomeDialog";
import { useIsMobile } from "@/hooks/use-mobile";

export const WELCOME_SEEN_KEY = "shadowtalk_welcome_seen";

const OnboardingFlow = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (location.pathname !== "/chatbot") return;
    if (isMobile) return;
    try {
      if (!localStorage.getItem(WELCOME_SEEN_KEY)) {
        setOpen(true);
      }
    } catch {
      // private mode — skip
    }
  }, [isMobile, location.pathname]);

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
