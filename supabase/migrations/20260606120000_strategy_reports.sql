-- Persisted Strategy Agent reports (full JSON + execution plan)
CREATE TABLE public.strategy_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  business_idea JSONB NOT NULL,
  result JSONB,
  plan_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  used_fallback BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.strategy_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own strategy reports"
  ON public.strategy_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strategy reports"
  ON public.strategy_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strategy reports"
  ON public.strategy_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own strategy reports"
  ON public.strategy_reports FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_strategy_reports_user_created
  ON public.strategy_reports (user_id, created_at DESC);
