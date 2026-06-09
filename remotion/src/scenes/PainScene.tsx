import { AnimatedText } from "../components/AnimatedText";
import { SceneShell } from "../components/SceneShell";
import { SplitCompare } from "../components/SplitCompare";
import { colors } from "../theme";
import type { HookVariant } from "../types";

interface Props {
  variant: HookVariant;
}

const PAIN_COPY: Record<HookVariant, { headline: string; left: string[]; right: string[] }> = {
  privacy: {
    headline: "Every prompt can live on someone else's server forever.",
    left: ["Ideas stored", "Secrets logged", "No real delete"],
    right: ["Your journal", "Your therapy", "Your startup pitch"],
  },
  developer: {
    headline: "That .env paste? It's not ephemeral.",
    left: ["API keys cached", "Tokens in logs", "Training data risk"],
    right: ["AWS secrets", "Stripe keys", "Internal URLs"],
  },
  student: {
    headline: "Your homework might be someone else's training set.",
    left: ["Essays retained", "Style copied", "No opt-out"],
    right: ["College apps", "Research drafts", "Personal stories"],
  },
};

export function PainScene({ variant }: Props) {
  const copy = PAIN_COPY[variant];

  return (
    <SceneShell danger>
      <AnimatedText text={copy.headline} size={48} color={colors.foreground} weight={700} delay={5} />
      <AnimatedText text="Not paranoia. Architecture." size={32} color={colors.destructive} weight={600} delay={40} uppercase />
      <SplitCompare
        delay={70}
        leftLabel="Cloud AI"
        leftItems={copy.left}
        rightLabel="What you typed"
        rightItems={copy.right}
      />
    </SceneShell>
  );
}
