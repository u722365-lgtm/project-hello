import { ReactNode } from 'react';

interface LandingMotionProviderProps {
  children: ReactNode;
}

export function LandingMotionProvider({ children }: LandingMotionProviderProps) {
  return <>{children}</>;
}

export function useLandingMotionContext() {
  return {
    profile: { reduced: true },
    viewport: { once: true, amount: 0 },
    hoverLift: false,
    variants: {
      hidden: {},
      visible: {},
      staggerItem: {},
      staggerList: {},
    },
  };
}
