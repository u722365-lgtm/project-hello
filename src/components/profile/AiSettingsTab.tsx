import { motion } from "framer-motion";
import { ChatAIPreferencesCard } from "./ChatAIPreferencesCard";
import { CustomInstructionsProfileCard } from "./CustomInstructionsProfileCard";
import { OfflineAISettings } from "./OfflineAISettings";
import { ShadowTalkModelPanel } from "./ShadowTalkModelPanel";

const tabMotion = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

export function AiSettingsTab() {
  return (
    <motion.div {...tabMotion} className="space-y-6">
      <ChatAIPreferencesCard />
      <CustomInstructionsProfileCard />
      <OfflineAISettings />
      <ShadowTalkModelPanel />
    </motion.div>
  );
}
