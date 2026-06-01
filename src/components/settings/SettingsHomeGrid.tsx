import { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";
import type { SettingsNavSection } from "@/components/settings/SettingsNav";
import { SettingsSectionHeader } from "@/components/settings/SettingsSectionHeader";
import { LayoutGrid } from "lucide-react";
import { settingsHapticTick } from "@/lib/settingsFeedback";

interface SettingsHomeGridProps {
  sections: readonly SettingsNavSection[];
  onSelect: (id: string) => void;
}

export function SettingsHomeGrid({ sections, onSelect }: SettingsHomeGridProps) {
  const { staggerList } = useSettingsMotion();
  const tiles = sections.filter((s) => s.id !== "home");

  return (
    <motion.div variants={staggerList} initial="hidden" animate="visible" className="space-y-6">
      <SettingsSectionHeader
        icon={LayoutGrid}
        title="Overview"
        description="Pick a category — smooth as silk. Use ⌘K to search, ↑↓ to browse sections."
      />

      <motion.div
        variants={staggerList}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {tiles.map((tile, i) => (
          <HomeTile key={tile.id} tile={tile} index={i} onSelect={() => onSelect(tile.id)} />
        ))}
      </motion.div>
    </motion.div>
  );
}

function HomeTile({
  tile,
  index,
  onSelect,
}: {
  tile: SettingsNavSection;
  index: number;
  onSelect: () => void;
}) {
  const { staggerItem, reduced, spring } = useSettingsMotion();
  const Icon = tile.icon;
  const ref = useRef<HTMLButtonElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useMotionValue(0), { stiffness: 300, damping: 28 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 300, damping: 28 });

  const handleMove = (e: React.MouseEvent) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * 10);
    rotateX.set(-py * 10);
    x.set(px * 8);
    y.set(py * 8);
  };

  const handleLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    x.set(0);
    y.set(0);
  };

  const transform = useMotionTemplate`perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate(${x}px, ${y}px)`;

  return (
    <motion.button
      ref={ref}
      type="button"
      variants={staggerItem}
      custom={index}
      onClick={() => {
        settingsHapticTick();
        onSelect();
      }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={reduced ? undefined : { transform }}
      whileTap={{ scale: 0.97 }}
      transition={spring}
      className={cn(
        "group text-left relative overflow-hidden rounded-2xl border border-border/50",
        "bg-gradient-to-br from-muted/40 via-background/90 to-primary/5 p-5",
        "hover:border-primary/50 hover:shadow-[0_12px_40px_hsl(var(--primary)/0.15)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
      )}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_var(--mouse-x,50%)_var(--mouse-y,0%),hsl(var(--primary)/0.12),transparent_55%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center" />
      <div className="relative flex items-start justify-between gap-3">
        <motion.span
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 border border-primary/30 shadow-inner"
          whileHover={{ scale: 1.08 }}
          transition={spring}
        >
          <Icon className="h-5 w-5 text-primary" />
        </motion.span>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
      </div>
      <p className="relative mt-4 font-semibold text-foreground tracking-tight">{tile.label}</p>
      <p className="relative mt-1.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">
        {tile.desc}
      </p>
    </motion.button>
  );
}
