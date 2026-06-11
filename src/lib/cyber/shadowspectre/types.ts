import type { SHADOWSPECTRE_HEADS } from "./constants";

export type ShadowSpectreHead = (typeof SHADOWSPECTRE_HEADS)[number];

export type EngagementType = "pentest" | "bounty" | "ir" | "research" | "grc";
export type TargetClass = "lab" | "staging" | "production-advisory";

export interface AuthorizationContext {
  scopeId?: string;
  engagementType?: EngagementType;
  targetClass?: TargetClass;
  notes?: string;
  acceptedAt?: string;
}

export type ShadowSpectreMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};
