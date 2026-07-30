import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

type DevNoticeProps = {
  title?: string;
  description?: string;
  onRequestEarlyAccess?: () => void;
  earlyAccessLabel?: string;
};

export function DevNotice({
  title = "Under development",
  description = "This feature is still being built. Forge, documents, and core generation tools are available now.",
  onRequestEarlyAccess,
  earlyAccessLabel = "Request early access",
}: DevNoticeProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <Card className="max-w-md w-full border-dashed border-2">
        <CardContent className="p-6 text-center space-y-4">
          <Sparkles className="h-8 w-8 mx-auto opacity-70" />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {onRequestEarlyAccess && (
            <Button variant="outline" onClick={onRequestEarlyAccess} className="mt-2">
              {earlyAccessLabel}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
