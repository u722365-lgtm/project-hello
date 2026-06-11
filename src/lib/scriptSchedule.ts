export type SchedulePreset = "15m" | "1h" | "daily";

export interface ScriptScheduleConfig {
  preset?: SchedulePreset;
  intervalMinutes: number;
  next_run_at: string;
}

export function buildScheduleConfig(preset: SchedulePreset): ScriptScheduleConfig {
  const intervalMinutes = preset === "15m" ? 15 : preset === "1h" ? 60 : 24 * 60;
  return {
    preset,
    intervalMinutes,
    next_run_at: new Date(Date.now() + intervalMinutes * 60 * 1000).toISOString(),
  };
}

export function advanceScheduleConfig(
  config: Record<string, unknown> | null | undefined,
): ScriptScheduleConfig {
  const intervalMinutes =
    typeof config?.intervalMinutes === "number" && config.intervalMinutes > 0
      ? config.intervalMinutes
      : 60;
  return {
    preset: config?.preset as SchedulePreset | undefined,
    intervalMinutes,
    next_run_at: new Date(Date.now() + intervalMinutes * 60 * 1000).toISOString(),
  };
}

export function parseScheduleConfig(raw: unknown): ScriptScheduleConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  if (typeof c.next_run_at !== "string") return null;
  return {
    preset: c.preset as SchedulePreset | undefined,
    intervalMinutes: typeof c.intervalMinutes === "number" ? c.intervalMinutes : 60,
    next_run_at: c.next_run_at,
  };
}
