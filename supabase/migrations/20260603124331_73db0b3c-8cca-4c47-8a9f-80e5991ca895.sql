
-- 1) Profiles: restrict default SELECT to self; admins keep all-view policy
DROP POLICY IF EXISTS "Authenticated users can view public profile data" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2) shadow_credits: remove client INSERT/UPDATE; admins/service-role only
DROP POLICY IF EXISTS "Users can insert their own credits" ON public.shadow_credits;
DROP POLICY IF EXISTS "Users can update their own credits" ON public.shadow_credits;
CREATE POLICY "Admins can manage shadow credits"
ON public.shadow_credits FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
ALTER TABLE public.shadow_credits
  ADD CONSTRAINT shadow_credits_balance_non_negative CHECK (balance >= 0) NOT VALID;

-- 3) credit_transactions: remove client/system INSERT; restrict to admins
DROP POLICY IF EXISTS "System can insert transactions" ON public.credit_transactions;
CREATE POLICY "Admins can insert credit transactions"
ON public.credit_transactions FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) user_badges: remove client INSERT; admins/service-role only
DROP POLICY IF EXISTS "Users can insert their own badges" ON public.user_badges;
CREATE POLICY "Admins can award badges"
ON public.user_badges FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5) sponsor_partners: hide commission_rate from public; expose via safe view
DROP POLICY IF EXISTS "Anyone can view active sponsors" ON public.sponsor_partners;
CREATE POLICY "Admins can view all sponsors"
ON public.sponsor_partners FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE VIEW public.sponsor_partners_public
WITH (security_invoker = true) AS
SELECT id, name, description, logo_url, website_url, affiliate_url,
       keywords, category, priority, is_active, created_at, updated_at
FROM public.sponsor_partners
WHERE is_active = true;

GRANT SELECT ON public.sponsor_partners_public TO anon, authenticated;

-- 6) manual_payments: prevent NULL user_id rows from being read by signed-in users
DROP POLICY IF EXISTS "Users can view their own payments" ON public.manual_payments;
CREATE POLICY "Users can view their own payments"
ON public.manual_payments FOR SELECT
TO authenticated
USING (user_id IS NOT NULL AND auth.uid() = user_id);

-- 7) newsletter_subscriptions: let subscribers see/remove their own row by email
CREATE POLICY "Users can view their own subscription"
ON public.newsletter_subscriptions FOR SELECT
TO authenticated
USING (lower(email) = lower(auth.email()));

CREATE POLICY "Users can delete their own subscription"
ON public.newsletter_subscriptions FOR DELETE
TO authenticated
USING (lower(email) = lower(auth.email()));
