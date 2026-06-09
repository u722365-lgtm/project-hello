import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { GradientBackground } from "./GradientBackground";

interface Props {
  children: ReactNode;
  danger?: boolean;
  pulse?: boolean;
}

export function SceneShell({ children, danger, pulse }: Props) {
  return (
    <AbsoluteFill>
      <GradientBackground danger={danger} pulse={pulse} />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 32,
          padding: "80px 40px",
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
