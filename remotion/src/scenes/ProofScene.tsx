import { AnimatedText } from "../components/AnimatedText";
import { PhoneMockup } from "../components/PhoneMockup";
import { SceneShell } from "../components/SceneShell";
import { colors } from "../theme";

export function ProofScene() {
  return (
    <SceneShell>
      <AnimatedText text="Watch this." size={52} color={colors.foreground} weight={800} delay={5} />
      <PhoneMockup
        delay={25}
        showEncrypted
        messages={[
          { role: "user", text: "Draft my salary negotiation script" },
          { role: "ai", text: "Here's a confident, private draft — only on your device." },
        ]}
      />
      <AnimatedText text="Same power. None of the exposure." size={34} color={colors.primary} weight={700} delay={120} />
      <AnimatedText text="Try it in 10 seconds → shadowtalk-ai.com" size={26} color={colors.muted} weight={500} delay={150} />
    </SceneShell>
  );
}
