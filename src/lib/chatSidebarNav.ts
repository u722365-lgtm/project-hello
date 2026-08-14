import type { LucideIcon } from "lucide-react";
import {
  Home,
  MessageSquare,
  Brain,
  Network,
  FileText,
  Radio,
  Workflow,
  Code,
  Plug,
  Settings,
  Clapperboard,
} from "lucide-react";

export interface ChatSidebarNavItem {
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  to: string;
  end?: boolean;
  section: "workspace" | "explore";
}

export const CHAT_SIDEBAR_NAV: ChatSidebarNavItem[] = [
  { label: "Home", icon: Home, to: "/home", end: true, section: "workspace" },
  { label: "Chat", icon: MessageSquare, to: "/chatbot", end: true, section: "workspace" },
  // { label: "Execute", shortLabel: "Exec", icon: Brain, to: "/execute", section: "explore" },
  { label: "Research", icon: Network, to: "/research", section: "explore" },
  { label: "Workspace", icon: FileText, to: "/workspace", section: "explore" },
  { label: "Code IDE", icon: Code, to: "/ide", section: "explore" },
  { label: "Video Studio", shortLabel: "Video", icon: Clapperboard, to: "/video-studio", section: "explore" },
  { label: "Insights", icon: Radio, to: "/insights", section: "explore" },
  { label: "Automations", icon: Workflow, to: "/workspace?tab=automate", section: "explore" },
  { label: "Integrations", icon: Plug, to: "/developers", section: "explore" },
  { label: "Settings", icon: Settings, to: "/settings", section: "explore" },
];

export const CHAT_SIDEBAR_WIDTH_EXPANDED = 268;
export const CHAT_SIDEBAR_WIDTH_COLLAPSED = 76;
