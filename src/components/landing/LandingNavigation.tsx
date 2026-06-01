import { useCallback, useEffect, useState } from "react";
import {
  Bot,
  ChevronDown,
  Download,
  Menu,
  MoreHorizontal,
  Smartphone,
  User,
  X,
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/AuthProvider";
import { useTranslation } from "@/hooks/useTranslation";
import { useLandingMotionContext } from "@/components/landing/LandingMotionProvider";
import LandingMagneticButton from "@/components/landing/LandingMagneticButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { FeedbackForm } from "@/components/FeedbackForm";
import { StealthKillSwitch } from "@/components/StealthKillSwitch";
import {
  LANDING_MORE_LINKS,
  LANDING_PRIMARY_LINKS,
  LANDING_PRODUCT_LINKS,
  type LandingNavLink,
} from "@/lib/landingNav";
import { LANDING_SPRING } from "@/lib/landingMotion";

const navItemVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.04 + i * 0.05, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

function scrollToHash(href: string) {
  const id = href.replace("#", "");
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const LandingNavLinkButton = ({
  link,
  onNavigate,
  index,
}: {
  link: LandingNavLink;
  onNavigate: (link: LandingNavLink) => void;
  index: number;
}) => {
  const { profile, hoverLift } = useLandingMotionContext();

  return (
    <motion.button
      type="button"
      custom={index}
      variants={navItemVariants}
      initial="hidden"
      animate="visible"
      onClick={() => onNavigate(link)}
      whileHover={profile.reduced ? undefined : hoverLift}
      whileTap={profile.reduced ? undefined : { scale: 0.98 }}
      className="landing-nav-link relative px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg"
    >
      {link.label}
      <motion.span
        className="landing-nav-link-line absolute bottom-1 left-3.5 right-3.5 h-px bg-primary origin-left"
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        aria-hidden
      />
    </motion.button>
  );
};

const LandingNavigation = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { variants, profile, hoverLift } = useLandingMotionContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<{
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: string }>;
  } | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 12));

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
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
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

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
  }, [deferredPrompt]);

  const handleNav = (link: LandingNavLink) => {
    if (link.scroll && link.href.startsWith("#")) {
      scrollToHash(link.href);
    } else {
      navigate(link.href);
    }
    setMobileOpen(false);
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <>
      <motion.header
        className={`landing-nav fixed left-0 right-0 z-50 transition-[top] duration-300 ${
          scrolled ? "landing-nav--scrolled" : ""
        }`}
        initial="hidden"
        animate="visible"
        variants={variants.slideDown}
      >
        <div
          className={`landing-nav-inner mx-auto flex items-center justify-between gap-3 px-4 sm:px-6 transition-all duration-300 ${
            scrolled ? "h-14 max-w-6xl mt-2 rounded-2xl border border-border/60 shadow-lg shadow-black/10" : "h-16 max-w-7xl border-b border-transparent"
          }`}
        >
          {/* Brand */}
          <motion.button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 shrink-0 group"
            whileHover={profile.reduced ? undefined : hoverLift}
            whileTap={profile.reduced ? undefined : { scale: 0.98 }}
          >
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <Bot className="h-5 w-5 text-primary" />
              <motion.span
                className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-success"
                animate={profile.reduced ? undefined : { scale: [1, 1.25, 1] }}
                transition={{ duration: 2.2, repeat: Infinity }}
                aria-hidden
              />
            </span>
            <span className="hidden sm:block text-base font-semibold tracking-tight gradient-text">
              ShadowTalk
            </span>
          </motion.button>

          {/* Desktop center */}
          <nav className="hidden lg:flex items-center gap-0.5" aria-label="Primary">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  type="button"
                  custom={0}
                  variants={navItemVariants}
                  initial="hidden"
                  animate="visible"
                  className="landing-nav-link flex items-center gap-1 px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg"
                  whileHover={profile.reduced ? undefined : hoverLift}
                >
                  Product
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                className="w-72 p-2 glass-strong border-border/50"
                sideOffset={10}
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2 py-1">
                  Explore the platform
                </DropdownMenuLabel>
                {LANDING_PRODUCT_LINKS.map((item) => (
                  <DropdownMenuItem
                    key={item.href}
                    onClick={() => navigate(item.href)}
                    className="flex items-start gap-3 rounded-lg p-2.5 cursor-pointer"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                      <item.icon className="h-4 w-4 text-primary" />
                    </span>
                    <span>
                      <span className="block text-sm font-medium">{item.label}</span>
                      <span className="block text-xs text-muted-foreground">{item.description}</span>
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {LANDING_PRIMARY_LINKS.map((link, i) => (
              <LandingNavLinkButton key={link.href} link={link} onNavigate={handleNav} index={i + 1} />
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  type="button"
                  aria-label="More options"
                  className="h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                  whileHover={profile.reduced ? undefined : { scale: 1.05 }}
                  whileTap={profile.reduced ? undefined : { scale: 0.95 }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 glass-strong border-border/50">
                {!isInstalled && (
                  <DropdownMenuItem onClick={handleInstallClick} className="gap-2 cursor-pointer">
                    <Download className="h-4 w-4" />
                    Install app
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="p-0 focus:bg-transparent" onSelect={(e) => e.preventDefault()}>
                  <div className="flex items-center justify-between w-full px-2 py-1.5">
                    <span className="text-sm">Language</span>
                    <LanguageSwitcher />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-0 focus:bg-transparent" onSelect={(e) => e.preventDefault()}>
                  <div className="px-2 py-1">
                    <FeedbackForm />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="p-0 focus:bg-transparent" onSelect={(e) => e.preventDefault()}>
                  <div className="flex items-center justify-between w-full px-3 py-2">
                    <span className="text-xs text-muted-foreground">Stealth</span>
                    <StealthKillSwitch />
                  </div>
                </DropdownMenuItem>
                {LANDING_MORE_LINKS.map((link) => (
                  <DropdownMenuItem key={link.href} onClick={() => handleNav(link)} className="cursor-pointer">
                    {link.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    type="button"
                    className="h-9 w-9 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center"
                    whileHover={profile.reduced ? undefined : hoverLift}
                  >
                    <User className="h-4 w-4 text-primary" />
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 glass-strong">
                  <DropdownMenuItem onClick={() => navigate("/chatbot")}>Open workspace</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile")}>Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <motion.div whileHover={profile.reduced ? undefined : hoverLift}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => navigate("/auth")}
                >
                  {t("nav.login")}
                </Button>
              </motion.div>
            )}

            <LandingMagneticButton>
              <Button size="sm" className="btn-glow rounded-full px-5" onClick={() => navigate("/chatbot")}>
                {t("nav.tryFree")}
              </Button>
            </LandingMagneticButton>
          </div>

          {/* Mobile toggle */}
          <motion.button
            type="button"
            className="md:hidden h-10 w-10 flex items-center justify-center rounded-lg hover:bg-muted/40"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            whileTap={profile.reduced ? undefined : { scale: 0.92 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileOpen ? (
                <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                  <X className="h-5 w-5" />
                </motion.span>
              ) : (
                <motion.span key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                  <Menu className="h-5 w-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="fixed top-0 right-0 z-50 h-full w-full max-w-sm border-l border-border/50 bg-background/95 backdrop-blur-xl md:hidden flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={profile.reduced ? { duration: 0.01 } : LANDING_SPRING.gentle}
            >
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <span className="font-semibold gradient-text">Menu</span>
                <button type="button" onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-muted/40" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">Product</p>
                  <div className="space-y-1">
                    {LANDING_PRODUCT_LINKS.map((item, i) => (
                      <motion.button
                        key={item.href}
                        type="button"
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 + i * 0.04 }}
                        onClick={() => {
                          navigate(item.href);
                          setMobileOpen(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted/40"
                      >
                        <item.icon className="h-4 w-4 text-primary shrink-0" />
                        <span>
                          <span className="block text-sm font-medium">{item.label}</span>
                          <span className="block text-xs text-muted-foreground">{item.description}</span>
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">Explore</p>
                  <div className="space-y-0.5">
                    {[...LANDING_PRIMARY_LINKS, ...LANDING_MORE_LINKS].map((link, i) => (
                      <motion.button
                        key={link.href}
                        type="button"
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.12 + i * 0.03 }}
                        onClick={() => handleNav(link)}
                        className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      >
                        {link.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div className="glass-subtle rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Stealth mode</span>
                    <StealthKillSwitch />
                  </div>
                  <div className="flex items-center gap-2">
                    <LanguageSwitcher />
                    <FeedbackForm />
                  </div>
                  {!isInstalled && (
                    <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleInstallClick}>
                      <Download className="h-4 w-4" />
                      Install app
                    </Button>
                  )}
                </div>
              </div>
              <div className="p-4 border-t border-border/50 space-y-2">
                {!user && (
                  <Button variant="outline" className="w-full" onClick={() => { navigate("/auth"); setMobileOpen(false); }}>
                    {t("nav.login")}
                  </Button>
                )}
                <Button className="w-full btn-glow" onClick={() => { navigate("/chatbot"); setMobileOpen(false); }}>
                  {t("nav.tryFree")}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* PWA guide modal */}
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
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={LANDING_SPRING.gentle}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/15 rounded-full p-2.5">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Install ShadowTalk</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {isIOS
                  ? "In Safari, tap Share, then Add to Home Screen."
                  : "Use your browser menu to install this app to your device."}
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
