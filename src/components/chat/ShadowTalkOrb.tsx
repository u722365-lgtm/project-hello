import { ShadowTalkLogo } from "@/components/brand/ShadowTalkLogo";

/** Hero logo for ShadowTalk empty chat — custom mark, no circular plate. */
export function ShadowTalkOrb() {
  return (
    <div className="mb-8 flex items-center justify-center">
      <ShadowTalkLogo size={104} variant="icon" ambient animated />
    </div>
  );
}
