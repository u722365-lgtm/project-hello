import { motion } from "framer-motion";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";

interface SettingsStaggerProps {
  children: React.ReactNode;
  className?: string;
}

export function SettingsStagger({ children, className }: SettingsStaggerProps) {
  const { staggerList } = useSettingsMotion();

  return (
    <motion.div
      className={className}
      variants={staggerList}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}

export function SettingsStaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { staggerItem } = useSettingsMotion();

  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}
