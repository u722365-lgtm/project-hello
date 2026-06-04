import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LANDING_EASE } from "@/lib/landingMotion";

const STORAGE_KEY = "shadowtalk:newsletter:subscribed";

export default function NewsletterSignup() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(
    typeof window !== "undefined" && !!localStorage.getItem(STORAGE_KEY),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({
        title: "Enter a valid email",
        description: "We need a real address to send updates to.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      // Lightweight client-side opt-in. Persists in localStorage so the user
      // sees the confirmed state when they return. Wire to a real list
      // (Resend/Mailchimp/etc.) by replacing this block with a fetch.
      await new Promise((r) => setTimeout(r, 350));
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ email: trimmed, at: Date.now() }));
      setDone(true);
      toast({
        title: "Subscribed",
        description: `We'll send the next ShadowTalk update to ${trimmed}.`,
      });
    } catch (err) {
      toast({
        title: "Could not subscribe",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-2xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: LANDING_EASE }}
          className="glass-subtle rounded-2xl p-10 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <h2 className="text-2xl font-bold mb-4 tracking-tight">Subscribe to our newsletter</h2>
          <p className="text-muted-foreground mb-6">
            Get the latest articles, tutorials, and updates delivered to your inbox.
          </p>
          {done ? (
            <div className="inline-flex items-center gap-2 text-sm text-primary">
              <Check className="h-4 w-4" />
              You're on the list — thanks for subscribing.
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                required
                aria-label="Email address"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-background/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl btn-glow font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {submitting ? "Subscribing…" : "Subscribe"}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
