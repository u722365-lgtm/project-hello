import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { PROOF_LINKS } from "@/lib/ethicalGrowth";

type ProofOverHypeBarProps = {
  className?: string;
};

export function ProofOverHypeBar({ className = "" }: ProofOverHypeBarProps) {
  return (
    <nav
      aria-label="Product proof and documentation"
      className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs sm:text-sm ${className}`}
    >
      <span className="inline-flex items-center gap-1.5 text-muted-foreground font-medium">
        <FileText className="h-3.5 w-3.5 text-primary" />
        Proof, not hype:
      </span>
      {PROOF_LINKS.map((link, i) => (
        <span key={link.href} className="inline-flex items-center gap-1.5">
          {i > 0 && <span className="text-border hidden sm:inline">·</span>}
          <Link to={link.href} className="text-primary/90 hover:text-primary hover:underline">
            {link.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}

export default ProofOverHypeBar;
