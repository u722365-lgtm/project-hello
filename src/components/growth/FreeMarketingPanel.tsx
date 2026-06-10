import { useState } from "react";
import { Copy, Check, Share2, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUserReferralCode } from "@/hooks/useUserReferralCode";
import {
  FREE_MARKETING_POSTS,
  formatPostForPlatform,
  getDailyMarketingPost,
  getPlatformShareUrl,
  type SocialPlatform,
} from "@/lib/growth/freeMarketingToolkit";
import { useMarketingExperiments } from "@/hooks/useMarketingExperiments";
import { recordGrowthEvent } from "@/lib/shadowScale/growthEvents";

const PLATFORMS: { id: SocialPlatform; label: string }[] = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "twitter", label: "X / Twitter" },
  { id: "instagram", label: "Instagram caption" },
  { id: "tiktok", label: "TikTok caption" },
];

interface Props {
  compact?: boolean;
}

export function FreeMarketingPanel({ compact = false }: Props) {
  const { toast } = useToast();
  const referralCode = useUserReferralCode();
  const { shareCta } = useMarketingExperiments();
  const [copied, setCopied] = useState<string | null>(null);
  const daily = getDailyMarketingPost(referralCode);

  const copyText = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    recordGrowthEvent("share", `marketing_copy:${key}`);
    toast({ title: "Copied!", description: "Paste on your social — link includes your referral if signed in." });
    setTimeout(() => setCopied(null), 2000);
  };

  const openShare = (platform: SocialPlatform, post = daily) => {
    const text = formatPostForPlatform(post, platform);
    const url = getPlatformShareUrl(platform, text, post.cta);
    if (platform === "instagram" || platform === "tiktok") {
      void copyText(platform, text);
      return;
    }
    recordGrowthEvent("share", `marketing_${platform}`);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (compact) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Today&apos;s post (free marketing)
          </p>
          <p className="text-sm text-muted-foreground">{daily.hook}</p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.slice(0, 3).map((p) => (
              <Button key={p.id} size="sm" variant="outline" onClick={() => openShare(p.id)}>
                {p.label}
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={() => void copyText("daily", formatPostForPlatform(daily, "whatsapp"))}>
              <Copy className="h-3.5 w-3.5 mr-1" />
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Share2 className="h-5 w-5 text-primary" />
          Free Marketing Autopilot
        </CardTitle>
        <CardDescription>
          Zero ad spend — copy today&apos;s post, paste on WhatsApp / LinkedIn / TikTok. ShadowScale rotates content daily.
          {referralCode && (
            <span className="block mt-1 text-primary/90">Your referral code is embedded: {referralCode}</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-xl border border-primary/25 bg-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary">Today&apos;s pick</Badge>
            <span className="text-xs text-muted-foreground">Auto-rotates daily</span>
          </div>
          <p className="font-semibold">{daily.hook}</p>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{daily.body}</p>
          <p className="text-xs text-primary">{daily.hashtags}</p>
          <p className="text-xs text-muted-foreground italic">Experiment CTA: {shareCta}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {PLATFORMS.map((p) => (
              <Button key={p.id} size="sm" variant={p.id === "whatsapp" ? "default" : "outline"} onClick={() => openShare(p.id)}>
                {p.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">All post templates</p>
          <div className="grid gap-2 max-h-64 overflow-y-auto pr-1">
            {FREE_MARKETING_POSTS.map((post) => (
              <div
                key={post.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border/50 p-3 text-sm hover:border-primary/20 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{post.hook}</p>
                  <p className="text-xs text-muted-foreground truncate">{post.id}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="shrink-0 h-8 w-8"
                  onClick={() => void copyText(post.id, formatPostForPlatform(post, "whatsapp"))}
                >
                  {copied === post.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/40">
          <Button asChild variant="outline" size="sm">
            <a href="/video-studio">
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              Video Studio
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="/founder-access?plan=pro">Checkout link</a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="/admin">Growth Command</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
