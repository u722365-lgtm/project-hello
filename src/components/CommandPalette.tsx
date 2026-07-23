import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  MessageSquare, Shield, Brain, Sparkles, Store, Target,
  Presentation, Terminal, ShieldCheck, BookOpen, History,
  Users, Code, BarChart3, Building2, UserCircle, Settings,
  User, Eye, CreditCard, Rocket, Search as SearchIcon,
  Globe, FileText, HelpCircle, Mail, Activity, Newspaper,
  Briefcase, Lock, Cookie, Scale, Wallet, FlaskConical,
  Database, Ghost, Key, LayoutGrid, Clapperboard, Monitor,
  Languages, ClipboardList, Network, Server, LineChart,
  Handshake, Share2, MessageCircle, Gift, PenTool, Award,
  Star, Zap, LogIn, HeartHandshake,
} from "lucide-react";

type PageEntry = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
  group: "Core" | "Tools" | "Account" | "Company" | "Marketing" | "Legal" | "More";
};

const pages: PageEntry[] = [
  // === Core product surfaces ===
  { name: "Home", href: "/home", icon: LayoutGrid, desc: "Marketing landing page", group: "Core" },
  { name: "Chatbot", href: "/chatbot", icon: MessageSquare, desc: "AI chat assistant", group: "Core" },
  { name: "Strategy Agent", href: "/strategy", icon: Brain, desc: "AI strategy advisor", group: "Core" },
  { name: "Shadow Workspace", href: "/workspace", icon: Sparkles, desc: "Memory, agents & automations", group: "Core" },
  { name: "Shadow Execution", href: "/execute", icon: Target, desc: "Multi-step missions & deliverables", group: "Core" },
  { name: "Marketplace", href: "/marketplace", icon: Store, desc: "Agent marketplace", group: "Core" },
  { name: "Code IDE", href: "/ide", icon: Code, desc: "Monaco editor & live preview", group: "Core" },
  { name: "Pricing", href: "/pricing", icon: Shield, desc: "Plans & pricing", group: "Core" },
  { name: "Lifetime Deal", href: "/lifetime-deal", icon: Star, desc: "$99 one-time premium access", group: "Core" },

  // === Tools ===
  { name: "Content Forge", href: "/forge", icon: Presentation, desc: "Slides, documents & studio", group: "Tools" },
  { name: "Video Studio", href: "/video-studio", icon: Clapperboard, desc: "Pro & Elite viral shorts", group: "Tools" },
  { name: "Creative Studio", href: "/studio", icon: PenTool, desc: "Media & document editor", group: "Tools" },
  { name: "Presentations", href: "/presentations", icon: Presentation, desc: "AI presentation builder", group: "Tools" },
  { name: "Shadow Research", href: "/research", icon: SearchIcon, desc: "Deep research & knowledge", group: "Tools" },
  { name: "Deep Research", href: "/deep-research", icon: SearchIcon, desc: "Multi-step research with citations", group: "Tools" },
  { name: "Knowledge Vault", href: "/knowledge", icon: BookOpen, desc: "Local RAG knowledge base", group: "Tools" },
  { name: "Knowledge Graph", href: "/knowledge-graph", icon: Network, desc: "Visual entity graph", group: "Tools" },
  { name: "Shadow Insights", href: "/insights", icon: BarChart3, desc: "Usage, behavior & activity", group: "Tools" },
  { name: "Data Insights", href: "/data-insights", icon: LineChart, desc: "Data licensing dashboard", group: "Tools" },
  { name: "Analytics", href: "/analytics", icon: BarChart3, desc: "Platform analytics", group: "Tools" },
  { name: "Strategy Lab", href: "/strategy-lab", icon: FlaskConical, desc: "Strategy experiments", group: "Tools" },
  { name: "Mission Control", href: "/missioncontrol", icon: Rocket, desc: "Mission templates & quotas", group: "Tools" },
  { name: "Command Center", href: "/command-center", icon: Target, desc: "Automation hub", group: "Tools" },
  { name: "Cyber Command", href: "/cyber", icon: ShieldCheck, desc: "8-module security suite", group: "Tools" },
  { name: "Security Center", href: "/security", icon: ShieldCheck, desc: "Vault, privacy score & audits", group: "Tools" },
  { name: "Security Audit (HSCA)", href: "/security-audit", icon: ShieldCheck, desc: "30+ vulnerability scans", group: "Tools" },
  { name: "Stealth Vault", href: "/vault", icon: Lock, desc: "Zero-knowledge encrypted vault", group: "Tools" },
  { name: "Shadow Memory", href: "/shadow-memory", icon: Brain, desc: "Local activity logger", group: "Tools" },
  { name: "Business Memory", href: "/business-memory", icon: Briefcase, desc: "Company facts injected into AI", group: "Tools" },
  { name: "Chat Rooms", href: "/rooms", icon: Users, desc: "Collaborative rooms", group: "Tools" },
  { name: "WhatsApp Contacts", href: "/whatsapp", icon: MessageCircle, desc: "Contacts, broadcast & AI drafts", group: "Tools" },
  { name: "Computer Mode", href: "/computer", icon: Monitor, desc: "Real npm/node shell in browser", group: "Tools" },
  { name: "Backend Flows", href: "/flows", icon: Zap, desc: "Backend infrastructure generation", group: "Tools" },
  { name: "Local Models · Ollama", href: "/local-models", icon: Server, desc: "Run open-source LLMs locally", group: "Tools" },
  { name: "Personal LLM", href: "/personal-llm", icon: Brain, desc: "Fine-tune local models", group: "Tools" },

  // === Account ===
  { name: "Profile", href: "/profile", icon: User, desc: "Your profile", group: "Account" },
  { name: "Settings", href: "/settings", icon: Settings, desc: "App settings & autonomy", group: "Account" },
  { name: "Billing", href: "/billing", icon: CreditCard, desc: "Manage billing", group: "Account" },
  { name: "Sovereign Wallet", href: "/wallet", icon: Wallet, desc: "Credit wallet", group: "Account" },
  { name: "Active Sessions", href: "/sessions", icon: Monitor, desc: "Manage signed-in devices", group: "Account" },
  { name: "Sign in", href: "/auth", icon: LogIn, desc: "Sign in or create account", group: "Account" },
  { name: "Auth Design Gallery", href: "/auth/designs", icon: LayoutGrid, desc: "Browse auth themes", group: "Account" },
  { name: "Founder Access", href: "/founder-access", icon: Rocket, desc: "Founder perks", group: "Account" },
  { name: "Admin", href: "/admin", icon: Settings, desc: "Admin dashboard", group: "Account" },
  { name: "Enterprise", href: "/enterprise", icon: Building2, desc: "Enterprise settings", group: "Account" },
  { name: "Enterprise License", href: "/enterprise-license", icon: Key, desc: "Enterprise agreements", group: "Account" },
  { name: "Offline License", href: "/offline-license", icon: Key, desc: "Enterprise offline license", group: "Account" },
  { name: "Sovereign Data", href: "/sovereign-data", icon: Database, desc: "Data sovereignty controls", group: "Account" },
  { name: "Privacy Score", href: "/privacy-score", icon: Award, desc: "Your privacy posture", group: "Account" },
  { name: "Self-Healing", href: "/self-healing", icon: Activity, desc: "Diagnostics & auto-repair", group: "Account" },

  // === Company ===
  { name: "About", href: "/about", icon: UserCircle, desc: "About ShadowTalk", group: "Company" },
  { name: "Founder", href: "/founder", icon: UserCircle, desc: "Meet the founder", group: "Company" },
  { name: "Founder — Zain Ahmed", href: "/zain-ahmed-fahad-patel", icon: UserCircle, desc: "Founder entity page", group: "Company" },
  { name: "Zain Ahmed", href: "/zain-ahmed", icon: UserCircle, desc: "Founder profile", group: "Company" },
  { name: "Careers", href: "/careers", icon: Briefcase, desc: "Join the team", group: "Company" },
  { name: "Contact", href: "/contact", icon: Mail, desc: "Contact us", group: "Company" },
  { name: "Press", href: "/press", icon: Newspaper, desc: "Press & media", group: "Company" },
  { name: "Blog", href: "/blog", icon: Newspaper, desc: "Blog posts", group: "Company" },
  { name: "Case Studies", href: "/case-studies", icon: FileText, desc: "Customer wins", group: "Company" },
  { name: "Case Study — AI Strategy PSF", href: "/case-study-ai-strategy-psf", icon: FileText, desc: "Featured case study", group: "Company" },
  { name: "Changelog", href: "/changelog", icon: History, desc: "What's new", group: "Company" },
  { name: "Status", href: "/status", icon: Activity, desc: "System status", group: "Company" },
  { name: "Help Center", href: "/help", icon: HelpCircle, desc: "Get help", group: "Company" },
  { name: "FAQ", href: "/faq", icon: FileText, desc: "Common questions", group: "Company" },
  { name: "Docs", href: "/docs", icon: BookOpen, desc: "Documentation", group: "Company" },
  { name: "Docs (Geo)", href: "/docs/geos", icon: Globe, desc: "Regional documentation", group: "Company" },
  { name: "Developers", href: "/developers", icon: Terminal, desc: "Developer tools", group: "Company" },
  { name: "API", href: "/api", icon: Code, desc: "API reference", group: "Company" },
  { name: "ShadowTalk Desktop", href: "/downloads", icon: Monitor, desc: "Windows, macOS, Linux", group: "Company" },
  { name: "Download", href: "/download", icon: Monitor, desc: "Download ShadowTalk", group: "Company" },
  { name: "Founder — Zain Ahmed (Founder page)", href: "/zain-ahmed-fahad-patel-founder", icon: UserCircle, desc: "Founder detail page", group: "Company" },
  { name: "Trust Center", href: "/trust", icon: ShieldCheck, desc: "Compliance & security posture", group: "Company" },
  { name: "Transparency", href: "/transparency", icon: Eye, desc: "Transparency report", group: "Company" },
  { name: "Compliance Dashboard", href: "/compliance", icon: ShieldCheck, desc: "Privacy compliance", group: "Company" },
  { name: "Agent Architecture", href: "/agents", icon: Target, desc: "Distributed AI agents", group: "Company" },
  { name: "Competitive Analysis", href: "/competitive", icon: BarChart3, desc: "ShadowTalk vs competitors", group: "Company" },
  { name: "Facts", href: "/facts", icon: FileText, desc: "Verified product facts", group: "Company" },
  { name: "AI Answers", href: "/answers", icon: BookOpen, desc: "Answer engine optimization corpus", group: "Company" },

  // === Marketing / SEO / Growth ===
  { name: "Discover", href: "/discover", icon: Sparkles, desc: "Viral AI comparisons", group: "Marketing" },
  { name: "Google SEO Hub", href: "/google-seo", icon: Globe, desc: "SEO + AEO topic hub", group: "Marketing" },
  { name: "UI Templates", href: "/templates", icon: LayoutGrid, desc: "100 presets + custom theme designer", group: "Marketing" },
  { name: "Themes", href: "/themes", icon: LayoutGrid, desc: "Theme gallery", group: "Marketing" },
  { name: "Theme Designer", href: "/theme", icon: PenTool, desc: "Custom theme designer", group: "Marketing" },
  { name: "Referral Program", href: "/referral", icon: Gift, desc: "Earn credits by referring", group: "Marketing" },
  { name: "Referral Activation", href: "/referral/activation-guide", icon: ClipboardList, desc: "Get started with referrals", group: "Marketing" },
  { name: "Referral Share Templates", href: "/referral/social-share-templates", icon: Share2, desc: "Social share copy", group: "Marketing" },
  { name: "Ghost Ads", href: "/ghost-ads", icon: Ghost, desc: "Privacy-first ads", group: "Marketing" },
  { name: "AI Business Planner", href: "/ai-business-planner", icon: Briefcase, desc: "Free business planning AI", group: "Marketing" },
  { name: "AI Marketing Planner", href: "/ai-marketing-planner", icon: Rocket, desc: "Free marketing planning AI", group: "Marketing" },
  { name: "AI Strategy Consultant", href: "/ai-strategy-consultant", icon: Brain, desc: "Free strategy consultant", group: "Marketing" },
  { name: "AI Translation Chat", href: "/ai-translation-chat", icon: Languages, desc: "Chat with translation", group: "Marketing" },
  { name: "AI Chat Translator", href: "/translator/ai-chat-translator", icon: Languages, desc: "Live chat translator", group: "Marketing" },
  { name: "Best AI (non-English)", href: "/best-ai-non-english", icon: Globe, desc: "Multilingual AI showcase", group: "Marketing" },
  { name: "Multilingual AI", href: "/multilingual-ai", icon: Languages, desc: "20+ languages", group: "Marketing" },
  { name: "Support · 20 Languages", href: "/support/20-languages", icon: Languages, desc: "Multilingual support", group: "Marketing" },
  { name: "Anonymous AI", href: "/anonymous-ai", icon: Ghost, desc: "No-login AI chat", group: "Marketing" },
  { name: "No-login AI Chat", href: "/no-login-ai-chat", icon: MessageSquare, desc: "Try without an account", group: "Marketing" },
  { name: "Private AI (no training)", href: "/private-ai-no-training", icon: Lock, desc: "Zero data training", group: "Marketing" },
  { name: "Partnerships", href: "/partnerships", icon: Handshake, desc: "Partner with ShadowTalk", group: "Marketing" },
  { name: "Complementary Tools", href: "/partnerships/complementary-tools", icon: Handshake, desc: "Recommended integrations", group: "Marketing" },
  { name: "Notion Integration", href: "/partnerships/notion-integration", icon: Handshake, desc: "Sync with Notion", group: "Marketing" },
  { name: "Slack Bot", href: "/partnerships/slack-bot", icon: Handshake, desc: "ShadowTalk in Slack", group: "Marketing" },
  { name: "Co-Marketing", href: "/pricing/co-marketing", icon: HeartHandshake, desc: "Co-marketing package", group: "Marketing" },
  { name: "Team & Enterprise Pricing", href: "/pricing/team-enterprise", icon: Building2, desc: "Team plans", group: "Marketing" },
  { name: "Strategy Planner Resource", href: "/resources/strategy-planner", icon: ClipboardList, desc: "Free strategy planner", group: "Marketing" },
  { name: "Privacy Checklist", href: "/resources/privacy-checklist", icon: ClipboardList, desc: "Downloadable checklist", group: "Marketing" },
  { name: "Code Snippets", href: "/resources/code-snippets", icon: Code, desc: "Reusable snippets", group: "Marketing" },
  { name: "Meme Pack", href: "/resources/meme-pack", icon: Sparkles, desc: "Shareable memes", group: "Marketing" },
  { name: "Product Hunt Listing", href: "/review-platforms/producthunt-listing", icon: Rocket, desc: "PH launch page", group: "Marketing" },
  { name: "G2 Listing", href: "/review-platforms/g2-listing", icon: Award, desc: "G2 review page", group: "Marketing" },
  { name: "Capterra Listing", href: "/review-platforms/capterra-listing", icon: Award, desc: "Capterra review page", group: "Marketing" },
  { name: "Review Ask Email", href: "/review-platforms/review-ask-email", icon: Mail, desc: "Ask users for reviews", group: "Marketing" },

  // === Legal ===
  { name: "Privacy Policy", href: "/privacy", icon: Lock, desc: "Privacy policy", group: "Legal" },
  { name: "Terms of Service", href: "/terms", icon: Scale, desc: "Terms of service", group: "Legal" },
  { name: "Cookie Policy", href: "/cookies", icon: Cookie, desc: "Cookie policy", group: "Legal" },
  { name: "GDPR", href: "/gdpr", icon: Shield, desc: "GDPR compliance", group: "Legal" },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GROUP_ORDER: PageEntry["group"][] = ["Core", "Tools", "Account", "Company", "Marketing", "Legal", "More"];

const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const onChatPage = location.pathname === "/chatbot";

  // Global keyboard shortcut: Ctrl+K / Cmd+K (chat page uses its own tools palette)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (onChatPage) return;
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange, onChatPage]);

  const handleSelect = useCallback((href: string) => {
    navigate(href);
    onOpenChange(false);
  }, [navigate, onOpenChange]);

  const grouped = GROUP_ORDER
    .map((g) => ({ group: g, items: pages.filter((p) => p.group === g) }))
    .filter((g) => g.items.length > 0);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={`Search ${pages.length} pages... (Ctrl+K)`} />
      <CommandList className="max-h-[70vh]">
        <CommandEmpty>No pages found.</CommandEmpty>
        {grouped.map(({ group, items }) => (
          <CommandGroup key={group} heading={group}>
            {items.map((page) => (
              <CommandItem
                key={page.href}
                value={`${page.name} ${page.href} ${page.desc}`}
                onSelect={() => handleSelect(page.href)}
                className="gap-3 cursor-pointer"
              >
                <page.icon className="h-4 w-4 text-primary" />
                <div className="flex flex-col">
                  <span className="font-medium">{page.name}</span>
                  <span className="text-xs text-muted-foreground">{page.desc}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
