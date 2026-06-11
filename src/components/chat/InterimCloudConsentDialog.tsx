import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Cloud, Cpu, Shield } from "lucide-react";

interface InterimCloudConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseCloudUntilReady: () => void;
  onGoToDownload: () => void;
  onStayDeviceOnly: () => void;
  isDownloading?: boolean;
}

/**
 * Lets users choose cloud AI while an on-device model downloads — avoids canned offline fallbacks.
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            How should we chat right now?
          </DialogTitle>
          <DialogDescription>
            Device-only mode is on, but no on-device model is loaded yet.
            {isDownloading
              ? " Your model is downloading — you can use cloud AI in the meantime."
              : " Pick an option so you are not stuck with placeholder replies."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Button
            className="w-full justify-start gap-3 h-auto py-3"
            onClick={onUseCloudUntilReady}
          >
            <Cloud className="h-4 w-4 shrink-0" />
            <span className="text-left">
              <span className="block font-medium">Use cloud AI until my model is ready</span>
              <span className="block text-xs font-normal opacity-80">
                Recommended while downloading. Switches to on-device automatically when loaded.
              </span>
            </span>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-3"
            onClick={onGoToDownload}
          >
            <Cpu className="h-4 w-4 shrink-0" />
            <span className="text-left">
              <span className="block font-medium">Download on-device model</span>
              <span className="block text-xs font-normal text-muted-foreground">
                Profile → Offline AI (~1–3 GB, one-time)
              </span>
            </span>
          </Button>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button variant="ghost" size="sm" onClick={onStayDeviceOnly}>
            Stay device-only for now (limited replies until model loads)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
