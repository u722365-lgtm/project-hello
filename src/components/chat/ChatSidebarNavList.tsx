import { NavLink, useLocation } from "react-router-dom";
import { motion, LayoutGroup } from "framer-motion";
import { cn } from "@/lib/utils";
import { CHAT_SIDEBAR_NAV, type ChatSidebarNavItem } from "@/lib/chatSidebarNav";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";
import { settingsHapticTick } from "@/lib/settingsFeedback";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatSidebarNavListProps {
  collapsed: boolean;
  onItemClick?: () => void;
}

function NavRow({
  item,
  collapsed,
  active,
  onItemClick,
}: {
  item: ChatSidebarNavItem;
  collapsed: boolean;
  active: boolean;
  onItemClick?: () => void;
}) {
  const { navSpring, spring } = useSettingsMotion();
  const Icon = item.icon;
  const label = collapsed ? item.shortLabel ?? item.label : item.label;

  const inner = (
    <motion.span
      className={cn(
        "relative flex items-center rounded-xl text-[13px] font-medium transition-colors",
        collapsed ? "justify-center h-11 w-11 mx-auto" : "gap-3 px-3 py-2.5 w-full",
        active ? "text-sidebar-foreground" : "text-muted-foreground hover:text-sidebar-foreground",
      )}
      whileHover={active ? undefined : { x: collapsed ? 0 : 5, scale: collapsed ? 1.05 : 1 }}
      whileTap={{ scale: 0.96 }}
      transition={spring}
    >
      {active && (
        <motion.span
          layoutId="chat-sidebar-nav-active"
          className={cn(
            "absolute inset-0 rounded-xl border border-primary/25 bg-primary/12",
            "shadow-[inset_0_1px_0_hsl(var(--primary)/0.2),0_0_20px_hsl(var(--primary)/0.08)]",
          )}
          transition={navSpring}
        />
      )}
      <Icon className={cn("relative z-10 h-4 w-4 shrink-0", active && "text-primary")} />
      {!collapsed && (
        <>
          <span className="relative z-10 flex-1 truncate">{label}</span>
          {active && (
            <motion.span
              layoutId="chat-sidebar-nav-dot"
              className="relative z-10 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]"
              transition={navSpring}
            />
          )}
        </>
      )}
    </motion.span>
  );

  const link = (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={() => {
        settingsHapticTick();
        onItemClick?.();
      }}
      className="block"
    >
      {inner}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

export function ChatSidebarNavList({ collapsed, onItemClick }: ChatSidebarNavListProps) {
  const location = useLocation();
  const { staggerList, staggerItem } = useSettingsMotion();

  const isActive = (item: ChatSidebarNavItem) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);

  const workspace = CHAT_SIDEBAR_NAV.filter((i) => i.section === "workspace");
  const explore = CHAT_SIDEBAR_NAV.filter((i) => i.section === "explore");

  const renderSection = (title: string, items: ChatSidebarNavItem[]) => (
    <div className={cn("space-y-0.5", collapsed && "space-y-1")}>
      {!collapsed && (
        <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
          {title}
        </p>
      )}
      {items.map((item) => (
        <motion.div key={item.to} variants={staggerItem}>
          <NavRow
            item={item}
            collapsed={collapsed}
            active={isActive(item)}
            onItemClick={onItemClick}
          />
        </motion.div>
      ))}
    </div>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <LayoutGroup id="chat-sidebar-nav">
        <motion.nav
          variants={staggerList}
          initial="hidden"
          animate="visible"
          className="flex-1 px-2 py-2 space-y-4 overflow-y-auto min-h-0 scrollbar-none"
        >
          {renderSection("Workspace", workspace)}
          {renderSection("Explore", explore)}
        </motion.nav>
      </LayoutGroup>
    </TooltipProvider>
  );
}
