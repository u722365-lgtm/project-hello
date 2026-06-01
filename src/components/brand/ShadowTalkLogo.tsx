import { useId } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export type ShadowTalkLogoProps = {
  size?: number;
  className?: string;
  ambient?: boolean;
  animated?: boolean;
};

/**
 * ShadowTalk brand mark — reads as one idea:
 * **Shadow** (silhouette in the dark) + **Talk** (speech bubble & voice waves).
 */
export function ShadowTalkLogo({
  size = 88,
  className,
  ambient = true,
  animated = true,
}: ShadowTalkLogoProps) {
  const baseId = useId().replace(/:/g, "");
  const grad = `${baseId}-grad`;
  const bubble = `${baseId}-bubble`;
  const ambientId = `${baseId}-ambient`;
  const glow = `${baseId}-glow`;

  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("overflow-visible", className)}
      role="img"
      aria-label="ShadowTalk — shadow and conversation"
    >
      <defs>
        <linearGradient id={grad} x1="16" y1="12" x2="80" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
        <linearGradient id={bubble} x1="20" y1="24" x2="72" y2="68" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id={ambientId} x1="48" y1="8" x2="48" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </linearGradient>
        <filter id={glow} x="-15%" y="-15%" width="130%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#6366f1" floodOpacity="0.4" />
        </filter>
      </defs>

      {ambient && (
        <ellipse cx="48" cy="46" rx="36" ry="32" fill={`url(#${ambientId})`} opacity={0.35} />
      )}

      {/* Cast shadow under the bubble (literal “shadow”) */}
      <ellipse cx="50" cy="78" rx="22" ry="5" fill="#000" opacity={0.35} />

      {/* Offset ghost bubble — depth */}
      <path
        d="M22 28h44a10 10 0 0 1 10 10v24a10 10 0 0 1-10 10H38l-10 12 4-14H22a10 10 0 0 1-10-10V38a10 10 0 0 1 10-10z"
        fill="#020617"
        opacity={0.5}
        transform="translate(3, 4)"
      />

      {/* Speech bubble — TALK */}
      <g filter={`url(#${glow})`}>
        <path
          d="M20 26h44a10 10 0 0 1 10 10v24a10 10 0 0 1-10 10H36l-11 13 4-15H20a10 10 0 0 1-10-10V36a10 10 0 0 1 10-10z"
          fill={`url(#${bubble})`}
          stroke={`url(#${grad})`}
          strokeWidth="2"
        />
      </g>

      {/* Silhouette profile — SHADOW (sovereign / private intelligence) */}
      <path
        d="M30 40c0-6 5-11 12-11 4 0 7 2 9 5 1-1 3-2 5-1 3 1 5 5 4 9-1 5-6 9-12 9-7 0-12-5-12-11z"
        fill="#020617"
      />
      <path
        d="M36 58c2 2 6 3 10 2 2-1 3-3 3-5h-8c-2 0-4 1-5 3z"
        fill="#020617"
      />
      {/* Eye highlight — life in the shadow */}
      <circle cx="44" cy="42" r="1.5" fill={`url(#${grad})`} opacity={0.9} />

      {/* Voice / AI waves — intelligence speaking */}
      <path
        d="M54 38c6 0 8 4 8 8s-2 8-8 8"
        stroke={`url(#${grad})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M60 34c9 0 12 6 12 12s-3 12-12 12"
        stroke={`url(#${grad})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity={0.85}
      />
      <path
        d="M66 30c12 0 16 8 16 16s-4 16-16 16"
        stroke={`url(#${grad})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity={0.65}
      />

      {/* Neural spark — “Think AI” */}
      <path
        d="M48 48l2 4 4 1-3 3 1 4-4-2-2 4-1-4-3 1-3-3-1 1-4z"
        fill={`url(#${grad})`}
        opacity={0.95}
        transform="translate(8, -6) scale(0.55)"
      />
    </svg>
  );

  if (!animated) {
    return <div className="inline-flex items-center justify-center">{svg}</div>;
  }

  return (
    <motion.div
      className="inline-flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1, y: [0, -3, 0] }}
      transition={{
        opacity: { duration: 0.35 },
        scale: { duration: 0.35 },
        y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      {svg}
    </motion.div>
  );
}

export default ShadowTalkLogo;
