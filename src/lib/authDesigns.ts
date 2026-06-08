export type AuthDesignId =
  | "neural-void"
  | "glass-monolith"
  | "sovereign-split"
  | "terminal-brutalist"
  | "aurora-flow"
  | "neon-cyber";

export const AUTH_DESIGN_STORAGE_KEY = "shadowtalk_auth_design_choice";

export type AuthDesignMeta = {
  id: AuthDesignId;
  name: string;
  tagline: string;
  description: string;
  palette: string[];
  mood: string;
};

export const AUTH_DESIGNS: AuthDesignMeta[] = [
  {
    id: "neural-void",
    name: "Neural Void",
    tagline: "Deep space intelligence",
    description:
      "Evolution of the current auth — neural grid, guardian robot panel, pink/teal glow. Familiar but sharper.",
    palette: ["#ec4899", "#14b8a6", "#0a0a0f"],
    mood: "Futuristic · Guardian",
  },
  {
    id: "glass-monolith",
    name: "Glass Monolith",
    tagline: "Calm, centered clarity",
    description:
      "Single floating glass card on a soft gradient. Minimal chrome, maximum focus on sign-in.",
    palette: ["#a78bfa", "#38bdf8", "#18181b"],
    mood: "Minimal · Premium",
  },
  {
    id: "sovereign-split",
    name: "Sovereign Split",
    tagline: "Enterprise-grade trust",
    description:
      "Bold brand panel left, crisp form right. Sovereign security cues for serious workspaces.",
    palette: ["#f59e0b", "#10b981", "#09090b"],
    mood: "Professional · Sovereign",
  },
  {
    id: "terminal-brutalist",
    name: "Terminal Brutalist",
    tagline: "Raw developer energy",
    description:
      "Monospace, scanlines, amber terminal glow. Built for hackers and builders who live in the CLI.",
    palette: ["#fbbf24", "#22c55e", "#000000"],
    mood: "Dev · Brutalist",
  },
  {
    id: "aurora-flow",
    name: "Aurora Flow",
    tagline: "Organic & welcoming",
    description:
      "Flowing aurora gradients, soft blobs, rounded shapes. Friendly first impression for new users.",
    palette: ["#818cf8", "#f472b6", "#0f172a"],
    mood: "Soft · Approachable",
  },
  {
    id: "neon-cyber",
    name: "Neon Cyber",
    tagline: "High-voltage edge",
    description:
      "Angular neon frames, cyberpunk contrast, pulsing borders. Maximum visual impact.",
    palette: ["#ff00ff", "#00ffff", "#050508"],
    mood: "Cyberpunk · Bold",
  },
];

export function getAuthDesign(id: string | null | undefined): AuthDesignMeta | undefined {
  return AUTH_DESIGNS.find((d) => d.id === id);
}

export const DEFAULT_AUTH_DESIGN: AuthDesignId = "glass-monolith";

export function getStoredAuthDesignChoice(): AuthDesignId | null {
  try {
    const v = localStorage.getItem(AUTH_DESIGN_STORAGE_KEY);
    return AUTH_DESIGNS.some((d) => d.id === v) ? (v as AuthDesignId) : null;
  } catch {
    return null;
  }
}

export function getActiveAuthDesignId(): AuthDesignId {
  return getStoredAuthDesignChoice() ?? DEFAULT_AUTH_DESIGN;
}

export function setStoredAuthDesignChoice(id: AuthDesignId): void {
  try {
    localStorage.setItem(AUTH_DESIGN_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}
