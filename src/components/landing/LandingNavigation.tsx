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

      {/* 3-Bar Slide-Over Navigation Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeDrawer}
              className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
              aria-hidden="true"
            />

            {/* Drawer Sheet */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full max-w-md sm:max-w-lg h-full bg-slate-950/95 border-l border-white/15 backdrop-blur-3xl shadow-2xl flex flex-col z-[101] overflow-hidden text-slate-100"
              role="dialog"
              aria-label="Site Navigation"
              aria-modal="true"
            >
              {/* Drawer Top Header */}
              <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-white/10">
                    <ChatbotLogo size={22} />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold tracking-wider text-white uppercase">
                      ShadowTalk Navigation
                    </h2>
                    <p className="text-xs text-slate-400">Direct options & sections</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeDrawer}
                  className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-white/10 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                {/* SECTION 1: SERVICES & AI PRODUCTS */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400">
                    <Zap className="h-3.5 w-3.5" />
                    <span>1. Services & AI Tools</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <Link
                      to="/chatbot"
                      onClick={closeDrawer}
                      className="group p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/90 border border-white/5 hover:border-cyan-500/30 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-500/20">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
                            AI Chatbot & Agents
                          </p>
                          <p className="text-xs text-slate-400">Multi-model reasoning with 30+ tools</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                    </Link>

                    <Link
                      to="/workspace"
                      onClick={closeDrawer}
                      className="group p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/90 border border-white/5 hover:border-purple-500/30 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-950/60 text-purple-400 border border-purple-500/20">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-purple-400 transition-colors">
                            Mission Control Workspace
                          </p>
                          <p className="text-xs text-slate-400">Autonomous goal-driven execution</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
                    </Link>

                    <Link
                      to="/deep-research"
                      onClick={closeDrawer}
                      className="group p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/90 border border-white/5 hover:border-cyan-500/30 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-500/20">
                          <Brain className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                            Deep Research Engine
                          </p>
                          <p className="text-xs text-slate-400">Multi-source synthesis & citations</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                    </Link>

                    <Link
                      to="/private-ai"
                      onClick={closeDrawer}
                      className="group p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/90 border border-white/5 hover:border-emerald-500/30 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-500/20">
                          <Shield className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                            Private AI & Local Vault
                          </p>
                          <p className="text-xs text-slate-400">Zero-cloud on-device WebGPU models</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                    </Link>
                  </div>
                </div>

                {/* SECTION 2: ABOUT US & FOUNDERS */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-purple-400">
                    <Users className="h-3.5 w-3.5" />
                    <span>2. About Us / Founders</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <Link
                      to="/founder"
                      onClick={closeDrawer}
                      className="group p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/90 border border-white/5 hover:border-cyan-500/30 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-500/20">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
                            Zain Ahmed
                          </p>
                          <p className="text-xs text-slate-400">Founder & Lead Architect (Karachi, Pakistan)</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                    </Link>

                    <Link
                      to="/fatima"
                      onClick={closeDrawer}
                      className="group p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/90 border border-white/5 hover:border-purple-500/30 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-purple-950/80 border border-purple-500/30 flex items-center justify-center font-mono font-bold text-xs text-purple-300">
                          FT
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-purple-400 transition-colors">
                            Fatima
                          </p>
                          <p className="text-xs text-slate-400">Co-Founder & Systems Architect (Second Developer)</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
                    </Link>

                    <Link
                      to="/about"
                      onClick={closeDrawer}
                      className="group p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/90 border border-white/5 hover:border-white/20 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-slate-200 transition-colors">
                            About ShadowTalk AI
                          </p>
                          <p className="text-xs text-slate-400">Company mission, timeline & architecture</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                    </Link>
                  </div>
                </div>

                {/* SECTION 3: PRICING & ACCESS */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400">
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>3. Pricing & Access</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <Link
                      to="/pricing"
                      onClick={closeDrawer}
                      className="group p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/90 border border-white/5 hover:border-emerald-500/30 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-500/20">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                            Membership Plans & Pricing
                          </p>
                          <p className="text-xs text-slate-400">Free starter, Pro, and Lifetime Founder tier</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                    </Link>
                  </div>
                </div>

                {/* SECTION 4: CONTACT DETAILS & SUPPORT */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-pink-400">
                    <Mail className="h-3.5 w-3.5" />
                    <span>4. Contact Details & Support</span>
                  </div>

                  {/* Business Email Action Card */}
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-pink-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Official Inquiries:</span>
                      <button
                        type="button"
                        onClick={copyBusinessEmail}
                        className="inline-flex items-center gap-1 text-[11px] text-pink-400 hover:text-pink-300 font-mono transition-colors"
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
                      className="block text-sm font-mono text-white hover:text-pink-300 transition-colors break-all"
                    >
                      shadowtalk@shadowtalk-ai.com
                    </a>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/contact"
                      onClick={closeDrawer}
                      className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/90 border border-white/5 hover:border-pink-500/30 transition-all text-center"
                    >
                      <MessageSquare className="h-4 w-4 mx-auto mb-1 text-pink-400" />
                      <p className="text-xs font-semibold text-white">Contact Form</p>
                      <p className="text-[10px] text-slate-400">Direct message</p>
                    </Link>

                    <Link
                      to="/status"
                      onClick={closeDrawer}
                      className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/90 border border-white/5 hover:border-cyan-500/30 transition-all text-center"
                    >
                      <Activity className="h-4 w-4 mx-auto mb-1 text-cyan-400" />
                      <p className="text-xs font-semibold text-white">Live Status</p>
                      <p className="text-[10px] text-slate-400">System health</p>
                    </Link>

                    <Link
                      to="/faq"
                      onClick={closeDrawer}
                      className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/90 border border-white/5 hover:border-purple-500/30 transition-all text-center"
                    >
                      <HelpCircle className="h-4 w-4 mx-auto mb-1 text-purple-400" />
                      <p className="text-xs font-semibold text-white">FAQ</p>
                      <p className="text-[10px] text-slate-400">Questions & info</p>
                    </Link>

                    <Link
                      to="/help"
                      onClick={closeDrawer}
                      className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/90 border border-white/5 hover:border-emerald-500/30 transition-all text-center"
                    >
                      <Shield className="h-4 w-4 mx-auto mb-1 text-emerald-400" />
                      <p className="text-xs font-semibold text-white">Help Center</p>
                      <p className="text-[10px] text-slate-400">Guides & setup</p>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Drawer Bottom CTA */}
              <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-900/80 flex items-center gap-3">
                <Link
                  to="/chatbot"
                  onClick={closeDrawer}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white text-xs sm:text-sm font-semibold text-center transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <span>Launch Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/contact"
                  onClick={closeDrawer}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium border border-white/10 transition-colors"
                >
                  Contact
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

