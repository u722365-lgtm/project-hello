import { motion } from 'framer-motion';

/** Dynamic ambient mesh gradient backdrop for the premium look. */
export function ChatAmbientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-black pointer-events-none">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          rotate: [0, 90, 0]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-indigo-900/40 blur-[120px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.4, 0.2],
          rotate: [0, -90, 0]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-cyan-900/30 blur-[100px]"
      />
      <div className="fixed inset-0 bg-black/50 backdrop-blur-3xl" aria-hidden />
      <div className="fixed inset-0 settings-grain opacity-20" aria-hidden />
    </div>
  );
}
