import { motion } from "framer-motion";
import { User } from "lucide-react";
import { SettingsAmbientBackground } from "@/components/settings/SettingsAmbientBackground";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";

export function ProfileLoading() {
  const { loadingPulse, shouldAnimateAmbient, staggerList, staggerItem } = useSettingsMotion();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 neural-bg px-4">
      <SettingsAmbientBackground enabled={shouldAnimateAmbient} />
      <motion.div variants={loadingPulse} animate="animate" className="relative">
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/30 blur-2xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.65, 0.35] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full ring-2 ring-primary/40 bg-primary/10">
          <User className="h-8 w-8 text-primary" />
        </div>
      </motion.div>
      <motion.div variants={staggerList} initial="hidden" animate="visible" className="w-full max-w-sm space-y-3">
        {[0.85, 0.65, 0.45].map((w) => (
          <motion.div
            key={w}
            variants={staggerItem}
            className="h-2.5 rounded-full bg-muted/40 mx-auto overflow-hidden"
            style={{ width: `${w * 100}%` }}
          >
            <motion.div
              className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-primary/40 to-transparent"
              animate={{ x: ["-100%", "400%"] }}
              transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        ))}
      </motion.div>
      <p className="text-sm text-muted-foreground">Loading your profile…</p>
    </div>
  );
}
