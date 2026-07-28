import { isLeanMotionEnabled } from "@/lib/perf/leanMotion";

interface FloatingOrbsProps {
  /** Extra className applied to wrapper */
  className?: string;
}

/** Decorative floating orbs — removed under lean motion for GPU budget. */
export function FloatingOrbs({ className }: FloatingOrbsProps) {
  if (isLeanMotionEnabled()) return null;
  return <div className={className} aria-hidden data-decorative="ambient" />;
}
