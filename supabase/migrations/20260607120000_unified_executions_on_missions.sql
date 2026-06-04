-- Unified Shadow Execution: extend missions for all deliverable types (Phase B)

ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS deliverable_type TEXT NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS business_idea JSONB,
  ADD COLUMN IF NOT EXISTS used_fallback BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deliverable_markdown TEXT;

ALTER TABLE public.missions
  DROP CONSTRAINT IF EXISTS missions_deliverable_type_check;

ALTER TABLE public.missions
  ADD CONSTRAINT missions_deliverable_type_check
  CHECK (deliverable_type IN ('general', 'strategy_report', 'research_brief', 'content_pack'));

CREATE INDEX IF NOT EXISTS idx_missions_deliverable_type
  ON public.missions (user_id, deliverable_type, created_at DESC);

-- Migrate completed strategy_reports into missions (idempotent: skip if title+user+created_at exists)
INSERT INTO public.missions (
  user_id,
  title,
  goal,
  description,
  status,
  steps,
  result,
  deliverable_type,
  business_idea,
  used_fallback,
  progress,
  created_at,
  completed_at,
  updated_at
)
SELECT
  sr.user_id,
  sr.title,
  COALESCE(
    NULLIF(trim(sr.business_idea->>'name'), '') || ': strategy report',
    sr.title
  ),
  left(COALESCE(sr.business_idea->>'description', ''), 500),
  CASE sr.status
    WHEN 'completed' THEN 'completed'
    WHEN 'failed' THEN 'failed'
    WHEN 'cancelled' THEN 'cancelled'
    ELSE 'failed'
  END,
  COALESCE(sr.plan_steps, '[]'::jsonb),
  CASE
    WHEN sr.result IS NOT NULL THEN jsonb_build_object(
      'deliverable_type', 'strategy_report',
      'strategy', sr.result
    )
    ELSE NULL
  END,
  'strategy_report',
  sr.business_idea,
  COALESCE(sr.used_fallback, false),
  CASE WHEN sr.status = 'completed' THEN 100 ELSE 0 END,
  sr.created_at,
  CASE WHEN sr.status = 'completed' THEN sr.updated_at ELSE NULL END,
  sr.updated_at
FROM public.strategy_reports sr
WHERE NOT EXISTS (
  SELECT 1 FROM public.missions m
  WHERE m.user_id = sr.user_id
    AND m.title = sr.title
    AND m.created_at = sr.created_at
    AND m.deliverable_type = 'strategy_report'
);
