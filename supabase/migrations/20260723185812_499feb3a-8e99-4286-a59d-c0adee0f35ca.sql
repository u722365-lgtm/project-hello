GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback TO authenticated;
GRANT INSERT ON public.feedback TO anon;
GRANT ALL ON public.feedback TO service_role;