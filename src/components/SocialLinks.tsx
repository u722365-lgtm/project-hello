import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SOCIAL_LINKS } from "@/lib/socialLinks";

type SocialLinksProps = {
  className?: string;
  iconClassName?: string;
  linkClassName?: string;
  /** `icons` — icon-only row; `buttons` — labeled Instagram + LinkedIn buttons */
  variant?: "icons" | "buttons";
};

export function SocialLinks({
  className,
  iconClassName = "h-5 w-5",
  linkClassName,
  variant = "icons",
}: SocialLinksProps) {
  if (variant === "buttons") {
    return (
      <div className={cn("flex flex-wrap gap-3", className)}>
        {SOCIAL_LINKS.map((social, index) => (
          <Button
            key={social.label}
            variant={index === 0 ? "default" : "outline"}
            className={cn(index === 0 && "btn-glow", linkClassName)}
            asChild
          >
            <a href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
              <social.icon className="h-4 w-4 mr-2" />
              {social.label}
            </a>
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex gap-4", className)}>
      {SOCIAL_LINKS.map((social) => (
        <a
          key={social.label}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={social.label}
          className={cn(
            "p-3 bg-muted rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary",
            linkClassName,
          )}
        >
          <social.icon className={iconClassName} />
        </a>
      ))}
    </div>
  );
}
