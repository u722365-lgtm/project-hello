import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";
import type { SettingsNavSection } from "@/components/settings/SettingsNav";
import { SettingsSectionHeader } from "@/components/settings/SettingsSectionHeader";
import { LayoutGrid } from "lucide-react";

interface SettingsHomeGridProps {
  sections: readonly SettingsNavSection[];
  onSelect: (id: string) => void;
}

export function SettingsHomeGrid({ sections, onSelect }: SettingsHomeGridProps) {
  const { staggerList, staggerItem } = useSettingsMotion();
  const tiles = sections.filter((s) => s.id !== "home");

  return (
    <motion.div variants={staggerList} initial="hidden" animate="visible" className="space-y-6">
      <SettingsSectionHeader
        icon={LayoutGrid}
        title="Overview"
        description="Jump to any area — or use ⌘K to search every setting"
      />

      <motion.div
        variants={staggerList}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3"
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
  const { staggerItem, reduced } = useSettingsMotion();
  const Icon = tile.icon;

  return (
    <motion.button
      type="button"
      variants={staggerItem}
      custom={index}
      onClick={onSelect}
      whileHover={reduced ? undefined : { y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group text-left relative overflow-hidden rounded-2xl border border-border/50",
        "bg-gradient-to-br from-muted/30 to-background/80 p-5 transition-shadow",
        "hover:border-primary/40 hover:shadow-[0_8px_32px_hsl(var(--primary)/0.12)]",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 border border-primary/25">
          <Icon className="h-5 w-5 text-primary" />
        </span>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
      </div>
      <p className="mt-4 font-semibold text-foreground">{tile.label}</p>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">{tile.desc}</p>
    </motion.button>
  );
}
