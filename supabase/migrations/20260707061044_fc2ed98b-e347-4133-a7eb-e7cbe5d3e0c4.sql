
CREATE TABLE public.shared_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'chat',
  title TEXT,
  prompt TEXT NOT NULL,
  answer TEXT NOT NULL,
  model TEXT,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.shared_answers TO anon, authenticated;
GRANT INSERT ON public.shared_answers TO authenticated;
GRANT ALL ON public.shared_answers TO service_role;

ALTER TABLE public.shared_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read shared answers"
ON public.shared_answers FOR SELECT
USING (true);

CREATE POLICY "Users can create their own shared answers"
ON public.shared_answers FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (user_id IS NULL OR user_id = auth.uid())
  AND views = 0
);

CREATE INDEX idx_shared_answers_slug ON public.shared_answers(slug);
CREATE INDEX idx_shared_answers_user ON public.shared_answers(user_id, created_at DESC);
