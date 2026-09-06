import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Code2,
  Compass,
  FileText,
  Cloud,
  ShieldCheck,
  Search,
  PenLine,
  BarChart3,
  ArrowRight,
  Zap,
} from "lucide-react";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";
import { settingsHapticTick } from "@/lib/settingsFeedback";
import { cn } from "@/lib/utils";
import { resolveEnterpriseTenant } from "@/lib/enterpriseTenants";
import { useAuth } from "@/components/AuthProvider";

/** Formats display name cleanly, removing trailing user-id numbers (e.g. zaim98269 -> Zaim) */
function formatGreetingName(rawName: string): string {
  if (!rawName || rawName.trim() === "" || rawName.toLowerCase() === "there") {
    return "friend";
  }
  const firstPart = rawName.trim().split(" ")[0].split("@")[0];
  // Strip trailing database digits if present (e.g. zaim98269 -> zaim)
  const cleaned = firstPart.replace(/\d+$/, "");
  const target = cleaned.length >= 2 ? cleaned : firstPart;
  return target.charAt(0).toUpperCase() + target.slice(1);
}

/** Determines local time greeting */
function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 22) return "Good evening";
  return "Welcome";
}

/** Flagship 4-Card Studio capabilities */
const FLAGSHIP_STUDIOS = [
  {
    id: "document",
    title: "Executive Documents",
    subtitle: "McKinsey-grade PDFs, Word, Markdown & Reports",
    badge: "Ultra-HD",
    icon: FileText,
    accent: "from-blue-500/20 via-cyan-500/10 to-transparent",
    borderHover: "hover:border-cyan-500/40",
    iconBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    badgeColor: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    prompt: "Generate a comprehensive McKinsey-grade executive report on ",
    actionKey: "documentStudio" as const,
  },
  {
    id: "image",
    title: "Image & Vision Studio",
    subtitle: "Diffusion art, visual editing & photo analysis",
    badge: "Diffusion",
    icon: Sparkles,
    accent: "from-purple-500/20 via-fuchsia-500/10 to-transparent",
    borderHover: "hover:border-purple-500/40",
    iconBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    badgeColor: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    prompt: "Create a photorealistic 8k architectural concept of ",
    actionKey: "imageStudio" as const,
  },
  {
    id: "research",
    title: "Deep Research Engine",
    subtitle: "Multi-source live web synthesis & market intel",
    badge: "Live Web",
    icon: Compass,
    accent: "from-emerald-500/20 via-teal-500/10 to-transparent",
    borderHover: "hover:border-emerald-500/40",
    iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    prompt: "Conduct a deep research analysis on ",
    actionKey: "deepResearch" as const,
  },
  {
    id: "app",
    title: "Code & App Studio",
    subtitle: "Full-stack web apps, sandboxes & instant preview",
    badge: "Full-Stack",
    icon: Code2,
    accent: "from-amber-500/20 via-orange-500/10 to-transparent",
    borderHover: "hover:border-amber-500/40",
    iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    prompt: "Build a responsive full-stack web application with React and Tailwind that ",
    actionKey: "appIde" as const,
  },
] as const;

/** Prompt inspiration pills */
const QUICK_INSPIRATIONS = [
  { label: "Quarterly Strategy Memo", prompt: "Draft an executive quarterly strategy memo covering revenue, growth levers, and key risks for " },
  { label: "React Dashboard Component", prompt: "Build an interactive analytics dashboard component in React with dark mode and KPIs for " },
  { label: "Analyze Market Landscape", prompt: "Analyze the competitive landscape, market drivers, and TAM for " },
  { label: "Explain Quantum Algorithms", prompt: "Explain Shor's and Grover's quantum algorithms with practical examples and implications for " },
] as const;

interface ChatEmptyStateProps {
  userDisplayName: string;
  onSelectPrompt: (text: string) => void;
  apiConnectedLabel?: string | null;
  composerDockStyle?: React.CSSProperties;
  children: React.ReactNode;
  onOpenDocumentStudio?: () => void;
  onOpenImageStudio?: () => void;
  onOpenDeepResearch?: () => void;
  onOpenAppIde?: () => void;
  onOpenLiveVoice?: () => void;
}

