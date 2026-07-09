-- Payment invoices + auto-processing metadata for manual checkout

ALTER TABLE public.manual_payments
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS invoice_html TEXT,
  ADD COLUMN IF NOT EXISTS invoice_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_activated_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_manual_payments_invoice_number
  ON public.manual_payments (invoice_number)
  WHERE invoice_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.payment_invoice_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_key TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PKR',
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_html TEXT,
  payment_reference TEXT,
  manual_payment_id UUID REFERENCES public.manual_payments(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'activated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_invoice_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own invoice drafts" ON public.payment_invoice_drafts;
CREATE POLICY "Users manage own invoice drafts"
ON public.payment_invoice_drafts
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage invoice drafts" ON public.payment_invoice_drafts;
CREATE POLICY "Admins manage invoice drafts"
ON public.payment_invoice_drafts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_payment_invoice_drafts_user
  ON public.payment_invoice_drafts (user_id, created_at DESC);

CREATE TRIGGER update_payment_invoice_drafts_updated_at
BEFORE UPDATE ON public.payment_invoice_drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
