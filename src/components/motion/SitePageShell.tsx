import type { ReactNode } from "react";

const SitePageShell = ({ children }: { children: ReactNode }) => {
  return (
    <div className="site-page relative app-min-height overflow-x-hidden">
      <div className="site-page-ambient-static landing-page-ambient-static pointer-events-none fixed inset-0 z-0 opacity-20" aria-hidden />
      <div className="site-page-grain landing-page-grain pointer-events-none fixed inset-0 z-0 opacity-[0.35]" aria-hidden />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
};

export default SitePageShell;
