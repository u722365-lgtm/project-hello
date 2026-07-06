import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, X, ShieldCheck, Zap } from "lucide-react";

const KEY = "shadowtalk-exit-intent-shown";

/**
 * One-shot exit-intent modal. Fires when the cursor leaves through the top
 * of the viewport (desktop) or after 45s of inactivity (mobile fallback).
 * Shown at most once per browser.
 */
export default function ExitIntentPrompt() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(KEY) === "1") return;

    let armed = true;
    const trigger = () => {
      if (!armed) return;
      armed = false;
      localStorage.setItem(KEY, "1");
      setOpen(true);
    };

    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) trigger();
    };
    const timer = window.setTimeout(trigger, 45_000);
    document.addEventListener("mouseout", onMouseOut);
    return () => {
      document.removeEventListener("mouseout", onMouseOut);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-md p-4"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl border border-primary/30 bg-card p-8 shadow-2xl shadow-primary/20"
          >
            <button
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary mb-4">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold leading-tight mb-2">Before you go — try it in 10 seconds.</h2>
            <p className="text-sm text-muted-foreground mb-5">
              No signup. No credit card. Runs on your device once the model loads. Just type and see what ShadowTalk actually does.
            </p>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Chats stay on your device</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-primary" />
                <span>Generates docs, images, and strategy in one flow</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => { setOpen(false); navigate("/chatbot"); }}>
                Try free now
              </Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Maybe later
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
