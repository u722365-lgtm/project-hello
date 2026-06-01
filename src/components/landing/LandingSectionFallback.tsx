import { motion } from "framer-motion";
import { useLandingMotion } from "@/hooks/use-landing-motion";

type LandingSectionFallbackProps = {
  className?: string;
};

const LandingSectionFallback = ({ className = "" }: LandingSectionFallbackProps) => {
  const { reduced } = useLandingMotion();

  return (
    <div
      className={`landing-section-fallback py-16 sm:py-24 min-h-[200px] flex flex-col items-center justify-center gap-4 px-4 ${className}`}
      aria-hidden
    >
      <div className="w-full max-w-3xl space-y-3">
        <div className="landing-shimmer h-3 w-32 mx-auto rounded-full" />
        <div className="landing-shimmer h-8 w-2/3 mx-auto rounded-lg" />
        <div className="landing-shimmer h-4 w-1/2 mx-auto rounded-md" />
      </div>
      {!reduced && (
        <motion.div
          className="h-1 w-24 rounded-full bg-primary/30"
          animate={{ scaleX: [0.2, 1, 0.2], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
};

export default LandingSectionFallback;
