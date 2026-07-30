/**
 * Mission share helpers — bounded, read-only viral path.
 *
 * Current scope:
 * - buildShareUrl(id)
 * - sanitizeMissionForPublic(missions)
 *
 * IMPORTANT: this does NOT auto-publish missions. A separate explicit
 * share action should call a public rows/policy-safe write before handing
 * the user a public URL.
 */

export type PublicMissionLog = {
  id: string;
  title: string;
  status: string;
  started_at?: string | null;
  completed_at?: string | null;
  actual_duration_ms?: number | null;
  steps: Array<{
    id: string;
    action: string;
    status: string;
    result?: string | null;
    duration_ms?: number | null;
    tool_name?: string | null;
  }>;
};

export function buildShareUrl(id: string): string {
  return `/mission/${encodeURIComponent(id)}`;
}

export function sanitizeMissionForPublic(mission: Record<string, unknown>): PublicMissionLog | null {
  if (!mission?.id || !mission?.title) return null;

  const stepsRaw = Array.isArray(mission.steps) ? mission.steps : [];
  const steps = stepsRaw.map((s: Record<string, unknown>) => ({
    id: String(s.id ?? `step-${Math.random().toString(36).slice(2, 8)}`),
    action: String(s.action ?? s.tool_name ?? 'Step'),
    status: ['completed', 'failed', 'skipped', 'running', 'pending', 'awaiting_approval'].includes(String(s.status))
      ? (s.status as PublicMissionLog['steps'][0]['status'])
      : 'completed',
    result: typeof s.result === 'string' ? s.result : typeof s.output === 'string' ? s.output : null,
    duration_ms: typeof s.duration_ms === 'number' ? s.duration_ms : null,
    tool_name: typeof s.tool_name === 'string' ? s.tool_name : null,
  }));

  return {
    id: String(mission.id),
    title: String(mission.title),
    status: String(mission.status ?? 'completed'),
    started_at: typeof mission.started_at === 'string' ? mission.started_at : null,
    completed_at: typeof mission.completed_at === 'string' ? mission.completed_at : null,
    actual_duration_ms: typeof mission.actual_duration_ms === 'number' ? mission.actual_duration_ms : null,
    steps,
  };
}
