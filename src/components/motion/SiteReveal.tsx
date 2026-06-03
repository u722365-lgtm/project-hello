import SiteAnimate from "@/components/motion/SiteAnimate";
import type { LandingAnimatePreset } from "@/lib/landingMotion";

type SiteRevealProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
  preset?: LandingAnimatePreset;
  as?: "div" | "section" | "article" | "main";
  interactive?: boolean;
};

/** Scroll-reveal wrapper for any page (responsive + reduced-motion safe). */
const SiteReveal = ({
  children,
  className = "",
  id,
  preset = "section",
  as = "section",
  interactive = false,
}: SiteRevealProps) => (
  <SiteAnimate id={id} className={className} preset={preset} as={as} interactive={interactive}>
    {children}
  </SiteAnimate>
);

export default SiteReveal;
