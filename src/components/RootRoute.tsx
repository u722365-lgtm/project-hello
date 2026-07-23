import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import Index from "@/pages/Index";
import { PageLoader } from "@/components/PageLoader";
import { shouldSkipLandingForReturnVisitor } from "@/lib/growth/firstVisit";
import { recordLandingView } from "@/lib/growth/funnelEvents";
import { useEffect } from "react";

/**
 * Root route. First-time anonymous visitors see the marketing home at `/`.
 * Signed-in users and anyone who has chatted before go straight to `/chatbot`.
 */
export default function RootRoute() {
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading) recordLandingView("/");
  }, [loading]);

  if (loading) return <PageLoader />;
  // Everyone lands on the marketing home. Chat is opt-in via CTAs.
  return <Index />;
}
