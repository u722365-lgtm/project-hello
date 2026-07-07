import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, Share2, Instagram, Linkedin, Mail, Download } from "lucide-react";
import { FOUNDER_SOCIAL } from "@/lib/socialLinks";
import {
  getShareSocialUrls,
  renderShareCardPng,
  type ShareKind,
} from "@/lib/growth/shareGrowth";

type ShareResultDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: ShareKind;
  title: string;
  subtitle?: string;
  referralCode?: string | null;
  colleagueMode?: boolean;
  orgName?: string;
  /** Optional public URL to share instead of the default computed link (e.g. /s/:slug). */
  customLink?: string;
};

export function ShareResultDialog({
  open,
  onOpenChange,
  kind,
  title,
  subtitle,
  referralCode,
  colleagueMode,
  orgName,
  customLink,
}: ShareResultDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const social = getShareSocialUrls({
    title,
    subtitle,
    ref: colleagueMode ? null : referralCode,
    kind,
  });
  const linkToShare = customLink ?? social.link;
  const encodedCustom = customLink ? encodeURIComponent(customLink) : null;
  const encodedTitle = encodeURIComponent(title);
  const twitterUrl = customLink
    ? `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedCustom}`
    : social.twitter;
  const linkedinUrl = customLink
    ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodedCustom}`
    : social.linkedin;
  const whatsappUrl = customLink
    ? `https://wa.me/?text=${encodedTitle}%20${encodedCustom}`
    : social.whatsapp;
  const emailUrl = customLink
    ? `mailto:?subject=${encodedTitle}&body=${encodedCustom}`
    : social.email;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(social.link);
      setCopied(true);
      toast({ title: "Link copied", description: "Share anywhere — previews load automatically." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const downloadCard = async () => {
    setDownloading(true);
    try {
      const blob = await renderShareCardPng(title, subtitle);
      if (!blob) throw new Error("Canvas unavailable");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shadowtalk-${kind}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Image saved", description: "Upload to X, LinkedIn, or Stories." });
    } catch {
      toast({ title: "Could not create image", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            {colleagueMode ? "Share with a colleague" : "Share your win"}
          </DialogTitle>
          <DialogDescription>
            {colleagueMode
              ? `Send this to a ${orgName ?? "team"} teammate — they sign in with their work email.`
              : "One link with a rich preview. Your referral code is included when you're signed in."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input readOnly value={social.link} className="text-xs font-mono" />
            <Button type="button" variant="outline" size="icon" onClick={copyLink} aria-label="Copy link">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" size="sm" asChild>
              <a href={FOUNDER_SOCIAL.instagram.url} target="_blank" rel="noopener noreferrer">
                <Instagram className="h-4 w-4 mr-2" />
                Follow on Instagram
              </a>
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <a href={FOUNDER_SOCIAL.linkedin.url} target="_blank" rel="noopener noreferrer">
                <Linkedin className="h-4 w-4 mr-2" />
                Follow on LinkedIn
              </a>
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <a href={social.linkedin} target="_blank" rel="noopener noreferrer">
                <Share2 className="h-4 w-4 mr-2" />
                Share link
              </a>
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <a href={social.whatsapp} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <a href={social.email}>
                <Mail className="h-4 w-4 mr-2" />
                Email
              </a>
            </Button>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={downloading}
            onClick={downloadCard}
          >
            <Download className="h-4 w-4 mr-2" />
            {downloading ? "Creating image…" : "Download share card (PNG)"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
