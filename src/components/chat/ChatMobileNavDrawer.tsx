import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SETTINGS_SPRING } from "@/lib/settingsMotion";
import { ChatShadowSidebar } from "@/components/chat/ChatShadowSidebar";

interface ChatMobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
  userInitials: string;
  userDisplayName: string;
  onNewChat: () => void;
  onOpenHistory: () => void;
}

export function ChatMobileNavDrawer({
  open,
  onClose,
  userInitials,
  userDisplayName,
  onNewChat,
  onOpenHistory,
}: ChatMobileNavDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-md md:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={SETTINGS_SPRING}
            className="fixed left-0 top-0 bottom-0 z-[70] md:hidden shadow-elevated"
          >
            <div className="relative h-full">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute right-2 top-2 z-20 h-9 w-9 rounded-xl"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </Button>
              <ChatShadowSidebar
                forceExpanded
                mobileDrawer
                userInitials={userInitials}
                userDisplayName={userDisplayName}
                onNewChat={() => {
                  onNewChat();
                  onClose();
                }}
                onOpenHistory={() => {
                  onOpenHistory();
                  onClose();
                }}
                onNavigate={onClose}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
