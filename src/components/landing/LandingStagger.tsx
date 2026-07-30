import { ReactNode, HTMLAttributes } from 'react';

interface LandingStaggerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  as?: 'div' | 'ul' | 'section';
}

const LandingStagger = ({ children, className, as = 'div', ...rest }: LandingStaggerProps) => {
  const Component = as;
  return (
    <Component className={className} {...rest}>
      {children}
    </Component>
  );
};

export default LandingStagger;
