import { ReactNode, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  X,
  Bot,
  Sparkles,
  Brain,
  Shield,
  Copy,
  Check,
  ChevronRight,
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

      {/* Minimal & Professional Right-Side Navigation Drawer with Frosted Glass Theme */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-[99999] flex justify-end">
            {/* Backdrop Blur & Dimmer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={closeDrawer}
              className="fixed inset-0 bg-black/75 backdrop-blur-md cursor-pointer"
              aria-hidden="true"
            />

            {/* Frosted Luxury Glass Blade */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="relative w-full sm:max-w-md h-full flex flex-col z-10 bg-slate-950/85 backdrop-blur-3xl border-l border-white/15 shadow-[-25px_0_60px_rgba(0,0,0,0.85),inset_1px_0_0_rgba(255,255,255,0.08)] text-slate-100 overflow-hidden"
              role="dialog"
              aria-label="Site Navigation"
              aria-modal="true"
            >
              {/* Internal Glass Ambient Glow Accents */}
              <div className="absolute -top-12 -right-12 w-80 h-80 bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute top-1/2 -left-20 w-80 h-80 bg-purple-500/12 rounded-full blur-[110px] pointer-events-none" />
              <div className="absolute -bottom-10 right-0 w-72 h-72 bg-pink-500/10 rounded-full blur-[90px] pointer-events-none" />

              {/* Glass Header */}
              <div className="px-6 py-5 border-b border-white/10 bg-slate-950/40 backdrop-blur-2xl flex items-center justify-between shrink-0 relative z-10">
                <Link to="/" onClick={closeDrawer} className="flex items-center gap-3 select-none group">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900/90 border border-white/15 shadow-[0_0_15px_rgba(6,182,212,0.2)] group-hover:scale-105 transition-transform">
                    <ChatbotLogo size={18} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold tracking-wider text-white uppercase font-sans">
                      ShadowTalk
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[9px] font-mono text-cyan-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Online
                    </span>
                  </div>
                </Link>

                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-white/15 text-slate-300">ESC</kbd>
                  </span>
                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
                    aria-label="Close navigation menu"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Glass Content Area with Clean Typography */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7 relative z-10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                
                {/* 1. SERVICES & AI TOOLS */}
                <div className="space-y-3">
                  <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-400/90 font-semibold flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-cyan-400" />
                    Services & AI Tools
                  </p>

                  <div className="space-y-1">
                    <Link
                      to="/chatbot"
                      onClick={closeDrawer}
                      className="group flex items-center justify-between py-2.5 px-3 -mx-3 rounded-xl hover:bg-white/[0.06] hover:backdrop-blur-md border border-transparent hover:border-white/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Bot className="h-4 w-4 text-cyan-400 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                            Autonomous Chatbot
                          </p>
                          <p className="text-xs text-slate-400">
                            Multi-model reasoning & 30+ native tools
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
                    </Link>

                    <Link
                      to="/workspace"
                      onClick={closeDrawer}
                      className="group flex items-center justify-between py-2.5 px-3 -mx-3 rounded-xl hover:bg-white/[0.06] hover:backdrop-blur-md border border-transparent hover:border-white/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">
                            Mission Control
                          </p>
                          <p className="text-xs text-slate-400">
                            Goal execution & autonomous task loops
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-purple-300 group-hover:translate-x-0.5 transition-all" />
                    </Link>

                    <Link
                      to="/deep-research"
                      onClick={closeDrawer}
                      className="group flex items-center justify-between py-2.5 px-3 -mx-3 rounded-xl hover:bg-white/[0.06] hover:backdrop-blur-md border border-transparent hover:border-white/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Brain className="h-4 w-4 text-blue-400 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">
                            Deep Research Engine
                          </p>
                          <p className="text-xs text-slate-400">
                            Multi-source web synthesis & citations
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-blue-300 group-hover:translate-x-0.5 transition-all" />
                    </Link>

                    <Link
                      to="/private-ai"
                      onClick={closeDrawer}
                      className="group flex items-center justify-between py-2.5 px-3 -mx-3 rounded-xl hover:bg-white/[0.06] hover:backdrop-blur-md border border-transparent hover:border-white/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-white group-hover:text-emerald-300 transition-colors">
                            Private AI & Vault
                          </p>
                          <p className="text-xs text-slate-400">
                            100% on-device WebGPU models
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all" />
                    </Link>

                    <Link
                      to="/studio"
                      onClick={closeDrawer}
                      className="flex items-center justify-between py-2 px-3 -mx-3 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors"
                    >
                      <span className="pl-7">Model Studio & Code Playground</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                    </Link>
                  </div>
                </div>

                {/* 2. ABOUT US / FOUNDERS */}
                <div className="space-y-3">
                  <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-purple-400/90 font-semibold flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-purple-400" />
                    About Us / Founders
                  </p>

                  <div className="space-y-2.5">
                    {/* Zain Ahmed */}
                    <Link
                      to="/founder"
                      onClick={closeDrawer}
                      className="group block p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] backdrop-blur-md border border-white/[0.08] hover:border-cyan-500/40 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                          {FOUNDER_CANONICAL.fullName}
                        </span>
                        <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/70 px-2 py-0.5 rounded-full border border-cyan-500/30">
                          Founder & Lead Architect
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        System design, autonomous loops & local inference engine
                      </p>
                    </Link>

                    {/* Fatima */}
                    <Link
                      to="/fatima"
                      onClick={closeDrawer}
                      className="group block p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] backdrop-blur-md border border-white/[0.08] hover:border-purple-500/40 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded-md bg-purple-950/90 border border-purple-500/40 font-mono text-[9px] font-bold text-purple-300 flex items-center justify-center">
                            FT
                          </span>
                          <span className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
                            {COFOUNDER_CANONICAL.fullName}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-purple-300 bg-purple-950/70 px-2 py-0.5 rounded-full border border-purple-500/30">
                          Co-Founder & Systems Architect
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 pl-7">
                        120fps UI state machine & client-side memory ledger
                      </p>
                    </Link>

                    {/* Secondary links */}
                    <div className="flex items-center gap-4 pt-1 pl-1 text-xs text-slate-400">
                      <Link to="/about" onClick={closeDrawer} className="hover:text-white transition-colors">
                        Company Vision
                      </Link>
                      <span className="text-slate-700">&bull;</span>
                      <Link to="/trust" onClick={closeDrawer} className="hover:text-white transition-colors">
                        Security & Trust
                      </Link>
                    </div>
                  </div>
                </div>

                {/* 3. PRICING & ACCESS */}
                <div className="space-y-3">
                  <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-emerald-400/90 font-semibold flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-emerald-400" />
                    Pricing & Access
                  </p>

                  <Link
                    to="/pricing"
                    onClick={closeDrawer}
                    className="group block p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] backdrop-blur-md border border-white/[0.08] hover:border-emerald-500/40 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                        Membership Plans & Pricing
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Free Starter ($0) &bull; Pro Sovereign ($19/mo) &bull; Lifetime Tier
                    </p>
                    <p className="text-[11px] text-emerald-400/90 font-mono mt-2">
                      No credit card required for Starter
                    </p>
                  </Link>
                </div>

                {/* 4. CONTACT DETAILS & SUPPORT */}
                <div className="space-y-3">
                  <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-pink-400/90 font-semibold flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-pink-400" />
                    Contact Details & Support
                  </p>

                  {/* Clean Business Email Row with Frosted Glass */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-pink-500/25 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                        Official Inquiries
                      </p>
                      <a
                        href="mailto:shadowtalk@shadowtalk-ai.com"
                        className="text-xs font-mono text-white hover:text-pink-300 transition-colors font-medium mt-0.5 block"
                      >
                        shadowtalk@shadowtalk-ai.com
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={copyBusinessEmail}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-xs flex items-center gap-1 font-mono"
                    >
                      {copiedEmail ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400 text-[10px]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span className="text-[10px]">Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Clean support links grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Link
                      to="/contact"
                      onClick={closeDrawer}
                      className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] text-slate-300 hover:text-white transition-colors text-center"
                    >
                      Contact Form
                    </Link>
                    <Link
                      to="/status"
                      onClick={closeDrawer}
                      className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Live Status</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </Link>
                    <Link
                      to="/faq"
                      onClick={closeDrawer}
                      className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] text-slate-300 hover:text-white transition-colors text-center"
                    >
                      FAQ
                    </Link>
                    <Link
                      to="/help"
                      onClick={closeDrawer}
                      className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] text-slate-300 hover:text-white transition-colors text-center"
                    >
                      Help Center
                    </Link>
                  </div>
                </div>

              </div>

              {/* Frosted Glass Bottom Bar */}
              <div className="p-5 border-t border-white/10 bg-slate-950/50 backdrop-blur-2xl flex items-center gap-3 shrink-0 relative z-10">
                <Link
                  to="/chatbot"
                  onClick={closeDrawer}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500/90 via-purple-600/90 to-pink-600/90 backdrop-blur-md hover:from-cyan-400 hover:to-pink-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(6,182,212,0.3)] border border-white/20"
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
