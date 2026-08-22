import { ReactNode, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

interface LandingNavigationProps {
  children?: ReactNode;
}

const LandingNavigation = ({ children }: LandingNavigationProps) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-background/40 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.1)] py-2' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo Section */}
          <a href="/" className="flex items-center gap-3 group relative cursor-pointer">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 shadow-inner overflow-hidden transition-all duration-300 group-hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/40 to-purple-500/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
              <Sparkles className="relative z-10 h-5 w-5 text-indigo-400 group-hover:text-purple-300 transition-colors duration-300" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 group-hover:to-white transition-all duration-300">
              ShadowTalk
            </span>
          </a>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {['Features', 'Pricing'].map((item) => (
              <a 
                key={item} 
                href={`/#${item.toLowerCase()}`} 
                className="relative text-sm font-medium text-white/60 hover:text-white transition-colors py-2 group"
              >
                {item}
                <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full transition-all duration-300 group-hover:w-full opacity-0 group-hover:opacity-100" />
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <a 
              href="/auth" 
              className="hidden sm:block text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              Sign in
            </a>
            <motion.a 
              href="/chatbot" 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full p-[1px] font-medium"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70 group-hover:opacity-100 animate-spin-slow transition-opacity duration-300" style={{ animationDuration: '4s' }} />
              <span className="relative flex h-full w-full items-center gap-2 rounded-full bg-background/90 backdrop-blur-md px-5 py-2 text-sm text-white transition-colors group-hover:bg-background/70">
                Open app
                <ArrowRight className="h-4 w-4 -translate-x-1 opacity-70 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
              </span>
            </motion.a>
          </div>

        </div>
      </div>
      {children}
    </motion.header>
  );
};

export default LandingNavigation;
