import type { ReactNode } from "react";
import type { AuthDesignId } from "@/lib/authDesigns";
import { NeuralVoidDesign } from "./NeuralVoidDesign";
import { GlassMonolithDesign } from "./GlassMonolithDesign";
import { SovereignSplitDesign } from "./SovereignSplitDesign";
import { TerminalBrutalistDesign } from "./TerminalBrutalistDesign";
import { AuroraFlowDesign } from "./AuroraFlowDesign";
import { NeonCyberDesign } from "./NeonCyberDesign";

export type AuthDesignShellProps = {
  designId: AuthDesignId;
  children: ReactNode;
  compact?: boolean;
  showBack?: boolean;
  onBack?: () => void;
};

export function AuthDesignShell({
  designId,
  children,
  compact = false,
  showBack = false,
  onBack,
}: AuthDesignShellProps) {
  const props = { children, compact, showBack, onBack };

  switch (designId) {
    case "neural-void":
      return <NeuralVoidDesign {...props} />;
    case "glass-monolith":
      return <GlassMonolithDesign {...props} />;
    case "sovereign-split":
      return <SovereignSplitDesign {...props} />;
    case "terminal-brutalist":
      return <TerminalBrutalistDesign {...props} />;
    case "aurora-flow":
      return <AuroraFlowDesign {...props} />;
    case "neon-cyber":
      return <NeonCyberDesign {...props} />;
    default:
      return <NeuralVoidDesign {...props} />;
  }
}
