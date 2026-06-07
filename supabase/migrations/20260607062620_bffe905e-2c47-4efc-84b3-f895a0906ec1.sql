
-- 1. manual_payments: restrict INSERT to authenticated user binding user_id
CREATE POLICY "Users can insert their own payments"
  ON public.manual_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- 2. user_locations: allow self read
CREATE POLICY "Users can view their own locations"
  ON public.user_locations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Remove sensitive tables from Realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.admin_alerts;
ALTER PUBLICATION supabase_realtime DROP TABLE public.user_locations;
ALTER PUBLICATION supabase_realtime DROP TABLE public.missions;
ALTER PUBLICATION supabase_realtime DROP TABLE public.mission_actions;
ALTER PUBLICATION supabase_realtime DROP TABLE public.business_memories;
