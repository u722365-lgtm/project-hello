import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, Monitor, Moon, Palette, Settings, Volume2 } from "lucide-react";
import { useTheme } from "next-themes";
import {
  getUiCompactMode,
  getUiLanguage,
  getUiSoundEnabled,
  setUiCompactMode,
  setUiLanguage,
  setUiSoundEnabled,
} from "@/lib/profilePreferences";
import { SettingsSectionHeader } from "@/components/settings/SettingsSectionHeader";
import { SettingsStagger, SettingsStaggerItem } from "@/components/settings/SettingsStagger";
import { useSettingsMotion } from "@/hooks/useSettingsMotion";

function SettingRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { reduced } = useSettingsMotion();

  return (
    <motion.div
      className={className}
      whileHover={reduced ? undefined : { backgroundColor: "hsl(var(--muted) / 0.35)" }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

export function SettingsGeneralSection() {
  const { setTheme } = useTheme();
  const [soundEnabled, setSoundEnabled] = useState(() => getUiSoundEnabled());
  const [compactMode, setCompactMode] = useState(() => getUiCompactMode());
  const [language, setLanguage] = useState(() => getUiLanguage());

  useEffect(() => {
    setUiCompactMode(compactMode);
  }, [compactMode]);

  return (
    <SettingsStagger className="space-y-6">
      <SettingsSectionHeader
        icon={Settings}
        title="General"
        description="Appearance and interface — theme, language, and feedback like leading AI apps"
      />

      <SettingsStaggerItem>
        <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}>
          <Card className="glass border-border/50 card-glass overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="h-5 w-5 text-primary" />
                Appearance
              </CardTitle>
              <CardDescription>How ShadowTalk looks on your device</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <SettingRow className="flex items-center justify-between p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <Moon className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Theme</p>
                    <p className="text-xs text-muted-foreground">Sovereign dark brand theme</p>
                  </div>
                </div>
                <Select value="dark" onValueChange={() => setTheme("dark")}>
                  <SelectTrigger className="w-36 bg-muted/30 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">ShadowTalk Dark</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow className="flex items-center justify-between p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <Monitor className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Compact mode</p>
                    <p className="text-xs text-muted-foreground">Tighter spacing across the app</p>
                  </div>
                </div>
                <Switch
                  checked={compactMode}
                  onCheckedChange={(v) => {
                    setCompactMode(v);
                    setUiCompactMode(v);
                  }}
                />
              </SettingRow>

              <SettingRow className="flex items-center justify-between p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <Volume2 className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Sound effects</p>
                    <p className="text-xs text-muted-foreground">UI feedback sounds</p>
                  </div>
                </div>
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={(v) => {
                    setSoundEnabled(v);
                    setUiSoundEnabled(v);
                  }}
                />
              </SettingRow>
            </CardContent>
          </Card>
        </motion.div>
      </SettingsStaggerItem>

      <SettingsStaggerItem>
        <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}>
          <Card className="glass border-border/50 card-glass overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-5 w-5 text-primary" />
                Language
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SettingRow className="flex items-center justify-between p-4 rounded-xl">
                <div>
                  <Label>Display language</Label>
                  <p className="text-xs text-muted-foreground">
                    UI language preference (stored on device)
                  </p>
                </div>
                <Select
                  value={language}
                  onValueChange={(code) => {
                    setLanguage(code);
                    setUiLanguage(code);
                  }}
                >
                  <SelectTrigger className="w-32 bg-muted/30 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
            </CardContent>
          </Card>
        </motion.div>
      </SettingsStaggerItem>
    </SettingsStagger>
  );
}
