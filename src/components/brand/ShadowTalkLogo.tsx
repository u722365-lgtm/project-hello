import { useId } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export type ShadowTalkLogoProps = {
  size?: number;
  className?: string;
  /** Subtle outer glow (hero only) */
  ambient?: boolean;
  animated?: boolean;
  /** icon = squircle app mark; mark = emblem only (sidebar) */
  variant?: "icon" | "mark";
};

/**
 * ShadowTalk sovereign mark — professional app-icon style (ChatGPT / Gemini tier).
 *
 * - Rounded squircle frame (product icon)
 * - Layered “S” ribbon = Shadow (depth layers) + flow (Talk / intelligence)
 * - Eclipse dot = neural core
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
  const gradSoft = `${id}-grad-soft`;
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
        <linearGradient id={grad} x1="18" y1="14" x2="82" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="38%" stopColor="#38bdf8" />
          <stop offset="68%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <linearGradient id={gradSoft} x1="50" y1="20" x2="50" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.15" />
        </linearGradient>
        <radialGradient id={ambientId} cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>
        <filter id={glow} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#6366f1" floodOpacity="0.45" />
        </filter>
      </defs>

      {ambient && squircle && (
        <circle cx="50" cy="50" r="46" fill={`url(#${ambientId})`} opacity={0.5} />
      )}

      {squircle && (
        <>
          <rect
            x="6"
            y="6"
            width="88"
            height="88"
            rx="22"
            fill="#070b14"
          />
          <rect
            x="6"
            y="6"
            width="88"
            height="88"
            rx="22"
            fill={`url(#${gradSoft})`}
            opacity={0.35}
          />
          <rect
            x="6.5"
            y="6.5"
            width="87"
            height="87"
            rx="21"
            stroke={`url(#${grad})`}
            strokeWidth="1"
            opacity={0.45}
          />
        </>
      )}

      <g filter={squircle ? `url(#${glow})` : undefined}>
        {/* Depth layer — shadow */}
        <path
          d="M72 26C46 20 26 36 28 50c2 10 14 16 28 12 10-3 14-10 8-16-8-8-26-4-26 12 0 18 20 30 46 26 20-3 30-16 24-26"
          stroke="#1e1b4b"
          strokeWidth={squircle ? 7.5 : 6.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          transform="translate(2.8, 3.2)"
          opacity={0.9}
        />
        <path
          d="M72 26C46 20 26 36 28 50c2 10 14 16 28 12 10-3 14-10 8-16-8-8-26-4-26 12 0 18 20 30 46 26 20-3 30-16 24-26"
          stroke="#312e81"
          strokeWidth={squircle ? 6 : 5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          transform="translate(1.4, 1.6)"
          opacity={0.75}
        />

        {/* Primary ribbon — brand gradient */}
        <path
          d="M72 26C46 20 26 36 28 50c2 10 14 16 28 12 10-3 14-10 8-16-8-8-26-4-26 12 0 18 20 30 46 26 20-3 30-16 24-26"
          stroke={`url(#${grad})`}
          strokeWidth={squircle ? 5.5 : 4.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Eclipse core — shadow ∩ light (sovereign intelligence) */}
        <circle cx="50" cy="50" r="9" fill="#070b14" />
        <circle cx="50" cy="50" r="9" stroke={`url(#${grad})`} strokeWidth="1.25" opacity={0.7} />
        <circle cx="50" cy="50" r="4" fill={`url(#${grad})`} />
        <path
          d="M50 41a9 9 0 0 1 0 18"
          stroke={`url(#${grad})`}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity={0.85}
        />
      </g>
    </svg>
  );

  if (!animated) {
    return <div className="inline-flex items-center justify-center shrink-0">{svg}</div>;
  }

  return (
    <motion.div
      className="inline-flex items-center justify-center shrink-0"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: [1, 1.02, 1] }}
      transition={{
        opacity: { duration: 0.35 },
        scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      {svg}
    </motion.div>
  );
}

export default ShadowTalkLogo;
