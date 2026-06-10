import { cn } from "@/lib/utils";
import { SOCIAL_LINKS } from "@/lib/socialLinks";

type SocialLinksProps = {
  className?: string;
  iconClassName?: string;
  linkClassName?: string;
};

export function SocialLinks({ className, iconClassName = "h-5 w-5", linkClassName }: SocialLinksProps) {
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
