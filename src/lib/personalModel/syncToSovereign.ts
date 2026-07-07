import { ingestMessage, runUnsupervisedTraining } from "@/lib/shadowtalkModel/learner";
import type { PersonalShadowTalkModel } from "./types";

/** Push manual training examples into sovereign on-device learning (embeddings). */
export async function syncPersonalExamplesToSovereign(
  model: PersonalShadowTalkModel,
): Promise<void> {
  let shouldTrain = false;
  for (const ex of model.trainingExamples.slice(-20)) {
    const text = `${ex.userMessage}\n${ex.assistantResponse}`;
    try {
      const { shouldTrain: train } = await ingestMessage(text, "assistant");
      if (train) shouldTrain = true;
    } catch {
      /* embedding optional */
    }
  }
  if (shouldTrain) {
    try {
      await runUnsupervisedTraining();
    } catch {
      /* non-fatal */
    }
  }
}
