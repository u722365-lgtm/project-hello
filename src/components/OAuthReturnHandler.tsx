import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { upsertVaultConnection, type IntegrationProvider } from "@/lib/integrationOAuth";

const PROVIDERS = new Set(["google", "github", "slack", "notion"]);

/**
 * Completes OAuth after same-tab redirect (required when COOP blocks Google popups).
 */
export function OAuthReturnHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    const params = new URLSearchParams(location.search);
    const oauth = params.get("oauth");
    const provider = params.get("provider") as IntegrationProvider | null;

    if (!oauth || !provider || !PROVIDERS.has(provider)) return;
    handled.current = true;

    const cleanParams = new URLSearchParams(location.search);
    cleanParams.delete("oauth");
    cleanParams.delete("provider");
    const cleanSearch = cleanParams.toString();
    const cleanPath = cleanSearch ? `${location.pathname}?${cleanSearch}` : location.pathname;

    if (oauth === "success") {
      void upsertVaultConnection(provider);
      toast({
        title: provider === "google" ? "Google connected" : "Account connected",
        description:
          provider === "google"
            ? "Gmail, Calendar, and Drive are linked."
            : `${provider} is now linked to ShadowTalk.`,
      });
    } else if (oauth === "error") {
      const message = params.get("message") || "Authorization failed";
      toast({
        title: "Could not connect account",
        description: message,
        variant: "destructive",
      });
      cleanParams.delete("message");
    }

    navigate(cleanPath, { replace: true });
  }, [location.pathname, location.search, navigate, toast]);

  return null;
}
