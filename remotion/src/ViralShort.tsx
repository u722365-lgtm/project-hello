import type { FC } from "react";
import { Sequence, AbsoluteFill } from "remotion";
import { FPS } from "./theme";
import { HOOK_VARIANTS, type ViralShortProps } from "./types";
import { HookScene } from "./scenes/HookScene";
import { PainScene } from "./scenes/PainScene";
import { TwistScene } from "./scenes/TwistScene";
import { ProofScene } from "./scenes/ProofScene";
import { ShareScene } from "./scenes/ShareScene";
import { CtaScene } from "./scenes/CtaScene";
import { LoopScene } from "./scenes/LoopScene";

/** Scene timings (30fps) — matches the 60s viral script */
const SCENES = {
  hook: { from: 0, duration: 90 },       // 0:00–0:03
  pain: { from: 90, duration: 270 },    // 0:03–0:12
  twist: { from: 360, duration: 300 },  // 0:12–0:22
  proof: { from: 660, duration: 390 },  // 0:22–0:35
  share: { from: 1050, duration: 300 }, // 0:35–0:45
  cta: { from: 1350, duration: 300 },   // 0:45–0:55
  loop: { from: 1650, duration: 150 },  // 0:55–1:00
} as const;

export const ViralShort: FC<ViralShortProps> = ({ hookVariant = "privacy" }) => {
  const hook = HOOK_VARIANTS[hookVariant];

  return (
    <AbsoluteFill style={{ backgroundColor: "#07070a" }}>
      <Sequence from={SCENES.hook.from} durationInFrames={SCENES.hook.duration}>
        <HookScene hook={hook} />
      </Sequence>
      <Sequence from={SCENES.pain.from} durationInFrames={SCENES.pain.duration}>
        <PainScene variant={hookVariant} />
      </Sequence>
      <Sequence from={SCENES.twist.from} durationInFrames={SCENES.twist.duration}>
        <TwistScene />
      </Sequence>
      <Sequence from={SCENES.proof.from} durationInFrames={SCENES.proof.duration}>
        <ProofScene />
      </Sequence>
      <Sequence from={SCENES.share.from} durationInFrames={SCENES.share.duration}>
        <ShareScene variant={hookVariant} />
      </Sequence>
      <Sequence from={SCENES.cta.from} durationInFrames={SCENES.cta.duration}>
        <CtaScene />
      </Sequence>
      <Sequence from={SCENES.loop.from} durationInFrames={SCENES.loop.duration}>
        <LoopScene />
      </Sequence>
    </AbsoluteFill>
  );
};

export const viralShortMetadata = {
  id: "ViralShort",
  component: ViralShort,
  durationInFrames: FPS * 60,
  fps: FPS,
  width: 1080,
  height: 1920,
  defaultProps: { hookVariant: "privacy" as const },
};
