import { useId } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export type ShadowTalkLogoProps = {
  size?: number;
  className?: string;
  ambient?: boolean;
  animated?: boolean;
  variant?: "icon" | "mark";
};

/**
 * Approved ShadowTalk mark — 3D gradient S-ribbons + sovereign eye core.
 */
export function ShadowTalkLogo({
  size = 88,
  className,
  ambient = true,
  animated = true,
  variant = "icon",
}: ShadowTalkLogoProps) {
  const id = useId().replace(/:/g, "");
  const grad = `${id}-grad`;
  const gradRibbon = `${id}-ribbon`;
  const gradDark = `${id}-dark`;
  const pupilGlow = `${id}-pupil`;
  const ambientId = `${id}-ambient`;
  const glow = `${id}-glow`;

  const squircle = variant === "icon";

  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("overflow-visible", className)}
      role="img"
      aria-label="ShadowTalk"
    >
      <defs>
        <linearGradient id={grad} x1="8" y1="8" x2="92" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="35%" stopColor="#3b82f6" />
          <stop offset="70%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id={gradRibbon} x1="20" y1="18" x2="80" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="40%" stopColor="#60a5fa" />
          <stop offset="75%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
        <linearGradient id={gradDark} x1="30" y1="30" x2="70" y2="70">
          <stop offset="0%" stopColor="#312e81" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>
        <radialGradient id={pupilGlow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e9d5ff" />
          <stop offset="35%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#4c1d95" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={ambientId} cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
        <filter id={glow} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#6366f1" floodOpacity="0.5" />
        </filter>
        <filter id={`${id}-pupil-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {ambient && squircle && (
        <circle cx="50" cy="50" r="48" fill={`url(#${ambientId})`} />
      )}

      {squircle && (
        <>
          <rect x="5" y="5" width="90" height="90" rx="22" fill="#030712" />
          <rect
            x="5.5"
            y="5.5"
            width="89"
            height="89"
            rx="21"
            stroke={`url(#${grad})`}
            strokeWidth="1.25"
            opacity={0.85}
          />
        </>
      )}

      <g filter={squircle ? `url(#${glow})` : undefined}>
        {/* Back ribbon — depth / shadow layer */}
        <path
          d="M74 24C48 18 24 34 26 50c2 12 16 18 32 14 12-2 16-8 10-14-10-10-28-6-28 10 0 20 22 32 48 28 22-4 32-18 26-28"
          stroke={`url(#${gradDark})`}
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          transform="translate(3, 3.5)"
          opacity={0.95}
        />

        {/* Mid ribbon — indigo bridge */}
        <path
          d="M74 24C48 18 24 34 26 50c2 12 16 18 32 14 12-2 16-8 10-14-10-10-28-6-28 10 0 20 22 32 48 28 22-4 32-18 26-28"
          stroke="#4338ca"
          strokeWidth="8.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          transform="translate(1.5, 1.8)"
          opacity={0.55}
        />

        {/* Front ribbon — luminous gradient (approved 3D S) */}
        <path
          d="M74 24C48 18 24 34 26 50c2 12 16 18 32 14 12-2 16-8 10-14-10-10-28-6-28 10 0 20 22 32 48 28 22-4 32-18 26-28"
          stroke={`url(#${gradRibbon})`}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Highlight edge — glass sheen */}
        <path
          d="M68 28C52 24 36 34 36 48c0 8 8 12 18 10"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity={0.22}
        />

        {/* Sovereign eye — pupil */}
        <circle cx="50" cy="50" r="12" fill="#050508" />
        <circle cx="50" cy="50" r="12" stroke={`url(#${grad})`} strokeWidth="0.75" opacity={0.35} />
        <circle cx="50" cy="50" r="7" fill={`url(#${pupilGlow})`} opacity={0.5} />
        <circle
          cx="50"
          cy="50"
          r="3.2"
          fill="#c084fc"
          filter={`url(#${id}-pupil-blur)`}
        />
        <circle cx="51" cy="49" r="1" fill="white" opacity={0.9} />
      </g>
    </svg>
  );

  if (!animated) {
    return <div className="inline-flex items-center justify-center shrink-0">{svg}</div>;
  }

  return (
    <motion.div
      className="inline-flex items-center justify-center shrink-0"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: [1, 1.025, 1] }}
      transition={{
        opacity: { duration: 0.4 },
        scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      {svg}
    </motion.div>
  );
}

export default ShadowTalkLogo;
