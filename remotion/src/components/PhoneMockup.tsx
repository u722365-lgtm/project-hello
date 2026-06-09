import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "../theme";

interface Props {
  delay?: number;
  messages?: { role: "user" | "ai"; text: string }[];
  showEncrypted?: boolean;
}

export function PhoneMockup({ delay = 0, messages = [], showEncrypted = false }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame: frame - delay, fps, config: { damping: 16 } });

  return (
    <div
      style={{
        transform: `scale(${interpolate(scale, [0, 1], [0.85, 1])})`,
        width: 520,
        borderRadius: 48,
        border: `3px solid ${colors.border}`,
        background: colors.card,
        boxShadow: `0 24px 80px #00000088, 0 0 60px ${colors.primary}22`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "20px 24px",
          borderBottom: `1px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 28, color: colors.foreground }}>
          ShadowTalk
        </span>
        {showEncrypted && (
          <span
            style={{
              fontFamily: fonts.mono,
              fontSize: 18,
              color: colors.success,
              background: `${colors.success}22`,
              padding: "6px 14px",
              borderRadius: 999,
            }}
          >
            🔒 Encrypted
          </span>
        )}
      </div>
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, minHeight: 320 }}>
        {messages.map((m, i) => {
          const msgDelay = delay + 20 + i * 18;
          const visible = frame >= msgDelay;
          return (
            <div
              key={i}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(12px)",
                maxWidth: "85%",
                padding: "14px 18px",
                borderRadius: 18,
                background: m.role === "user" ? `${colors.primary}33` : colors.muted + "22",
                border: `1px solid ${m.role === "user" ? colors.primary + "55" : colors.border}`,
                fontFamily: fonts.sans,
                fontSize: 22,
                color: colors.foreground,
                lineHeight: 1.4,
              }}
            >
              {m.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
