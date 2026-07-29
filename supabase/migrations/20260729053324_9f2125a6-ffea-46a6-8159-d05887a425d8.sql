DROP POLICY IF EXISTS "email-assets public read" ON storage.objects;
DROP POLICY IF EXISTS "email-assets admins read" ON storage.objects;
DROP POLICY IF EXISTS "email-assets admins insert" ON storage.objects;
DROP POLICY IF EXISTS "email-assets admins update" ON storage.objects;
DROP POLICY IF EXISTS "email-assets admins delete" ON storage.objects;
DROP POLICY IF EXISTS "email-assets service write" ON storage.objects;
DROP POLICY IF EXISTS "email-assets service update" ON storage.objects;
DROP POLICY IF EXISTS "email-assets service delete" ON storage.objects;

CREATE POLICY "email-assets admins read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'email-assets' AND public.has_role(auth.uid(), 'admin'::app_role));

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

CREATE POLICY "email-assets service all"
ON storage.objects FOR ALL TO service_role
USING (bucket_id = 'email-assets')
WITH CHECK (bucket_id = 'email-assets');