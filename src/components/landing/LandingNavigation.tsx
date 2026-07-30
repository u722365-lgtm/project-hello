import { ReactNode, useEffect, useRef, useState } from 'react';

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
    <header className={`sticky top-0 z-50 border-b border-white/10 transition-colors ${scrolled ? 'bg-background/80 backdrop-blur-xl' : 'bg-transparent'}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/20 border border-primary/30" />
            <span className="text-[15px] font-semibold tracking-tight">ShadowTalk</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="/#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="/#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="/auth" className="hover:text-foreground transition-colors">Sign in</a>
            <a href="/chatbot" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Open app
            </a>
          </nav>
        </div>
      </div>
      {children}
    </header>
  );
};

export default LandingNavigation;
