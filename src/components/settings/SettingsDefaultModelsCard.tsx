import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bot, Loader2, Sparkles } from "lucide-react";
import type { AIProvider } from "@/components/chat/ProviderSelector";
import { useChatSettings } from "@/hooks/useChatSettings";
import { PERSONALITY_OPTIONS } from "@/lib/chatSettings";
import type { ChatMode } from "@/components/chat/ModeSelector";
import { useToast } from "@/hooks/use-toast";

const MODE_OPTIONS: { value: ChatMode; label: string }[] = [
  { value: "general", label: "General" },
  { value: "code", label: "Code" },
  { value: "research", label: "Research" },
  { value: "creative", label: "Creative" },
  { value: "summarize", label: "Summarize" },
  { value: "debug", label: "Debug" },
];

export function SettingsDefaultModelsCard() {
  const { preferences, updatePreferences, isSaving } = useChatSettings();
  const { toast } = useToast();

  const onChange = async <K extends keyof typeof preferences>(
    key: K,
    value: (typeof preferences)[K],
  ) => {
    await updatePreferences({ [key]: value });
    toast({ title: "Saved", description: "Default chat settings updated for new sessions." });
  };

  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="h-5 w-5 text-primary" />
          Default model & style
        </CardTitle>
        <CardDescription>
          Applied when you open a new chat (you can still change per conversation in the header)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Default personality
          </Label>
          <Select
            value={preferences.defaultPersonality}
            onValueChange={(v) =>
              void onChange("defaultPersonality", v as typeof preferences.defaultPersonality)
            }
            disabled={isSaving}
          >
            <SelectTrigger className="bg-muted/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERSONALITY_OPTIONS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label} — {p.desc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Default chat mode</Label>
          <Select
            value={preferences.defaultMode}
            onValueChange={(v) => void onChange("defaultMode", v as ChatMode)}
            disabled={isSaving}
          >
            <SelectTrigger className="bg-muted/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODE_OPTIONS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isSaving && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving…
          </p>
        )}
      </CardContent>
    </Card>
  );
}
