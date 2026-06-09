-- ShadowScale autonomy v2: client signals, realtime queue, default experiments

CREATE TABLE IF NOT EXISTS public.shadowscale_client_signals (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  amplify_shares BOOLEAN NOT NULL DEFAULT false,
  amplify_shares_until TIMESTAMPTZ,
  promote_video_studio BOOLEAN NOT NULL DEFAULT false,
  campaign_message TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.shadowscale_client_signals (id, amplify_shares, promote_video_studio)
VALUES (1, false, false)
ON CONFLICT (id) DO NOTHING;

GRANT SELECT ON public.shadowscale_client_signals TO authenticated;
GRANT ALL ON public.shadowscale_client_signals TO service_role;

ALTER TABLE public.shadowscale_client_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated reads growth signals"
  ON public.shadowscale_client_signals FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Service role manages growth signals"
  ON public.shadowscale_client_signals FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Realtime for admin Growth Command live queue
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'shadowscale_action_queue'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shadowscale_action_queue;
  END IF;
END $$;

ALTER TABLE public.shadowscale_action_queue REPLICA IDENTITY FULL;

-- Seed default growth experiments (copy variants)
INSERT INTO public.shadowscale_experiments (key, variants, active_variant)
VALUES (
  'share_cta',
  '["Tag a friend who still uses normal AI for private stuff","Share ShadowTalk with someone who needs private AI"]'::jsonb,
  'Tag a friend who still uses normal AI for private stuff'
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.shadowscale_experiments (key, variants, active_variant)
VALUES (
  'video_hook',
  '["privacy","developer","student"]'::jsonb,
  'privacy'
)
ON CONFLICT (key) DO NOTHING;
