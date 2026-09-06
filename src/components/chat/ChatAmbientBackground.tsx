import { motion } from 'framer-motion';

/** Dynamic ambient mesh gradient backdrop for the premium flagship look. */
export function ChatAmbientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#060911] pointer-events-none select-none">
      {/* Top-left Indigo / Violet Radiant Mesh */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.35, 0.55, 0.35],
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[-15%] left-[-10%] w-[65vw] h-[65vw] rounded-full bg-gradient-to-br from-indigo-600/25 via-violet-600/18 to-transparent blur-[140px]"
      />

      {/* Top-right Cyan / Sky Radiant Mesh */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.25, 0.45, 0.25],
          x: [0, -40, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[-10%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-bl from-cyan-500/22 via-sky-600/15 to-transparent blur-[130px]"
      />

      {/* Center Subtle Frontier Aura */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 38%, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.04) 40%, transparent 70%)",
        }}
        aria-hidden
      />

      {/* Micro-grid constellation texture */}
      <div
        className="fixed inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:32px_32px] opacity-40"
        aria-hidden
      />

      <div className="fixed inset-0 settings-grain opacity-15" aria-hidden />
    </div>
  );
}
