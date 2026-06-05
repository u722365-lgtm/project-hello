import { useState } from "react";
import { Share2, Users, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { EnterpriseTenant } from "@/lib/enterpriseTenants";
import { buildEnterpriseInviteUrl } from "@/lib/growth/selfMarketing";

interface EnterpriseInviteColleaguesProps {
  tenant: EnterpriseTenant;
  compact?: boolean;
}

export function EnterpriseInviteColleagues({ tenant, compact }: EnterpriseInviteColleaguesProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const inviteUrl = buildEnterpriseInviteUrl();
  const shareText = tenant.inviteMessage;

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${inviteUrl}`);
      setCopied(true);
      toast({ title: "Invite link copied", description: "Send it to a Shan Foods colleague." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const shareInvite = async () => {
    if (!navigator.share) {
      void copyInvite();
      return;
    }
    setSharing(true);
    try {
      await navigator.share({
        title: `${tenant.name} AI Workspace`,
        text: shareText,
        url: inviteUrl,
      });
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      void copyInvite();
    } finally {
      setSharing(false);
    }
  };

  if (compact) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="rounded-full gap-1.5 shrink-0"
        onClick={() => void shareInvite()}
        disabled={sharing}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
        Invite colleague
      </Button>
    );
  }

  return (
    <div className="mx-3 md:mx-6 mb-2 rounded-xl border border-violet-500/25 bg-violet-500/10 px-4 py-3 flex items-start gap-3">
      <Users className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">Spread ShadowTalk at {tenant.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Invite teammates — they sign in with their work email and get unlimited AI instantly.
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button type="button" size="sm" className="rounded-full gap-1.5" onClick={() => void shareInvite()} disabled={sharing}>
          <Share2 className="h-3.5 w-3.5" />
          Share
        </Button>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => void copyInvite()} aria-label="Copy invite link">
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
