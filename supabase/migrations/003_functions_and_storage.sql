-- ============================================
-- ShadowTalk AI — RPC Functions & Storage Setup
-- ============================================
-- Run AFTER 002_rls_policies.sql


-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Avatars: public read (anyone can see profile pictures)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Payment receipts: private (only user + admins can access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('payment-receipts', 'payment-receipts', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "AvatarUpload: users can upload own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "AvatarRead: public" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "AvatarDelete: users can delete own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policies for payment receipts
CREATE POLICY "ReceiptUpload: users can upload own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "ReceiptRead: users and admins" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-receipts'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    )
  );
CREATE POLICY "ReceiptRead: service role" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment-receipts');


-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Check if a user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(target_user_id uuid, target_role text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = target_user_id AND role = target_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is workspace admin
CREATE OR REPLACE FUNCTION public.is_workspace_admin(target_user_id uuid, target_workspace_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = target_user_id
      AND workspace_id = target_workspace_id
      AND role = 'admin'
  )
  OR EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = target_workspace_id AND owner_id = target_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is workspace member
CREATE OR REPLACE FUNCTION public.is_workspace_member(target_user_id uuid, target_workspace_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = target_user_id AND workspace_id = target_workspace_id
  )
  OR EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = target_workspace_id AND owner_id = target_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user has a valid workspace invitation
CREATE OR REPLACE FUNCTION public.has_valid_workspace_invitation(target_token text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_invitations
    WHERE token = target_token
      AND accepted_at IS NULL
      AND expires_at > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get a shared answer by slug
CREATE OR REPLACE FUNCTION public.get_shared_answer(target_slug text)
RETURNS TABLE(id uuid, title text, answer text, source text, views bigint) AS $$
BEGIN
  RETURN QUERY
    UPDATE public.shared_answers
    SET views = views + 1
    WHERE slug = target_slug
    RETURNING id, title, answer, source, views;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment shared answer views (standalone)
CREATE OR REPLACE FUNCTION public.increment_shared_answer_views(target_slug text)
RETURNS void AS $$
BEGIN
  UPDATE public.shared_answers SET views = views + 1 WHERE slug = target_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Match source chunks for RAG (vector similarity placeholder)
CREATE OR REPLACE FUNCTION public.match_source_chunks(
  query_embedding text,
  match_threshold numeric DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE(
  id uuid,
  content text,
  file_path text,
  chunk_index int,
  similarity numeric
) AS $$
BEGIN
  -- When pgvector is enabled, replace this with actual cosine similarity search:
  -- SELECT id, content, file_path, chunk_index,
  --   1 - (embedding <=> query_embedding::vector) as similarity
  -- FROM public.shadowtalk_source_chunks
  -- WHERE 1 - (embedding <=> query_embedding::vector) > match_threshold
  -- ORDER BY similarity DESC LIMIT match_count;
  
  RETURN QUERY
    SELECT sc.id, sc.content, sc.file_path, sc.chunk_index, 1.0::numeric
    FROM public.shadowtalk_source_chunks sc
    ORDER BY sc.chunk_index
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ============================================
-- HELPER: Update daily_usage counters atomically
-- ============================================
CREATE OR REPLACE FUNCTION public.increment_daily_usage(
  target_user_id uuid,
  p_messages int DEFAULT 0,
  p_image_generations int DEFAULT 0,
  p_deep_research int DEFAULT 0,
  p_voice_sessions int DEFAULT 0,
  p_web_searches int DEFAULT 0,
  p_code_generations int DEFAULT 0,
  p_document_generations int DEFAULT 0,
  p_file_uploads int DEFAULT 0
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.daily_usage (
    user_id, usage_date,
    messages, image_generations, deep_research, voice_sessions,
    web_searches, code_generations, document_generations, file_uploads
  ) VALUES (
    target_user_id, current_date,
    p_messages, p_image_generations, p_deep_research, p_voice_sessions,
    p_web_searches, p_code_generations, p_document_generations, p_file_uploads
  )
  ON CONFLICT (user_id, usage_date) DO UPDATE SET
    messages = daily_usage.messages + p_messages,
    image_generations = daily_usage.image_generations + p_image_generations,
    deep_research = daily_usage.deep_research + p_deep_research,
    voice_sessions = daily_usage.voice_sessions + p_voice_sessions,
    web_searches = daily_usage.web_searches + p_web_searches,
    code_generations = daily_usage.code_generations + p_code_generations,
    document_generations = daily_usage.document_generations + p_document_generations,
    file_uploads = daily_usage.file_uploads + p_file_uploads,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- HELPER: Check and enforce plan limits
-- ============================================
CREATE OR REPLACE FUNCTION public.check_plan_limit(
  target_user_id uuid,
  limit_type text
)
RETURNS TABLE(allowed boolean, current_count bigint, limit_count bigint) AS $$
DECLARE
  v_plan text;
  v_limit bigint;
  v_count bigint;
  v_today date := current_date;
BEGIN
  SELECT plan INTO v_plan FROM public.profiles WHERE id = target_user_id;
  IF v_plan IS NULL THEN v_plan := 'free'; END IF;

  v_count := 0;
  v_limit := 0;

  CASE limit_type
    WHEN 'messages' THEN
      SELECT COALESCE(SUM(messages), 0) INTO v_count
      FROM public.daily_usage WHERE user_id = target_user_id AND usage_date = v_today;
      v_limit := CASE v_plan
        WHEN 'free' THEN 50
        WHEN 'pro' THEN 999999
        WHEN 'premium' THEN 999999
        WHEN 'elite' THEN 999999
        ELSE 50
      END;
    WHEN 'deep_research' THEN
      SELECT COALESCE(SUM(deep_research), 0) INTO v_count
      FROM public.daily_usage WHERE user_id = target_user_id AND usage_date = v_today;
      v_limit := CASE v_plan
        WHEN 'free' THEN 3
        WHEN 'pro' THEN 20
        WHEN 'premium' THEN 50
        WHEN 'elite' THEN 999999
        ELSE 3
      END;
    WHEN 'image_generations' THEN
      SELECT COALESCE(SUM(image_generations), 0) INTO v_count
      FROM public.daily_usage WHERE user_id = target_user_id AND usage_date = v_today;
      v_limit := CASE v_plan
        WHEN 'free' THEN 5
        WHEN 'pro' THEN 20
        WHEN 'premium' THEN 50
        WHEN 'elite' THEN 999999
        ELSE 5
      END;
    ELSE
      v_limit := 999999;
  END CASE;

  RETURN QUERY SELECT (v_count < v_limit), v_count, v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ============================================
-- UNIQUE constraint on daily_usage
-- ============================================
ALTER TABLE public.daily_usage
  ADD CONSTRAINT daily_usage_user_date_unique UNIQUE (user_id, usage_date);


-- ============================================
-- UNIQUE constraint on user_settings
-- ============================================
ALTER TABLE public.user_settings
  ADD CONSTRAINT user_settings_user_key_unique UNIQUE (user_id, setting_key);


-- ============================================
-- UNIQUE constraint on user_streaks
-- ============================================
ALTER TABLE public.user_streaks
  ADD CONSTRAINT user_streaks_user_unique UNIQUE (user_id);


-- ============================================
-- UNIQUE constraint on shadow_credits
-- ============================================
ALTER TABLE public.shadow_credits
  ADD CONSTRAINT shadow_credits_user_unique UNIQUE (user_id);


-- ============================================
-- UNIQUE constraint on user_referral_codes
-- ============================================
ALTER TABLE public.user_referral_codes
  ADD CONSTRAINT user_referral_codes_user_unique UNIQUE (user_id);
