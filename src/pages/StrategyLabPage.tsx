import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import OfflineStrategyAgent from "@/components/chat/OfflineStrategyAgent";

const StrategyLabPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-5xl">
        <OfflineStrategyAgent />
      </div>
      <Footer />
    </div>
  );
};

export default StrategyLabPage;
