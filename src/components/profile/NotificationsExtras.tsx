import { Bell, Mail, Shield, Newspaper } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { ExtendedNotificationPrefs } from "@/lib/profileNotificationSettings";

interface NotificationsExtrasProps {
  notificationEmail: boolean;
  onNotificationEmailChange: (v: boolean) => void;
  notificationPush: boolean;
  onNotificationPushChange: (v: boolean) => void;
  notificationMentions: boolean;
  onNotificationMentionsChange: (v: boolean) => void;
  extended: ExtendedNotificationPrefs;
  onExtendedChange: (patch: Partial<ExtendedNotificationPrefs>) => void;
  disabled?: boolean;
}

export function NotificationsExtras({
  notificationEmail,
  onNotificationEmailChange,
  notificationPush,
  onNotificationPushChange,
  notificationMentions,
  onNotificationMentionsChange,
  extended,
  onExtendedChange,
  disabled,
}: NotificationsExtrasProps) {
  const rows = [
    {
      label: "Email Notifications",
      desc: "Receive email updates about your conversations",
      value: notificationEmail,
      onChange: onNotificationEmailChange,
      icon: Mail,
    },
    {
      label: "Push Notifications",
      desc: "Browser push when enabled in this device",
      value: notificationPush,
      onChange: onNotificationPushChange,
      icon: Bell,
    },
    {
      label: "Mention Notifications",
      desc: "Get notified when someone mentions you",
      value: notificationMentions,
      onChange: onNotificationMentionsChange,
      icon: Bell,
    },
    {
      label: "Product updates",
      desc: "New features, changelog highlights, and release notes",
      value: extended.productUpdates,
      onChange: (v: boolean) => onExtendedChange({ productUpdates: v }),
      icon: Newspaper,
    },
    {
      label: "Security alerts",
      desc: "Sign-in from new devices and account security events",
      value: extended.securityAlerts,
      onChange: (v: boolean) => onExtendedChange({ securityAlerts: v }),
      icon: Shield,
    },
    {
      label: "Weekly digest",
      desc: "Summary of your activity and credits usage",
      value: extended.weeklyDigest,
      onChange: (v: boolean) => onExtendedChange({ weeklyDigest: v }),
      icon: Mail,
    },
  ];

  return (
    <div className="space-y-1">
      {rows.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <item.icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </div>
          <Switch checked={item.value} onCheckedChange={item.onChange} disabled={disabled} />
        </div>
      ))}
    </div>
  );
}
