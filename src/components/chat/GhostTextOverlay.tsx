import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface GhostTextOverlayProps {
  /** Text currently typed by the user (rendered invisibly to offset the ghost). */
  value: string;
  /** Predicted continuation, rendered as subtle gray text. */
  completion: string;
  /** Must mirror the textarea's typography/padding classes exactly. */
  className: string;
}

/**
 * Inline "Tab Tab Tab" style ghost completion, rendered as an overlay that sits
 * perfectly behind the real textarea so the prediction appears inline in gray.
 *
 * The ghost is only shown when the typed text + prediction still fit on a single
 * line: once the text wraps, a textarea and a div can break lines differently,
 * which would smear ghost words across the user's own text.
 */
export const GhostTextOverlay = ({ value, completion, className }: GhostTextOverlayProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [fits, setFits] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !completion || value.includes("\n")) {
      setFits(false);
      return;
    }
    const style = window.getComputedStyle(el);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setFits(false);
      return;
    }
    ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const available =
      el.clientWidth - parseFloat(style.paddingLeft || "0") - parseFloat(style.paddingRight || "0");
    // leave room for the "Tab" chip
    const needed = ctx.measureText(value + completion).width + 44;
    setFits(needed <= available);
  }, [value, completion]);

  // Recheck on resize so rotating a phone can't leave a smeared ghost behind.
  useEffect(() => {
    const onResize = () => setFits(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`${className} pointer-events-none absolute inset-0 select-none overflow-hidden whitespace-pre text-left`}
    >
      {completion && fits ? (
        <>
          <span className="invisible">{value}</span>
          <span className="text-muted-foreground/45">{completion}</span>
          <span className="ml-1.5 hidden rounded border border-border/50 px-1 py-px align-middle text-[9px] font-medium uppercase tracking-wide text-muted-foreground/50 sm:inline">
            Tab
          </span>
        </>
      ) : null}
    </div>
  );
};
