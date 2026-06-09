import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { colors } from "../theme";

interface Props {
  pulse?: boolean;
  danger?: boolean;
}

export function GradientBackground({ pulse = false, danger = false }: Props) {
  const frame = useCurrentFrame();
  const glow = pulse ? interpolate(Math.sin(frame / 15), [-1, 1], [0.08, 0.18]) : 0.12;
  const accent = danger ? "239, 68, 68" : "26, 200, 255";

  return (
    <AbsoluteFill
      style={{
        background: colors.background,
        backgroundImage: `
          radial-gradient(ellipse 90% 50% at 50% 0%, rgba(${accent}, ${glow}) 0%, transparent 55%),
          radial-gradient(ellipse 60% 40% at 80% 100%, rgba(168, 85, 247, 0.1) 0%, transparent 50%),
          linear-gradient(180deg, ${colors.background} 0%, #0a0a12 100%)
        `,
      }}
    />
  );
}
