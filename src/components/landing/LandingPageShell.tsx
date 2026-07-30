import { ReactNode } from 'react';

interface LandingPageShellProps {
  children: ReactNode;
}

const LandingPageShell = ({ children }: LandingPageShellProps) => {
  return (
    <div className="relative min-h-screen">
      {/* Static background gradient to replace animated orb */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse at top, rgba(99,102,241,0.15), transparent 60%)',
        }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
};

export default LandingPageShell;
