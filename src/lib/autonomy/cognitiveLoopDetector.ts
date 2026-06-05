/** Heuristic: when to invoke multi-agent cognitive loop instead of single-model chat */

const COGNITIVE_SIGNALS =
  /\b(trade-?offs?|pros?\s+and\s+cons|multi-?perspective|multiple\s+angles|debate|devil'?s\s+advocate|should\s+we|ethical|legal\s+implications|risk\s+vs|compare\s+approaches|board\s+decision|stakeholders?)\b/i;

const HARD_PROBLEM =
  /\b(architecture\s+decision|build\s+vs\s+buy|hire\s+vs|pivot|fundraising|acquisition|compliance\s+strategy|go-?to-?market\s+strategy)\b/i;

export function shouldUseCognitiveLoop(message: string): boolean {
  const text = message.trim();
  if (text.length < 40) return false;
  if (COGNITIVE_SIGNALS.test(text)) return true;
  if (HARD_PROBLEM.test(text) && text.length >= 60) return true;
  const questionMarks = (text.match(/\?/g) || []).length;
  if (questionMarks >= 2 && text.length >= 120) return true;
  return false;
}
