import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SquarePen, Menu, History, ChevronRight } from "lucide-react";
import { ShadowTalkLogo } from "@/components/brand/ShadowTalkLogo";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getShadowModeEnabled, setShadowModeEnabled } from "@/lib/shadowMode";
import { InstalledAgentsPanel } from "@/components/marketplace/InstalledAgentsPanel";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";
import { settingsHapticTick } from "@/lib/settingsFeedback";
import { SETTINGS_SPRING } from "@/lib/settingsMotion";
import { CHAT_SIDEBAR_WIDTH_COLLAPSED, CHAT_SIDEBAR_WIDTH_EXPANDED } from "@/lib/chatSidebarNav";
import { ChatSidebarNavList } from "@/components/chat/ChatSidebarNavList";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ChatShadowSidebarProps {
  userInitials: string;
  userDisplayName: string;
  onNewChat: () => void;
  onOpenHistory?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileDrawer?: boolean;
  forceExpanded?: boolean;
  onNavigate?: () => void;
}

export function ChatShadowSidebar({ userInitials, userDisplayName, onNewChat, onOpenHistory, collapsed = false, onToggleCollapse, mobileDrawer = false, forceExpanded = false, onNavigate }: ChatShadowSidebarProps) {
  const navigate = useNavigate();
  const [shadowMode, setShadowMode] = useState(() => getShadowModeEnabled());
  const { spring } = useSettingsMotion();
  const isCollapsed = forceExpanded ? false : collapsed;
  const width = isCollapsed ? CHAT_SIDEBAR_WIDTH_COLLAPSED : CHAT_SIDEBAR_WIDTH_EXPANDED;

  useEffect(() => { setShadowModeEnabled(shadowMode); }, [shadowMode]);

  return (
    <TooltipProvider delayDuration={300}>
      <motion.aside animate={{ width }} transition={SETTINGS_SPRING} className={cn("shrink-0 flex flex-col relative z-30 overflow-hidden", mobileDrawer ? "flex h-full min-h-0 bg-[#07090f]" : "hidden md:flex h-full min-h-0 bg-[#07090f] border-r border-cyan-500/10")} style={{ width }}>

        {/* Top row */}
        <div className={cn("shrink-0 flex items-center", isCollapsed ? "flex-col gap-3 px-2 pt-4 pb-2" : "flex-row gap-2 px-3 pt-4 pb-2")}>
          {onToggleCollapse && !mobileDrawer ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button type="button" onClick={() => { settingsHapticTick(); onToggleCollapse(); }} whileHover={{ backgroundColor: "rgba(6,182,212,0.10)" }} whileTap={{ scale: 0.94 }} transition={spring} className="flex h-10 w-10 items-center justify-center rounded-full text-cyan-400/60 hover:text-cyan-300 transition-colors shrink-0" aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
                  <Menu className="h-5 w-5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="right">{isCollapsed ? "Expand" : "Collapse"}</TooltipContent>
            </Tooltip>
          ) : <div className="h-10 w-10 shrink-0" />}

          <AnimatePresence>
            {!isCollapsed && (
              <motion.button type="button" onClick={() => { settingsHapticTick(); navigate("/chatbot"); onNavigate?.(); }} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={spring} className="flex items-center gap-2.5 min-w-0">
                <ShadowTalkLogo size={28} variant="icon" ambient={false} animated={false} />
                <span className="text-[19px] font-semibold bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent whitespace-nowrap select-none tracking-tight">ShadowTalk</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* New Chat */}
        <div className={cn("shrink-0", isCollapsed ? "px-2 py-3" : "px-3 py-3")}>
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button type="button" onClick={() => { settingsHapticTick(); onNewChat(); }} whileHover={{ boxShadow: "0 0 16px rgba(6,182,212,0.25)" }} whileTap={{ scale: 0.95 }} transition={spring} className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/20 transition-colors" aria-label="New chat">
                  <SquarePen className="h-5 w-5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="right">New chat</TooltipContent>
            </Tooltip>
          ) : (
            <motion.button type="button" onClick={() => { settingsHapticTick(); onNewChat(); }} whileHover={{ boxShadow: "0 0 20px rgba(6,182,212,0.18)" }} whileTap={{ scale: 0.98 }} transition={spring} className="flex w-full items-center gap-3 rounded-full bg-gradient-to-r from-cyan-500/15 to-purple-500/10 border border-cyan-500/20 px-4 py-3 text-sm text-cyan-300/90 hover:text-cyan-200 hover:border-cyan-500/35 transition-all">
              <SquarePen className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left font-medium">New chat</span>
            </motion.button>
          )}
        </div>

        {/* History */}
        {onOpenHistory && (
          <div className={cn("shrink-0", isCollapsed ? "px-2 pb-1" : "px-3 pb-1")}>
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button type="button" onClick={() => { settingsHapticTick(); onOpenHistory(); }} whileHover={{ backgroundColor: "rgba(6,182,212,0.10)" }} whileTap={{ scale: 0.95 }} transition={spring} className="flex h-11 w-11 mx-auto items-center justify-center rounded-full text-cyan-400/50 hover:text-cyan-300 transition-colors" aria-label="Chat history">
                    <History className="h-4 w-4" />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="right">Chat history</TooltipContent>
              </Tooltip>
            ) : (
              <motion.button type="button" onClick={() => { settingsHapticTick(); onOpenHistory(); }} whileHover={{ backgroundColor: "rgba(6,182,212,0.08)" }} whileTap={{ scale: 0.98 }} transition={spring} className="flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-[13px] font-normal text-slate-400 hover:text-cyan-300 transition-colors">
                <History className="h-4 w-4 shrink-0" />
                <span>Chat history</span>
              </motion.button>
            )}
          </div>
        )}

        {/* Agents */}
        {!isCollapsed && <div className="px-3 pb-1 shrink-0"><InstalledAgentsPanel compact /></div>}

        {/* Nav */}
        <ChatSidebarNavList collapsed={isCollapsed} onItemClick={onNavigate} />

        {/* Footer */}
        <div className={cn("shrink-0 border-t border-cyan-500/10", isCollapsed ? "px-2 py-3" : "px-3 py-3")}>
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button type="button" onClick={() => { settingsHapticTick(); navigate("/profile"); onNavigate?.(); }} whileHover={{ scale: 1.05, boxShadow: "0 0 12px rgba(6,182,212,0.35)" }} whileTap={{ scale: 0.96 }} transition={spring} className="flex h-9 w-9 mx-auto items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 text-[12px] font-bold text-white" aria-label="Profile">
                  {userInitials}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="right">Profile</TooltipContent>
            </Tooltip>
          ) : (
            <motion.button type="button" onClick={() => { settingsHapticTick(); navigate("/profile"); onNavigate?.(); }} whileHover={{ backgroundColor: "rgba(6,182,212,0.07)" }} whileTap={{ scale: 0.98 }} transition={spring} className="flex w-full items-center gap-3 rounded-full px-2 py-2 transition-colors">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 text-[12px] font-bold text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]">{userInitials}</div>
              <div className="min-w-0 flex-1 text-left"><p className="text-[13px] font-normal text-slate-300 truncate">{userDisplayName}</p></div>
              <ChevronRight className="h-4 w-4 text-cyan-500/30 shrink-0" />
            </motion.button>
          )}
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
