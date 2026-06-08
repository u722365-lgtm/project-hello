-- Shadow Heal Engine: runtime fix visibility + heartbeat telemetry

CREATE POLICY "Users read approved runtime recoveries"
  ON public.shadowtalk_fix_proposals FOR SELECT TO authenticated
  USING (status = 'approved' AND patch_strategy = 'runtime_recover');

CREATE TABLE IF NOT EXISTS public.shadowtalk_heal_heartbeats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  route TEXT,
  traffic_level TEXT,
  wiring_issues JSONB DEFAULT '[]'::jsonb,
  metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shadowtalk_heal_heartbeats_created_idx
  ON public.shadowtalk_heal_heartbeats(created_at DESC);

GRANT INSERT, SELECT ON public.shadowtalk_heal_heartbeats TO authenticated;
GRANT ALL ON public.shadowtalk_heal_heartbeats TO service_role;
ALTER TABLE public.shadowtalk_heal_heartbeats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own heartbeats"
  ON public.shadowtalk_heal_heartbeats FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Admins view heartbeats"
  ON public.shadowtalk_heal_heartbeats FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
