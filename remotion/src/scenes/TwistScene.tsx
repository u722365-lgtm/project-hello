import { interpolate, useCurrentFrame } from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { SceneShell } from "../components/SceneShell";
import { colors, fonts } from "../theme";

const FEATURES = ["Encrypted chat", "Private by design", "Your keys. Your control."];

export function TwistScene() {
  const frame = useCurrentFrame();

  return (
    <SceneShell pulse>
      <AnimatedText text="So we built the opposite." size={56} color={colors.foreground} weight={800} delay={5} />
      <div
        style={{
          fontFamily: fonts.sans,
          fontSize: 88,
          fontWeight: 900,
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          opacity: interpolate(frame, [20, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          transform: `scale(${interpolate(frame, [20, 40], [0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`,
        }}
      >
        ShadowTalk AI
      </div>
      <AnimatedText
        text="Think AI — without broadcasting your brain to the internet."
        size={36}
        color={colors.muted}
        weight={500}
        delay={45}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
        {FEATURES.map((f, i) => (
          <div
            key={f}
            style={{
              fontFamily: fonts.mono,
              fontSize: 28,
              color: colors.primary,
              opacity: interpolate(frame, [60 + i * 15, 75 + i * 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              border: `1px solid ${colors.primary}44`,
              padding: "12px 28px",
              borderRadius: 999,
              background: `${colors.primary}11`,
            }}
          >
            {f}
          </div>
        ))}
      </div>
    </SceneShell>
  );
}
