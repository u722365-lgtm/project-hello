/**
 * One-time seed of product Q&A into the sovereign learning corpus
 * when Tier A (default offline model) first becomes ready.
 */

import { AEO_ANSWER_CORPUS } from "@/lib/aeo/answerCorpus";
import { ingestMessage } from "@/lib/shadowtalkModel/learner";

const SEED_KEY = "shadowtalk_offline_brain_seeded_v1";

const SEED_IDS = [
  "what-is-shadowtalk",
  "shadowtalk-tagline",
  "who-should-use-shadowtalk",
  "shadowtalk-vs-chatgpt-wrapper",
  "shadowtalk-pricing-google",
  "best-chatgpt-alternative-free",
  "best-ai-strategy-consultant",
  "anonymous-ai-no-login",
  "multilingual-ai-shadowtalk",
  "shadowtalk-tools-count",
  "shadowtalk-desktop",
  "privacy-ai-chat-google",
];

/** Seed curated facts so ShadowTalk Model learns product knowledge offline. */
export async function seedDefaultModelKnowledge(): Promise<void> {
  if (typeof localStorage === "undefined") return;
  if (localStorage.getItem(SEED_KEY) === "1") return;

  const entries = AEO_ANSWER_CORPUS.filter((a) => SEED_IDS.includes(a.id));
  let trained = false;

  for (const entry of entries) {
    const text = `${entry.question} ${entry.answer}`;
    try {
      const { shouldTrain } = await ingestMessage(text, "assistant");
      if (shouldTrain) trained = true;
    } catch {
      /* embeddings may fail on weak hardware — still mark partial seed */
    }
  }

  if (trained) {
    const { runUnsupervisedTraining } = await import("@/lib/shadowtalkModel/learner");
    try {
      await runUnsupervisedTraining();
    } catch {
      /* non-fatal */
    }
  }

  localStorage.setItem(SEED_KEY, "1");
}
