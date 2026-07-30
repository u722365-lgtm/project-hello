import type { ReactNode, HTMLAttributes } from 'react';

interface LandingSectionRevealProps {
  children: ReactNode;
  preset?: string;
  className?: string;
  as?: 'div' | 'section';
}

const LandingSectionReveal = ({ children, className, as = 'div' }: LandingSectionRevealProps) => {
  const Component = as;
  return <Component className={className}>{children}</Component>;
};

export default LandingSectionReveal;
