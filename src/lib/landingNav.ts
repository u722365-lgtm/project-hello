import type { LucideIcon } from "lucide-react";
import {
  Brain,
  Code,
  MessageSquare,
  Shield,
  Sparkles,
  Target,
} from "lucide-react";

export type LandingNavLink = {
  label: string;
  href: string;
  scroll?: boolean;
};

/** Primary marketing nav — kept minimal for a clean header */
export const LANDING_PRIMARY_LINKS: LandingNavLink[] = [
  { label: "Features", href: "#features", scroll: true },
  { label: "Pricing", href: "#pricing", scroll: true },
  { label: "FAQ", href: "#faq", scroll: true },
  { label: "Docs", href: "/docs" },
];

export type LandingProductLink = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export const LANDING_PRODUCT_LINKS: LandingProductLink[] = [
  {
    label: "AI Chat",
    description: "Multi-model workspace",
    href: "/chatbot",
    icon: MessageSquare,
  },
  {
    label: "Mission Control",
    description: "Autonomous workflows",
    href: "/missioncontrol",
    icon: Target,
  },
  {
    label: "Strategy Agent",
    description: "Planning & research",
    href: "/strategy",
    icon: Brain,
  },
  {
    label: "Code IDE",
    description: "Build in the browser",
    href: "/ide",
    icon: Code,
  },
  {
    label: "AI Workspace",
    description: "Unified tools hub",
    href: "/workspace",
    icon: Sparkles,
  },
  {
    label: "Pricing",
    description: "Plans & billing",
    href: "/pricing",
    icon: Shield,
  },
];

export const LANDING_MORE_LINKS: LandingNavLink[] = [
  { label: "About", href: "/about" },
  { label: "Developers", href: "/developers" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];
