import { isLeanMotionEnabled } from "@/lib/perf/leanMotion";

type Props = { disabled?: boolean };

/** Particle field — disabled under lean motion (default). */
export function AuthFloatingParticles({ disabled }: Props) {
  if (disabled || isLeanMotionEnabled()) return null;
  return null;
}
