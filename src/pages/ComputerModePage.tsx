import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { PAGE_SEO } from "@/lib/seo";
import { ComputerModePanel } from "@/components/computer/ComputerModePanel";
import { Badge } from "@/components/ui/badge";
import { MonitorSmartphone } from "lucide-react";

const ComputerModePage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead meta={PAGE_SEO.computer} />
      <Navigation />
      <main className="flex-1 pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-5xl mb-6 text-center">
          <Badge variant="secondary" className="mb-3">
            <MonitorSmartphone className="h-3 w-3 mr-1" />
            Computer Mode
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Your AI&apos;s computer</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Run real shell commands in the browser. Pair with Mission Control for multi-step jobs — code here, research in
            Shadow Browser.
          </p>
        </div>
        <ComputerModePanel />
      </main>
      <Footer />
    </div>
  );
};

export default ComputerModePage;
