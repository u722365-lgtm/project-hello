import type { FC } from "react";
import { Sequence, AbsoluteFill, Audio, staticFile } from "remotion";
import { FPS } from "./theme";
import { HOOK_VARIANTS, type ViralShortProps } from "./types";
import { voiceoverAssetPath } from "./voiceover";
import { SCENES } from "./scenes/timing";
import { HookScene } from "./scenes/HookScene";
import { PainScene } from "./scenes/PainScene";
import { TwistScene } from "./scenes/TwistScene";
import { ProofScene } from "./scenes/ProofScene";
import { ShareScene } from "./scenes/ShareScene";
import { CtaScene } from "./scenes/CtaScene";
import { LoopScene } from "./scenes/LoopScene";

function SceneAudio({ variant, scene }: { variant: ViralShortProps["hookVariant"]; scene: keyof typeof SCENES }) {
  const v = variant ?? "privacy";
  return <Audio src={staticFile(voiceoverAssetPath(v, scene))} volume={0.95} />;
}

export const ViralShort: FC<ViralShortProps> = ({ hookVariant = "privacy" }) => {
  const hook = HOOK_VARIANTS[hookVariant];

  return (
    <AbsoluteFill style={{ backgroundColor: "#07070a" }}>
      <Sequence from={SCENES.hook.from} durationInFrames={SCENES.hook.duration}>
        <SceneAudio variant={hookVariant} scene="hook" />
        <HookScene hook={hook} />
      </Sequence>
      <Sequence from={SCENES.pain.from} durationInFrames={SCENES.pain.duration}>
        <SceneAudio variant={hookVariant} scene="pain" />
        <PainScene variant={hookVariant} />
      </Sequence>
      <Sequence from={SCENES.twist.from} durationInFrames={SCENES.twist.duration}>
        <SceneAudio variant={hookVariant} scene="twist" />
        <TwistScene />
      </Sequence>
      <Sequence from={SCENES.proof.from} durationInFrames={SCENES.proof.duration}>
        <SceneAudio variant={hookVariant} scene="proof" />
        <ProofScene />
      </Sequence>
      <Sequence from={SCENES.share.from} durationInFrames={SCENES.share.duration}>
        <SceneAudio variant={hookVariant} scene="share" />
        <ShareScene variant={hookVariant} />
      </Sequence>
      <Sequence from={SCENES.cta.from} durationInFrames={SCENES.cta.duration}>
        <SceneAudio variant={hookVariant} scene="cta" />
        <CtaScene />
      </Sequence>
      <Sequence from={SCENES.loop.from} durationInFrames={SCENES.loop.duration}>
        <SceneAudio variant={hookVariant} scene="loop" />
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
