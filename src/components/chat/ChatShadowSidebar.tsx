import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Menu,
  Plus,
  MessageSquare,
  Trash2,
  Archive,
  Settings,
  Sparkles
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";
import { settingsHapticTick } from "@/lib/settingsFeedback";
import { SETTINGS_SPRING } from "@/lib/settingsMotion";
import { CHAT_SIDEBAR_WIDTH_COLLAPSED, CHAT_SIDEBAR_WIDTH_EXPANDED } from "@/lib/chatSidebarNav";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InstalledAgentsPanel } from "@/components/marketplace/InstalledAgentsPanel";
import { ChatSidebarNavList } from "@/components/chat/ChatSidebarNavList";

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  archived_at?: string | null;
}

interface ChatShadowSidebarProps {
  userInitials: string;
  userDisplayName: string;
  onNewChat: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileDrawer?: boolean;
  forceExpanded?: boolean;
  onNavigate?: () => void;

  conversations?: Conversation[];
  currentConversationId?: string | null;
  isArchived?: (conversation: Conversation) => boolean;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  onOpenSettings?: () => void;
}

export function ChatShadowSidebar({
  userInitials,
  userDisplayName,
  onNewChat,
  collapsed = false,
  onToggleCollapse,
  mobileDrawer = false,
  forceExpanded = false,
  onNavigate,
  conversations = [],
  currentConversationId,
  isArchived = () => false,
  onSelect,
  onDelete,
  onArchive,
  onOpenSettings
}: ChatShadowSidebarProps) {
  const navigate = useNavigate();
  const { spring } = useSettingsMotion();
  const isCollapsed = forceExpanded ? false : collapsed;
  const width = isCollapsed ? CHAT_SIDEBAR_WIDTH_COLLAPSED : CHAT_SIDEBAR_WIDTH_EXPANDED;
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const activeConversations = conversations.filter((c) => !isArchived(c));
  
  // Grouping logic
  const grouped = activeConversations.reduce((acc, conv) => {
    const date = new Date(conv.created_at);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    let group = "Earlier";
    if (days === 0) group = "Today";
    else if (days === 1) group = "Yesterday";
    else if (days < 7) group = "Previous 7 Days";
    else if (days < 30) group = "Previous 30 Days";

    if (!acc[group]) acc[group] = [];
    acc[group].push(conv);
    return acc;
  }, {} as Record<string, Conversation[]>);

  const groupOrder = ["Today", "Yesterday", "Previous 7 Days", "Previous 30 Days", "Earlier"];

  return (
    <TooltipProvider delayDuration={300}>
      <motion.aside
        animate={{ width }}
        transition={SETTINGS_SPRING}
        className={cn(
          "shrink-0 flex flex-col relative z-30 overflow-hidden",
          mobileDrawer ? "flex h-full min-h-0 bg-[#07090f]" : "hidden md:flex h-full min-h-0 bg-[#07090f] border-r border-cyan-500/10 backdrop-blur-xl"
        )}
        style={{ width }}
      >
        {/* Top Header: Hamburger & Title */}
        <div className="flex h-[64px] shrink-0 items-center px-4 gap-3">
          {onToggleCollapse && !mobileDrawer && (
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  type="button"
                  onClick={() => { settingsHapticTick(); onToggleCollapse(); }}
                  whileHover={{ backgroundColor: "rgba(6,182,212,0.10)" }}
                  whileTap={{ scale: 0.94 }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-cyan-400/60 hover:text-cyan-300 transition-colors"
                >
                  <Menu className="h-5 w-5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="right">{isCollapsed ? "Expand" : "Collapse"}</TooltipContent>
            </Tooltip>
          )}
          
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={spring}
                className="flex items-center gap-2 overflow-hidden"
              >
                <Sparkles className="h-5 w-5 text-cyan-400 shrink-0" />
                <span className="text-[18px] font-semibold bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent whitespace-nowrap tracking-tight">ShadowTalk</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* New Chat Button */}
        <div className="px-3 pb-4 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                type="button"
                onClick={() => { settingsHapticTick(); onNewChat(); }}
                whileHover={{ backgroundColor: "rgba(6,182,212,0.15)", boxShadow: "0 0 16px rgba(6,182,212,0.15)" }}
                whileTap={{ scale: 0.96 }}
                className={cn(
                  "flex items-center rounded-2xl bg-cyan-500/10 text-cyan-300 transition-all overflow-hidden border border-cyan-500/20",
                  isCollapsed ? "h-11 w-11 justify-center mx-auto" : "h-11 px-4 gap-3 w-full"
                )}
              >
                <Plus className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span className="font-medium whitespace-nowrap text-sm">New chat</span>}
              </motion.button>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="right">New chat</TooltipContent>}
          </Tooltip>
        </div>

        {/* Recents / History List */}
        <ScrollArea className="flex-1 px-2">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pb-4"
              >
                <div className="px-2 pb-1 shrink-0 mb-4">
                  <InstalledAgentsPanel compact />
                </div>

                {activeConversations.length > 0 && (
                  <div className="px-4 pb-2 text-[11px] font-medium text-cyan-500/60">
                    Recent
                  </div>
                )}
                
                <LayoutGroup id="sidebar-history">
                  {groupOrder.map((group) => {
                    const items = grouped[group];
                    if (!items?.length) return null;
                    return (
                      <div key={group} className="space-y-0.5 mb-4">
                        <div className="px-4 py-1 text-[11px] font-semibold text-cyan-400/40">{group}</div>
                        {items.map((conv) => {
                          const isActive = currentConversationId === conv.id;
                          const isHovered = hoveredId === conv.id;
                          return (
                            <motion.div
                              key={conv.id}
                              layout
                              onMouseEnter={() => setHoveredId(conv.id)}
                              onMouseLeave={() => setHoveredId(null)}
                              className="relative px-2"
                            >
                              <button
                                type="button"
                                onClick={() => { settingsHapticTick(); onSelect?.(conv.id); }}
                                className={cn(
                                  "relative w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors group",
                                  isActive ? "bg-cyan-500/15 text-cyan-300" : "text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-200"
                                )}
                              >
                                <MessageSquare className={cn("h-4 w-4 shrink-0", isActive ? "text-cyan-400" : "text-slate-500")} />
                                <span className="flex-1 text-[13px] truncate pr-4">{conv.title || "Untitled chat"}</span>
                                
                                <div className={cn(
                                  "absolute right-3 flex items-center gap-1 opacity-0 transition-opacity",
                                  (isHovered || isActive) && "opacity-100"
                                )}>
                                  <button
                                    className="p-1 rounded-md hover:bg-cyan-500/20 text-cyan-500/50 hover:text-cyan-300 transition-colors"
                                    onClick={(e) => { e.stopPropagation(); onArchive?.(conv.id); }}
                                    title="Archive"
                                  >
                                    <Archive className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    className="p-1 rounded-md hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                                    onClick={(e) => { e.stopPropagation(); onDelete?.(conv.id); }}
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </button>
                            </motion.div>
                          );
                        })}
                      </div>
                    );
                  })}
                </LayoutGroup>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>

        {/* Bottom Nav / Settings */}
        <div className="shrink-0 p-3 flex flex-col gap-1 mt-auto border-t border-cyan-500/10 bg-[#07090f]">
          <ChatSidebarNavList collapsed={isCollapsed} onItemClick={onNavigate} />
          
          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => { settingsHapticTick(); onOpenSettings?.(); }}
                className={cn(
                  "flex items-center rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors",
                  isCollapsed ? "h-11 w-11 justify-center mx-auto" : "h-11 px-3 gap-3 w-full"
                )}
              >
                <Settings className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
              </button>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="right">Settings</TooltipContent>}
          </Tooltip>
          
          {/* Profile */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => { settingsHapticTick(); navigate("/profile"); onNavigate?.(); }}
                className={cn(
                  "flex items-center rounded-xl hover:bg-cyan-500/10 transition-colors mt-1",
                  isCollapsed ? "h-11 w-11 justify-center mx-auto" : "h-11 px-2 gap-3 w-full"
                )}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 text-[11px] font-bold text-white shadow-sm">
                  {userInitials}
                </div>
                {!isCollapsed && (
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-[13px] font-medium text-slate-300 truncate">{userDisplayName}</p>
                  </div>
                )}
              </button>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="right">Profile</TooltipContent>}
          </Tooltip>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
