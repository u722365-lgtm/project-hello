import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  MessageSquarePlus,
  History,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
} from "lucide-react";
import { ShadowTalkLogo } from "@/components/brand/ShadowTalkLogo";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getShadowModeEnabled, setShadowModeEnabled } from "@/lib/shadowMode";
import { InstalledAgentsPanel } from "@/components/marketplace/InstalledAgentsPanel";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";
import { settingsHapticTick } from "@/lib/settingsFeedback";
import { SETTINGS_SPRING } from "@/lib/settingsMotion";
import {
  CHAT_SIDEBAR_WIDTH_COLLAPSED,
  CHAT_SIDEBAR_WIDTH_EXPANDED,
} from "@/lib/chatSidebarNav";
import { ChatSidebarNavList } from "@/components/chat/ChatSidebarNavList";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatShadowSidebarProps {
  userInitials: string;
  userDisplayName: string;
  onNewChat: () => void;
  onOpenHistory?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  /** Drawer on mobile — always expanded width, visible on small screens */
  mobileDrawer?: boolean;
  forceExpanded?: boolean;
  onNavigate?: () => void;
}

export function ChatShadowSidebar({
  userInitials,
  userDisplayName,
  onNewChat,
  onOpenHistory,
  collapsed = false,
  onToggleCollapse,
  mobileDrawer = false,
  forceExpanded = false,
  onNavigate,
}: ChatShadowSidebarProps) {
  const navigate = useNavigate();
  const [shadowMode, setShadowMode] = useState(() => getShadowModeEnabled());
  const { spring, staggerItem } = useSettingsMotion();

  const isCollapsed = forceExpanded ? false : collapsed;
  const width = isCollapsed ? CHAT_SIDEBAR_WIDTH_COLLAPSED : CHAT_SIDEBAR_WIDTH_EXPANDED;

  useEffect(() => {
    setShadowModeEnabled(shadowMode);
  }, [shadowMode]);

  const actionBtn = (opts: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    primary?: boolean;
  }) => {
    const btn = (
      <motion.button
        type="button"
        onClick={() => {
          settingsHapticTick();
          opts.onClick();
        }}
        whileHover={{ x: isCollapsed ? 0 : 3, scale: isCollapsed ? 1.04 : 1 }}
        whileTap={{ scale: 0.97 }}
        transition={spring}
        className={cn(
          "relative flex items-center rounded-full text-[13px] font-medium transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isCollapsed ? "justify-center h-11 w-11 mx-auto" : "gap-3 w-full px-4 py-2.5",
          opts.primary
            ? "bg-primary/15 ring-1 ring-inset ring-primary/25 text-sidebar-foreground hover:bg-primary/22"
            : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/40",
        )}
        aria-label={opts.label}
        title={isCollapsed ? undefined : opts.label}
      >
        {opts.icon}
        {!isCollapsed && <span className="flex-1 text-left">{opts.label}</span>}
      </motion.button>
    );

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{btn}</TooltipTrigger>
          <TooltipContent side="right">{opts.label}</TooltipContent>
        </Tooltip>
      );
    }
    return btn;
  };

  return (
    <TooltipProvider delayDuration={200}>
      <motion.aside
        animate={{ width }}
        transition={SETTINGS_SPRING}
        className={cn(
          "shrink-0 flex flex-col relative z-30 overflow-hidden",
          // Gemini-style: fully transparent rail that lets the ambient chat
          // backdrop show through. Mobile drawer keeps a light blur for legibility.
          mobileDrawer
            ? "flex h-full min-h-0 bg-sidebar/80 backdrop-blur-2xl"
            : "hidden md:flex h-full min-h-0 bg-transparent",
        )}
        style={{ width }}
      >

        {/* Brand */}
        <div className={cn("relative shrink-0", isCollapsed ? "px-2 pt-5 pb-3" : "px-4 pt-5 pb-4")}>
          <motion.button
            type="button"
            onClick={() => {
              settingsHapticTick();
              navigate("/chatbot");
              onNavigate?.();
            }}
            whileTap={{ scale: 0.98 }}
            transition={spring}
            className={cn(
              "flex items-center text-left w-full rounded-full hover:bg-sidebar-accent/30 transition-colors duration-200",
              isCollapsed ? "justify-center p-2" : "gap-3 p-2",
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <ShadowTalkLogo size={36} variant="icon" ambient={false} animated={!isCollapsed} />
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={spring}
                className="min-w-0"
              >
                <p className="text-sm font-semibold text-sidebar-foreground tracking-tight truncate">
                  ShadowTalk AI
                </p>
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-primary/75">
                  Sovereign
                </p>
              </motion.div>
            )}
          </motion.button>

          {onToggleCollapse && !mobileDrawer && (
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  type="button"
                  onClick={() => {
                    settingsHapticTick();
                    onToggleCollapse();
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.94 }}
                  transition={spring}
                  className={cn(
                    "absolute flex h-7 w-7 items-center justify-center rounded-lg",
                    "bg-sidebar-accent/40 text-muted-foreground hover:text-primary hover:bg-sidebar-accent/70 transition-colors",
                    isCollapsed ? "right-1 top-4" : "right-3 top-5",
                  )}
                  aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {isCollapsed ? (
                    <PanelLeftOpen className="h-3.5 w-3.5" />
                  ) : (
                    <PanelLeftClose className="h-3.5 w-3.5" />
                  )}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {isCollapsed ? "Expand" : "Collapse"}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Quick actions */}
        <motion.div
          variants={staggerItem}
          initial="hidden"
          animate="visible"
          className={cn("shrink-0 space-y-1", isCollapsed ? "px-2 pb-2" : "px-3 pb-3")}
        >
          {actionBtn({
            icon: <Home className="h-4 w-4 shrink-0" />,
            label: "Back to Home",
            onClick: () => {
              navigate("/home");
              onNavigate?.();
            },
          })}
          {actionBtn({
            icon: <MessageSquarePlus className="h-4 w-4 text-primary shrink-0" />,
            label: "New chat",
            onClick: onNewChat,
            primary: true,
          })}
          {onOpenHistory &&
            actionBtn({
              icon: <History className="h-4 w-4 shrink-0" />,
              label: "Chat history",
              onClick: onOpenHistory,
            })}
        </motion.div>

        {!isCollapsed && (
          <div className="px-3 pb-2 border-b border-sidebar-border/30 shrink-0">
            <InstalledAgentsPanel compact />
          </div>
        )}

        <ChatSidebarNavList collapsed={isCollapsed} onItemClick={onNavigate} />

        {/* Footer */}
        <div
          className={cn(
            "shrink-0 border-t border-sidebar-border/30 space-y-3",
            isCollapsed ? "px-2 py-3" : "px-4 py-4",
          )}
        >
          {!isCollapsed ? (
            <div className="flex items-center justify-between rounded-full bg-sidebar-accent/30 px-4 py-2">
              <span className="text-xs font-medium text-muted-foreground">Shadow Mode</span>
              <Switch
                checked={shadowMode}
                onCheckedChange={setShadowMode}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          ) : null}

          <motion.button
            type="button"
            onClick={() => {
              settingsHapticTick();
              navigate("/profile");
              onNavigate?.();
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={spring}
            className={cn(
              "flex w-full items-center rounded-full hover:bg-sidebar-accent/40 transition-colors duration-200",
              isCollapsed ? "justify-center p-2" : "gap-3 px-2 py-2",
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary ring-1 ring-primary/30">
              {userInitials}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1 text-left">
                <p className="text-sm font-medium truncate">{userDisplayName}</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                  Profile <ChevronRight className="h-3 w-3" />
                </p>
              </div>
            )}
          </motion.button>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
