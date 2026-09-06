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

      {/* Sleek Minimalist Right-Side Navigation Blade (Apple & Linear Aesthetic) */}
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

            {/* Right-Side Solid Luxury Blade */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              style={{ backgroundColor: '#020617' }}
              className="relative w-full sm:w-[480px] md:w-[540px] lg:w-[600px] h-full flex flex-col z-10 border-l border-white/10 shadow-[-25px_0_70px_rgba(0,0,0,0.9)] text-slate-100 overflow-hidden"
              role="dialog"
              aria-label="Site Navigation"
              aria-modal="true"
            >
              {/* Ambient Glows Inside Solid Canvas */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
              <div className="absolute bottom-20 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-[130px] pointer-events-none" />

              {/* Minimalist Top Bar */}
              <div className="px-6 sm:px-8 py-5 border-b border-white/10 flex items-center justify-between bg-slate-950/80 backdrop-blur-xl shrink-0 relative z-10">
                <Link to="/" onClick={closeDrawer} className="flex items-center gap-3 select-none group">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-white/15 shadow-[0_0_15px_rgba(6,182,212,0.25)] group-hover:scale-105 transition-transform">
                    <ChatbotLogo size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold tracking-widest text-white uppercase font-sans">
                        ShadowTalk AI
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[9px] font-mono text-cyan-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Online
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Sovereign Intelligence Engine</p>
                  </div>
                </Link>

                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline-block text-[11px] text-slate-400 font-mono">
                    <kbd className="px-2 py-0.5 rounded-md bg-slate-800/90 border border-white/15 text-slate-300 text-[10px]">ESC</kbd>
                  </span>
                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="h-9 w-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer group shadow-sm"
                    aria-label="Close navigation menu"
                  >
                    <X className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90 text-slate-200 group-hover:text-white" />
                  </button>
                </div>
              </div>

              {/* Airy Typographic Scroll Area (No Browser Scrollbars) */}
              <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-8 relative z-10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                
                {/* 01. SERVICES & AI TOOLS */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-cyan-500/25">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-cyan-400" />
                      <span className="text-xs font-mono font-bold tracking-[0.2em] text-cyan-400 uppercase">
                        Services & AI Tools
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-300/80 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30">
                      01
                    </span>
                  </div>

                  <div className="divide-y divide-white/[0.06]">
                    <Link
                      to="/chatbot"
                      onClick={closeDrawer}
                      className="group py-3.5 flex items-start justify-between transition-all block hover:pl-1.5"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-cyan-400" />
                          <span className="text-sm sm:text-base font-medium text-white group-hover:text-cyan-300 transition-colors">
                            Autonomous Chatbot
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                            30+ Tools
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 group-hover:text-slate-300 mt-1 pl-6">
                          Multi-model reasoning (Claude 3.5, GPT-4o, DeepSeek R1).
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all mt-1 shrink-0" />
                    </Link>

                    <Link
                      to="/workspace"
                      onClick={closeDrawer}
                      className="group py-3.5 flex items-start justify-between transition-all block hover:pl-1.5"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-purple-400" />
                          <span className="text-sm sm:text-base font-medium text-white group-hover:text-purple-300 transition-colors">
                            Mission Control
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            Agent Loops
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 group-hover:text-slate-300 mt-1 pl-6">
                          Autonomous goal planner executing code & browser tasks.
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all mt-1 shrink-0" />
                    </Link>

                    <Link
                      to="/deep-research"
                      onClick={closeDrawer}
                      className="group py-3.5 flex items-start justify-between transition-all block hover:pl-1.5"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-blue-400" />
                          <span className="text-sm sm:text-base font-medium text-white group-hover:text-blue-300 transition-colors">
                            Deep Research Engine
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 group-hover:text-slate-300 mt-1 pl-6">
                          Multi-source web synthesis, academic extraction & citations.
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all mt-1 shrink-0" />
                    </Link>

                    <Link
                      to="/private-ai"
                      onClick={closeDrawer}
                      className="group py-3.5 flex items-start justify-between transition-all block hover:pl-1.5"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-emerald-400" />
                          <span className="text-sm sm:text-base font-medium text-white group-hover:text-emerald-300 transition-colors">
                            Private AI & Vault
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            WebGPU
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 group-hover:text-slate-300 mt-1 pl-6">
                          100% on-device local models with zero cloud telemetry.
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all mt-1 shrink-0" />
                    </Link>

                    <Link
                      to="/studio"
                      onClick={closeDrawer}
                      className="group py-3 flex items-center justify-between text-xs text-slate-300 hover:text-white transition-all pl-6"
                    >
                      <span>Model Studio & Code Playground</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>

                {/* 02. ABOUT US / FOUNDERS */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-500/25">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-purple-400" />
                      <span className="text-xs font-mono font-bold tracking-[0.2em] text-purple-400 uppercase">
                        About Us / Founders
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-purple-300/80 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-500/30">
                      02 · Karachi
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Zain Ahmed */}
                    <Link
                      to="/founder"
                      onClick={closeDrawer}
                      className="group p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-cyan-500/40 transition-all block relative"
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className="font-mono text-cyan-300 font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30">
                          Founder & Lead Architect
                        </span>
                        <span className="text-slate-400 font-mono">Age 17</span>
                      </div>
                      <h4 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">
                        {FOUNDER_CANONICAL.fullName}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        Creator of ShadowTalk AI. Architect of offline model loops and sovereign systems.
                      </p>
                      <div className="mt-2.5 text-xs font-medium text-cyan-400 flex items-center gap-1">
                        <span>Read Founder Story</span>
                        <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>

                    {/* Fatima */}
                    <Link
                      to="/fatima"
                      onClick={closeDrawer}
                      className="group p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-purple-500/40 transition-all block relative"
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className="font-mono text-purple-300 font-semibold px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/30">
                          Co-Founder & Systems Architect
                        </span>
                        <span className="text-purple-400 font-mono">2nd Dev</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-purple-950/90 border border-purple-500/50 flex items-center justify-center font-mono font-bold text-[10px] text-purple-300 shrink-0">
                          FT
                        </div>
                        <h4 className="text-base font-semibold text-white group-hover:text-purple-300 transition-colors">
                          {COFOUNDER_CANONICAL.fullName}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        120fps UI state machine, client-side memory ledger & zero-leak telemetry.
                      </p>
                      <div className="mt-2.5 text-xs font-medium text-purple-400 flex items-center gap-1">
                        <span>Read Co-Founder Story</span>
                        <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>

                    {/* Quick Vision & Trust Links */}
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <Link
                        to="/about"
                        onClick={closeDrawer}
                        className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all text-xs text-slate-300 hover:text-white"
                      >
                        <p className="font-semibold text-white">Company Vision</p>
                        <p className="text-[10px] text-slate-400">Roadmap & principles</p>
                      </Link>
                      <Link
                        to="/trust"
                        onClick={closeDrawer}
                        className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all text-xs text-slate-300 hover:text-white"
                      >
                        <p className="font-semibold text-white">Security & Trust</p>
                        <p className="text-[10px] text-slate-400">Audits & zero cloud</p>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* 03. PRICING & ACCESS */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-500/25">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-xs font-mono font-bold tracking-[0.2em] text-emerald-400 uppercase">
                        Pricing & Access
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-300/80 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      03
                    </span>
                  </div>

                  <Link
                    to="/pricing"
                    onClick={closeDrawer}
                    className="group p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-emerald-500/40 transition-all block"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm sm:text-base font-semibold text-white group-hover:text-emerald-300 transition-colors">
                        Membership Plans & Pricing
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Transparent tiers: Free Starter ($0), Pro Sovereign ($19/mo), and Founder Lifetime.
                    </p>
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Starter Tier</span>
                      <span className="text-emerald-400 font-semibold">$0 / No card required</span>
                    </div>
                  </Link>
                </div>

                {/* 04. CONTACT DETAILS & SUPPORT */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-pink-500/25">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-pink-400" />
                      <span className="text-xs font-mono font-bold tracking-[0.2em] text-pink-400 uppercase">
                        Contact Details & Support
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-pink-300/80 bg-pink-950/60 px-2 py-0.5 rounded-full border border-pink-500/30">
                      04
                    </span>
                  </div>

                  {/* Official Business Email Card */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-pink-500/25 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Official Inquiries:</span>
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

                  {/* Support Channels 2x2 Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/contact"
                      onClick={closeDrawer}
                      className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all text-center group"
                    >
                      <MessageSquare className="h-3.5 w-3.5 mx-auto mb-1 text-pink-400 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-semibold text-white">Contact Form</p>
                      <p className="text-[10px] text-slate-400">Direct message</p>
                    </Link>

                    <Link
                      to="/status"
                      onClick={closeDrawer}
                      className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all text-center group"
                    >
                      <Activity className="h-3.5 w-3.5 mx-auto mb-1 text-cyan-400 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-semibold text-white">Live Status</p>
                      <p className="text-[10px] text-emerald-400 font-mono">99.9% Uptime</p>
                    </Link>

                    <Link
                      to="/faq"
                      onClick={closeDrawer}
                      className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all text-center group"
                    >
                      <HelpCircle className="h-3.5 w-3.5 mx-auto mb-1 text-purple-400 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-semibold text-white">FAQ</p>
                      <p className="text-[10px] text-slate-400">Architecture</p>
                    </Link>

                    <Link
                      to="/help"
                      onClick={closeDrawer}
                      className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all text-center group"
                    >
                      <Shield className="h-3.5 w-3.5 mx-auto mb-1 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-semibold text-white">Help Center</p>
                      <p className="text-[10px] text-slate-400">Docs & setup</p>
                    </Link>
                  </div>
                </div>

              </div>

              {/* Minimalist Bottom Bar */}
              <div className="px-6 sm:px-8 py-4 border-t border-white/10 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between gap-3 shrink-0 relative z-10">
                <div className="text-xs text-slate-400 font-mono hidden sm:block">
                  <span>Karachi, PK · 256-bit AES</span>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <Link
                    to="/contact"
                    onClick={closeDrawer}
                    className="py-2 px-3.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium border border-white/10 transition-colors text-center"
                  >
                    Contact Founders
                  </Link>
                  <Link
                    to="/chatbot"
                    onClick={closeDrawer}
                    className="flex-1 sm:flex-none py-2 px-4 rounded-full bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-600 hover:from-cyan-400 hover:to-pink-500 text-white text-xs font-semibold shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-1.5 transition-all group"
                  >
                    <span>Launch Workspace</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LandingNavigation;
