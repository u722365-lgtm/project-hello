import { useCallback, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlanetaryActionPanel from "@/components/chat/PlanetaryActionPanel";
import { supabase } from "@/integrations/supabase/client";

interface PlanetaryActionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlanetaryActionModal({ isOpen, onClose }: PlanetaryActionModalProps) {
  const [loading, setLoading] = useState(false);

  const onGetActions = useCallback(async (location: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: { getEcoActions: true, location },
      });
      if (error) throw error;
      const actions = Array.isArray(data) ? data : [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return actions.map((a: Record<string, unknown>) => ({ ...a, completed: false })) as any;
    } finally {
      setLoading(false);
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
        <h2 className="text-sm font-semibold">Planetary Actions</h2>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full">
        <PlanetaryActionPanel onGetActions={onGetActions} isLoading={loading} />
      </div>
    </div>
  );
}

export default PlanetaryActionModal;
