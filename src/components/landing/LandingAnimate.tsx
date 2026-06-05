import { motion, type HTMLMotionProps } from "framer-motion";
import { useLandingMotionContext } from "@/components/landing/LandingMotionProvider";
import { LANDING_SPRING, tapScale, variantForPreset, type LandingAnimatePreset } from "@/lib/landingMotion";

type LandingAnimateProps = HTMLMotionProps<"div"> & {
  preset?: LandingAnimatePreset;
  index?: number;
  inView?: boolean;
  interactive?: boolean;
  as?: "div" | "section" | "article" | "span" | "li" | "header" | "footer" | "nav";
};

const motionTags = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  span: motion.span,
  li: motion.li,
  header: motion.header,
  footer: motion.footer,
  nav: motion.nav,
} as const;

const LandingAnimate = ({
  preset = "fadeUp",
  index,
  inView = true,
  interactive = false,
  as = "div",
  children,
  className,
  whileHover,
  whileTap,
  ...rest
}: LandingAnimateProps) => {
  const { profile, viewport, hoverLift } = useLandingMotionContext();
  const Component = motionTags[as] as React.ComponentType<Record<string, unknown>>;
  const motionVariants = variantForPreset(profile, preset);
  const defaultHover =
    interactive || preset === "card" ? hoverLift : undefined;
  const defaultTap = whileTap ?? (interactive ? tapScale(profile) : undefined);

  return (
    <Component
      custom={index}
      variants={motionVariants}
      initial="hidden"
      {...(inView
        ? { whileInView: "visible" as const, viewport }
        : { animate: "visible" as const })}
      transition={interactive ? LANDING_SPRING.gentle : undefined}
      whileHover={whileHover ?? defaultHover}
      whileTap={defaultTap}
      className={className}
      {...rest}
    >
      {children}
    </Component>
  );
};

export default LandingAnimate;
