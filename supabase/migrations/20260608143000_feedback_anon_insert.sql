-- Restore anonymous feedback submissions (requires email for guests)
DROP POLICY IF EXISTS "Users can submit feedback" ON public.feedback;

CREATE POLICY "Authenticated users can submit feedback"
  ON public.feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Anonymous users can submit feedback with email"
  ON public.feedback
  FOR INSERT
  TO anon
  WITH CHECK (email IS NOT NULL AND length(trim(email)) > 3);
