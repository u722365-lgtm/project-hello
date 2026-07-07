import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const USE_CASE_LINKS = [
  { label: "Strategy AI", href: "/ai-strategy-consultant" },
  { label: "Business planner", href: "/ai-business-planner" },
  { label: "No-login AI", href: "/anonymous-ai" },
  { label: "11 languages", href: "/multilingual-ai" },
] as const;

interface UseCaseQuickLinksProps {
  className?: string;
  /** utm fragment for attribution */
  source?: string;
}

/** Compact inline links — chat empty state, sidebars, etc. */
export function UseCaseQuickLinks({ className, source = "chat_empty" }: UseCaseQuickLinksProps) {
  return (
    <p className={cn("text-[11px] sm:text-xs text-muted-foreground text-center leading-relaxed", className)}>
      <span className="text-muted-foreground/80">Looking for </span>
      {USE_CASE_LINKS.map((link, i) => (
        <span key={link.href}>
          {i > 0 && <span className="text-muted-foreground/50 mx-1">·</span>}
          <Link
            to={`${link.href}?utm_source=${source}&utm_medium=in_app&utm_campaign=use_case_links`}
            className="text-primary/90 hover:text-primary hover:underline underline-offset-2"
          >
            {link.label}
          </Link>
        </span>
      ))}
      <span className="text-muted-foreground/50 mx-1">·</span>
      <Link
        to={`/discover?utm_source=${source}&utm_medium=in_app&utm_campaign=use_case_links`}
        className="text-primary/90 hover:text-primary hover:underline underline-offset-2"
      >
        more
      </Link>
    </p>
  );
}

export default UseCaseQuickLinks;
