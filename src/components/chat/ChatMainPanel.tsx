import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatMainPanelProps {
  children: React.ReactNode;
  className?: string;
}

/** Glass content column for chat messages + composer dock. */
export function ChatMainPanel({ children, className }: ChatMainPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "flex-1 flex flex-col min-w-0 relative",
        "bg-background/35 backdrop-blur-md",
        "border-l border-border/30",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
}
