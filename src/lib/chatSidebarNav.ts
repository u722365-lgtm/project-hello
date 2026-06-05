import type { LucideIcon } from "lucide-react";
import {
  MessageSquare,
  Brain,
  Network,
  FileText,
  Radio,
  Workflow,
  Code,
  Plug,
  Settings,
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
  { label: "Chat", icon: MessageSquare, to: "/chatbot", end: true, section: "workspace" },
  { label: "Execute", shortLabel: "Exec", icon: Brain, to: "/execute", section: "explore" },
  { label: "Research", icon: Network, to: "/research", section: "explore" },
  { label: "Workspace", icon: FileText, to: "/workspace", section: "explore" },
  { label: "Code IDE", icon: Code, to: "/ide", section: "explore" },
  { label: "Insights", icon: Radio, to: "/insights", section: "explore" },
  { label: "Automations", icon: Workflow, to: "/workspace?tab=automate", section: "explore" },
  { label: "Integrations", icon: Plug, to: "/developers", section: "explore" },
  { label: "Settings", icon: Settings, to: "/settings", section: "explore" },
];

export const CHAT_SIDEBAR_WIDTH_EXPANDED = 268;
export const CHAT_SIDEBAR_WIDTH_COLLAPSED = 76;
