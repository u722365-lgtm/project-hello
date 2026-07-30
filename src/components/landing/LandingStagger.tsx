import { ReactNode, HTMLAttributes } from 'react';

interface LandingStaggerProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  children: ReactNode;
  as?: 'div' | 'ul' | 'section';
  inView?: boolean;
}

const LandingStagger = ({ children, className, as = 'div', inView: _inView, ...rest }: LandingStaggerProps) => {
  const Component = as as 'div';
  return (
    <Component className={className} {...rest}>
      {children}
    </Component>
  );
};

export default LandingStagger;
