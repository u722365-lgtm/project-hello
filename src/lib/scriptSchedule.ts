export type SchedulePreset = "15m" | "1h" | "6h" | "24h" | "weekly";

export interface ScheduleConfig {
  preset: SchedulePreset;
  intervalMinutes: number;
  cron: string;
  label: string;
}

const PRESETS: Record<SchedulePreset, { intervalMinutes: number; cron: string; label: string }> = {
  "15m": { intervalMinutes: 15, cron: "*/15 * * * *", label: "Every 15 minutes" },
  "1h": { intervalMinutes: 60, cron: "0 * * * *", label: "Every hour" },
  "6h": { intervalMinutes: 360, cron: "0 */6 * * *", label: "Every 6 hours" },
  "24h": { intervalMinutes: 1440, cron: "0 0 * * *", label: "Every day" },
  weekly: { intervalMinutes: 10080, cron: "0 0 * * 0", label: "Every week" },
};

export const SCHEDULE_PRESETS = Object.entries(PRESETS).map(([value, meta]) => ({
  value: value as SchedulePreset,
  label: meta.label,
}));

export function buildScheduleConfig(preset: SchedulePreset): ScheduleConfig {
  const meta = PRESETS[preset] ?? PRESETS["1h"];
  return { preset, ...meta };
}
