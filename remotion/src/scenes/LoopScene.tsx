import { AnimatedText } from "../components/AnimatedText";
import { SceneShell } from "../components/SceneShell";
import { colors } from "../theme";

export function LoopScene() {
  return (
    <SceneShell>
      <AnimatedText text="Part 2: I tested what leaks when you use regular AI 👀" size={44} color={colors.foreground} weight={700} delay={5} />
      <AnimatedText text="Comment SHADOW if you want Part 2." size={36} color={colors.accent} weight={800} delay={40} glow />
    </SceneShell>
  );
}
