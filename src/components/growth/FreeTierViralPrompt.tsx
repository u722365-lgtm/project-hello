import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, X, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const SHOW_KEY = "shadowtalk-viral-prompt-shown-v1";
const MSG_COUNT_KEY = "shadowtalk-chat-msg-count";

/**
 * Free-tier viral loop nudge. After a free user sends ~3 messages (their
 * "aha" moment), surface a small toast: share ShadowTalk, get Pro credits.
 * Turns happy free users into marketers without harassing them.
 */
export default function FreeTierViralPrompt() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(SHOW_KEY) === "1") return;

    const check = () => {
      const n = Number(localStorage.getItem(MSG_COUNT_KEY) || "0");
      if (n >= 3) {
        setOpen(true);
        localStorage.setItem(SHOW_KEY, "1");
      }
    };
    check();
    const id = window.setInterval(check, 4000);
    return () => window.clearInterval(id);
  }, []);

  const dismiss = () => setOpen(false);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed bottom-4 right-4 z-40 w-[min(92vw,360px)]"
        >
          <div className="relative rounded-2xl border border-primary/30 bg-background/90 backdrop-blur-xl shadow-2xl shadow-primary/10 p-4">
            <button
              aria-label="Dismiss"
              onClick={dismiss}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <Gift className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight mb-1">Enjoying ShadowTalk?</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Share it with one friend and get <span className="text-primary font-semibold">100 Pro credits</span> free — for both of you.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() => { dismiss(); navigate("/referral"); }}
                  >
                    <Share2 className="h-3.5 w-3.5" /> Get link
                  </Button>
                  <Button size="sm" variant="ghost" onClick={dismiss}>Not now</Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Call this whenever a chat message is sent by the user. */
export function bumpChatMessageCount() {
  if (typeof window === "undefined") return;
  const n = Number(localStorage.getItem(MSG_COUNT_KEY) || "0");
  localStorage.setItem(MSG_COUNT_KEY, String(n + 1));
}
