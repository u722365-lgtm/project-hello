import { ReactNode, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Menu,
  X,
  Sparkles,
  Bot,
  Brain,
  Zap,
  Users,
  User,
  Shield,
  CreditCard,
  Mail,
  HelpCircle,
  Activity,
  ChevronRight,
  ExternalLink,
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

          {/* Desktop Navigation Links — Shown on wider displays with ample breathing room */}
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

          {/* Action Group: Open App Button + 3-Bar Menu Toggle */}
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

            {/* Prominent Three-Bar (Hamburger) Navigation Button */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-slate-800/90 hover:bg-slate-700/90 border border-white/15 text-slate-200 hover:text-white transition-all shadow-md group cursor-pointer shrink-0 whitespace-nowrap"
              aria-label="Open navigation menu (Services, Founders, Contact, Pricing)"
              title="Open Navigation Menu"
            >
              {/* Animated 3 bars */}
              <div className="flex flex-col justify-center items-center gap-[3px] w-4 h-3.5 shrink-0">
                <span className="w-3.5 h-[2px] bg-cyan-400 rounded-full group-hover:w-4 transition-all" />
                <span className="w-4 h-[2px] bg-purple-400 rounded-full" />
                <span className="w-2.5 h-[2px] bg-pink-400 rounded-full group-hover:w-4 transition-all" />
              </div>
              <span className="text-xs font-semibold tracking-wide text-slate-200 group-hover:text-white shrink-0 whitespace-nowrap">
                Menu
              </span>
            </button>
          </div>
        </motion.div>

        {/* Invisible full-screen wrapper for children if any */}
        <div className="absolute top-0 left-0 w-full pointer-events-none">
          {children}
        </div>
      </header>

      {/* Ultra-Premium Glassmorphic Navigation Command Overlay */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 md:p-8 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* Ambient Lighting Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={closeDrawer}
              className="fixed inset-0 bg-black/85 backdrop-blur-2xl cursor-pointer"
              aria-hidden="true"
            >
              {/* Subtle Atmospheric Light Orbs */}
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
            </motion.div>

            {/* Centered Luxury Glass Command Hub */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="relative w-full max-w-5xl my-auto rounded-3xl bg-slate-950/95 border border-white/15 backdrop-blur-3xl shadow-[0_25px_80px_rgba(0,0,0,0.85),0_0_60px_rgba(6,182,212,0.12)] flex flex-col z-10 overflow-hidden text-slate-100 max-h-[92vh]"
              role="dialog"
              aria-label="Site Navigation"
              aria-modal="true"
            >
              {/* Command Hub Header */}
              <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-slate-900/60 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                    <ChatbotLogo size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold tracking-wider text-white uppercase font-sans">
                        ShadowTalk AI
                      </h2>
                      <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-[10px] font-mono text-cyan-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Online · Sovereign Node
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Direct Navigation Matrix & Workspaces</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-slate-300 text-[10px]">ESC</kbd> to exit
                  </span>
                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Command Hub Multi-Column Body */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                  {/* COLUMN 1: SERVICES & AI TOOLS */}
                  <div className="space-y-3.5" data-section="services">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                          <Zap className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                          Services & AI Tools
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/20">
                        5 Workspaces
                      </span>
                    </div>

                    <div className="space-y-2">
                      <Link
                        to="/chatbot"
                        onClick={closeDrawer}
                        className="group p-3.5 rounded-2xl bg-slate-900/50 hover:bg-slate-850 border border-white/5 hover:border-cyan-500/40 transition-all block relative overflow-hidden shadow-sm hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                            <Bot className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                                Autonomous Chatbot
                              </p>
                              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                              Multi-model reasoning (Claude, GPT, DeepSeek) with 30+ native tools.
                            </p>
                          </div>
                        </div>
                      </Link>

                      <Link
                        to="/workspace"
                        onClick={closeDrawer}
                        className="group p-3.5 rounded-2xl bg-slate-900/50 hover:bg-slate-850 border border-white/5 hover:border-purple-500/40 transition-all block relative overflow-hidden shadow-sm hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-500/30 group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                            <Sparkles className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
                                Mission Control
                              </p>
                              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                              Autonomous goal planner running multi-step browser & code loops.
                            </p>
                          </div>
                        </div>
                      </Link>

                      <Link
                        to="/deep-research"
                        onClick={closeDrawer}
                        className="group p-3.5 rounded-2xl bg-slate-900/50 hover:bg-slate-850 border border-white/5 hover:border-blue-500/40 transition-all block relative overflow-hidden shadow-sm hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-500/30 group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                            <Brain className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                                Deep Research Engine
                              </p>
                              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                              Multi-source web synthesis, academic extraction & cited reports.
                            </p>
                          </div>
                        </div>
                      </Link>

                      <Link
                        to="/private-ai"
                        onClick={closeDrawer}
                        className="group p-3.5 rounded-2xl bg-slate-900/50 hover:bg-slate-850 border border-white/5 hover:border-emerald-500/40 transition-all block relative overflow-hidden shadow-sm hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                            <Shield className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                                Private AI & Vault
                              </p>
                              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                              100% on-device WebGPU models with zero cloud telemetry.
                            </p>
                          </div>
                        </div>
                      </Link>

                      <Link
                        to="/studio"
                        onClick={closeDrawer}
                        className="group p-3 rounded-xl bg-slate-900/30 hover:bg-slate-850 border border-white/5 hover:border-amber-500/30 transition-all flex items-center justify-between text-xs text-slate-300 hover:text-white"
                      >
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-amber-400" />
                          Model Studio & Code Playground
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                      </Link>
                    </div>
                  </div>

                  {/* COLUMN 2: ABOUT US & FOUNDERS */}
                  <div className="space-y-3.5" data-section="founders">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                          <Users className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
                          About Us / Founders
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-purple-400/80 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-500/20">
                        Karachi, PK
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {/* Zain Ahmed Card */}
                      <Link
                        to="/founder"
                        onClick={closeDrawer}
                        className="group p-3.5 rounded-2xl bg-slate-900/50 hover:bg-slate-850 border border-white/5 hover:border-cyan-500/40 transition-all block relative overflow-hidden shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                            Founder & Lead Architect
                          </span>
                          <span className="text-[11px] text-slate-400">Age 17</span>
                        </div>
                        <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {FOUNDER_CANONICAL.fullName}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          Founder of ShadowTalk AI. Designs autonomous loops, offline model engines, and 30+ tools.
                        </p>
                        <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-cyan-400">
                          <span>View Founder Story</span>
                          <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </Link>

                      {/* Fatima Card */}
                      <Link
                        to="/fatima"
                        onClick={closeDrawer}
                        className="group p-3.5 rounded-2xl bg-slate-900/50 hover:bg-slate-850 border border-white/5 hover:border-purple-500/40 transition-all block relative overflow-hidden shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-500/30">
                            Co-Founder & Lead Systems Architect
                          </span>
                          <span className="text-[11px] text-purple-400 font-mono">2nd Dev</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-lg bg-purple-950/80 border border-purple-500/40 flex items-center justify-center font-mono font-bold text-xs text-purple-300 shrink-0">
                            FT
                          </div>
                          <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                            {COFOUNDER_CANONICAL.fullName}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                          Architect of the 120fps UI state machine, client-side memory ledger, and zero-leak controls.
                        </p>
                        <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-purple-400">
                          <span>View Co-Founder Story</span>
                          <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </Link>

                      {/* About Company & Trust */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Link
                          to="/about"
                          onClick={closeDrawer}
                          className="p-3 rounded-xl bg-slate-900/40 hover:bg-slate-800/80 border border-white/5 hover:border-white/20 transition-all text-xs text-slate-300 hover:text-white"
                        >
                          <p className="font-semibold text-white mb-0.5">Company Vision</p>
                          <p className="text-[10px] text-slate-400">Story & roadmap</p>
                        </Link>
                        <Link
                          to="/trust"
                          onClick={closeDrawer}
                          className="p-3 rounded-xl bg-slate-900/40 hover:bg-slate-800/80 border border-white/5 hover:border-white/20 transition-all text-xs text-slate-300 hover:text-white"
                        >
                          <p className="font-semibold text-white mb-0.5">Security & Trust</p>
                          <p className="text-[10px] text-slate-400">Audits & privacy</p>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* COLUMN 3: PRICING & CONTACT DETAILS */}
                  <div className="space-y-5" data-section="pricing-contact">
                    {/* Pricing Block */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <CreditCard className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                            Pricing & Access
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          Transparent
                        </span>
                      </div>

                      <Link
                        to="/pricing"
                        onClick={closeDrawer}
                        className="group p-3.5 rounded-2xl bg-slate-900/50 hover:bg-slate-850 border border-white/5 hover:border-emerald-500/40 transition-all block relative overflow-hidden shadow-sm hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                            Membership Plans & Pricing
                          </p>
                          <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <p className="text-xs text-slate-400">
                          Free starter ($0), Pro Sovereign ($19/mo), and Founder Lifetime Tier.
                        </p>
                        <div className="mt-2.5 flex items-center gap-2 text-[11px] font-mono text-emerald-400">
                          <span>Free forever · No credit card required</span>
                        </div>
                      </Link>
                    </div>

                    {/* Contact Details Block */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-lg bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400">
                            <Mail className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-xs font-bold uppercase tracking-widest text-pink-400">
                            Contact Details & Support
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-pink-400/80 bg-pink-950/60 px-2 py-0.5 rounded-full border border-pink-500/20">
                          Direct Desk
                        </span>
                      </div>

                      {/* Official Business Email Card */}
                      <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-pink-500/25 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400 font-medium">Official Inquiries:</span>
                          <button
                            type="button"
                            onClick={copyBusinessEmail}
                            className="inline-flex items-center gap-1 text-[11px] text-pink-400 hover:text-pink-300 font-mono transition-colors cursor-pointer"
                          >
                            {copiedEmail ? (
                              <>
                                <Check className="h-3 w-3 text-success" />
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
                          className="block text-xs sm:text-sm font-mono text-white hover:text-pink-300 transition-colors break-all font-semibold"
                        >
                          shadowtalk@shadowtalk-ai.com
                        </a>
                      </div>

                      {/* Support Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          to="/contact"
                          onClick={closeDrawer}
                          className="p-2.5 rounded-xl bg-slate-900/40 hover:bg-slate-800/80 border border-white/5 hover:border-pink-500/30 transition-all text-center group"
                        >
                          <MessageSquare className="h-3.5 w-3.5 mx-auto mb-1 text-pink-400 group-hover:scale-110 transition-transform" />
                          <p className="text-xs font-semibold text-white">Contact Form</p>
                          <p className="text-[10px] text-slate-400">Direct dispatch</p>
                        </Link>

                        <Link
                          to="/status"
                          onClick={closeDrawer}
                          className="p-2.5 rounded-xl bg-slate-900/40 hover:bg-slate-800/80 border border-white/5 hover:border-cyan-500/30 transition-all text-center group"
                        >
                          <Activity className="h-3.5 w-3.5 mx-auto mb-1 text-cyan-400 group-hover:scale-110 transition-transform" />
                          <p className="text-xs font-semibold text-white">Live Status</p>
                          <p className="text-[10px] text-emerald-400 font-mono">99.9% Uptime</p>
                        </Link>

                        <Link
                          to="/faq"
                          onClick={closeDrawer}
                          className="p-2.5 rounded-xl bg-slate-900/40 hover:bg-slate-800/80 border border-white/5 hover:border-purple-500/30 transition-all text-center group"
                        >
                          <HelpCircle className="h-3.5 w-3.5 mx-auto mb-1 text-purple-400 group-hover:scale-110 transition-transform" />
                          <p className="text-xs font-semibold text-white">FAQ</p>
                          <p className="text-[10px] text-slate-400">Direct answers</p>
                        </Link>

                        <Link
                          to="/help"
                          onClick={closeDrawer}
                          className="p-2.5 rounded-xl bg-slate-900/40 hover:bg-slate-800/80 border border-white/5 hover:border-emerald-500/30 transition-all text-center group"
                        >
                          <Shield className="h-3.5 w-3.5 mx-auto mb-1 text-emerald-400 group-hover:scale-110 transition-transform" />
                          <p className="text-xs font-semibold text-white">Help Center</p>
                          <p className="text-[10px] text-slate-400">System guides</p>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Command Hub Bottom Luxury Bar */}
              <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-900/80 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>End-to-End Sovereign Encryption · Karachi, Pakistan</span>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <Link
                    to="/contact"
                    onClick={closeDrawer}
                    className="flex-1 sm:flex-none py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 transition-colors text-center"
                  >
                    Contact Team
                  </Link>
                  <Link
                    to="/chatbot"
                    onClick={closeDrawer}
                    className="flex-1 sm:flex-none py-2 px-5 rounded-xl bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-600 hover:from-cyan-400 hover:to-pink-500 text-white text-xs font-semibold text-center transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-1.5"
                  >
                    <span>Launch Workspace</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LandingNavigation;

