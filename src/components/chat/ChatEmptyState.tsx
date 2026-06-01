import { motion } from "framer-motion";
import { Sparkles, Code2, Search, PenLine, Zap } from "lucide-react";
import { ShadowTalkOrb } from "@/components/chat/ShadowTalkOrb";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";
import { settingsHapticTick } from "@/lib/settingsFeedback";
import { cn } from "@/lib/utils";

const QUICK_PROMPTS = [
  { label: "Brainstorm ideas", prompt: "Help me brainstorm creative ideas for ", icon: Sparkles },
  { label: "Write code", prompt: "Write clean, production-ready code for ", icon: Code2 },
  { label: "Deep research", prompt: "Research and summarize ", icon: Search },
  { label: "Draft content", prompt: "Draft professional content about ", icon: PenLine },
  { label: "Quick answer", prompt: "Give me a clear, concise answer about ", icon: Zap },
] as const;

interface ChatEmptyStateProps {
  userDisplayName: string;
  onSelectPrompt: (text: string) => void;
  apiConnectedLabel?: string | null;
  children: React.ReactNode;
}

export function ChatEmptyState({
  userDisplayName,
  onSelectPrompt,
  apiConnectedLabel,
  children,
}: ChatEmptyStateProps) {
  const { staggerList, staggerItem, spring, reduced } = useSettingsMotion();

  return (
    <motion.div
      variants={staggerList}
      initial="hidden"
      animate="visible"
      className="shadowtalk-chat-empty"
    >
      <motion.div variants={staggerItem}>
        <ShadowTalkOrb />
      </motion.div>

      <motion.h1 variants={staggerItem} className="shadowtalk-chat-greeting">
        Hello, <span className="gradient-text">{userDisplayName}</span>
      </motion.h1>
      <motion.p variants={staggerItem} className="shadowtalk-chat-tagline">
        Think AI. Think ShadowTalk.
      </motion.p>

      {apiConnectedLabel && (
        <motion.p
          variants={staggerItem}
          className="text-[10px] text-muted-foreground/60 mt-2 tracking-wide"
        >
          {apiConnectedLabel}
        </motion.p>
      )}

      <motion.div
        variants={staggerItem}
        className="mt-8 flex flex-wrap justify-center gap-2 max-w-lg"
      >
        {QUICK_PROMPTS.map((item) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.label}
              type="button"
              whileHover={reduced ? undefined : { y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={spring}
              onClick={() => {
                settingsHapticTick();
                onSelectPrompt(item.prompt);
              }}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border border-border/50",
                "bg-muted/30 px-3.5 py-2 text-xs font-medium text-muted-foreground",
                "hover:border-primary/40 hover:text-foreground hover:bg-primary/10",
                "transition-colors",
              )}
            >
              <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
              {item.label}
            </motion.button>
          );
        })}
      </motion.div>

      <motion.div
        variants={staggerItem}
        className="shadowtalk-chat-input-shell shadowtalk-chat-input-shell--empty w-full"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
