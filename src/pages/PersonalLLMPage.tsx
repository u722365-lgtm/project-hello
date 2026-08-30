import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ModelFineTuning } from "@/components/chat/ModelFineTuning";
import { useNavigate } from "react-router-dom";

const PersonalLLMPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        <ModelFineTuning onClose={() => navigate("/chatbot")} />
      </div>
      <Footer />
    </div>
  );
};

export default PersonalLLMPage;
