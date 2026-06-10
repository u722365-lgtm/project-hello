import { cn } from "@/lib/utils";
import { SocialLinks } from "@/components/SocialLinks";
import { FOUNDER_SOCIAL } from "@/lib/socialLinks";

type FollowUsSectionProps = {
  className?: string;
  title?: string;
  description?: string;
  centered?: boolean;
  variant?: "icons" | "buttons";
  iconClassName?: string;
  linkClassName?: string;
};

export function FollowUsSection({
  className,
  title = "Follow Us",
  description = `Stay close to the build — ${FOUNDER_SOCIAL.instagram.handle} on Instagram and ${FOUNDER_SOCIAL.linkedin.name} on LinkedIn.`,
  centered = true,
  variant = "icons",
  iconClassName,
  linkClassName,
}: FollowUsSectionProps) {
  return (
    <div className={cn(centered && "text-center", className)}>
      <h3 className="font-bold mb-2">{title}</h3>
      {description ? (
        <p className={cn("text-sm text-muted-foreground mb-4 max-w-md", centered && "mx-auto")}>{description}</p>
      ) : null}
      <SocialLinks
        className={cn(centered && "justify-center")}
        variant={variant}
        iconClassName={iconClassName}
        linkClassName={linkClassName}
      />
    </div>
  );
}
