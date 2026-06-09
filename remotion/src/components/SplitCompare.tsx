import { interpolate, useCurrentFrame } from "remotion";
import { colors, fonts } from "../theme";

interface Props {
  delay?: number;
  leftLabel: string;
  leftItems: string[];
  rightLabel: string;
  rightItems: string[];
}

export function SplitCompare({ delay = 0, leftLabel, leftItems, rightLabel, rightItems }: Props) {
  const frame = useCurrentFrame();
  const show = interpolate(frame - delay, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ display: "flex", gap: 20, width: "100%", opacity: show, transform: `translateY(${interpolate(show, [0, 1], [30, 0])}px)` }}>
      <Panel label={leftLabel} items={leftItems} accent={colors.destructive} icon="☁️" />
      <Panel label={rightLabel} items={rightItems} accent={colors.primary} icon="🔒" />
    </div>
  );
}

function Panel({ label, items, accent, icon }: { label: string; items: string[]; accent: string; icon: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: `${accent}11`,
        border: `2px solid ${accent}44`,
        borderRadius: 24,
        padding: 24,
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 26, color: accent, marginBottom: 16 }}>{label}</div>
      {items.map((item) => (
        <div key={item} style={{ fontFamily: fonts.sans, fontSize: 20, color: colors.muted, marginBottom: 10, lineHeight: 1.35 }}>
          • {item}
        </div>
      ))}
    </div>
  );
}
