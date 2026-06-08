import { motion } from "framer-motion";

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  x: `${6 + (i * 19) % 88}%`,
  y: `${8 + (i * 21) % 85}%`,
  size: 2 + (i % 3),
  delay: i * 0.4,
  duration: 5 + (i % 4),
}));

type Props = { disabled?: boolean };

export function AdminAmbientBackground({ disabled }: Props) {
  if (disabled) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <motion.div
        className="absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-violet-500/15 blur-[100px]"
        animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-16 bottom-1/4 h-72 w-72 rounded-full bg-cyan-500/12 blur-[110px]"
        animate={{ x: [0, -35, 0], y: [0, 25, 0], scale: [1, 1.15, 1], opacity: [0.15, 0.35, 0.15] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />
      <motion.div
        className="absolute left-1/2 top-0 h-48 w-96 -translate-x-1/2 rounded-full bg-amber-500/8 blur-[90px]"
        animate={{ opacity: [0.08, 0.2, 0.08], scale: [1, 1.25, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      {PARTICLES.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-gradient-to-br from-violet-400/50 to-cyan-400/30"
          style={{ left: p.x, top: p.y, width: p.size, height: p.size }}
          animate={{
            y: [0, -24, 0],
            x: [0, p.id % 2 === 0 ? 10 : -10, 0],
            opacity: [0.1, 0.7, 0.1],
            scale: [1, 1.6, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
