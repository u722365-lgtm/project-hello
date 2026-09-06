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

  // Keyboard accessibility: Escape key closes menu
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawerOpen) {
        setDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  // Lock body scroll when menu is open
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

            {/* Minimalist Glass Icon Button (Clean 3-line animated hamburger, no text label) */}
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

      {/* Sleek Minimalist Fullscreen / Slide-Down Overlay (Apple & Linear Style) */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[99999] bg-slate-950/98 backdrop-blur-3xl text-slate-100 flex flex-col justify-between overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            role="dialog"
            aria-label="Site Navigation"
            aria-modal="true"
          >
            {/* Subtle Ambient Backlight Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-cyan-500/10 via-purple-500/5 to-transparent rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-0 right-10 w-[500px] h-[300px] bg-purple-500/8 rounded-full blur-[120px] pointer-events-none" />

            {/* Top Navigation Bar inside Overlay */}
            <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 pt-6 sm:pt-8 pb-5 flex items-center justify-between border-b border-white/10 shrink-0 relative z-10">
              <Link to="/" onClick={closeDrawer} className="flex items-center gap-3 select-none group">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 border border-white/15 shadow-[0_0_20px_rgba(6,182,212,0.2)] group-hover:scale-105 transition-transform">
                  <ChatbotLogo size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold tracking-widest text-white uppercase font-sans">
                      ShadowTalk AI
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-[10px] font-mono text-cyan-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Online · Sovereign Node
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Autonomous Intelligence & Private Models</p>
                </div>
              </Link>

              {/* Action Buttons: Escape key prompt & Frosted Circular Close */}
              <div className="flex items-center gap-4">
                <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  Press <kbd className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-white/15 text-slate-300 text-[11px] font-semibold">ESC</kbd> to close
                </span>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer group shadow-lg"
                  aria-label="Close navigation menu"
                >
                  <X className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90 text-slate-200 group-hover:text-white" />
                </button>
              </div>
            </div>

            {/* Main Navigation Matrix: 4 Sleek Minimalist Columns with Generous Spacing */}
            <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 py-8 lg:py-12 flex-1 flex flex-col justify-center relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
                
                {/* 01. SERVICES & AI TOOLS */}
                <div className="space-y-4">
                  <div className="pb-3 border-b border-cyan-500/25 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-cyan-400" />
                      <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                        Services & AI Tools
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-300/80 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30">
                      01
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Link
                      to="/chatbot"
                      onClick={closeDrawer}
                      className="group p-2.5 -mx-2.5 rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-white/10 transition-all block"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                          <Bot className="h-4 w-4 text-cyan-400" />
                          Autonomous Chatbot
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-xs text-slate-400 group-hover:text-slate-300 mt-1 pl-6">
                        Multi-model reasoning (Claude, GPT, DeepSeek) with 30+ native tools.
                      </p>
                    </Link>

                    <Link
                      to="/workspace"
                      onClick={closeDrawer}
                      className="group p-2.5 -mx-2.5 rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-white/10 transition-all block"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-purple-400" />
                          Mission Control
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-xs text-slate-400 group-hover:text-slate-300 mt-1 pl-6">
                        Autonomous goal planner running multi-step browser & code loops.
                      </p>
                    </Link>

                    <Link
                      to="/deep-research"
                      onClick={closeDrawer}
                      className="group p-2.5 -mx-2.5 rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-white/10 transition-all block"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors flex items-center gap-2">
                          <Brain className="h-4 w-4 text-blue-400" />
                          Deep Research Engine
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-xs text-slate-400 group-hover:text-slate-300 mt-1 pl-6">
                        Multi-source web synthesis, academic extraction & cited reports.
                      </p>
                    </Link>

                    <Link
                      to="/private-ai"
                      onClick={closeDrawer}
                      className="group p-2.5 -mx-2.5 rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-white/10 transition-all block"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                          <Shield className="h-4 w-4 text-emerald-400" />
                          Private AI & Vault
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-xs text-slate-400 group-hover:text-slate-300 mt-1 pl-6">
                        100% on-device WebGPU models with zero cloud telemetry.
                      </p>
                    </Link>

                    <Link
                      to="/studio"
                      onClick={closeDrawer}
                      className="group p-2.5 -mx-2.5 rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-white/10 transition-all block text-xs text-slate-300 hover:text-white"
                    >
                      <div className="flex items-center justify-between pl-6">
                        <span>Model Studio & Playground</span>
                        <ChevronRight className="h-3 w-3 text-slate-500" />
                      </div>
                    </Link>
                  </div>
                </div>

                {/* 02. ABOUT US / FOUNDERS */}
                <div className="space-y-4">
                  <div className="pb-3 border-b border-purple-500/25 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-purple-400" />
                      <span className="text-xs font-mono font-bold tracking-widest text-purple-400 uppercase">
                        About Us / Founders
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-purple-300/80 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-500/30">
                      02
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Zain Ahmed Card */}
                    <Link
                      to="/founder"
                      onClick={closeDrawer}
                      className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-cyan-500/40 transition-all block relative"
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-mono text-cyan-300 font-semibold">Founder & Lead Architect</span>
                        <span className="text-slate-400 font-mono">Age 17</span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {FOUNDER_CANONICAL.fullName}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        Creator of ShadowTalk AI. Architect of offline model loops and sovereign systems.
                      </p>
                      <div className="mt-2 text-[11px] font-medium text-cyan-400 flex items-center gap-1">
                        <span>View Founder Story</span>
                        <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>

                    {/* Fatima Card */}
                    <Link
                      to="/fatima"
                      onClick={closeDrawer}
                      className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-purple-500/40 transition-all block relative"
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-mono text-purple-300 font-semibold">Co-Founder & Systems Architect</span>
                        <span className="text-purple-400 font-mono">2nd Dev</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-purple-950/80 border border-purple-500/40 flex items-center justify-center font-mono font-bold text-[10px] text-purple-300 shrink-0">
                          FT
                        </div>
                        <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                          {COFOUNDER_CANONICAL.fullName}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        120fps UI state machine, client-side memory ledger & zero-leak telemetry.
                      </p>
                      <div className="mt-2 text-[11px] font-medium text-purple-400 flex items-center gap-1">
                        <span>View Co-Founder Story</span>
                        <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>

                    {/* Company Vision & Trust Quick Links */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Link
                        to="/about"
                        onClick={closeDrawer}
                        className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-all text-xs text-slate-300 hover:text-white"
                      >
                        <p className="font-semibold text-white">Company Vision</p>
                        <p className="text-[10px] text-slate-400">Roadmap & story</p>
                      </Link>
                      <Link
                        to="/trust"
                        onClick={closeDrawer}
                        className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-all text-xs text-slate-300 hover:text-white"
                      >
                        <p className="font-semibold text-white">Security & Trust</p>
                        <p className="text-[10px] text-slate-400">Audits & zero cloud</p>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* 03. PRICING & ACCESS */}
                <div className="space-y-4">
                  <div className="pb-3 border-b border-emerald-500/25 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
                        Pricing & Access
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-300/80 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      03
                    </span>
                  </div>

                  <div className="space-y-3">
                    <Link
                      to="/pricing"
                      onClick={closeDrawer}
                      className="group p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-emerald-500/40 transition-all block"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                          Membership Plans & Pricing
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
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

                    <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300">
                      <p className="font-semibold text-emerald-200">No Credit Card Required</p>
                      <p className="text-[11px] text-emerald-400/80 mt-0.5">
                        Start testing models locally on your GPU right away.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 04. CONTACT DETAILS & SUPPORT */}
                <div className="space-y-4">
                  <div className="pb-3 border-b border-pink-500/25 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-pink-400" />
                      <span className="text-xs font-mono font-bold tracking-widest text-pink-400 uppercase">
                        Contact Details & Support
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-pink-300/80 bg-pink-950/60 px-2 py-0.5 rounded-full border border-pink-500/30">
                      04
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Official Business Email Card */}
                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-pink-500/25 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Official Business Email:</span>
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

                    {/* Support Quick Channels */}
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to="/contact"
                        onClick={closeDrawer}
                        className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-all text-center group"
                      >
                        <MessageSquare className="h-3.5 w-3.5 mx-auto mb-1 text-pink-400 group-hover:scale-110 transition-transform" />
                        <p className="text-xs font-semibold text-white">Contact Form</p>
                        <p className="text-[10px] text-slate-400">Direct message</p>
                      </Link>

                      <Link
                        to="/status"
                        onClick={closeDrawer}
                        className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-all text-center group"
                      >
                        <Activity className="h-3.5 w-3.5 mx-auto mb-1 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <p className="text-xs font-semibold text-white">Live Status</p>
                        <p className="text-[10px] text-emerald-400 font-mono">99.9% Uptime</p>
                      </Link>

                      <Link
                        to="/faq"
                        onClick={closeDrawer}
                        className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-all text-center group"
                      >
                        <HelpCircle className="h-3.5 w-3.5 mx-auto mb-1 text-purple-400 group-hover:scale-110 transition-transform" />
                        <p className="text-xs font-semibold text-white">FAQ</p>
                        <p className="text-[10px] text-slate-400">Architecture</p>
                      </Link>

                      <Link
                        to="/help"
                        onClick={closeDrawer}
                        className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-all text-center group"
                      >
                        <Shield className="h-3.5 w-3.5 mx-auto mb-1 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <p className="text-xs font-semibold text-white">Help Center</p>
                        <p className="text-[10px] text-slate-400">Docs & setup</p>
                      </Link>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Status & Launch Bar */}
            <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 py-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 relative z-10">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Karachi, Pakistan · Sovereign Encryption · 256-bit AES-GCM</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Link
                  to="/contact"
                  onClick={closeDrawer}
                  className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium border border-white/10 transition-colors"
                >
                  Contact Founders
                </Link>
                <Link
                  to="/chatbot"
                  onClick={closeDrawer}
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-600 hover:from-cyan-400 hover:to-pink-500 text-white text-xs font-semibold transition-all shadow-[0_0_25px_rgba(6,182,212,0.35)] flex items-center gap-1.5 group"
                >
                  <span>Launch Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LandingNavigation;
