
GRANT INSERT ON public.feedback TO authenticated, anon;
GRANT SELECT, UPDATE, DELETE ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;

DROP POLICY IF EXISTS "Anon can submit feedback" ON public.feedback;
CREATE POLICY "Anon can submit feedback"
ON public.feedback FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);
