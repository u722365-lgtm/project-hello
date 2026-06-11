import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Cloud, Cpu, Shield, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InterimCloudConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseCloudUntilReady: () => void;
  onGoToDownload: () => void;
  onStayDeviceOnly: () => void;
  isDownloading?: boolean;
}

type OptionCardProps = {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  description: string;
  badge?: string;
  onClick: () => void;
  highlighted?: boolean;
};

function OptionCard({
  icon,
  iconClass,
  title,
  description,
  badge,
  onClick,
  highlighted,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all",
        "bg-white/[0.03] hover:bg-white/[0.06]",
        highlighted
          ? "border-primary/30 hover:border-primary/45 shadow-[0_0_0_1px_hsl(var(--primary)/0.08)]"
          : "border-border/40 hover:border-border/60",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/5",
          iconClass,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {badge && (
            <Badge variant="secondary" className="h-5 px-2 text-[10px] font-medium uppercase tracking-wide">
              {badge}
            </Badge>
          )}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
    </button>
  );
}

/**
 * Lets users choose cloud AI while an on-device model downloads — matches chat glass UI.
 */
export function InterimCloudConsentDialog({
  open,
  onOpenChange,
  onUseCloudUntilReady,
  onGoToDownload,
  onStayDeviceOnly,
  isDownloading,
}: InterimCloudConsentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden border-border/50 bg-[#121218]/95 p-0 shadow-2xl backdrop-blur-xl sm:max-w-md sm:rounded-2xl">
        <div className="border-b border-border/40 px-6 py-5">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="flex items-center gap-2.5 text-base font-semibold">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Shield className="h-4 w-4" />
              </span>
              How should we chat right now?
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Device-only mode is on, but no on-device model is loaded yet.
              {isDownloading
                ? " Your model is downloading — you can use cloud AI in the meantime."
                : " Pick an option so you are not stuck with placeholder replies."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-2.5 px-6 py-5">
          <OptionCard
            highlighted
            badge="Recommended"
            icon={<Cloud className="h-4 w-4 text-sky-400" />}
            iconClass="bg-sky-500/10"
            title="Use cloud AI until my model is ready"
            description="Temporary cloud replies while your model downloads. Switches to on-device automatically when loaded."
            onClick={onUseCloudUntilReady}
          />
          <OptionCard
            icon={<Cpu className="h-4 w-4 text-violet-400" />}
            iconClass="bg-violet-500/10"
            title="Download on-device model"
            description="Settings → Models · ~1–3 GB one-time download for fully private chat."
            onClick={onGoToDownload}
          />
        </div>

        <div className="border-t border-border/40 bg-white/[0.02] px-6 py-4">
          <button
            type="button"
            onClick={onStayDeviceOnly}
            className="w-full text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Stay device-only for now (limited replies until model loads)
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
