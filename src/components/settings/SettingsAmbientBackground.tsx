import { motion } from "framer-motion";

interface SettingsAmbientBackgroundProps {
  enabled?: boolean;
}

export function SettingsAmbientBackground({ enabled = true }: SettingsAmbientBackgroundProps) {
  if (!enabled) {
    return <div className="fixed inset-0 neural-bg -z-10 pointer-events-none" aria-hidden />;
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none settings-grain" aria-hidden>
      <div className="absolute inset-0 neural-bg" />
      <motion.div
        className="absolute -top-40 -right-32 h-[480px] w-[480px] rounded-full bg-primary/25 blur-[110px]"
        animate={{ x: [0, 48, -24, 0], y: [0, -36, 24, 0], scale: [1, 1.1, 0.94, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
      />
      <motion.div
        className="absolute top-[28%] -left-40 h-[400px] w-[400px] rounded-full bg-secondary/18 blur-[100px]"
        animate={{ x: [0, 56, 12, 0], y: [0, 44, -28, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
      />
      <motion.div
        className="absolute -bottom-20 right-[20%] h-[320px] w-[320px] rounded-full bg-accent/12 blur-[90px]"
        animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.06, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[55%] left-[45%] h-[200px] w-[200px] rounded-full bg-primary/10 blur-[70px]"
        animate={{ x: [0, -30, 20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/25 via-transparent to-background/95" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.12),transparent)]" />
    </div>
  );
}
