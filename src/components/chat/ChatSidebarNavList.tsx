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
        "relative flex items-center rounded-full text-[13px] font-normal transition-colors duration-200",
        !active && "hover:bg-white/[0.08]",
        collapsed ? "justify-center h-11 w-11 mx-auto" : "gap-3 px-4 py-2.5 w-full",
        active ? "text-white" : "text-white/60 hover:text-white/90",
      )}
      whileHover={active ? undefined : { x: collapsed ? 0 : 2 }}
      whileTap={{ scale: 0.97 }}
      transition={spring}
    >
      {active && (
        <motion.span
          layoutId="chat-sidebar-nav-active"
          className={cn("absolute inset-0 rounded-full bg-white/[0.12]")}
          transition={navSpring}
        />
      )}
      <Icon className={cn("relative z-10 h-4 w-4 shrink-0", active ? "text-white" : "text-white/60")} />
      {!collapsed && (
        <>
          <span className="relative z-10 flex-1 truncate">{label}</span>
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

  const isActive = (item: ChatSidebarNavItem) => {
    const [itemPath, itemQuery] = item.to.split("?");
    const pathOk = item.end
      ? location.pathname === itemPath
      : location.pathname === itemPath || location.pathname.startsWith(`${itemPath}/`);
    if (!pathOk) return false;
    if (!itemQuery) return true;
    const expected = new URLSearchParams(itemQuery);
    const actual = new URLSearchParams(location.search);
    for (const [key, value] of expected) {
      if (actual.get(key) !== value) return false;
    }
    return true;
  };

  const workspace = CHAT_SIDEBAR_NAV.filter((i) => i.section === "workspace");
  const explore = CHAT_SIDEBAR_NAV.filter((i) => i.section === "explore");

  const renderSection = (title: string, items: ChatSidebarNavItem[]) => (
    <div className={cn("space-y-0.5", collapsed && "space-y-1")}>
      {!collapsed && (
        <p className="px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
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
