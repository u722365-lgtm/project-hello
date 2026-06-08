-- ShadowScale: autonomous growth engine

CREATE TABLE IF NOT EXISTS public.shadowscale_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN NOT NULL DEFAULT true,
  autopilot BOOLEAN NOT NULL DEFAULT false,
  ethical_mode BOOLEAN NOT NULL DEFAULT true,
  max_emails_per_day INT NOT NULL DEFAULT 50,
  max_announcements_per_day INT NOT NULL DEFAULT 5,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.shadowscale_config (enabled, autopilot, ethical_mode)
SELECT true, false, true
WHERE NOT EXISTS (SELECT 1 FROM public.shadowscale_config LIMIT 1);

CREATE TABLE IF NOT EXISTS public.shadowscale_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  signups INT NOT NULL DEFAULT 0,
  active_users INT NOT NULL DEFAULT 0,
  shares INT NOT NULL DEFAULT 0,
  referrals INT NOT NULL DEFAULT 0,
  conversions INT NOT NULL DEFAULT 0,
  extra JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (metric_date)
);

CREATE TABLE IF NOT EXISTS public.shadowscale_action_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority INT NOT NULL DEFAULT 50,
  confidence REAL NOT NULL DEFAULT 0.5,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','running','done','failed','rejected')),
  scheduled_at TIMESTAMPTZ,
  result JSONB,
  created_by TEXT NOT NULL DEFAULT 'orchestrator',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shadowscale_action_queue_status_idx
  ON public.shadowscale_action_queue(status, priority DESC);

CREATE TABLE IF NOT EXISTS public.shadowscale_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  active_variant TEXT,
  winner TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shadowscale_heartbeats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  route TEXT,
  events JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shadowscale_heartbeats_created_idx
  ON public.shadowscale_heartbeats(created_at DESC);

GRANT SELECT ON public.shadowscale_config TO authenticated;
GRANT SELECT ON public.shadowscale_metrics_daily TO authenticated;
GRANT SELECT, UPDATE ON public.shadowscale_action_queue TO authenticated;
GRANT SELECT ON public.shadowscale_experiments TO authenticated;
GRANT INSERT, SELECT ON public.shadowscale_heartbeats TO authenticated;
GRANT ALL ON public.shadowscale_config TO service_role;
GRANT ALL ON public.shadowscale_metrics_daily TO service_role;
GRANT ALL ON public.shadowscale_action_queue TO service_role;
GRANT ALL ON public.shadowscale_experiments TO service_role;
GRANT ALL ON public.shadowscale_heartbeats TO service_role;

ALTER TABLE public.shadowscale_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shadowscale_metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shadowscale_action_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shadowscale_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shadowscale_heartbeats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage shadowscale config"
  ON public.shadowscale_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view shadowscale metrics"
  ON public.shadowscale_metrics_daily FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage action queue"
  ON public.shadowscale_action_queue FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage experiments"
  ON public.shadowscale_experiments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own heartbeats"
  ON public.shadowscale_heartbeats FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Admins view heartbeats"
  ON public.shadowscale_heartbeats FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER shadowscale_action_queue_updated
  BEFORE UPDATE ON public.shadowscale_action_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
