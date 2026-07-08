import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Shield, Trash2, ExternalLink, BarChart3, Megaphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getCookiePreferences,
  updateCookiePreferences,
  type CookiePreferences,
} from "@/lib/cookiePreferences";
import { PRESERVE_ON_LOCAL_CLEAR } from "@/lib/persistentAuth";

const BUNKER_KEY = "shadowtalk_bunker_mode";

function getBunkerMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(BUNKER_KEY) === "true";
}

function setBunkerMode(enabled: boolean): void {
  localStorage.setItem(BUNKER_KEY, enabled ? "true" : "false");
}

export function PrivacyDataCard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<CookiePreferences>(() => getCookiePreferences());
  const [bunker, setBunker] = useState(() => getBunkerMode());

  const patchPrefs = (partial: Partial<CookiePreferences>) => {
    const next = updateCookiePreferences(partial);
    setPrefs(next);
  };

  const clearLocalData = () => {
    if (
      !window.confirm(
        "Clear cached chats, metrics, and non-essential local data on this device? Your account and cloud data are not deleted.",
      )
    ) {
      return;
    }
    const preserve = new Set<string>([
      "shadowtalk_cookie_consent",
      "shadowtalk_cookie_preferences",
      "shadowtalk-booted",
      "shadowtalk_ui_theme",
      ...PRESERVE_ON_LOCAL_CLEAR,
    ]);
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith("shadowtalk_") && !preserve.has(key)) {
        localStorage.removeItem(key);
      }
    }
    toast({
      title: "Local data cleared",
      description: "On-device caches were reset. Your sign-in session was kept.",
    });
  };

  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-5 w-5 text-primary" />
          Privacy & data
        </CardTitle>
        <CardDescription>Control analytics, marketing, and on-device storage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Usage analytics</p>
              <p className="text-xs text-muted-foreground">Anonymous product analytics to improve ShadowTalk</p>
            </div>
          </div>
          <Switch
            checked={prefs.analytics}
            onCheckedChange={(v) => patchPrefs({ analytics: v })}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Megaphone className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Marketing emails</p>
              <p className="text-xs text-muted-foreground">Product news, offers, and release announcements</p>
            </div>
          </div>
          <Switch
            checked={prefs.marketing}
            onCheckedChange={(v) => patchPrefs({ marketing: v })}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Shield className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="font-medium text-sm">Bunker mode</p>
              <p className="text-xs text-muted-foreground">Extra-local posture; limits some cloud features in chat</p>
            </div>
          </div>
          <Switch
            checked={bunker}
            onCheckedChange={(v) => {
              setBunker(v);
              setBunkerMode(v);
              toast({
                title: v ? "Bunker mode on" : "Bunker mode off",
                description: v
                  ? "Chat will prefer on-device paths where possible."
                  : "Standard routing restored.",
              });
            }}
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-3 border-t border-border/40 mt-2">
          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => navigate("/trust")}>
            <ExternalLink className="h-3.5 w-3.5" />
            Trust center
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => navigate("/privacy")}>
            Privacy policy
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1 text-destructive hover:text-destructive"
            onClick={clearLocalData}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear local caches
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
