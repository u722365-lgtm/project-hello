import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { PAGE_SEO } from "@/lib/seo";
import { MissionControl } from "@/components/chat/MissionControl";

/** Dedicated Mission Control — templates, quota, and autonomous missions */
const MissionControlPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const goal = params.get("goal") ?? undefined;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead meta={PAGE_SEO.missioncontrol} />
      <Navigation />
      <MissionControl
        isOpen
        onClose={() => navigate(goal ? `/execute?goal=${encodeURIComponent(goal)}` : "/execute")}
        initialGoal={goal}
        onMissionComplete={() => navigate("/execute")}
      />
      <Footer />
    </div>
  );
};

export default MissionControlPage;
