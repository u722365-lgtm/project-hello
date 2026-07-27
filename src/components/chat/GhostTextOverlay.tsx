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
 */
export const GhostTextOverlay = ({ value, completion, className }: GhostTextOverlayProps) => {
  if (!completion) return null;

  return (
    <div
      aria-hidden="true"
      className={`${className} pointer-events-none absolute inset-0 select-none text-left overflow-hidden whitespace-pre-wrap break-words`}
    >
      <span className="invisible">{value}</span>
      <span className="text-muted-foreground/45">{completion}</span>
      <span className="ml-1.5 hidden rounded border border-border/50 px-1 py-px align-middle text-[9px] font-medium uppercase tracking-wide text-muted-foreground/50 sm:inline">
        Tab
      </span>
    </div>
  );
};
