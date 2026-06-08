import { Lock, Mail, KeyRound, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AuthDesignMockFormProps = {
  compact?: boolean;
  className?: string;
  cardClassName?: string;
  accentClassName?: string;
};

/** Static mock form for design previews — not wired to auth logic. */
export function AuthDesignMockForm({
  compact = false,
  className,
  cardClassName,
  accentClassName = "text-primary",
}: AuthDesignMockFormProps) {
  return (
    <div className={cn("w-full", compact ? "max-w-[280px]" : "max-w-md", className)}>
      <div className={cn("space-y-4", cardClassName)}>
        <div className="flex items-center gap-2">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 bg-muted/30", accentClassName)}>
            <Lock className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-500">
            <Shield className="h-3 w-3" />
            Secure
          </div>
        </div>

        <div>
          <h2 className={cn("font-bold tracking-tight text-foreground", compact ? "text-lg" : "text-2xl")}>
            Welcome Back
          </h2>
          <p className={cn("text-muted-foreground", compact ? "text-[10px] mt-0.5" : "text-sm mt-1")}>
            Sign in to your sovereign AI workspace
          </p>
        </div>

        <div className={cn("flex gap-1 rounded-lg bg-muted/30 p-1", compact && "text-[10px]")}>
          {["Email", "Phone", "Magic"].map((t, i) => (
            <div
              key={t}
              className={cn(
                "flex-1 rounded-md py-1.5 text-center font-medium",
                i === 0 ? "bg-background shadow-sm text-foreground" : "text-muted-foreground",
              )}
            >
              {t}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className={cn("font-medium text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                readOnly
                value="you@example.com"
                className={cn("bg-muted/20 pl-9", compact ? "h-8 text-xs" : "h-10")}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className={cn("font-medium text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                readOnly
                type="password"
                value="••••••••"
                className={cn("bg-muted/20 pl-9", compact ? "h-8 text-xs" : "h-10")}
              />
            </div>
          </div>
        </div>

        <Button className={cn("w-full font-semibold", compact ? "h-8 text-xs" : "h-11")}>
          Sign In
        </Button>

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/40" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
            <span className="bg-transparent px-2 text-muted-foreground">or continue with</span>
          </div>
        </div>

        <div className={cn("grid grid-cols-2 gap-2", compact && "gap-1.5")}>
          <Button variant="outline" className={compact ? "h-8 text-[10px]" : "h-10"} type="button">
            Google
          </Button>
          <Button variant="outline" className={compact ? "h-8 text-[10px]" : "h-10"} type="button">
            Apple
          </Button>
        </div>
      </div>
    </div>
  );
}
