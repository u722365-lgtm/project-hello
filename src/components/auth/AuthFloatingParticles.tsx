import { motion } from "framer-motion";

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: `${8 + (i * 17) % 84}%`,
  y: `${5 + (i * 23) % 90}%`,
  size: 2 + (i % 3),
  delay: i * 0.35,
  duration: 4 + (i % 5),
}));

type Props = { disabled?: boolean };

export function AuthFloatingParticles({ disabled }: Props) {
  if (disabled) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {PARTICLES.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-gradient-to-br from-violet-400/60 to-sky-400/40"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -28, 0],
            x: [0, (p.id % 2 === 0 ? 12 : -12), 0],
            opacity: [0.15, 0.85, 0.15],
            scale: [1, 1.8, 1],
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
