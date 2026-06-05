import { motion } from "framer-motion";
import {
  Sparkles,
  SquarePen,
  Search,
  LayoutGrid,
  Settings,
  PanelLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";
import { settingsHapticTick } from "@/lib/settingsFeedback";

interface ChatIconRailProps {
  userInitials: string;
  onNewChat: () => void;
  onOpenHistory: () => void;
  onOpenTools: () => void;
  onOpenSettings: () => void;
  onOpenNav: () => void;
}

export const ChatIconRail = ({
  userInitials,
  onNewChat,
  onOpenHistory,
  onOpenTools,
  onOpenSettings,
  onOpenNav,
}: ChatIconRailProps) => {
  const navigate = useNavigate();
  const { spring, reduced } = useSettingsMotion();

  const navItems = [
    { icon: PanelLeft, label: "Menu", onClick: onOpenNav, highlight: true },
    { icon: SquarePen, label: "New chat", onClick: onNewChat },
    { icon: Search, label: "History", onClick: onOpenHistory },
    { icon: LayoutGrid, label: "Tools", onClick: onOpenTools },
  ];

  const tap = (fn: () => void) => () => {
    settingsHapticTick();
    fn();
  };

  const RailButton = ({
    icon: Icon,
    label,
    onClick,
    highlight,
  }: {
    icon: typeof SquarePen;
    label: string;
    onClick: () => void;
    highlight?: boolean;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          whileHover={reduced ? undefined : { scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={spring}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={tap(onClick)}
            className={
              highlight
                ? "h-10 w-10 rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30"
                : "h-10 w-10 rounded-xl text-muted-foreground/80 hover:text-foreground hover:bg-primary/10"
            }
            aria-label={label}
          >
            <Icon className="h-5 w-5" />
          </Button>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <aside className="flex md:hidden w-[64px] xs:w-[72px] shrink-0 flex-col items-center py-2 xs:py-3 border-r border-sidebar-border/80 bg-sidebar/95 backdrop-blur-2xl relative z-30 safe-top">
        <motion.div whileTap={{ scale: 0.94 }} transition={spring} className="mb-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={tap(() => navigate("/chatbot"))}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/30 shadow-[0_0_16px_hsl(var(--primary)/0.15)]"
                aria-label="ShadowTalk home"
              >
                <Sparkles className="h-5 w-5 text-primary" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Home</TooltipContent>
          </Tooltip>
        </motion.div>

        <nav className="flex flex-1 flex-col items-center gap-1.5">
          {navItems.map((item) => (
            <RailButton key={item.label} {...item} />
          ))}
        </nav>

        <div className="flex flex-col items-center gap-1.5 mt-auto pt-2">
          <RailButton icon={Settings} label="Settings" onClick={onOpenSettings} />
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                transition={spring}
                onClick={tap(() => navigate("/profile"))}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary ring-1 ring-primary/35"
                aria-label="Profile"
              >
                {userInitials}
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="right">Profile</TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
};
