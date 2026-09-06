import type { LucideIcon } from "lucide-react";
import {
  Home,
  MessageSquare,
  Brain,
  Network,
  FileText,
  Compass,
  Plug,
  Shield,
  BarChart3,
  Lock,
  Code2,
  Sparkles,
  BookOpen,
  LayoutGrid,
} from "lucide-react";

export interface ChatSidebarNavItem {
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  to: string;
  end?: boolean;
  section: "workspace" | "explore";
  badge?: string;
}

export const CHAT_SIDEBAR_NAV: ChatSidebarNavItem[] = [
  // Workspace section
  { label: "Chatbot", icon: MessageSquare, to: "/chatbot", end: true, section: "workspace" },
  { label: "Home", icon: Home, to: "/home", end: true, section: "workspace" },
  { label: "Workspace", icon: FileText, to: "/workspace", section: "workspace" },
  { label: "Templates", icon: LayoutGrid, to: "/templates", section: "workspace" },

  // Explore section — all real, active production features
  { label: "Deep Research", icon: Compass, to: "/deep-research", section: "explore", badge: "Live" },
  { label: "Shadow Twin", icon: Brain, to: "/shadow-twin", section: "explore" },
  { label: "Cyber Command", icon: Shield, to: "/cyber", section: "explore" },
  { label: "Data Insights", icon: BarChart3, to: "/data-insights", section: "explore" },
  { label: "Knowledge Graph", icon: Network, to: "/knowledge-graph", section: "explore" },
  { label: "Private AI Hub", icon: Lock, to: "/private-ai", section: "explore" },
  { label: "Integrations", icon: Plug, to: "/integrations", section: "explore" },
  { label: "Developer API", icon: Code2, to: "/developers", section: "explore" },
  { label: "Pricing & Plans", icon: Sparkles, to: "/pricing", section: "explore" },
  { label: "Docs & Guides", icon: BookOpen, to: "/docs", section: "explore" },
];

export const CHAT_SIDEBAR_WIDTH_EXPANDED = 268;
export const CHAT_SIDEBAR_WIDTH_COLLAPSED = 76;
