import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { CinematicOnboarding } from "@/components/chat/CinematicOnboarding";
import { useIsMobile } from "@/hooks/use-mobile";

export const WELCOME_SEEN_KEY = "shadowtalk_welcome_seen";
export const USER_ROLE_KEY = "shadowtalk_user_role";

const OnboardingFlow = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (location.pathname !== "/chatbot") return;
    try {
      if (!localStorage.getItem(WELCOME_SEEN_KEY)) {
        setShowOnboarding(true);
      }
    } catch {
      // private mode — skip
    }
  }, [isMobile, location.pathname]);

  const handleComplete = (profile: string) => {
    setShowOnboarding(false);
    try {
      localStorage.setItem(WELCOME_SEEN_KEY, "true");
      localStorage.setItem(USER_ROLE_KEY, profile);
    } catch {
      // ignore
    }
  };

  if (!showOnboarding) return null;

  return <CinematicOnboarding onComplete={handleComplete} />;
};

export default OnboardingFlow;
