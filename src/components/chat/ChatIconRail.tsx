import { motion } from "framer-motion";
import {
  Sparkles,
  SquarePen,
  Search,
  LayoutGrid,
  Settings,
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
}

export const ChatIconRail = ({
  userInitials,
  onNewChat,
  onOpenHistory,
  onOpenTools,
  onOpenSettings,
}: ChatIconRailProps) => {
  const navigate = useNavigate();
  const { spring, reduced } = useSettingsMotion();

  const navItems = [
    { icon: SquarePen, label: "New chat", onClick: onNewChat },
    { icon: Search, label: "Search chats", onClick: onOpenHistory },
    { icon: LayoutGrid, label: "Tools", onClick: onOpenTools },
  ];

  const tap = (fn: () => void) => () => {
    settingsHapticTick();
    fn();
  };

  return (
    <TooltipProvider delayDuration={200}>
      <aside className="flex md:hidden w-[72px] shrink-0 flex-col items-center py-4 border-r border-sidebar-border/80 bg-sidebar/95 backdrop-blur-xl relative z-30">
        <motion.div whileTap={{ scale: 0.94 }} transition={spring}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={tap(() => navigate("/"))}
                className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/25"
                aria-label="ShadowTalk home"
              >
                <Sparkles className="h-6 w-6 text-primary" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">ShadowTalk</TooltipContent>
          </Tooltip>
        </motion.div>

        <nav className="flex flex-1 flex-col items-center gap-1">
          {navItems.map(({ icon: Icon, label, onClick }) => (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <motion.div
                  whileHover={reduced ? undefined : { scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  transition={spring}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={tap(onClick)}
                    className="h-10 w-10 rounded-xl text-muted-foreground/80 hover:text-foreground hover:bg-primary/10"
                    aria-label={label}
                  >
                    <Icon className="h-5 w-5" />
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          ))}
        </nav>

        <div className="flex flex-col items-center gap-1 mt-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                whileHover={reduced ? undefined : { scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                transition={spring}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={tap(onOpenSettings)}
                  className="h-10 w-10 rounded-xl text-muted-foreground/80 hover:text-foreground hover:bg-primary/10"
                  aria-label="Settings"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                transition={spring}
                onClick={tap(() => navigate("/profile"))}
                className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground ring-1 ring-primary/30"
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
