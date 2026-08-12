import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Code2, Search, PenLine, Zap, BarChart3, ShieldCheck, Cloud } from "lucide-react";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";
import { settingsHapticTick } from "@/lib/settingsFeedback";
import { cn } from "@/lib/utils";
import { resolveEnterpriseTenant } from "@/lib/enterpriseTenants";
import { useAuth } from "@/components/AuthProvider";
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

  // Spec §14 — only claim what the code actually guarantees.
  const privacy = useMemo(() => {
    const deviceOnly = isDeviceOnlyPledgeActive() && !canUseCloudAI();
    return deviceOnly
      ? { label: "On-device only", deviceOnly: true }
      : { label: "Cloud AI enabled", deviceOnly: false };
  }, []);
  const PrivacyIcon = privacy.deviceOnly ? ShieldCheck : Cloud;

  const firstName = (userDisplayName || "there").split(" ")[0];

  return (
    <motion.div
      variants={staggerList}
      initial="hidden"
      animate="visible"
      className="shadowtalk-chat-empty relative"
    >
      {/* Gemini-style ambient bloom behind the greeting */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[560px] w-[860px] max-w-[130vw] -translate-x-1/2 -translate-y-[55%] rounded-full blur-3xl opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(var(--primary) / 0.22), hsl(var(--accent) / 0.12) 45%, transparent 72%)",
        }}
      />

      <motion.h1
        variants={staggerItem}
        className="text-center text-3xl sm:text-4xl md:text-[2.6rem] font-normal tracking-tight leading-tight"
      >
        <span className="gradient-text">Hi {firstName}, what&apos;s on your mind?</span>
      </motion.h1>

      <motion.div
        variants={staggerItem}
        className="shadowtalk-chat-input-dock shadowtalk-chat-input-shell shadowtalk-chat-input-shell--empty mt-7 w-full"
        style={composerDockStyle}
      >
        {children}
      </motion.div>

      <motion.div
        variants={staggerItem}
        className="mt-5 flex flex-wrap justify-center gap-2 max-w-lg"
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
                "inline-flex items-center gap-2 rounded-full border border-border/40",
                "bg-muted/20 px-3.5 py-2 text-xs font-medium text-muted-foreground",
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

      <motion.div
        variants={staggerItem}
        className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground/70"
      >
        <span
          className="inline-flex items-center gap-1.5"
          role="status"
          aria-label={`Privacy status: ${privacy.label}`}
        >
          <PrivacyIcon
            className={cn("h-3 w-3 shrink-0", privacy.deviceOnly ? "text-emerald-400" : "text-primary/70")}
            aria-hidden
          />
          {privacy.label}
        </span>
        {apiConnectedLabel && <span>{apiConnectedLabel}</span>}
        {[
          { label: "Pro", href: "/founder-access?plan=pro" },
          { label: "Premium", href: "/founder-access?plan=premium" },
          { label: "Elite", href: "/founder-access?plan=elite" },
        ].map((cta) => (
          <a
            key={cta.label}
            href={cta.href}
            className="underline-offset-4 hover:text-foreground hover:underline transition-colors"
          >
            {cta.label}
          </a>
        ))}
      </motion.div>
    </motion.div>
  );
}
