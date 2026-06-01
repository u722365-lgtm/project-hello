import { motion } from "framer-motion";

interface SettingsAmbientBackgroundProps {
  enabled?: boolean;
}

export function SettingsAmbientBackground({ enabled = true }: SettingsAmbientBackgroundProps) {
  if (!enabled) {
    return <div className="fixed inset-0 neural-bg -z-10 pointer-events-none" aria-hidden />;
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute inset-0 neural-bg" />
      <motion.div
        className="absolute -top-32 -right-24 h-[420px] w-[420px] rounded-full bg-primary/20 blur-[100px]"
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.08, 0.95, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -left-32 h-[360px] w-[360px] rounded-full bg-secondary/15 blur-[90px]"
        animate={{ x: [0, 50, 10, 0], y: [0, 40, -25, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-1/4 h-[280px] w-[280px] rounded-full bg-accent/10 blur-[80px]"
        animate={{ opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/90" />
    </div>
  );
}
