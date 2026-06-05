-- Auto-provision enterprise tier for Shan Foods (and configured domains)

CREATE OR REPLACE FUNCTION public.provision_enterprise_subscriber()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_domain text;
  enterprise_domains text[] := ARRAY['shanfoods.com', 'shan.com', 'shanfood.com'];
BEGIN
  IF NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  email_domain := lower(split_part(NEW.email, '@', 2));

  IF email_domain = ANY (enterprise_domains) THEN
    INSERT INTO public.subscribers (user_id, subscription_tier, subscription_status)
    VALUES (NEW.id, 'enterprise', 'active')
    ON CONFLICT (user_id) DO UPDATE SET
      subscription_tier = 'enterprise',
      subscription_status = 'active',
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_enterprise_provision ON auth.users;
CREATE TRIGGER on_auth_user_enterprise_provision
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.provision_enterprise_subscriber();

-- Backfill existing Shan Foods accounts
INSERT INTO public.subscribers (user_id, subscription_tier, subscription_status)
SELECT u.id, 'enterprise', 'active'
FROM auth.users u
WHERE lower(split_part(u.email, '@', 2)) IN ('shanfoods.com', 'shan.com', 'shanfood.com')
ON CONFLICT (user_id) DO UPDATE SET
  subscription_tier = 'enterprise',
  subscription_status = 'active',
  updated_at = now();
