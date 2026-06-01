import { ShadowTalkLogo } from "@/components/brand/ShadowTalkLogo";

/** Approved ShadowTalk logo — replaces legacy glow orb / plate in empty chat. */
export function ShadowTalkOrb() {
  return (
    <div className="mb-8 flex items-center justify-center" data-testid="shadowtalk-hero-logo">
      <ShadowTalkLogo size={112} variant="icon" ambient animated />
    </div>
  );
}
