import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";

const MuhammadUmarPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <Badge variant="secondary" className="mb-4">
          <Briefcase className="h-3 w-3 mr-1" /> Official CFO profile
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold mb-2 leading-tight">Muhammad Umar</h1>
        <p className="text-lg text-muted-foreground mb-4">Chief Financial Officer · ShadowTalk AI</p>
        <div className="flex flex-wrap gap-3 mb-8">
          <Button asChild><Link to="/chatbot">Try ShadowTalk</Link></Button>
          <Button variant="outline" asChild>
            <a href="https://www.shadowtalk-ai.com/facts.html">Company facts</a>
          </Button>
        </div>
        <div className="space-y-6 text-muted-foreground">
          <p>Muhammad Umar is the Chief Financial Officer of ShadowTalk AI. He oversees finance, budgeting, and capital planning for the platform.</p>
          <p>For verified leadership details, see <Link to="/facts" className="text-primary hover:underline">/facts</Link> or the public profile at <a href="https://www.shadowtalk-ai.com/muhammad-umar-cfo.html" className="text-primary hover:underline">muhammad-umar-cfo.html</a>.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MuhammadUmarPage;
