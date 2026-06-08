import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { useAdminMotion } from "@/hooks/useAdminMotion";
import { cn } from "@/lib/utils";

type AdminAnimatedCardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
};

export function AdminAnimatedCard({ children, className, hover = true }: AdminAnimatedCardProps) {
  const { cardHover, reduced } = useAdminMotion();

  return (
    <motion.div
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
      whileHover={hover && !reduced ? cardHover : undefined}
      className="h-full"
    >
      <Card className={cn("h-full border-border/80 bg-card/90 backdrop-blur-sm transition-shadow", className)}>
        {children}
      </Card>
    </motion.div>
  );
}
