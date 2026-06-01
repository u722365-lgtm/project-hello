import { useState } from "react";
import { Bell, Mail, Shield, Newspaper } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  getNotifProductUpdates,
  setNotifProductUpdates,
  getNotifSecurityAlerts,
  setNotifSecurityAlerts,
  getNotifWeeklyDigest,
  setNotifWeeklyDigest,
} from "@/lib/profilePreferences";

interface NotificationsExtrasProps {
  notificationEmail: boolean;
  setNotificationEmail: (v: boolean) => void;
  notificationPush: boolean;
  setNotificationPush: (v: boolean) => void;
  notificationMentions: boolean;
  setNotificationMentions: (v: boolean) => void;
}

export function NotificationsExtras({
  notificationEmail,
  setNotificationEmail,
  notificationPush,
  setNotificationPush,
  notificationMentions,
  setNotificationMentions,
}: NotificationsExtrasProps) {
  const [productUpdates, setProductUpdates] = useState(() => getNotifProductUpdates());
  const [securityAlerts, setSecurityAlerts] = useState(() => getNotifSecurityAlerts());
  const [weeklyDigest, setWeeklyDigest] = useState(() => getNotifWeeklyDigest());

  const rows = [
    {
      label: "Email Notifications",
      desc: "Receive email updates about your conversations",
      value: notificationEmail,
      onChange: setNotificationEmail,
      icon: Mail,
    },
    {
      label: "Push Notifications",
      desc: "Get push notifications on your device",
      value: notificationPush,
      onChange: setNotificationPush,
      icon: Bell,
    },
    {
      label: "Mention Notifications",
      desc: "Get notified when someone mentions you",
      value: notificationMentions,
      onChange: setNotificationMentions,
      icon: Bell,
    },
    {
      label: "Product updates",
      desc: "New features, changelog highlights, and release notes",
      value: productUpdates,
      onChange: (v: boolean) => {
        setProductUpdates(v);
        setNotifProductUpdates(v);
      },
      icon: Newspaper,
    },
    {
      label: "Security alerts",
      desc: "Sign-in from new devices and account security events",
      value: securityAlerts,
      onChange: (v: boolean) => {
        setSecurityAlerts(v);
        setNotifSecurityAlerts(v);
      },
      icon: Shield,
    },
    {
      label: "Weekly digest",
      desc: "Summary of your activity and credits usage",
      value: weeklyDigest,
      onChange: (v: boolean) => {
        setWeeklyDigest(v);
        setNotifWeeklyDigest(v);
      },
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
          <Switch checked={item.value} onCheckedChange={item.onChange} />
        </div>
      ))}
    </div>
  );
}
