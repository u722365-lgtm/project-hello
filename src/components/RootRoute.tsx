import { useAuth } from "@/components/AuthProvider";
import Index from "@/pages/Index";
import { PageLoader } from "@/components/PageLoader";
import { recordLandingView } from "@/lib/growth/funnelEvents";
import { useEffect } from "react";

/**
 * Root route — always show the marketing home page at `/`.
 * Product workspace lives at /chatbot (nav, CTAs, returning users choose when to enter).
 */
export default function RootRoute() {
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading) recordLandingView("/");
  }, [loading]);

  if (loading) return <PageLoader />;
  return <Index />;
}
