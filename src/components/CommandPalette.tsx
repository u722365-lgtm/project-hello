import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  User, Eye, CreditCard, Rocket, Tag, Search as SearchIcon,
  Globe, FileText, HelpCircle, Mail, Activity, Newspaper,
  Briefcase, Lock, Cookie, Scale, Wallet, FlaskConical,
  Database, Ghost, Key, BarChart,   Layers,
  LayoutGrid,
  Clapperboard,
  Monitor,
} from "lucide-react";

const pages = [
  { name: "Chatbot", href: "/chatbot", icon: MessageSquare, desc: "AI chat assistant" },
  { name: "Pricing", href: "/pricing", icon: Shield, desc: "Plans & pricing" },
  { name: "ShadowTalk Desktop", href: "/downloads", icon: Monitor, desc: "shadowtalk-setup.exe — Windows, macOS, Linux" },
  { name: "UI Templates", href: "/templates", icon: LayoutGrid, desc: "100 presets + custom theme designer" },
  { name: "Custom theme designer", href: "/templates?tab=custom", icon: LayoutGrid, desc: "Design your own palette and apply site-wide" },
  { name: "Strategy Agent", href: "/strategy", icon: Brain, desc: "AI strategy advisor" },
  { name: "Shadow Workspace", href: "/workspace", icon: Sparkles, desc: "Memory, agents & automations" },
  { name: "Shadow Research", href: "/research", icon: SearchIcon, desc: "Deep research, knowledge & browser" },
  { name: "Shadow Insights", href: "/insights", icon: BarChart3, desc: "Usage, behavior & activity" },
  { name: "Security Center", href: "/security", icon: ShieldCheck, desc: "Vault, privacy score & audits" },
  { name: "Code IDE", href: "/ide", icon: Code, desc: "Monaco editor & live preview" },
  { name: "Marketplace", href: "/marketplace", icon: Store, desc: "Agent marketplace" },
  { name: "Shadow Execution", href: "/execute", icon: Target, desc: "Multi-step missions & deliverables" },
  { name: "Content Forge", href: "/forge", icon: Presentation, desc: "Slides, documents, studio & Beast Mode" },
  { name: "Video Studio", href: "/video-studio", icon: Clapperboard, desc: "Pro & Elite viral short generator — no API key" },
  { name: "Developers", href: "/developers", icon: Terminal, desc: "Developer tools" },
  { name: "Docs", href: "/docs", icon: BookOpen, desc: "Documentation" },
  { name: "Changelog", href: "/changelog", icon: History, desc: "What's new" },
  { name: "Chat Rooms", href: "/rooms", icon: Users, desc: "Collaborative rooms" },
  { name: "API", href: "/api", icon: Code, desc: "API reference" },
  { name: "Enterprise", href: "/enterprise", icon: Building2, desc: "Enterprise settings" },
  { name: "About", href: "/about", icon: UserCircle, desc: "About ShadowTalk" },
  { name: "Admin", href: "/admin", icon: Settings, desc: "Admin dashboard" },
  { name: "Settings", href: "/settings", icon: Settings, desc: "App settings & autonomy" },
  { name: "Profile", href: "/profile", icon: User, desc: "Your profile" },
  { name: "Personal LLM", href: "/personal-llm", icon: Brain, desc: "Fine-tune local models" },
  { name: "Active Sessions", href: "/sessions", icon: Monitor, desc: "Manage signed-in devices" },
  { name: "Billing", href: "/billing", icon: CreditCard, desc: "Manage billing" },
  { name: "Founder Access", href: "/founder-access", icon: Rocket, desc: "Founder perks" },
  { name: "Strategy Lab", href: "/strategy-lab", icon: FlaskConical, desc: "Strategy experiments" },
  { name: "Sovereign Data", href: "/sovereign-data", icon: Database, desc: "Data sovereignty" },
  { name: "Sovereign Wallet", href: "/wallet", icon: Wallet, desc: "Credit wallet" },
  { name: "Ghost Ads", href: "/ghost-ads", icon: Ghost, desc: "Privacy-first ads" },
  { name: "Command Center", href: "/command-center", icon: Target, desc: "Automation hub" },
  { name: "Help Center", href: "/help", icon: HelpCircle, desc: "Get help" },
  { name: "FAQ", href: "/faq", icon: FileText, desc: "Common questions" },
  { name: "Contact", href: "/contact", icon: Mail, desc: "Contact us" },
  { name: "Status", href: "/status", icon: Activity, desc: "System status" },
  { name: "Blog", href: "/blog", icon: Newspaper, desc: "Blog posts" },
  { name: "Careers", href: "/careers", icon: Briefcase, desc: "Join the team" },
  { name: "Referral", href: "/referral", icon: Users, desc: "Referral program" },
  { name: "Privacy Policy", href: "/privacy", icon: Lock, desc: "Privacy policy" },
  { name: "Terms of Service", href: "/terms", icon: Scale, desc: "Terms of service" },
  { name: "GDPR", href: "/gdpr", icon: Shield, desc: "GDPR compliance" },
  { name: "Transparency", href: "/transparency", icon: Eye, desc: "Transparency report" },
  { name: "Competitive Analysis", href: "/competitive", icon: BarChart3, desc: "ShadowTalk vs competitors" },
  { name: "Agent Architecture", href: "/agents", icon: Target, desc: "Distributed AI agents" },
  { name: "Compliance Dashboard", href: "/compliance", icon: ShieldCheck, desc: "Privacy compliance" },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();

  // Global keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const handleSelect = useCallback((href: string) => {
    navigate(href);
    onOpenChange(false);
  }, [navigate, onOpenChange]);

  const core = pages.filter(p =>
    ["/chatbot", "/ide", "/workspace", "/execute", "/strategy", "/pricing", "/marketplace"].includes(p.href),
  );
  const tools = pages.filter(p =>
    ["/forge", "/video-studio", "/research", "/insights", "/security", "/developers", "/strategy-lab", "/command-center"].includes(p.href),
  );
  const rest = pages.filter(p => !core.includes(p) && !tools.includes(p));

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages... (Ctrl+K)" />
      <CommandList>
        <CommandEmpty>No pages found.</CommandEmpty>
        <CommandGroup heading="Core">
          {core.map((page) => (
            <CommandItem key={page.href} onSelect={() => handleSelect(page.href)} className="gap-3 cursor-pointer">
              <page.icon className="h-4 w-4 text-primary" />
              <div className="flex flex-col">
                <span className="font-medium">{page.name}</span>
                <span className="text-xs text-muted-foreground">{page.desc}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Tools">
          {tools.map((page) => (
            <CommandItem key={page.href} onSelect={() => handleSelect(page.href)} className="gap-3 cursor-pointer">
              <page.icon className="h-4 w-4 text-secondary" />
              <div className="flex flex-col">
                <span className="font-medium">{page.name}</span>
                <span className="text-xs text-muted-foreground">{page.desc}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="More">
          {rest.map((page) => (
            <CommandItem key={page.href} onSelect={() => handleSelect(page.href)} className="gap-3 cursor-pointer">
              <page.icon className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="font-medium">{page.name}</span>
                <span className="text-xs text-muted-foreground">{page.desc}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
