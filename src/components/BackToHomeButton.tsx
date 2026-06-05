import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BackToHomeButton({ className }: { className?: string }) {
  const navigate = useNavigate();
  const location = useLocation();

  const path = useMemo(
    () => (location.pathname || "/").replace(/\/+$/, "") || "/",
    [location.pathname],
  );
  const isHome = path === "/home";
  const isChat = path === "/chatbot";

  if (isChat) return null;

  return (
    <div
      className={cn(
        "fixed left-4 z-50 safe-bottom",
        className,
      )}
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          if (!isHome) navigate("/home");
        }}
        aria-label="Back to home"
        aria-disabled={isHome}
        disabled={isHome}
        className={cn(
          "gap-2 rounded-full border-border/60 bg-background/70 backdrop-blur-md shadow-sm",
          "hover:bg-background/90 hover:border-primary/30",
        )}
      >
        <Home className="h-4 w-4" />
        <span className="text-sm">Back to Home</span>
      </Button>
    </div>
  );
}

