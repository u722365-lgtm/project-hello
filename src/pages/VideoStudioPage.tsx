import Navigation from "@/components/Navigation";
import { SEOHead } from "@/components/SEOHead";
import { VideoStudioPanel } from "@/components/videoStudio/VideoStudioPanel";
import { PAGE_SEO } from "@/lib/seo";

export default function VideoStudioPage() {
  return (
    <div className="app-min-height bg-background flex flex-col">
      <SEOHead meta={PAGE_SEO.videoStudio} />
      <Navigation />
      <div className="pt-16 flex-1 app-shell-height overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Shadow Video Studio</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Code-driven viral shorts for ShadowTalk — generate post-ready MP4s in your browser.
            </p>
          </div>
          <VideoStudioPanel />
        </div>
      </div>
    </div>
  );
}
