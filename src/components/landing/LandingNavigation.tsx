import { useEffect, useState } from "react";
import { Bot, Menu, X } from "lucide-react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/AuthProvider";
import { useTranslation } from "@/hooks/useTranslation";
import { useLandingMotion } from "@/hooks/use-landing-motion";
import { LANDING_PRIMARY_LINKS, LANDING_PRODUCT_LINKS, type LandingNavLink } from "@/lib/landingNav";

function scrollToHash(href: string) {
  document.getElementById(href.replace("#", ""))?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Marketing-only header for the home page. Intentionally separate from app Navigation.
 */
const LandingNavigation = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { variants, profile, hoverLift } = useLandingMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 8));

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const go = (link: LandingNavLink) => {
    if (link.scroll && link.href.startsWith("#")) scrollToHash(link.href);
    else navigate(link.href);
    setMenuOpen(false);
  };

  return (
    <>
      <motion.header
        className={`landing-nav fixed inset-x-0 top-0 z-50 ${scrolled ? "landing-nav--scrolled" : ""}`}
        initial="hidden"
        animate="visible"
        variants={variants.slideDown}
      >
        <div className="landing-nav-bar mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 sm:h-16">
          {/* Logo */}
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

          {/* Desktop links — text only, no icons */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 md:flex items-center gap-1" aria-label="Primary">
            {LANDING_PRIMARY_LINKS.map((link, i) => (
              <motion.button
                key={link.href}
                type="button"
                onClick={() => go(link)}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.04, duration: 0.4 }}
                whileHover={profile.reduced ? undefined : { y: -1 }}
                className="landing-nav-link px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </motion.button>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => navigate("/chatbot")}>Workspace</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile")}>Profile</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/auth")}
              >
                {t("nav.login")}
              </Button>
            )}
            <motion.div whileHover={profile.reduced ? undefined : hoverLift} whileTap={{ scale: 0.98 }}>
              <Button size="sm" className="btn-glow rounded-full px-5" onClick={() => navigate("/chatbot")}>
                {t("nav.tryFree")}
              </Button>
            </motion.div>
          </div>

          {/* Mobile menu */}
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
            <motion.nav
              className="fixed inset-x-0 top-14 z-50 border-b border-border/50 bg-background/95 backdrop-blur-xl md:hidden"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: profile.reduced ? 0.01 : 0.22 }}
              aria-label="Mobile"
            >
              <div className="px-4 py-3 space-y-1">
                {LANDING_PRIMARY_LINKS.map((link) => (
                  <button
                    key={link.href}
                    type="button"
                    onClick={() => go(link)}
                    className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  >
                    {link.label}
                  </button>
                ))}
                <div className="my-2 h-px bg-border/50" />
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Product</p>
                {LANDING_PRODUCT_LINKS.slice(0, 4).map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => {
                      navigate(item.href);
                      setMenuOpen(false);
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 border-t border-border/50 p-4">
                {!user && (
                  <Button variant="outline" className="flex-1" onClick={() => { navigate("/auth"); setMenuOpen(false); }}>
                    {t("nav.login")}
                  </Button>
                )}
                <Button className="flex-1 btn-glow" onClick={() => { navigate("/chatbot"); setMenuOpen(false); }}>
                  {t("nav.tryFree")}
                </Button>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default LandingNavigation;
