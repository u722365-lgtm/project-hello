import SiteReveal from "@/components/motion/SiteReveal";
import type { LandingAnimatePreset } from "@/lib/landingMotion";

type LandingSectionRevealProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
  preset?: LandingAnimatePreset;
};

const LandingSectionReveal = ({
  children,
  className = "",
  id,
  preset = "section",
}: LandingSectionRevealProps) => (
  <SiteReveal id={id} className={className} preset={preset} as="div">
    {children}
  </SiteReveal>
);

export default LandingSectionReveal;
