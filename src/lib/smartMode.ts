/** Optional shared Smart Mode helper: derive a human-readable mode label. */

export function getSmartModeLabel(chatMode: string): string {
  const labelMap: Record<string, string> = {
    general: "Smart Mode",
    code: "Coding",
    translate: "Translate",
    summarize: "Summarize",
    debug: "Debug",
    brainstorm: "Brainstorm",
    image: "Image",
    explain: "Explain",
    creative: "Creative",
    music: "Music",
    research: "Deep Research",
    ppag: "Eco Actions",
    hsca: "Security Audit",
    math: "Math",
    camera: "Camera",
    organize: "Organize",
    academic: "Academic",
    email: "Email",
    proofread: "Proofread",
    shadowspectre: "ShadowSpectre",
    uncensored: "Uncensored",
  };

  return labelMap[chatMode] || chatMode;
}
