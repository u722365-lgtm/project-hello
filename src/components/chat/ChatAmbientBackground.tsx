import { motion } from "framer-motion";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";

/** Subtle animated backdrop for the chat workspace. */
export function ChatAmbientBackground() {
  const { shouldAnimateAmbient } = useSettingsMotion();

  if (!shouldAnimateAmbient) {
    return (
      <>
        <div className="shadowtalk-chat-glow" aria-hidden />
        <div className="fixed inset-0 settings-grain pointer-events-none -z-[1]" aria-hidden />
      </>
    );
  }

  return (
    <div className="fixed inset-0 -z-[1] overflow-hidden pointer-events-none settings-grain" aria-hidden>
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(100vw,900px)] h-[50vh]"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, hsl(var(--primary) / 0.18), hsl(var(--secondary) / 0.08), transparent 70%)",
        }}
        animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.03, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -top-24 right-[10%] h-72 w-72 rounded-full bg-primary/15 blur-[100px]"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[20%] left-[5%] h-56 w-56 rounded-full bg-secondary/10 blur-[90px]"
        animate={{ x: [0, 40, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
