-- Payment receipts storage + admin subscriber upgrades for manual payments

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-receipts',
  'payment-receipts',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users upload own payment receipts" ON storage.objects;
CREATE POLICY "Users upload own payment receipts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'payment-receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users read own payment receipts" ON storage.objects;
CREATE POLICY "Users read own payment receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Admins read all payment receipts" ON storage.objects;
CREATE POLICY "Admins read all payment receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-receipts'
    AND public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Admins can update all subscribers" ON public.subscribers;
CREATE POLICY "Admins can update all subscribers"
  ON public.subscribers FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert subscribers" ON public.subscribers;
CREATE POLICY "Admins can insert subscribers"
  ON public.subscribers FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
