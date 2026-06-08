import { useNavigate, useParams } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AuthDesignMockForm } from "@/components/auth/AuthDesignMockForm";
import { AuthDesignShell } from "@/components/auth/designs/AuthDesignShell";
import {
  AUTH_DESIGNS,
  getAuthDesign,
  getStoredAuthDesignChoice,
  setStoredAuthDesignChoice,
  type AuthDesignId,
} from "@/lib/authDesigns";

export default function AuthDesignPreviewPage() {
  const { designId } = useParams<{ designId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const design = getAuthDesign(designId);
  const currentPick = getStoredAuthDesignChoice();

  if (!design) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
        <p className="text-muted-foreground">Design not found.</p>
        <Button onClick={() => navigate("/auth/designs")}>Back to gallery</Button>
      </div>
    );
  }

  const handleSelect = () => {
    setStoredAuthDesignChoice(design.id);
    toast({
      title: `${design.name} selected`,
      description: "Reply in chat to approve — we'll apply this design to the live auth page.",
    });
  };

  return (
    <div className="relative min-h-screen">
      <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-wrap items-center justify-center gap-3 border-t border-border/50 bg-background/90 p-4 backdrop-blur-md">
        <p className="text-sm font-medium">
          Previewing: <span className="text-primary">{design.name}</span>
        </p>
        <Button size="sm" variant="outline" onClick={() => navigate("/auth/designs")}>
          All designs
        </Button>
        <Button size="sm" onClick={handleSelect} className="gap-1.5">
          {currentPick === design.id ? (
            <>
              <Check className="h-4 w-4" /> Selected
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Select this design
            </>
          )}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => navigate("/auth/designs")}>
          Compare others ({AUTH_DESIGNS.length})
        </Button>
      </div>

      <div className="min-h-screen pb-24">
        <AuthDesignShell
          designId={design.id as AuthDesignId}
          showBack
          onBack={() => navigate("/auth/designs")}
        >
          <AuthDesignMockForm />
        </AuthDesignShell>
      </div>
    </div>
  );
}
