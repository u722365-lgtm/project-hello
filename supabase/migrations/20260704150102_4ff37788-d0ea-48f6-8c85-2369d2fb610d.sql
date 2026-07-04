
-- 1. gemini_api_keys: drop broad ALL policy on public role; add admin-only SELECT
DROP POLICY IF EXISTS "Admins can manage API keys" ON public.gemini_api_keys;
CREATE POLICY "Admin can select gemini keys" ON public.gemini_api_keys
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. newsletter_subscriptions: restrict INSERT to caller's own email
DROP POLICY IF EXISTS "Authenticated users can subscribe to newsletter" ON public.newsletter_subscriptions;
CREATE POLICY "Users can subscribe with their own email" ON public.newsletter_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(email) > 0
    AND length(email) <= 255
    AND lower(email) = lower(auth.email())
  );

-- 3. referrals: mask referred_email exposure
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS referred_email_masked text
  GENERATED ALWAYS AS (
    CASE
      WHEN referred_email IS NULL THEN NULL
      WHEN position('@' in referred_email) < 2 THEN '***'
      ELSE substr(referred_email, 1, 1) || '***' || substr(referred_email, position('@' in referred_email))
    END
  ) STORED;

REVOKE SELECT (referred_email) ON public.referrals FROM authenticated;
REVOKE SELECT (referred_email) ON public.referrals FROM anon;
REVOKE SELECT (referred_email) ON public.referrals FROM PUBLIC;

-- 4. user_badges: drop overly permissive SELECT-all policy
DROP POLICY IF EXISTS "Users can view all earned badges" ON public.user_badges;

-- 5. storage: restrict writes to email-assets bucket to admins only
CREATE POLICY "email-assets admins insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'email-assets' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "email-assets admins update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'email-assets' AND public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'email-assets' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "email-assets admins delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'email-assets' AND public.has_role(auth.uid(), 'admin'::app_role));
