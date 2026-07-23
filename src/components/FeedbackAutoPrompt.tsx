import { useEffect, useState } from "react";
import { FeedbackForm } from "@/components/FeedbackForm";

const STORAGE_KEY = "shadowtalk_feedback_prompted_v1";
const DELAY_MS = 60_000; // show after 60s of session
const SNOOZE_MS = 1000 * 60 * 60 * 24 * 7; // re-ask after a week if dismissed

/**
 * Auto-opens the feedback dialog once per user (per browser) after a short
 * warm-up so every visitor is asked for feedback while using ShadowTalk.
 */
export const FeedbackAutoPrompt = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const last = raw ? Number(raw) : 0;
      if (last && Date.now() - last < SNOOZE_MS) return;
    } catch {
      /* ignore */
    }
    const t = window.setTimeout(() => setOpen(true), DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      try {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
    }
  };

  return <FeedbackForm open={open} onOpenChange={handleOpenChange} hideTrigger />;
};

export default FeedbackAutoPrompt;
