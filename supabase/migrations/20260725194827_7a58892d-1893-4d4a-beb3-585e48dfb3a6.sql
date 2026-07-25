GRANT SELECT ON public.marketplace_agents TO anon, authenticated;
GRANT ALL ON public.marketplace_agents TO service_role;
GRANT SELECT, INSERT, DELETE ON public.user_installed_agents TO authenticated;
GRANT ALL ON public.user_installed_agents TO service_role;