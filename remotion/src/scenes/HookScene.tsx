import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { SceneShell } from "../components/SceneShell";
import type { HookCopy } from "../types";
import { colors, fonts } from "../theme";

interface Props {
  hook: HookCopy;
}

export function HookScene({ hook }: Props) {
  const frame = useCurrentFrame();
  const glitch = frame > 45 && frame < 55 ? (frame % 2 === 0 ? 4 : -4) : 0;
  const flash = interpolate(frame, [50, 55, 60], [0, 0.3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <SceneShell danger pulse>
      <AbsoluteFill style={{ background: `rgba(239,68,68,${flash})`, pointerEvents: "none" }} />
      <div style={{ transform: `translateX(${glitch}px)` }}>
        <AnimatedText text={hook.headline} size={72} color={colors.destructive} glow delay={5} />
        {hook.subline && <AnimatedText text={hook.subline} size={36} color={colors.muted} weight={500} delay={20} />}
        <div style={{ height: 40 }} />
        <AnimatedText text={hook.voiceover} size={38} color={colors.foreground} weight={600} delay={35} />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 120,
          fontFamily: fonts.mono,
          fontSize: 22,
          color: colors.muted,
          opacity: interpolate(frame, [60, 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        ▶ Watch before you send
      </div>
    </SceneShell>
  );
}
