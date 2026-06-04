import { Lock, ShieldCheck, Loader2, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ChatEncryptionToggleProps {
  active: boolean;
  busy?: boolean;
  onEnable: () => void | Promise<void>;
  onDisable: () => void;
  className?: string;
}

export function ChatEncryptionToggle({
  active,
  busy,
  onEnable,
  onDisable,
  className,
}: ChatEncryptionToggleProps) {
  if (active) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={busy}
            onClick={onDisable}
            className={cn(
              "h-8 gap-1.5 rounded-full text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_20px_hsl(142_76%_36%/0.35)]",
              className,
            )}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Encrypted</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          End-to-end encrypted · anonymous session. Click to turn off for new messages.
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              className={cn(
                "h-8 gap-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:border-primary/20 border border-transparent",
                className,
              )}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Encrypt chat</span>
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Encrypt this chat and browse anonymously</TooltipContent>
      </Tooltip>

      <AlertDialogContent className="bg-card border-border rounded-2xl max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <AlertDialogTitle className="text-center">Encrypt & go anonymous?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground space-y-3 text-center">
              <p>
                All messages in this conversation will be encrypted on your device before they are stored.
                Only this browser session can read them.
              </p>
              <ul className="text-left text-xs space-y-1.5 bg-muted/40 rounded-lg p-3 border border-border/50">
                <li className="flex items-start gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  AES-256-GCM with a session-only key
                </li>
                <li className="flex items-start gap-2">
                  <UserX className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  Your name and email are hidden in the chat UI
                </li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="rounded-xl w-full sm:w-auto">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-xl w-full sm:w-auto bg-primary"
            onClick={() => void onEnable()}
          >
            <Lock className="h-4 w-4 mr-2" />
            Encrypt entire chat
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
