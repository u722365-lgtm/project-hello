import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Twitter, Linkedin, Share2, Link as LinkIcon, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface PostCTAProps {
  title: string;
  slug?: string;
  postId?: string;
}

const SITE = "https://www.shadowtalk-ai.com";

/**
 * Product-Led + Social share block that appears at the end of every blog post.
 * - "Try on ShadowTalk" pushes readers into /chatbot from within the article (Option B).
 * - Share buttons hit Reddit / X / LinkedIn / clipboard (Option C).
 */
const PostCTA = ({ title, slug, postId }: PostCTAProps) => {
  const shareUrl = slug
    ? `${SITE}/blog/${slug}`
    : postId
    ? `${SITE}/blog#${postId}`
    : `${SITE}/blog`;
  const shareText = `${title} — via ShadowTalk AI`;

  const share = (platform: "x" | "linkedin" | "reddit") => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);
    const urls: Record<typeof platform, string> = {
      x: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`,
    };
    window.open(urls[platform], "_blank", "noopener,noreferrer,width=640,height=640");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  return (
    <div className="mt-8 space-y-4 not-prose">
      <Card className="card-glass p-6 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg mb-1">Try it on ShadowTalk — free, no login required</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The offline model downloads in the background while you chat. Your conversations stay on your device.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" className="btn-glow">
                <Link to="/chatbot">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Open ShadowTalk
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/referral">Get Pro credits</Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground mr-1 inline-flex items-center gap-1">
          <Share2 className="h-3.5 w-3.5" /> Share:
        </span>
        <Button size="sm" variant="outline" onClick={() => share("x")}>
          <Twitter className="h-3.5 w-3.5 mr-1.5" /> X
        </Button>
        <Button size="sm" variant="outline" onClick={() => share("linkedin")}>
          <Linkedin className="h-3.5 w-3.5 mr-1.5" /> LinkedIn
        </Button>
        <Button size="sm" variant="outline" onClick={() => share("reddit")}>
          Reddit
        </Button>
        <Button size="sm" variant="outline" onClick={copyLink}>
          <LinkIcon className="h-3.5 w-3.5 mr-1.5" /> Copy link
        </Button>
      </div>
    </div>
  );
};

export default PostCTA;