export function ChatEmptyState({
  userDisplayName,
  onSelectPrompt,
  apiConnectedLabel,
  composerDockStyle,
  children,
  onOpenDocumentStudio,
  onOpenImageStudio,
  onOpenDeepResearch,
  onOpenAppIde,
}: ChatEmptyStateProps) {
  const { user } = useAuth();
  const { staggerList, staggerItem, spring, reduced } = useSettingsMotion();
  const tenant = resolveEnterpriseTenant(user?.email);

  const formattedName = useMemo(() => formatGreetingName(userDisplayName), [userDisplayName]);
  const timeGreeting = useMemo(() => getTimeGreeting(), []);

  return (
    <motion.div
      variants={staggerList}
      initial="hidden"
      animate="visible"
      className="shadowtalk-chat-empty relative py-4 sm:py-8"
    >
      {/* Dynamic ambient bloom behind the greeting */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[500px] w-[800px] max-w-[130vw] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px] opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(99, 102, 241, 0.18), rgba(6, 182, 212, 0.12) 40%, rgba(168, 85, 247, 0.06) 65%, transparent 75%)",
        }}
      />

      {/* Intelligence Status Badge */}
      <motion.div
        variants={staggerItem}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-md mb-4 shadow-[0_2px_12px_rgba(0,0,0,0.25)] hover:border-white/20 transition-colors"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
        </span>
        <span className="text-[12px] font-medium tracking-wide text-slate-300">
          ShadowTalk Studio <span className="text-white/30">·</span> Multi-Model Intelligence
        </span>
      </motion.div>

      {/* Hero Greeting & Headline */}
      <motion.div variants={staggerItem} className="space-y-1.5 mb-6 sm:mb-8 text-center px-4">
        <p className="text-sm sm:text-base md:text-lg font-normal text-muted-foreground/85 tracking-normal">
          {timeGreeting}, <span className="text-foreground font-semibold">{formattedName}</span>
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.12] text-balance">
          <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent drop-shadow-sm">
            What would you like to create today?
          </span>
        </h1>
      </motion.div>

      {/* Floating Frosted-Glass Command Capsule */}
      <motion.div
        variants={staggerItem}
        className="shadowtalk-chat-input-dock shadowtalk-chat-input-shell shadowtalk-chat-input-shell--empty w-full max-w-3xl mb-7 relative"
        style={composerDockStyle}
      >
        {/* Subtle luminous ambient aura behind the composer */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-[32px] bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 blur-xl opacity-60 transition-opacity duration-300 group-hover:opacity-90"
        />
        <div className="relative">
          {children}
        </div>
      </motion.div>

      {/* Flagship 4-Card Studio Suite */}
      <motion.div
        variants={staggerItem}
        className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 mb-6 text-left px-2 sm:px-0"
      >
        {FLAGSHIP_STUDIOS.map((studio) => {
          const Icon = studio.icon;
          return (
            <motion.button
              key={studio.id}
              type="button"
              whileHover={reduced ? undefined : { y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition={spring}
              onClick={() => {
                settingsHapticTick();
                if (studio.actionKey === "documentStudio" && onOpenDocumentStudio) {
                  onOpenDocumentStudio();
                } else if (studio.actionKey === "imageStudio" && onOpenImageStudio) {
                  onOpenImageStudio();
                } else if (studio.actionKey === "deepResearch" && onOpenDeepResearch) {
                  onOpenDeepResearch();
                } else if (studio.actionKey === "appIde" && onOpenAppIde) {
                  onOpenAppIde();
                } else {
                  onSelectPrompt(studio.prompt);
                }
              }}
              className={cn(
                "group relative flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl",
                "border border-white/[0.08] bg-slate-900/50 dark:bg-slate-950/50 backdrop-blur-xl",
                "hover:bg-slate-900/80 dark:hover:bg-slate-900/80 hover:border-white/20",
                "transition-all duration-200 text-left overflow-hidden",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                "shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
              )}
            >
              {/* Subtle hover gradient bloom */}
              <div
                className={cn(
                  "pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500",
                  studio.accent
                )}
              />
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 group-hover:scale-105",
                  studio.iconBg
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {studio.title}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0",
                      studio.badgeColor
                    )}
                  >
                    {studio.badge}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
                  {studio.subtitle}
                </p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Prompt Inspiration Pills */}
      <motion.div
        variants={staggerItem}
        className="flex flex-wrap justify-center gap-2 max-w-2xl mb-6 px-2"
      >
        {QUICK_INSPIRATIONS.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              settingsHapticTick();
              onSelectPrompt(item.prompt);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
              "border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.07] text-muted-foreground hover:text-foreground",
              "hover:border-white/15 transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
            )}
          >
            <Sparkles className="h-3 w-3 text-primary/70 shrink-0" />
            <span>{item.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Footer Trust Bar & Tiers */}
      <motion.div
        variants={staggerItem}
        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground/60 px-4"
      >
        <span className="inline-flex items-center gap-1.5">
          <Cloud className="h-3 w-3 text-primary/70 shrink-0" />
          Cloud AI & Local Hybrid Ready
        </span>
        <span>·</span>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3 text-emerald-400 shrink-0" />
          Zero Data Retention
        </span>
        {apiConnectedLabel && (
          <>
            <span>·</span>
            <span>{apiConnectedLabel}</span>
          </>
        )}
        <span>·</span>
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
