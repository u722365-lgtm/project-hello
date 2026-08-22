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
      <motion.aside animate={{ width }} transition={SETTINGS_SPRING} className={cn("shrink-0 flex flex-col relative z-30 overflow-hidden", mobileDrawer ? "flex h-full min-h-0 bg-[#1c1c1c]" : "hidden md:flex h-full min-h-0 bg-[#1c1c1c]")} style={{ width }}>

        {/* Top row */}
        <div className={cn("shrink-0 flex items-center", isCollapsed ? "flex-col gap-3 px-2 pt-4 pb-2" : "flex-row gap-2 px-3 pt-4 pb-2")}>
          {onToggleCollapse && !mobileDrawer ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button type="button" onClick={() => { settingsHapticTick(); onToggleCollapse(); }} whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }} whileTap={{ scale: 0.94 }} transition={spring} className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 hover:text-white transition-colors shrink-0" aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
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
                <span className="text-[19px] font-normal text-white/90 tracking-tight whitespace-nowrap select-none">ShadowTalk</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* New Chat */}
        <div className={cn("shrink-0", isCollapsed ? "px-2 py-3" : "px-3 py-3")}>
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button type="button" onClick={() => { settingsHapticTick(); onNewChat(); }} whileHover={{ backgroundColor: "rgba(255,255,255,0.10)" }} whileTap={{ scale: 0.95 }} transition={spring} className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl text-white/80 hover:text-white transition-colors" aria-label="New chat">
                  <SquarePen className="h-5 w-5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="right">New chat</TooltipContent>
            </Tooltip>
          ) : (
            <motion.button type="button" onClick={() => { settingsHapticTick(); onNewChat(); }} whileHover={{ backgroundColor: "rgba(255,255,255,0.10)" }} whileTap={{ scale: 0.98 }} transition={spring} className="flex w-full items-center gap-3 rounded-full bg-white/[0.06] px-4 py-3 text-sm text-white/85 hover:text-white transition-colors">
              <SquarePen className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left font-normal">New chat</span>
            </motion.button>
          )}
        </div>

        {/* History */}
        {onOpenHistory && (
          <div className={cn("shrink-0", isCollapsed ? "px-2 pb-1" : "px-3 pb-1")}>
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button type="button" onClick={() => { settingsHapticTick(); onOpenHistory(); }} whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }} whileTap={{ scale: 0.95 }} transition={spring} className="flex h-11 w-11 mx-auto items-center justify-center rounded-full text-white/60 hover:text-white transition-colors" aria-label="Chat history">
                    <History className="h-4 w-4" />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="right">Chat history</TooltipContent>
              </Tooltip>
            ) : (
              <motion.button type="button" onClick={() => { settingsHapticTick(); onOpenHistory(); }} whileHover={{ backgroundColor: "rgba(255,255,255,0.07)" }} whileTap={{ scale: 0.98 }} transition={spring} className="flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-[13px] font-normal text-white/65 hover:text-white/90 transition-colors">
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
        <div className={cn("shrink-0 border-t border-white/5", isCollapsed ? "px-2 py-3" : "px-3 py-3")}>
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button type="button" onClick={() => { settingsHapticTick(); navigate("/profile"); onNavigate?.(); }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} transition={spring} className="flex h-9 w-9 mx-auto items-center justify-center rounded-full bg-primary text-[12px] font-semibold text-primary-foreground" aria-label="Profile">
                  {userInitials}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="right">Profile</TooltipContent>
            </Tooltip>
          ) : (
            <motion.button type="button" onClick={() => { settingsHapticTick(); navigate("/profile"); onNavigate?.(); }} whileHover={{ backgroundColor: "rgba(255,255,255,0.07)" }} whileTap={{ scale: 0.98 }} transition={spring} className="flex w-full items-center gap-3 rounded-full px-2 py-2 transition-colors">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-semibold text-primary-foreground">{userInitials}</div>
              <div className="min-w-0 flex-1 text-left"><p className="text-[13px] font-normal text-white/85 truncate">{userDisplayName}</p></div>
              <ChevronRight className="h-4 w-4 text-white/30 shrink-0" />
            </motion.button>
          )}
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
