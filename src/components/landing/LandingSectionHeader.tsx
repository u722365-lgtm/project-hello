import { ReactNode } from 'react';

interface LandingSectionHeaderProps {
  kicker?: string;
  badge?: ReactNode;
  badgeIcon?: React.ComponentType<{ className?: string }>;
  title: ReactNode;
  description?: ReactNode;
  subtitle?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
}

const LandingSectionHeader = ({ kicker, badge, badgeIcon: BadgeIcon, title, description, subtitle, align = 'center', className }: LandingSectionHeaderProps) => {
  return (
    <div className={`mb-10 ${className ?? ''}`}>
      {badge ? (
        <span className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1 text-[11px] font-medium text-muted-foreground">
          {BadgeIcon ? <BadgeIcon className="h-3.5 w-3.5" /> : null}
          {badge}
        </span>
      ) : null}
      {kicker ? (
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">{kicker}</span>
      ) : null}
      <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">{title}</h2>
      {description || subtitle ? <p className="mt-2 text-muted-foreground text-sm sm:text-base">{description ?? subtitle}</p> : null}
    </div>
  );
};

export default LandingSectionHeader;
