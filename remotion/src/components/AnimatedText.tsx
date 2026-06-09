import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "../theme";

interface Props {
  text: string;
  size?: number;
  color?: string;
  weight?: number;
  align?: "left" | "center" | "right";
  delay?: number;
  glow?: boolean;
  uppercase?: boolean;
}

export function AnimatedText({
  text,
  size = 64,
  color = colors.foreground,
  weight = 800,
  align = "center",
  delay = 0,
  glow = false,
  uppercase = false,
}: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 120 } });
  const opacity = interpolate(frame - delay, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(progress, [0, 1], [40, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px)`,
        fontFamily: fonts.sans,
        fontSize: size,
        fontWeight: weight,
        color,
        textAlign: align,
        lineHeight: 1.15,
        letterSpacing: uppercase ? "0.04em" : "-0.02em",
        textTransform: uppercase ? "uppercase" : "none",
        textShadow: glow ? `0 0 40px ${colors.primary}88, 0 0 80px ${colors.primary}44` : undefined,
        padding: "0 48px",
      }}
    >
      {text}
    </div>
  );
}
