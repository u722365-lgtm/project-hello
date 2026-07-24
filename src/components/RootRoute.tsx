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
  const { loading, user } = useAuth();

  useEffect(() => {
    if (!loading) recordLandingView("/");
  }, [loading]);

  if (loading) return <PageLoader />;
  // Anonymous users go straight to chat; real users too.
  if (user) return <Navigate to="/chatbot" replace />;
  if (shouldSkipLandingForReturnVisitor()) return <Navigate to="/chatbot" replace />;
  return <Index />;
}
