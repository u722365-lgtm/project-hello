import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, X } from "lucide-react";

const DISMISS_KEY = "shadowtalk-sticky-cta-dismissed";

/**
 * Persistent bottom bar CTA. Appears after user scrolls past hero so it
 * doesn't compete with the primary hero CTA. Dismissible; remembers choice.
 */
export default function StickyTryCTA() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(DISMISS_KEY) === "1") {
      setDismissed(true);
      return;
    }
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[min(92vw,560px)]"
        >
          <div className="relative flex items-center gap-3 rounded-2xl border border-primary/30 bg-background/85 backdrop-blur-xl shadow-2xl shadow-primary/10 px-4 py-3">
            <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">Try ShadowTalk free — no login required</p>
              <p className="text-xs text-muted-foreground truncate">On-device model, private by default.</p>
            </div>
            <Button
              size="sm"
              onClick={() => navigate("/chatbot")}
              className="shrink-0 gap-1"
            >
              Start <ArrowRight className="h-3.5 w-3.5" />
            </Button>
            <button
              aria-label="Dismiss"
              onClick={handleDismiss}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
