import { interpolate, useCurrentFrame } from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { SceneShell } from "../components/SceneShell";
import { colors, fonts } from "../theme";
import type { HookVariant } from "../types";

interface Props {
  variant: HookVariant;
}

const SHARE_LINES: Record<HookVariant, { quote: string; cta: string }> = {
  privacy: {
    quote: "If you wouldn't read your journal out loud in a coffee shop… why are you doing it in a chat box?",
    cta: "Tag 1 person who still uses normal AI for private stuff.",
  },
  developer: {
    quote: "If you wouldn't commit secrets to GitHub… why paste them into ChatGPT?",
    cta: "Tag a dev who still pastes .env files into AI.",
  },
  student: {
    quote: "If you wouldn't hand your essay to a stranger… why upload it to a chatbot?",
    cta: "Tag a friend who writes papers in ChatGPT.",
  },
};

export function ShareScene({ variant }: Props) {
  const frame = useCurrentFrame();
  const copy = SHARE_LINES[variant];
  const tagPulse = interpolate(Math.sin(frame / 8), [-1, 1], [1, 1.04]);

  return (
    <SceneShell pulse>
      <AnimatedText text={copy.quote} size={42} color={colors.foreground} weight={700} delay={10} />
      <div
        style={{
          transform: `scale(${tagPulse})`,
          marginTop: 40,
          padding: "28px 36px",
          borderRadius: 24,
          border: `3px solid ${colors.accent}`,
          background: `${colors.accent}18`,
          boxShadow: `0 0 60px ${colors.accent}33`,
        }}
      >
        <div style={{ fontFamily: fonts.sans, fontSize: 40, fontWeight: 900, color: colors.accent, textAlign: "center", lineHeight: 1.2 }}>
          {copy.cta}
        </div>
      </div>
      <AnimatedText text="Send this to them. Seriously." size={32} color={colors.foreground} weight={600} delay={80} />
    </SceneShell>
  );
}
