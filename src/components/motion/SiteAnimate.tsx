import type { HTMLAttributes, ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { useSiteMotion } from "@/components/motion/SiteMotionProvider";
import { LANDING_SPRING, tapScale, variantForPreset, type LandingAnimatePreset } from "@/lib/landingMotion";

type SiteAnimateProps = HTMLMotionProps<"div"> & {
  preset?: LandingAnimatePreset;
  index?: number;
  inView?: boolean;
  interactive?: boolean;
  as?: "div" | "section" | "article" | "span" | "li" | "header" | "footer" | "nav" | "main";
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
  main: motion.main,
} as const;

const SiteAnimate = ({
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
}: SiteAnimateProps) => {
  const { profile, viewport, hoverLift, reduced } = useSiteMotion();
  const Component = motionTags[as] as React.ComponentType<Record<string, unknown>>;
  const motionVariants = variantForPreset(profile, preset);
  const defaultHover = interactive || preset === "card" ? hoverLift : undefined;
  const defaultTap = whileTap ?? (interactive ? tapScale(profile) : undefined);

  if (reduced) {
    const Tag = as as unknown as React.ElementType;
    return (
      <Tag className={className} {...(rest as unknown as Record<string, unknown>)}>
        {children as ReactNode}
      </Tag>
    );
  }

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

export default SiteAnimate;
