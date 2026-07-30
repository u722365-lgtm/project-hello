import { ReactNode } from 'react';

interface LandingSectionHeaderProps {
  kicker?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

const LandingSectionHeader = ({ kicker, title, description, align = 'center', className }: LandingSectionHeaderProps) => {
  return (
    <div className={`mb-10 ${className ?? ''}`}>
      {kicker ? (
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">{kicker}</span>
      ) : null}
      <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">{title}</h2>
      {description ? <p className="mt-2 text-muted-foreground text-sm sm:text-base">{description}</p> : null}
    </div>
  );
};

export default LandingSectionHeader;
