
-- manual_payments: force pending, no self-verification
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.manual_payments;
CREATE POLICY "Users can submit their own pending payments"
ON public.manual_payments FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND status = 'pending'
  AND verified_by IS NULL
  AND verified_at IS NULL
);

-- pay_per_solution: pending only, no amount/deliverable set by user
DROP POLICY IF EXISTS "Users can create purchases" ON public.pay_per_solution;
CREATE POLICY "Users can create pending purchases"
ON public.pay_per_solution FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
  AND amount_paid IS NULL
  AND deliverable_url IS NULL
  AND stripe_payment_id IS NULL
  AND completed_at IS NULL
);

-- referrals: remove user-side insert (backend edge function uses service role)
DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;

-- strategy_day_passes: remove user-side insert (backend/admin only)
DROP POLICY IF EXISTS "Users can insert their own day passes" ON public.strategy_day_passes;

-- subscribers: remove user-side insert and update (webhook/admin only)
DROP POLICY IF EXISTS "Users can insert subscriber record" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscribers;

-- user_referral_codes: force zero counters on insert, remove user update
DROP POLICY IF EXISTS "Users can create their own referral code" ON public.user_referral_codes;
CREATE POLICY "Users can create their own referral code"
ON public.user_referral_codes FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND COALESCE(total_referrals, 0) = 0
  AND COALESCE(successful_conversions, 0) = 0
  AND COALESCE(total_earnings, 0) = 0
);
DROP POLICY IF EXISTS "Users can update their own referral code" ON public.user_referral_codes;
