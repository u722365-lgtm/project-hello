import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Code2, Search, PenLine, Zap, BarChart3, ShieldCheck, Cloud } from "lucide-react";
import { ShadowTalkOrb } from "@/components/chat/ShadowTalkOrb";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";
import { settingsHapticTick } from "@/lib/settingsFeedback";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import { resolveEnterpriseTenant } from "@/lib/enterpriseTenants";
import { useAuth } from "@/components/AuthProvider";
import { UseCaseQuickLinks } from "@/components/growth/UseCaseQuickLinks";
import {
  canUseCloudAI,
  isDeviceOnlyPledgeActive,
} from "@/lib/privacy/deviceOnlyPledge";

/** Spec §7 — four labelled starting shortcuts (prompt shortcuts, not new pages). */
const DEFAULT_QUICK_PROMPTS = [
  { label: "Research", prompt: "Research the latest on ", icon: Search },
  { label: "Write", prompt: "Help me write ", icon: PenLine },
  { label: "Code", prompt: "Write code that ", icon: Code2 },
  { label: "Analyze", prompt: "Analyze this and tell me what matters: ", icon: BarChart3 },
] as const;

interface ChatEmptyStateProps {
  userDisplayName: string;
  onSelectPrompt: (text: string) => void;
  apiConnectedLabel?: string | null;
  composerDockStyle?: React.CSSProperties;
  children: React.ReactNode;
}

export function ChatEmptyState({
  userDisplayName,
  onSelectPrompt,
  apiConnectedLabel,
  composerDockStyle,
  children,
}: ChatEmptyStateProps) {
  const { user } = useAuth();
  const { staggerList, staggerItem, spring, reduced } = useSettingsMotion();
  const tenant = resolveEnterpriseTenant(user?.email);
  const quickPrompts = tenant?.quickPrompts ?? DEFAULT_QUICK_PROMPTS;

  // Spec §14 — only claim what the code actually guarantees. Chat can be
  // persisted to the cloud whenever cloud AI is allowed (see
  // shouldPersistChatToCloud in lib/privacy/deviceOnlyPledge), so the
  // "no data stored" claim is only true in device-only mode.
  const privacy = useMemo(() => {
    const deviceOnly = isDeviceOnlyPledgeActive() && !canUseCloudAI();
    return deviceOnly
      ? { label: "Anonymous · on-device only", deviceOnly: true }
      : { label: "Anonymous · cloud AI enabled", deviceOnly: false };
  }, []);
  const PrivacyIcon = privacy.deviceOnly ? ShieldCheck : Cloud;

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
        <span className="gradient-text">What are you working on?</span>
      </motion.h1>
      <motion.p variants={staggerItem} className="text-sm text-muted-foreground mt-1">
        Hello, {userDisplayName}
      </motion.p>
      <motion.p variants={staggerItem} className="shadowtalk-chat-tagline text-base sm:text-lg font-semibold tracking-tight">
        <span className="gradient-text">{tenant?.welcomeSubtitle ?? BRAND.tagline}</span>
      </motion.p>
      <motion.p variants={staggerItem} className="text-xs text-muted-foreground mt-1">
        Try ShadowTalk — sovereign AI you control.
      </motion.p>

      <motion.div
        variants={staggerItem}
        className={cn(
          "mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
          privacy.deviceOnly
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            : "border-border/60 bg-muted/30 text-muted-foreground",
        )}
        role="status"
        aria-label={`Privacy status: ${privacy.label}`}
      >
        <PrivacyIcon className="h-3 w-3 shrink-0" aria-hidden />
        {privacy.label}
      </motion.div>

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
        {quickPrompts.map((item, index) => {
          const defaultIcons = [Sparkles, Code2, Search, PenLine, Zap] as const;
          const Icon =
            "icon" in item && item.icon
              ? item.icon
              : defaultIcons[index % defaultIcons.length];
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
                "transition-colors focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
              aria-label={`Start a ${item.label} prompt`}
            >
              <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
              {item.label}
            </motion.button>
          );
        })}
      </motion.div>

      <motion.div variants={staggerItem} className="mt-4 max-w-lg px-2">
        <UseCaseQuickLinks source="chat_empty" />
      </motion.div>

      <motion.div
        variants={staggerItem}
        className="mt-6 flex flex-wrap justify-center gap-2"
      >
        {[
          { label: "Pro — Rs 1,499/mo", href: "/founder-access?plan=pro" },
          { label: "Premium — Rs 3,999/mo", href: "/founder-access?plan=premium" },
          { label: "Elite — Rs 5,999/mo", href: "/founder-access?plan=elite" },
        ].map((cta) => (
          <motion.a
            key={cta.label}
            href={cta.href}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-2 text-xs font-semibold text-foreground hover:border-primary/50 hover:bg-primary/15 transition-colors"
          >
            {cta.label}
          </motion.a>
        ))}
      </motion.div>

      <motion.div
        variants={staggerItem}
        className="shadowtalk-chat-input-dock shadowtalk-chat-input-shell shadowtalk-chat-input-shell--empty w-full"
        style={composerDockStyle}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
