-- Public aggregate metrics for marketing/community sections (no PII)
CREATE OR REPLACE FUNCTION public.get_public_platform_metrics()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT json_build_object(
    'totalUsers', (SELECT count(*)::int FROM public.profiles),
    'totalConversations', (SELECT count(*)::int FROM public.conversations),
    'dailyActiveUsers', (
      SELECT count(DISTINCT user_id)::int
      FROM public.usage_analytics
      WHERE created_at >= now() - interval '24 hours'
    )
  );
$$;

REVOKE ALL ON FUNCTION public.get_public_platform_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_platform_metrics() TO anon, authenticated;
