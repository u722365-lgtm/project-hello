import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import Index from "@/pages/Index";
import { PageLoader } from "@/components/PageLoader";
import { shouldSkipLandingForReturnVisitor } from "@/lib/growth/firstVisit";
import { recordLandingView } from "@/lib/growth/funnelEvents";
import { useEffect } from "react";

/**
 * Root route. Anonymous visitors see the full landing page (value prop,
 * comparison, features, pricing, testimonials, FAQ) — this fixes the bounce
 * rate caused by dropping people straight into an empty chatbox. Authenticated
 * users skip the marketing page and go straight to the product.
 */
export default function RootRoute() {
  const { user, isAnonymous, loading } = useAuth();

  useEffect(() => {
    if (!loading) recordLandingView("/");
  }, [loading]);

  if (loading) return <PageLoader />;
  if (user && !isAnonymous) return <Navigate to="/chatbot" replace />;
  if (shouldSkipLandingForReturnVisitor()) return <Navigate to="/chatbot" replace />;
  return <Index />;
}
