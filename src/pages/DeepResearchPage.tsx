import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DeepResearchPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <Card className="glass border-border/50">
          <CardHeader className="flex flex-row items-center gap-3">
            <AlertCircle className="h-6 w-6 text-amber-500" />
            <CardTitle className="text-xl">Deep Research is paused</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed">
              The local research engine is being rebuilt. In the meantime, use the chatbot's research tool — it runs cloud-side and will hand off to the new engine once it ships.
            </p>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default DeepResearchPage;
