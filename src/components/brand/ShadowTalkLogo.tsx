import { useId } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export type ShadowTalkLogoProps = {
  /** Width & height in pixels */
  size?: number;
  className?: string;
  /** Soft halo only — no circular “plate” */
  ambient?: boolean;
  /** Gentle idle motion for hero placement */
  animated?: boolean;
};

/**
 * Custom ShadowTalk mark: overlapping “shadow” crescent + intelligence arc + neural core.
 * Replaces the generic sparkle-in-a-disc orb.
 */
export function ShadowTalkLogo({
  size = 88,
  className,
  ambient = true,
  animated = true,
}: ShadowTalkLogoProps) {
  const baseId = useId().replace(/:/g, "");
  const uid = `${baseId}-grad`;
  const shadowUid = `${baseId}-shadow`;
  const ambientUid = `${baseId}-ambient`;

  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("overflow-visible", className)}
      role="img"
      aria-label="ShadowTalk"
    >
      <defs>
        <linearGradient id={uid} x1="12" y1="8" x2="84" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="45%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
        <linearGradient id={ambientUid} x1="48" y1="0" x2="48" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </linearGradient>
        <filter id={shadowUid} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#6366f1" floodOpacity="0.35" />
        </filter>
      </defs>

      {ambient && (
        <ellipse cx="48" cy="50" rx="34" ry="30" fill={`url(#${ambientUid})`} opacity={0.22} />
      )}

      {/* Shadow layer — offset duplicate of the main ribbon */}
      <g opacity={0.45} transform="translate(3.5, 4)">
        <path
          d="M58 22c-18-2-32 8-32 24 0 10 8 16 16 14 6-1.5 10-6 6-10-5-5-18-3-18 10 0 14 14 24 32 22 16-1.5 26-12 22-22"
          stroke="#0f172a"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      {/* Intelligence ribbon (stylized S + dialogue flow) */}
      <g filter={`url(#${shadowUid})`}>
        <path
          d="M58 22c-18-2-32 8-32 24 0 10 8 16 16 14 6-1.5 10-6 6-10-5-5-18-3-18 10 0 14 14 24 32 22 16-1.5 26-12 22-22"
          stroke={`url(#${uid})`}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Dialogue tail */}
        <path
          d="M72 58 L82 68 L74 62"
          stroke={`url(#${uid})`}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={0.85}
        />
      </g>

      {/* Neural core */}
      <circle cx="44" cy="44" r="6" fill={`url(#${uid})`} />
      <circle cx="44" cy="44" r="10" stroke={`url(#${uid})`} strokeWidth="1.5" opacity={0.45} />

      {/* Ascending signal dots */}
      <circle cx="68" cy="30" r="3" fill="#22d3ee" opacity={0.9} />
      <circle cx="74" cy="42" r="3.5" fill="#818cf8" />
      <circle cx="70" cy="54" r="2.5" fill="#c084fc" opacity={0.85} />
    </svg>
  );

  if (!animated) {
    return <div className="inline-flex items-center justify-center">{svg}</div>;
  }

  return (
    <motion.div
      className="inline-flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }}
      transition={{
        opacity: { duration: 0.4 },
        scale: { duration: 0.4 },
        y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      {svg}
    </motion.div>
  );
}

export default ShadowTalkLogo;
