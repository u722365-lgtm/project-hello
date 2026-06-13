import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VisionAgent } from "@/components/chat/VisionAgent/VisionAgent";

interface VisionAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMessage?: (message: string, isProactive?: boolean) => void;
}

export const VisionAgentModal = ({ isOpen, onClose, onMessage }: VisionAgentModalProps) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="fixed top-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-border bg-card px-4 py-2 shadow-lg">
        <span className="text-sm font-medium">Vision Agent — emotion-aware camera companion</span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label="Close Vision Agent">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <VisionAgent
        isEnabled={isOpen}
        onMessage={onMessage}
        onGestureCommand={(gesture) => {
          if (gesture === "stop") onClose();
        }}
      />
    </>
  );
};
