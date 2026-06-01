import { useCallback, useEffect, useState } from "react";
import { Bot, Bell, Download, Menu, Smartphone, X } from "lucide-react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { useTranslation } from "@/hooks/useTranslation";
import { useLandingMotion } from "@/hooks/use-landing-motion";
import { FeedbackForm } from "@/components/FeedbackForm";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { toast } from "sonner";

/**
 * Landing page header — logo plus essential actions only.
 */
const LandingNavigation = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { variants, profile, hoverLift } = useLandingMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<{
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: string }>;
  } | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 8));

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone;
    if (standalone) setIsInstalled(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as NonNullable<typeof deferredPrompt>);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const goPricing = () => {
    const el = document.getElementById("pricing");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    else navigate("/pricing");
    setMenuOpen(false);
  };

  const handleInstallClick = useCallback(async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") setIsInstalled(true);
        setDeferredPrompt(null);
      } catch {
        setShowIOSGuide(true);
      }
    } else {
      setShowIOSGuide(true);
    }
    setMenuOpen(false);
  }, [deferredPrompt]);

  const handleNotificationClick = () => {
    if (!user) {
      toast.info("Sign in to view notifications");
      navigate("/auth");
    }
  };

  const actionButtonClass =
    "h-9 text-muted-foreground hover:text-foreground border-border/50 hover:border-primary/30 hover:bg-muted/30";

  const desktopActions = (
    <>
      <motion.div whileHover={profile.reduced ? undefined : hoverLift}>
        <Button variant="ghost" size="sm" onClick={goPricing} className={actionButtonClass}>
          {t("nav.pricing")}
        </Button>
      </motion.div>

      {!isInstalled && (
        <motion.div whileHover={profile.reduced ? undefined : hoverLift}>
          <Button variant="outline" size="sm" onClick={handleInstallClick} className={`gap-1.5 ${actionButtonClass}`}>
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Install</span>
          </Button>
        </motion.div>
      )}

      {user ? (
        <NotificationBell />
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 relative"
          onClick={handleNotificationClick}
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>
      )}

      <FeedbackForm />

      <motion.div whileHover={profile.reduced ? undefined : hoverLift}>
        <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className={actionButtonClass}>
          {t("nav.login")}
        </Button>
      </motion.div>
    </>
  );

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <>
      <motion.header
        className={`landing-nav fixed inset-x-0 top-0 z-50 ${scrolled ? "landing-nav--scrolled" : ""}`}
        initial="hidden"
        animate="visible"
        variants={variants.slideDown}
      >
        <div className="landing-nav-bar mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 sm:h-16">
          <motion.button
            type="button"
            onClick={() => navigate("/")}
            className="flex shrink-0 items-center gap-2"
            whileHover={profile.reduced ? undefined : { opacity: 0.9 }}
            whileTap={profile.reduced ? undefined : { scale: 0.98 }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </span>
            <span className="text-sm font-semibold tracking-tight gradient-text sm:text-base">ShadowTalk</span>
          </motion.button>

          <div className="hidden md:flex items-center gap-1.5 shrink-0">{desktopActions}</div>

          <motion.button
            type="button"
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted/50"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            whileTap={{ scale: 0.94 }}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </motion.button>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              className="fixed inset-x-0 top-14 z-50 border-b border-border/50 bg-background/95 backdrop-blur-xl md:hidden p-4 space-y-2"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <Button variant="ghost" className="w-full justify-start" onClick={goPricing}>
                {t("nav.pricing")}
              </Button>
              {!isInstalled && (
                <Button variant="outline" className="w-full justify-start gap-2" onClick={handleInstallClick}>
                  <Download className="h-4 w-4" />
                  Install app
                </Button>
              )}
              {user ? (
                <div className="flex justify-start px-1">
                  <NotificationBell />
                </div>
              ) : (
                <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleNotificationClick}>
                  <Bell className="h-4 w-4" />
                  Notifications
                </Button>
              )}
              <div className="px-1">
                <FeedbackForm />
              </div>
              <Button variant="outline" className="w-full" onClick={() => { navigate("/auth"); setMenuOpen(false); }}>
                {t("nav.login")}
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showIOSGuide && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowIOSGuide(false)}
          >
            <motion.div
              className="bg-background border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-3">
                <Smartphone className="h-6 w-6 text-primary" />
                <h3 className="font-semibold text-lg">Install ShadowTalk</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {isIOS
                  ? "In Safari: Share → Add to Home Screen."
                  : "Use your browser menu to install this app."}
              </p>
              <Button className="w-full" onClick={() => setShowIOSGuide(false)}>
                Got it
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LandingNavigation;
