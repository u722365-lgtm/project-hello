import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { SettingsAmbientBackground } from "@/components/settings/SettingsAmbientBackground";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";

export function SettingsLoading() {
  const { loadingPulse, shouldAnimateAmbient, staggerList, staggerItem } = useSettingsMotion();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 neural-bg px-4">
      <SettingsAmbientBackground enabled={shouldAnimateAmbient} />
      <motion.div variants={loadingPulse} animate="animate" className="relative">
        <motion.div
          className="absolute inset-0 rounded-2xl bg-primary/30 blur-2xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10">
          <Settings className="h-8 w-8 text-primary" />
        </div>
      </motion.div>
      <motion.div
        variants={staggerList}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md space-y-3"
      >
        {[0.9, 0.7, 0.5].map((w) => (
          <motion.div
            key={w}
            variants={staggerItem}
            className="h-3 rounded-full bg-muted/40 overflow-hidden"
            style={{ width: `${w * 100}%`, marginInline: "auto" }}
          >
            <motion.div
              className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-primary/50 to-transparent"
              animate={{ x: ["-100%", "400%"] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        ))}
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-sm text-muted-foreground"
      >
        Preparing your workspace…
      </motion.p>
    </div>
  );
}
