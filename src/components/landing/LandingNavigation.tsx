import { ReactNode, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  X,
  Sparkles,
  Bot,
  Brain,
  Zap,
  Users,
  Shield,
  CreditCard,
  Mail,
  HelpCircle,
  Activity,
  ChevronRight,
  MessageSquare,
  Copy,
  Check,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ChatbotLogo from '../ChatbotLogo';
import { FOUNDER_CANONICAL } from '@/lib/founderIdentity';
import { COFOUNDER_CANONICAL } from '@/lib/cofounderIdentity';

interface LandingNavigationProps {
  children?: ReactNode;
}

const LandingNavigation = ({ children }: LandingNavigationProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Keyboard accessibility: Escape key closes drawer
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawerOpen) {
        setDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const copyBusinessEmail = useCallback(() => {
    navigator.clipboard.writeText('shadowtalk@shadowtalk-ai.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  }, []);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 pt-3 sm:pt-5 px-3 sm:px-6 pointer-events-none flex justify-center">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 22 }}
          className={`pointer-events-auto flex items-center justify-between transition-all duration-300 ease-out 
            w-full max-w-[940px] ${
              scrolled
                ? 'shadow-[0_12px_36px_rgba(0,0,0,0.5)] bg-slate-900/90 border-white/15'
                : 'shadow-[0_8px_30px_rgba(0,0,0,0.35)] bg-slate-900/75 border-white/10'
            }
            rounded-full backdrop-blur-2xl border px-3 sm:px-5 py-2 gap-3`}
        >
          {/* Logo Section */}
          <a href="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0 whitespace-nowrap select-none group mr-2">
            <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-slate-950 border border-white/15 shadow-inner group-hover:scale-105 transition-transform shrink-0">
              <ChatbotLogo size={20} className="relative z-10" />
            </div>
            <span className="text-sm sm:text-base font-bold tracking-widest text-white uppercase shrink-0 whitespace-nowrap">
              ShadowTalk
            </span>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-5 shrink-0 mx-2" aria-label="Main navigation">
            <a
              href="#services"
              className="text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-cyan-400 transition-colors shrink-0 whitespace-nowrap px-1.5 py-1"
            >
              Services
            </a>
            <div className="h-3 w-px bg-slate-700/60 shrink-0" />
            <a
              href="#founders"
              className="text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-purple-400 transition-colors shrink-0 whitespace-nowrap px-1.5 py-1"
            >
              Founders
            </a>
            <div className="h-3 w-px bg-slate-700/60 shrink-0" />
            <a
              href="#pricing"
              className="text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-emerald-400 transition-colors shrink-0 whitespace-nowrap px-1.5 py-1"
            >
              Pricing
            </a>
            <div className="h-3 w-px bg-slate-700/60 shrink-0" />
            <a
              href="#contact"
              className="text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-pink-400 transition-colors shrink-0 whitespace-nowrap px-1.5 py-1"
            >
              Contact
            </a>
          </nav>

          {/* Action Group: Open App Button + Minimalist Glass Hamburger Button */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 whitespace-nowrap ml-auto">
            {/* Primary Open App Button */}
            <Link
              to="/chatbot"
              className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full p-[1px] shrink-0 whitespace-nowrap"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-blue-500 opacity-80 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500/90 to-purple-500/90 backdrop-blur-md px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white transition-all hover:from-cyan-400 hover:to-purple-400 whitespace-nowrap shrink-0 shadow-md">
                <span className="whitespace-nowrap">Open App</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 shrink-0" />
              </span>
            </Link>

            {/* Minimalist Glass Icon Button */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center bg-slate-800/80 hover:bg-slate-700/90 border border-white/15 hover:border-cyan-400/40 text-slate-200 hover:text-white transition-all duration-300 shadow-md group cursor-pointer shrink-0"
              aria-label="Open navigation menu (Services, Founders, Contact, Pricing)"
              title="Open Navigation Menu"
            >
              <div className="flex flex-col justify-center items-center gap-[3.5px] w-4 h-4 shrink-0">
                <span className="w-4 h-[1.5px] bg-slate-300 group-hover:bg-cyan-400 rounded-full transition-all duration-300 group-hover:w-4.5" />
                <span className="w-3 h-[1.5px] bg-purple-400 group-hover:bg-purple-300 rounded-full transition-all duration-300 group-hover:w-4.5" />
                <span className="w-4 h-[1.5px] bg-slate-300 group-hover:bg-pink-400 rounded-full transition-all duration-300 group-hover:w-4.5" />
              </div>
            </button>
          </div>
        </motion.div>

        {/* Invisible full-screen wrapper for children if any */}
        <div className="absolute top-0 left-0 w-full pointer-events-none">
          {children}
        </div>
      </header>

      {/* Right-Side Luxury Navigation Drawer for Desktops, Laptops, Tablets & Mobile */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-[99999] flex justify-end">
            {/* Backdrop Dimmer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={closeDrawer}
              className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
              aria-hidden="true"
            />

            {/* Responsive Right-Side Sliding Panel */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{ backgroundColor: '#020617' }}
              className="relative w-full sm:w-[460px] md:w-[500px] lg:w-[540px] h-full flex flex-col z-10 border-l border-white/10 shadow-[-25px_0_60px_rgba(0,0,0,0.85)] text-slate-100 overflow-hidden"
              role="dialog"
              aria-label="Site Navigation"
              aria-modal="true"
            >
              {/* Drawer Sticky Top Header */}
              <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-white/10 flex items-center justify-between bg-slate-950/90 backdrop-blur-xl shrink-0">
                <Link to="/" onClick={closeDrawer} className="flex items-center gap-3 select-none group">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-white/15 shadow-[0_0_15px_rgba(6,182,212,0.25)] group-hover:scale-105 transition-transform">
                    <ChatbotLogo size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold tracking-wider text-white uppercase font-sans">
                        ShadowTalk AI
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[9px] font-mono text-cyan-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Online
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Navigation & Workspaces</p>
                  </div>
                </Link>

                <div className="flex items-center gap-2.5">
                  <span className="hidden sm:inline-block text-[10px] text-slate-400 font-mono">
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-slate-300">ESC</kbd>
                  </span>
                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="h-9 w-9 rounded-full bg-slate-900 hover:bg-slate-800 border border-white/15 hover:border-white/30 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer shadow-md"
                    aria-label="Close navigation menu"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Drawer Scrollable Body (Native Scrollbars Completely Hidden) */}
              <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                
                {/* 1. SERVICES & AI TOOLS */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-cyan-500/25">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-cyan-500/15 text-cyan-400">
                        <Zap className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
                        Services & AI Tools
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/30">
                      5 Engines
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Link
                      to="/chatbot"
                      onClick={closeDrawer}
                      className="group p-3 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-white/10 hover:border-cyan-500/40 transition-all block shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                          <Bot className="h-4 w-4 text-cyan-400 shrink-0" />
                          Autonomous Chatbot
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-[11px] text-slate-400 group-hover:text-slate-300 mt-1 pl-6">
                        Multi-model reasoning (Claude, GPT, DeepSeek) with 30+ native tools.
                      </p>
                    </Link>

                    <Link
                      to="/workspace"
                      onClick={closeDrawer}
                      className="group p-3 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-white/10 hover:border-purple-500/40 transition-all block shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-semibold text-white group-hover:text-purple-300 transition-colors flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
                          Mission Control
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-[11px] text-slate-400 group-hover:text-slate-300 mt-1 pl-6">
                        Autonomous goal planner running multi-step browser & code loops.
                      </p>
                    </Link>

                    <Link
                      to="/deep-research"
                      onClick={closeDrawer}
                      className="group p-3 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-white/10 hover:border-blue-500/40 transition-all block shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-semibold text-white group-hover:text-blue-300 transition-colors flex items-center gap-2">
                          <Brain className="h-4 w-4 text-blue-400 shrink-0" />
                          Deep Research Engine
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-[11px] text-slate-400 group-hover:text-slate-300 mt-1 pl-6">
                        Multi-source web synthesis, academic extraction & cited reports.
                      </p>
                    </Link>

                    <Link
                      to="/private-ai"
                      onClick={closeDrawer}
                      className="group p-3 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-white/10 hover:border-emerald-500/40 transition-all block shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                          <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
                          Private AI & Vault
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-[11px] text-slate-400 group-hover:text-slate-300 mt-1 pl-6">
                        100% on-device WebGPU models with zero cloud telemetry.
                      </p>
                    </Link>

                    <Link
                      to="/studio"
                      onClick={closeDrawer}
                      className="group p-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-850 border border-white/5 hover:border-amber-500/30 transition-all flex items-center justify-between text-xs text-slate-300 hover:text-white"
                    >
                      <span className="pl-1">Model Studio & Playground</span>
                      <ChevronRight className="h-3 w-3 text-slate-500" />
                    </Link>
                  </div>
                </div>

                {/* 2. ABOUT US / FOUNDERS */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-500/25">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-purple-500/15 text-purple-400">
                        <Users className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-mono font-bold tracking-wider text-purple-400 uppercase">
                        About Us / Founders
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-500/30">
                      Karachi, PK
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Zain Ahmed Card */}
                    <Link
                      to="/founder"
                      onClick={closeDrawer}
                      className="group p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-white/10 hover:border-cyan-500/40 transition-all block relative shadow-sm"
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="font-mono text-cyan-300 font-semibold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30">
                          Founder & Lead Architect
                        </span>
                        <span className="text-slate-400 font-mono">Age 17</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors mt-1.5">
                        {FOUNDER_CANONICAL.fullName}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        Creator of ShadowTalk AI. Architect of offline model loops and sovereign systems.
                      </p>
                      <div className="mt-2 text-[10px] font-medium text-cyan-400 flex items-center gap-1">
                        <span>View Founder Story</span>
                        <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>

                    {/* Fatima Card */}
                    <Link
                      to="/fatima"
                      onClick={closeDrawer}
                      className="group p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-white/10 hover:border-purple-500/40 transition-all block relative shadow-sm"
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="font-mono text-purple-300 font-semibold px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/30">
                          Co-Founder & Systems Architect
                        </span>
                        <span className="text-purple-400 font-mono">2nd Dev</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="h-6 w-6 rounded-md bg-purple-950/90 border border-purple-500/50 flex items-center justify-center font-mono font-bold text-[10px] text-purple-300 shrink-0">
                          FT
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                          {COFOUNDER_CANONICAL.fullName}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        120fps UI state machine, client-side memory ledger & zero-leak telemetry.
                      </p>
                      <div className="mt-2 text-[10px] font-medium text-purple-400 flex items-center gap-1">
                        <span>View Co-Founder Story</span>
                        <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>

                    {/* Company Vision & Trust Quick Links */}
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <Link
                        to="/about"
                        onClick={closeDrawer}
                        className="p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-850 border border-white/10 transition-all text-center"
                      >
                        <p className="text-xs font-semibold text-white">Company Vision</p>
                        <p className="text-[10px] text-slate-400">Roadmap & story</p>
                      </Link>
                      <Link
                        to="/trust"
                        onClick={closeDrawer}
                        className="p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-850 border border-white/10 transition-all text-center"
                      >
                        <p className="text-xs font-semibold text-white">Security & Trust</p>
                        <p className="text-[10px] text-slate-400">Audits & zero cloud</p>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* 3. PRICING & ACCESS */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-500/25">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-emerald-500/15 text-emerald-400">
                        <CreditCard className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
                        Pricing & Access
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Transparent
                    </span>
                  </div>

                  <Link
                    to="/pricing"
                    onClick={closeDrawer}
                    className="group p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-white/10 hover:border-emerald-500/40 transition-all block shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                        Membership Plans & Pricing
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Free starter ($0), Pro Sovereign ($19/mo), and Founder Lifetime Tier.
                    </p>
                    <div className="mt-3 pt-2.5 border-t border-white/5 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Free Starter</span>
                        <span className="font-mono text-emerald-400 font-semibold">$0 / forever</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Pro Sovereign</span>
                        <span className="font-mono text-emerald-400 font-semibold">$19 / mo</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Lifetime Tier</span>
                        <span className="font-mono text-purple-400 font-semibold">One-time</span>
                      </div>
                    </div>
                  </Link>

                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300">
                    <p className="font-semibold text-emerald-200 text-[11px]">No Credit Card Required</p>
                    <p className="text-[10px] text-emerald-400/90 mt-0.5">
                      Start testing models locally on your GPU right away.
                    </p>
                  </div>
                </div>

                {/* 4. CONTACT DETAILS & SUPPORT */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-pink-500/25">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-pink-500/15 text-pink-400">
                        <Mail className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-mono font-bold tracking-wider text-pink-400 uppercase">
                        Contact Details & Support
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-pink-300 bg-pink-950/80 px-2 py-0.5 rounded-full border border-pink-500/30">
                      Direct Desk
                    </span>
                  </div>

                  {/* Official Business Email Card */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-pink-500/30 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="text-[11px]">Official Business Email:</span>
                      <button
                        type="button"
                        onClick={copyBusinessEmail}
                        className="inline-flex items-center gap-1 text-[11px] text-pink-400 hover:text-pink-300 font-mono transition-colors cursor-pointer"
                      >
                        {copiedEmail ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <a
                      href="mailto:shadowtalk@shadowtalk-ai.com"
                      className="block text-xs sm:text-sm font-mono text-white hover:text-pink-300 transition-colors break-all font-bold"
                    >
                      shadowtalk@shadowtalk-ai.com
                    </a>
                  </div>

                  {/* Support Quick 2x2 Channels */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/contact"
                      onClick={closeDrawer}
                      className="p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-850 border border-white/10 transition-all text-center group"
                    >
                      <MessageSquare className="h-3.5 w-3.5 mx-auto mb-1 text-pink-400 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-semibold text-white">Contact Form</p>
                      <p className="text-[10px] text-slate-400">Direct message</p>
                    </Link>

                    <Link
                      to="/status"
                      onClick={closeDrawer}
                      className="p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-850 border border-white/10 transition-all text-center group"
                    >
                      <Activity className="h-3.5 w-3.5 mx-auto mb-1 text-cyan-400 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-semibold text-white">Live Status</p>
                      <p className="text-[10px] text-emerald-400 font-mono">99.9% Uptime</p>
                    </Link>

                    <Link
                      to="/faq"
                      onClick={closeDrawer}
                      className="p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-850 border border-white/10 transition-all text-center group"
                    >
                      <HelpCircle className="h-3.5 w-3.5 mx-auto mb-1 text-purple-400 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-semibold text-white">FAQ</p>
                      <p className="text-[10px] text-slate-400">Architecture</p>
                    </Link>

                    <Link
                      to="/help"
                      onClick={closeDrawer}
                      className="p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-850 border border-white/10 transition-all text-center group"
                    >
                      <Shield className="h-3.5 w-3.5 mx-auto mb-1 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-semibold text-white">Help Center</p>
                      <p className="text-[10px] text-slate-400">Docs & setup</p>
                    </Link>
                  </div>
                </div>

              </div>

              {/* Drawer Bottom Sticky Action Bar */}
              <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-950/95 backdrop-blur-xl flex items-center gap-3 shrink-0">
                <Link
                  to="/contact"
                  onClick={closeDrawer}
                  className="py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-white/15 text-center transition-colors shrink-0"
                >
                  Contact Founders
                </Link>
                <Link
                  to="/chatbot"
                  onClick={closeDrawer}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-600 hover:from-cyan-400 hover:to-pink-500 text-white text-xs font-semibold shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 transition-all"
                >
                  <span>Launch Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LandingNavigation;
