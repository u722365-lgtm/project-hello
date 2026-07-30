import { useEffect } from "react";

export function GlobalScrollReveal() {
  useEffect(() => {
    return () => {
      document.querySelectorAll('.st-reveal').forEach((el) => {
        el.classList.remove('st-reveal', 'st-reveal--visible');
        (el as HTMLElement)?.style?.removeProperty?.('--st-reveal-delay');
      });
    };
  }, []);

  return null;
}

export default GlobalScrollReveal;
