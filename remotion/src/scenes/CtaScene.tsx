import { interpolate, useCurrentFrame } from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { SceneShell } from "../components/SceneShell";
import { colors, fonts } from "../theme";

export function CtaScene() {
  const frame = useCurrentFrame();
  const glow = interpolate(Math.sin(frame / 12), [-1, 1], [0.4, 0.8]);

  return (
    <SceneShell pulse>
      <div
        style={{
          width: 160,
          height: 160,
          borderRadius: 40,
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 72,
          fontWeight: 900,
          color: colors.background,
          boxShadow: `0 0 ${60 * glow}px ${colors.primary}88`,
          opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        S
      </div>
      <AnimatedText text="ShadowTalk AI" size={64} color={colors.foreground} weight={900} delay={15} glow />
      <AnimatedText text="Think AI. Think ShadowTalk." size={36} color={colors.primary} weight={600} delay={35} />
      <div
        style={{
          marginTop: 24,
          fontFamily: fonts.mono,
          fontSize: 32,
          color: colors.foreground,
          background: `${colors.primary}22`,
          border: `2px solid ${colors.primary}`,
          padding: "18px 36px",
          borderRadius: 16,
          opacity: interpolate(frame, [50, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        shadowtalk-ai.com
      </div>
      <AnimatedText text="Free to try" size={26} color={colors.muted} weight={500} delay={80} />
    </SceneShell>
  );
}
