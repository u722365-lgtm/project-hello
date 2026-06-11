import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skull } from "lucide-react";
import { acceptShadowSpectreTerms } from "@/lib/cyber/shadowspectre";

interface Props {
  open: boolean;
  onAccepted: () => void;
  onDecline: () => void;
}

export function ShadowSpectreTermsDialog({ open, onAccepted, onDecline }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onDecline(); }}>
      <DialogContent className="sm:max-w-lg bg-[#1e1f20]/95 border-red-500/20 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Skull className="h-5 w-5 text-red-400" />
            ShadowSpectre — Authorized Use Only
          </DialogTitle>
          <DialogDescription className="text-left space-y-2 pt-2">
            <p>
              ShadowSpectre is an <strong>uncensored cybersecurity model</strong> for professional
              security work: pentesting, SOC, IR, threat intel, and compliance — on systems you own
              or are explicitly authorized to test.
            </p>
            <p className="text-muted-foreground text-sm">
              You are responsible for lawful use. ShadowTalk is not liable for misuse. Do not target
              systems without written authorization.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onDecline}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              acceptShadowSpectreTerms();
              onAccepted();
            }}
            className="bg-red-600 hover:bg-red-700"
          >
            I am authorized — enable ShadowSpectre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
