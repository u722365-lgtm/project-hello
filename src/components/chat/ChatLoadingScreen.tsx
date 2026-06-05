import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { ShadowTalkLogo } from "@/components/brand/ShadowTalkLogo";
import { ChatAmbientBackground } from "@/components/chat/ChatAmbientBackground";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";

export function ChatLoadingScreen() {
  const { loadingPulse, staggerList, staggerItem } = useSettingsMotion();

  return (
    <div className="shadowtalk-chat-shell app-min-height neural-bg flex flex-col items-center justify-center gap-8">
      <ChatAmbientBackground />
      <motion.div variants={loadingPulse} animate="animate" className="relative z-10">
        <ShadowTalkLogo size={80} variant="icon" ambient animated />
      </motion.div>
      <motion.div
        variants={staggerList}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex items-center gap-2 text-sm text-muted-foreground"
      >
        <motion.span variants={staggerItem}>
          <MessageSquare className="h-4 w-4 text-primary animate-pulse" />
        </motion.span>
        <motion.span variants={staggerItem}>Warming up your neural workspace…</motion.span>
      </motion.div>
    </div>
  );
}
