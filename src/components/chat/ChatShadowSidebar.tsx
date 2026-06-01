import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, LayoutGroup } from "framer-motion";
import {
  MessageSquare,
  MessageSquarePlus,
  Brain,
  Network,
  FileText,
  Radio,
  Workflow,
  Code,
  Plug,
  Settings,
  History,
} from "lucide-react";
import { ShadowTalkLogo } from "@/components/brand/ShadowTalkLogo";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getShadowModeEnabled, setShadowModeEnabled } from "@/lib/shadowMode";
import { InstalledAgentsPanel } from "@/components/marketplace/InstalledAgentsPanel";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";
import { settingsHapticTick } from "@/lib/settingsFeedback";

const NAV = [
  { label: "Chat", icon: MessageSquare, to: "/chatbot", end: true },
  { label: "Intelligence", icon: Brain, to: "/missioncontrol" },
  { label: "Knowledge", icon: Network, to: "/knowledge" },
  { label: "Documents", icon: FileText, to: "/workspace" },
  { label: "Code IDE", icon: Code, to: "/ide" },
  { label: "Signals", icon: Radio, to: "/analytics" },
  { label: "Automations", icon: Workflow, to: "/workspace" },
  { label: "Integrations", icon: Plug, to: "/developers" },
  { label: "Settings", icon: Settings, to: "/settings" },
] as const;

interface ChatShadowSidebarProps {
  userInitials: string;
  userDisplayName: string;
  onNewChat: () => void;
  onOpenHistory?: () => void;
}

export function ChatShadowSidebar({
  userInitials,
  userDisplayName,
  onNewChat,
  onOpenHistory,
}: ChatShadowSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [shadowMode, setShadowMode] = useState(() => getShadowModeEnabled());
  const { navSpring, spring } = useSettingsMotion();

  useEffect(() => {
    setShadowModeEnabled(shadowMode);
  }, [shadowMode]);

  return (
    <aside className="hidden md:flex w-[248px] shrink-0 flex-col border-r border-sidebar-border/80 bg-sidebar/95 backdrop-blur-xl relative z-30">
      <motion.button
        type="button"
        onClick={() => navigate("/")}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        transition={spring}
        className="flex items-center gap-3 px-5 pt-6 pb-6 text-left w-full hover:opacity-90 transition-opacity"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card/80 ring-1 ring-primary/20 shadow-[0_0_20px_hsl(var(--primary)/0.12)]">
          <ShadowTalkLogo size={40} variant="icon" ambient={false} animated={false} />
        </div>
        <div>
          <p className="text-sm font-semibold text-sidebar-foreground tracking-tight">ShadowTalk AI</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary/80">
            Sovereign Intelligence
          </p>
        </div>
      </motion.button>

      <div className="px-3 pb-3 space-y-1">
        <motion.button
          type="button"
          onClick={() => {
            settingsHapticTick();
            onNewChat();
          }}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          transition={spring}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-sidebar-foreground bg-primary/15 border border-primary/25 hover:bg-primary/20 transition-colors"
        >
          <MessageSquarePlus className="h-4 w-4 text-primary shrink-0" />
          New chat
        </motion.button>
        {onOpenHistory && (
          <motion.button
            type="button"
            onClick={() => {
              settingsHapticTick();
              onOpenHistory();
            }}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            transition={spring}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <History className="h-4 w-4 shrink-0" />
            Chat history
          </motion.button>
        )}
      </div>

      <div className="px-3 pb-2 border-b border-sidebar-border/60">
        <InstalledAgentsPanel compact />
      </div>

      <LayoutGroup id="chat-sidebar-nav">
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto min-h-0">
          {NAV.map((item) => {
            const { label, icon: Icon, to } = item;
            const end = "end" in item && item.end;
            const active = end
              ? location.pathname === to
              : location.pathname.startsWith(to);

            return (
              <NavLink key={label} to={to} end={end} className="block relative">
                <motion.span
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors",
                    active
                      ? "text-sidebar-foreground"
                      : "text-muted-foreground hover:text-sidebar-foreground",
                  )}
                  whileHover={active ? undefined : { x: 4 }}
                  transition={spring}
                >
                  {active && (
                    <motion.span
                      layoutId="chat-sidebar-active"
                      className="absolute inset-0 rounded-xl bg-sidebar-accent border border-primary/20 shadow-[inset_0_1px_0_hsl(var(--primary)/0.15)]"
                      transition={navSpring}
                    />
                  )}
                  <Icon className="relative z-10 h-4 w-4 shrink-0" />
                  <span className="relative z-10 flex-1">{label}</span>
                  {active && (
                    <span className="relative z-10 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.9)]" />
                  )}
                </motion.span>
              </NavLink>
            );
          })}
        </nav>
      </LayoutGroup>

      <div className="px-5 py-4 border-t border-sidebar-border space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Shadow Mode</span>
          <Switch
            checked={shadowMode}
            onCheckedChange={setShadowMode}
            className="data-[state=checked]:bg-primary"
          />
        </div>
        <motion.button
          type="button"
          onClick={() => navigate("/profile")}
          whileHover={{ scale: 1.01 }}
          transition={spring}
          className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-sidebar-accent/40 transition-colors"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-xs font-bold text-foreground ring-1 ring-primary/25">
            {userInitials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{userDisplayName}</p>
            <p className="text-[11px] text-muted-foreground">View profile</p>
          </div>
        </motion.button>
      </div>
    </aside>
  );
}
