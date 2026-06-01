import { useCallback, useEffect, useState } from "react";
import { Bot, Bell, Download, Menu, Shield, Smartphone, X } from "lucide-react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { useTranslation } from "@/hooks/useTranslation";
import { useLandingMotion } from "@/hooks/use-landing-motion";
import { FeedbackForm } from "@/components/FeedbackForm";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Unique landing header: floating neural dock with gradient ring + action rail.
 * Same theme tokens; only essential controls.
 */
const LandingNavigation = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { variants, profile, hoverLift, orbTransition } = useLandingMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<{
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: string }>;
  } | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 16));

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

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <>
      <motion.header
        className={cn("landing-nav-dock-wrap fixed inset-x-0 top-0 z-50 px-3 sm:px-4 pt-3", scrolled && "landing-nav-dock-wrap--scrolled")}
        initial="hidden"
        animate="visible"
        variants={variants.slideDown}
      >
        <div className="landing-nav-dock-ring mx-auto max-w-4xl">
          <div className="landing-nav-dock">
            <div className="landing-nav-dock-grid" aria-hidden />

            {/* Brand */}
            <motion.button
              type="button"
              onClick={() => navigate("/chatbot")}
              className="landing-nav-brand flex shrink-0 items-center gap-2.5"
              whileHover={profile.reduced ? undefined : hoverLift}
              whileTap={profile.reduced ? undefined : { scale: 0.98 }}
            >
              <span className="landing-nav-logo-orbit relative flex h-9 w-9 items-center justify-center">
                <span className="landing-nav-logo-ring" aria-hidden />
                <span className="relative z-[1] flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 border border-primary/25">
                  <Bot className="h-4 w-4 text-primary" />
                </span>
                <motion.span
                  className="absolute -top-0.5 -right-0.5 z-[2] h-2 w-2 rounded-full bg-success"
                  animate={profile.reduced ? undefined : { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                  transition={orbTransition(2.5)}
                  aria-hidden
                />
              </span>
              <span className="hidden sm:flex flex-col items-start leading-none">
                <span className="text-sm font-semibold gradient-text tracking-tight">ShadowTalk</span>
                <span className="text-[10px] text-muted-foreground font-medium mt-0.5 tracking-wide">Agentic AI</span>
              </span>
            </motion.button>

            <span className="landing-nav-dock-divider hidden sm:block" aria-hidden />

            {/* Pricing — featured chip */}
            <motion.button
              type="button"
              onClick={goPricing}
              className="landing-nav-pricing hidden sm:inline-flex items-center gap-1.5"
              whileHover={profile.reduced ? undefined : { scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>{t("nav.pricing")}</span>
            </motion.button>

            <div className="flex-1 min-w-2" />

            {/* Desktop action rail */}
            <div className="landing-nav-rail hidden md:flex items-stretch">
              {!isInstalled && (
                <motion.button
                  type="button"
                  onClick={handleInstallClick}
                  className="landing-nav-rail-item gap-1.5"
                  whileHover={profile.reduced ? undefined : { backgroundColor: "hsl(var(--muted) / 0.35)" }}
                >
                  <Download className="h-3.5 w-3.5 text-primary" />
                  <span>Install</span>
                </motion.button>
              )}

              <span className="landing-nav-rail-sep" aria-hidden />

              <div className="landing-nav-rail-item landing-nav-rail-item--icon">
                {user ? (
                  <NotificationBell className="h-9 w-9" iconClassName="h-4 w-4" />
                ) : (
                  <button
                    type="button"
                    onClick={handleNotificationClick}
                    className="flex h-9 w-9 items-center justify-center rounded-md"
                    aria-label="Notifications"
                  >
                    <Bell className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </button>
                )}
              </div>

              <span className="landing-nav-rail-sep" aria-hidden />

              <div className="landing-nav-rail-item landing-nav-rail-feedback">
                <FeedbackForm />
              </div>

              <span className="landing-nav-rail-sep" aria-hidden />

              <motion.button
                type="button"
                onClick={() => navigate("/auth")}
                className="landing-nav-rail-item landing-nav-rail-login"
                whileHover={profile.reduced ? undefined : hoverLift}
              >
                {t("nav.login")}
              </motion.button>
            </div>

            {/* Mobile menu */}
            <motion.button
              type="button"
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-muted/20"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              whileTap={{ scale: 0.94 }}
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </motion.button>
          </div>

          <div className="landing-nav-beam" aria-hidden />
        </div>
      </motion.header>

      {/* Mobile panel */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              className="landing-nav-mobile-panel fixed left-3 right-3 z-50 md:hidden top-[4.25rem]"
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            >
              <div className="landing-nav-dock-ring">
                <div className="landing-nav-mobile-inner p-3 space-y-1">
                  <button type="button" className="landing-nav-mobile-row" onClick={goPricing}>
                    <Shield className="h-4 w-4 text-primary" />
                    {t("nav.pricing")}
                  </button>
                  {!isInstalled && (
                    <button type="button" className="landing-nav-mobile-row" onClick={handleInstallClick}>
                      <Download className="h-4 w-4 text-primary" />
                      Install app
                    </button>
                  )}
                  <button type="button" className="landing-nav-mobile-row" onClick={handleNotificationClick}>
                    <Bell className="h-4 w-4 text-primary" />
                    Notifications
                  </button>
                  <div className="px-2 py-1">
                    <FeedbackForm />
                  </div>
                  <button
                    type="button"
                    className="landing-nav-mobile-row landing-nav-mobile-login w-full mt-1"
                    onClick={() => {
                      navigate("/auth");
                      setMenuOpen(false);
                    }}
                  >
                    {t("nav.login")}
                  </button>
                </div>
              </div>
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
