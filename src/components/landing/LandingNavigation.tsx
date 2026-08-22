import { ReactNode, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import ChatbotLogo from '../ChatbotLogo';

interface LandingNavigationProps {
  children?: ReactNode;
}

const LandingNavigation = ({ children }: LandingNavigationProps) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-6 px-4 pointer-events-none flex justify-center">
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className={`pointer-events-auto flex items-center justify-between transition-all duration-500 ease-out 
          ${scrolled ? 'w-[750px] shadow-[0_8px_32px_rgba(31,38,135,0.37)]' : 'w-[850px] shadow-[0_4px_24px_rgba(0,0,0,0.2)]'}
          rounded-full bg-slate-900/40 backdrop-blur-2xl border border-white/10 p-2 pl-4 pr-3`}
      >
        
        {/* Logo Section */}
        <a href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-white/10 shadow-inner group-hover:scale-105 transition-transform duration-300">
            <ChatbotLogo size={24} className="relative z-10" />
          </div>
          <span className="text-lg font-bold tracking-widest text-white uppercase hidden sm:block">
            ShadowTalk
          </span>
        </a>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {['Features', 'Pricing', 'Docs', 'Changelog'].map((item, i) => (
            <div key={item} className="flex items-center gap-8">
              <a 
                href={`/#${item.toLowerCase()}`} 
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                {item}
              </a>
              {/* Add separators except for the last item */}
              {i < 3 && <div className="h-3 w-px bg-slate-700/50" />}
            </div>
          ))}
        </nav>

        {/* Action Button */}
        <motion.a 
          href="/chatbot" 
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full p-[1px]"
        >
          {/* Animated gradient border */}
          <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-blue-500 opacity-80" />
          {/* Inner button surface */}
          <span className="relative flex h-full w-full items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500/80 to-purple-500/80 backdrop-blur-md px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:from-cyan-400/90 hover:to-purple-400/90">
            Open App
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </motion.a>

      </motion.div>
      {/* Invisible full-screen wrapper for `children` just in case */}
      <div className="absolute top-0 left-0 w-full pointer-events-none">
        {children}
      </div>
    </header>
  );
};

export default LandingNavigation;
