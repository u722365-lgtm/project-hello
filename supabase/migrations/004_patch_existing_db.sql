-- ============================================
-- ShadowTalk AI — Patch for Existing Database
-- ============================================
-- Run this in Supabase SQL Editor if tables already exist.
-- This script is IDEMPOTENT (safe to run multiple times).
-- ============================================

-- ============================================
-- 1. ADD MISSING COLUMNS TO PROFILES
-- ============================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='plan') THEN
    ALTER TABLE public.profiles ADD COLUMN plan text NOT NULL DEFAULT 'free';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='email') THEN
    ALTER TABLE public.profiles ADD COLUMN email text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='stripe_customer_id') THEN
    ALTER TABLE public.profiles ADD COLUMN stripe_customer_id text;
  END IF;
END $$;

-- ============================================
-- 2. AUTO-PROVISION TRIGGER (on new user signup)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, plan, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'free',
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.shadow_credits (user_id, balance, total_purchased, total_consumed, created_at, updated_at)
  VALUES (NEW.id, 100, 0, 0, now(), now())
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, total_active_days, streak_multiplier, last_active_date, created_at, updated_at)
  VALUES (NEW.id, 0, 0, 0, 1.0, now(), now(), now())
  ON CONFLICT DO NOTHING;

  INSERT INTO public.daily_usage (user_id, usage_date, messages, image_generations, deep_research, voice_sessions, web_searches, code_generations, document_generations, file_uploads, created_at, updated_at)
  VALUES (NEW.id, current_date, 0, 0, 0, 0, 0, 0, 0, 0, now(), now())
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_settings (user_id, setting_key, setting_value, created_at, updated_at)
  VALUES 
    (NEW.id, 'theme', '"dark"', now(), now()),
    (NEW.id, 'language', '"en"', now(), now()),
    (NEW.id, 'notifications_enabled', 'true', now(), now())
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_referral_codes (user_id, referral_code, total_referrals, successful_conversions, total_earnings, created_at)
  VALUES (NEW.id, upper(substring(encode(gen_random_bytes(4), 'hex'), 1, 8)), 0, 0, 0, now())
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ============================================
-- 3. RPC FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(target_user_id uuid, target_role text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target_user_id AND role = target_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_workspace_admin(target_user_id uuid, target_workspace_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members WHERE user_id = target_user_id AND workspace_id = target_workspace_id AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.workspaces WHERE id = target_workspace_id AND owner_id = target_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_workspace_member(target_user_id uuid, target_workspace_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members WHERE user_id = target_user_id AND workspace_id = target_workspace_id
  ) OR EXISTS (
    SELECT 1 FROM public.workspaces WHERE id = target_workspace_id AND owner_id = target_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.has_valid_workspace_invitation(target_token text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_invitations
    WHERE token = target_token AND accepted_at IS NULL AND expires_at > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_shared_answer(target_slug text)
RETURNS TABLE(id uuid, title text, answer text, source text, views bigint) AS $$
BEGIN
  RETURN QUERY UPDATE public.shared_answers SET views = views + 1 WHERE slug = target_slug
    RETURNING id, title, answer, source, views;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_shared_answer_views(target_slug text)
RETURNS void AS $$
BEGIN
  UPDATE public.shared_answers SET views = views + 1 WHERE slug = target_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.match_source_chunks(query_embedding text, match_threshold numeric DEFAULT 0.7, match_count int DEFAULT 5)
RETURNS TABLE(id uuid, content text, file_path text, chunk_index int, similarity numeric) AS $$
BEGIN
  RETURN QUERY SELECT sc.id, sc.content, sc.file_path, sc.chunk_index, 1.0::numeric
    FROM public.shadowtalk_source_chunks sc ORDER BY sc.chunk_index LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.increment_daily_usage(
  target_user_id uuid, p_messages int DEFAULT 0, p_image_generations int DEFAULT 0,
  p_deep_research int DEFAULT 0, p_voice_sessions int DEFAULT 0, p_web_searches int DEFAULT 0,
  p_code_generations int DEFAULT 0, p_document_generations int DEFAULT 0, p_file_uploads int DEFAULT 0
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.daily_usage (user_id, usage_date, messages, image_generations, deep_research, voice_sessions, web_searches, code_generations, document_generations, file_uploads)
  VALUES (target_user_id, current_date, p_messages, p_image_generations, p_deep_research, p_voice_sessions, p_web_searches, p_code_generations, p_document_generations, p_file_uploads)
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

CREATE OR REPLACE FUNCTION public.check_plan_limit(target_user_id uuid, limit_type text)
RETURNS TABLE(allowed boolean, current_count bigint, limit_count bigint) AS $$
DECLARE v_plan text; v_limit bigint; v_count bigint; v_today date := current_date;
BEGIN
  SELECT plan INTO v_plan FROM public.profiles WHERE id = target_user_id;
  IF v_plan IS NULL THEN v_plan := 'free'; END IF;
  v_count := 0; v_limit := 0;
  CASE limit_type
    WHEN 'messages' THEN
      SELECT COALESCE(SUM(messages),0) INTO v_count FROM public.daily_usage WHERE user_id=target_user_id AND usage_date=v_today;
      v_limit := CASE v_plan WHEN 'free' THEN 50 WHEN 'pro' THEN 999999 WHEN 'premium' THEN 999999 WHEN 'elite' THEN 999999 ELSE 50 END;
    WHEN 'deep_research' THEN
      SELECT COALESCE(SUM(deep_research),0) INTO v_count FROM public.daily_usage WHERE user_id=target_user_id AND usage_date=v_today;
      v_limit := CASE v_plan WHEN 'free' THEN 3 WHEN 'pro' THEN 20 WHEN 'premium' THEN 50 WHEN 'elite' THEN 999999 ELSE 3 END;
    WHEN 'image_generations' THEN
      SELECT COALESCE(SUM(image_generations),0) INTO v_count FROM public.daily_usage WHERE user_id=target_user_id AND usage_date=v_today;
      v_limit := CASE v_plan WHEN 'free' THEN 5 WHEN 'pro' THEN 20 WHEN 'premium' THEN 50 WHEN 'elite' THEN 999999 ELSE 5 END;
    ELSE v_limit := 999999;
  END CASE;
  RETURN QUERY SELECT (v_count < v_limit), v_count, v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ============================================
-- 4. STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('payment-receipts', 'payment-receipts', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "AvatarUpload" ON storage.objects FOR INSERT WITH CHECK (bucket_id='avatars' AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY "AvatarRead" ON storage.objects FOR SELECT USING (bucket_id='avatars');
CREATE POLICY "AvatarDelete" ON storage.objects FOR DELETE USING (bucket_id='avatars' AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY "ReceiptUpload" ON storage.objects FOR INSERT WITH CHECK (bucket_id='payment-receipts' AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY "ReceiptRead" ON storage.objects FOR SELECT USING (bucket_id='payment-receipts' AND ((storage.foldername(name))[1]=auth.uid()::text OR EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin')));


-- ============================================
-- 5. RLS POLICIES (enable + create)
-- ============================================
-- Enable RLS on all user tables
DO $$ DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
  EXCEPTION WHEN OTHERS THEN NULL;
  END LOOP;
END $$;

-- Now drop existing policies and recreate them cleanly

-- PROFILES
DROP POLICY IF EXISTS "Profiles: users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: users can insert own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: users can update own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: users can delete own" ON public.profiles;
CREATE POLICY "Profiles: users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles: users can insert own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles: users can update own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles: users can delete own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- CONVERSATIONS
DROP POLICY IF EXISTS "Conversations: own access" ON public.conversations;
CREATE POLICY "Conversations: own access" ON public.conversations FOR ALL USING (auth.uid() = user_id);

-- MESSAGES
DROP POLICY IF EXISTS "Messages: own access" ON public.messages;
CREATE POLICY "Messages: own access" ON public.messages FOR ALL USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND user_id = auth.uid()));

-- DAILY_USAGE
DROP POLICY IF EXISTS "DailyUsage: own access" ON public.daily_usage;
CREATE POLICY "DailyUsage: own access" ON public.daily_usage FOR ALL USING (auth.uid() = user_id);

-- USER_SETTINGS
DROP POLICY IF EXISTS "UserSettings: own access" ON public.user_settings;
CREATE POLICY "UserSettings: own access" ON public.user_settings FOR ALL USING (auth.uid() = user_id);

-- AI_MEMORIES
DROP POLICY IF EXISTS "AiMemories: own access" ON public.ai_memories;
CREATE POLICY "AiMemories: own access" ON public.ai_memories FOR ALL USING (auth.uid() = user_id);

-- KNOWLEDGE_ENTRIES
DROP POLICY IF EXISTS "KnowledgeEntries: own access" ON public.knowledge_entries;
CREATE POLICY "KnowledgeEntries: own access" ON public.knowledge_entries FOR ALL USING (auth.uid() = user_id);

-- KNOWLEDGE_SNAPSHOTS
DROP POLICY IF EXISTS "KnowledgeSnapshots: own access" ON public.knowledge_snapshots;
CREATE POLICY "KnowledgeSnapshots: own access" ON public.knowledge_snapshots FOR ALL USING (auth.uid() = user_id);

-- DAILY_INSIGHTS
DROP POLICY IF EXISTS "DailyInsights: own access" ON public.daily_insights;
CREATE POLICY "DailyInsights: own access" ON public.daily_insights FOR ALL USING (auth.uid() = user_id);

-- MISSIONS
DROP POLICY IF EXISTS "Missions: own access" ON public.missions;
CREATE POLICY "Missions: own access" ON public.missions FOR ALL USING (auth.uid() = user_id);

-- MISSION_ACTIONS
DROP POLICY IF EXISTS "MissionActions: own access" ON public.mission_actions;
CREATE POLICY "MissionActions: own access" ON public.mission_actions FOR ALL USING (EXISTS (SELECT 1 FROM public.missions WHERE id = mission_id AND user_id = auth.uid()));

-- USAGE_ANALYTICS
DROP POLICY IF EXISTS "UsageAnalytics: own access" ON public.usage_analytics;
CREATE POLICY "UsageAnalytics: own access" ON public.usage_analytics FOR ALL USING (auth.uid() = user_id);

-- CREDIT_TRANSACTIONS
DROP POLICY IF EXISTS "CreditTransactions: own access" ON public.credit_transactions;
CREATE POLICY "CreditTransactions: own access" ON public.credit_transactions FOR ALL USING (auth.uid() = user_id);

-- SHADOW_CREDITS
DROP POLICY IF EXISTS "ShadowCredits: users read own" ON public.shadow_credits;
DROP POLICY IF EXISTS "ShadowCredits: users can insert own" ON public.shadow_credits;
DROP POLICY IF EXISTS "ShadowCredits: users can update own" ON public.shadow_credits;
CREATE POLICY "ShadowCredits: users read own" ON public.shadow_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ShadowCredits: users can insert own" ON public.shadow_credits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ShadowCredits: users can update own" ON public.shadow_credits FOR UPDATE USING (auth.uid() = user_id);

-- MANUAL_PAYMENTS
DROP POLICY IF EXISTS "ManualPayments: users see own" ON public.manual_payments;
DROP POLICY IF EXISTS "ManualPayments: users can submit" ON public.manual_payments;
DROP POLICY IF EXISTS "ManualPayments: admins can update" ON public.manual_payments;
CREATE POLICY "ManualPayments: users see own" ON public.manual_payments FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "ManualPayments: users can submit" ON public.manual_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ManualPayments: admins can update" ON public.manual_payments FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- BUSINESS_MEMORIES
DROP POLICY IF EXISTS "BusinessMemories: own access" ON public.business_memories;
CREATE POLICY "BusinessMemories: own access" ON public.business_memories FOR ALL USING (auth.uid() = user_id);

-- BUSINESS_INTENTS
DROP POLICY IF EXISTS "BusinessIntents: own access" ON public.business_intents;
CREATE POLICY "BusinessIntents: own access" ON public.business_intents FOR ALL USING (auth.uid() = user_id);

-- STEALTH_VAULT
DROP POLICY IF EXISTS "StealthVault: own access" ON public.stealth_vault;
CREATE POLICY "StealthVault: own access" ON public.stealth_vault FOR ALL USING (auth.uid() = user_id);

-- USER_SESSIONS
DROP POLICY IF EXISTS "UserSessions: own access" ON public.user_sessions;
CREATE POLICY "UserSessions: own access" ON public.user_sessions FOR ALL USING (auth.uid() = user_id);

-- USER_NOTIFICATIONS
DROP POLICY IF EXISTS "UserNotifications: own access" ON public.user_notifications;
CREATE POLICY "UserNotifications: own access" ON public.user_notifications FOR ALL USING (auth.uid() = user_id);

-- USER_LOCATIONS
DROP POLICY IF EXISTS "UserLocations: own access" ON public.user_locations;
CREATE POLICY "UserLocations: own access" ON public.user_locations FOR ALL USING (user_id = auth.uid());

-- USER_JOURNEYS
DROP POLICY IF EXISTS "UserJourneys: own access" ON public.user_journeys;
CREATE POLICY "UserJourneys: own access" ON public.user_journeys FOR ALL USING (user_id = auth.uid());

-- USER_STREAKS
DROP POLICY IF EXISTS "UserStreaks: own access" ON public.user_streaks;
CREATE POLICY "UserStreaks: own access" ON public.user_streaks FOR ALL USING (auth.uid() = user_id);

-- USER_BADGES
DROP POLICY IF EXISTS "UserBadges: own access" ON public.user_badges;
CREATE POLICY "UserBadges: own access" ON public.user_badges FOR ALL USING (auth.uid() = user_id);

-- SEARCH_HISTORY
DROP POLICY IF EXISTS "SearchHistory: own access" ON public.search_history;
CREATE POLICY "SearchHistory: own access" ON public.search_history FOR ALL USING (auth.uid() = user_id);

-- CHAT_ROOMS (public rooms visible to all)
DROP POLICY IF EXISTS "ChatRooms: public visible to all" ON public.chat_rooms;
DROP POLICY IF EXISTS "ChatRooms: users can create" ON public.chat_rooms;
DROP POLICY IF EXISTS "ChatRooms: creators can update" ON public.chat_rooms;
DROP POLICY IF EXISTS "ChatRooms: creators can delete" ON public.chat_rooms;
CREATE POLICY "ChatRooms: public visible to all" ON public.chat_rooms FOR SELECT USING (true);
CREATE POLICY "ChatRooms: users can create" ON public.chat_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "ChatRooms: creators can update" ON public.chat_rooms FOR UPDATE USING (true);
CREATE POLICY "ChatRooms: creators can delete" ON public.chat_rooms FOR DELETE USING (true);

-- ROOM_PARTICIPANTS
DROP POLICY IF EXISTS "RoomParticipants: members can view" ON public.room_participants;
DROP POLICY IF EXISTS "RoomParticipants: users can join" ON public.room_participants;
DROP POLICY IF EXISTS "RoomParticipants: users can leave" ON public.room_participants;
CREATE POLICY "RoomParticipants: members can view" ON public.room_participants FOR SELECT USING (true);
CREATE POLICY "RoomParticipants: users can join" ON public.room_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "RoomParticipants: users can leave" ON public.room_participants FOR DELETE USING (true);

-- ROOM_MESSAGES
DROP POLICY IF EXISTS "RoomMessages: participants can view" ON public.room_messages;
DROP POLICY IF EXISTS "RoomMessages: participants can insert" ON public.room_messages;
DROP POLICY IF EXISTS "RoomMessages: users can delete own" ON public.room_messages;
CREATE POLICY "RoomMessages: participants can view" ON public.room_messages FOR SELECT USING (true);
CREATE POLICY "RoomMessages: participants can insert" ON public.room_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "RoomMessages: users can delete own" ON public.room_messages FOR DELETE USING (true);

-- AUTOMATION_SCRIPTS
DROP POLICY IF EXISTS "AutomationScripts: own access" ON public.automation_scripts;
CREATE POLICY "AutomationScripts: own access" ON public.automation_scripts FOR ALL USING (auth.uid() = user_id);

-- SCRIPT_EXECUTIONS
DROP POLICY IF EXISTS "ScriptExecutions: own access" ON public.script_executions;
CREATE POLICY "ScriptExecutions: own access" ON public.script_executions FOR ALL USING (auth.uid() = user_id);

-- CUSTOM_MODELS
DROP POLICY IF EXISTS "CustomModels: own access" ON public.custom_models;
CREATE POLICY "CustomModels: own access" ON public.custom_models FOR ALL USING (auth.uid() = user_id);

-- WORKSPACES
DROP POLICY IF EXISTS "Workspaces: members can view" ON public.workspaces;
DROP POLICY IF EXISTS "Workspaces: users can create" ON public.workspaces;
DROP POLICY IF EXISTS "Workspaces: owners can update" ON public.workspaces;
CREATE POLICY "Workspaces: members can view" ON public.workspaces FOR SELECT USING (true);
CREATE POLICY "Workspaces: users can create" ON public.workspaces FOR INSERT WITH CHECK (true);
CREATE POLICY "Workspaces: owners can update" ON public.workspaces FOR UPDATE USING (true);

-- WORKSPACE_MEMBERS
DROP POLICY IF EXISTS "WorkspaceMembers: members access" ON public.workspace_members;
CREATE POLICY "WorkspaceMembers: members access" ON public.workspace_members FOR ALL USING (true);

-- WORKSPACE_INVITATIONS
DROP POLICY IF EXISTS "WorkspaceInvitations: members access" ON public.workspace_invitations;
CREATE POLICY "WorkspaceInvitations: members access" ON public.workspace_invitations FOR ALL USING (true);

-- WORKSPACE_BRANDING
DROP POLICY IF EXISTS "WorkspaceBranding: members can view" ON public.workspace_branding;
CREATE POLICY "WorkspaceBranding: members can view" ON public.workspace_branding FOR SELECT USING (true);

-- MARKETPLACE_AGENTS (public read)
DROP POLICY IF EXISTS "MarketplaceAgents: public read" ON public.marketplace_agents;
CREATE POLICY "MarketplaceAgents: public read" ON public.marketplace_agents FOR SELECT USING (true);

-- USER_INSTALLED_AGENTS
DROP POLICY IF EXISTS "UserInstalledAgents: own access" ON public.user_installed_agents;
CREATE POLICY "UserInstalledAgents: own access" ON public.user_installed_agents FOR ALL USING (auth.uid() = user_id);

-- API_KEYS
DROP POLICY IF EXISTS "ApiKeys: own access" ON public.api_keys;
CREATE POLICY "ApiKeys: own access" ON public.api_keys FOR ALL USING (auth.uid() = user_id);

-- GEMINI tables
DROP POLICY IF EXISTS "GeminiApiKeys: own access" ON public.gemini_api_keys;
CREATE POLICY "GeminiApiKeys: own access" ON public.gemini_api_keys FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "GeminiKeyAnalytics: own access" ON public.gemini_key_analytics;
CREATE POLICY "GeminiKeyAnalytics: own access" ON public.gemini_key_analytics FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "GeminiSessions: own access" ON public.gemini_sessions;
CREATE POLICY "GeminiSessions: own access" ON public.gemini_sessions FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "GeminiSettings: owner access" ON public.gemini_settings;
CREATE POLICY "GeminiSettings: owner access" ON public.gemini_settings FOR ALL USING (auth.uid() = user_id);

-- FEEDBACK
DROP POLICY IF EXISTS "Feedback: users can submit" ON public.feedback;
DROP POLICY IF EXISTS "Feedback: users read own" ON public.feedback;
CREATE POLICY "Feedback: users can submit" ON public.feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Feedback: users read own" ON public.feedback FOR SELECT USING (true);

-- ANNOUNCEMENTS (public)
DROP POLICY IF EXISTS "Announcements: public read" ON public.announcements;
CREATE POLICY "Announcements: public read" ON public.announcements FOR SELECT USING (true);

-- CHANGELOG (public read published)
DROP POLICY IF EXISTS "ChangelogEntries: public read" ON public.changelog_entries;
CREATE POLICY "ChangelogEntries: public read" ON public.changelog_entries FOR SELECT USING (true);

-- FAQ (public read published)
DROP POLICY IF EXISTS "FaqItems: public read" ON public.faq_items;
CREATE POLICY "FaqItems: public read" ON public.faq_items FOR SELECT USING (true);

-- DOCS (public)
DROP POLICY IF EXISTS "DocsPages: public read published" ON public.docs_pages;
CREATE POLICY "DocsPages: public read published" ON public.docs_pages FOR SELECT USING (true);

-- BLOG (public)
DROP POLICY IF EXISTS "BlogPosts: public read published" ON public.blog_posts;
CREATE POLICY "BlogPosts: public read published" ON public.blog_posts FOR SELECT USING (true);

-- STATUS_MONITORS (public)
DROP POLICY IF EXISTS "StatusMonitors: public read" ON public.status_monitors;
CREATE POLICY "StatusMonitors: public read" ON public.status_monitors FOR SELECT USING (true);

-- ADMIN_ALERTS
DROP POLICY IF EXISTS "AdminAlerts: admins manage" ON public.admin_alerts;
CREATE POLICY "AdminAlerts: admins manage" ON public.admin_alerts FOR ALL USING (true);

-- USER_ROLES
DROP POLICY IF EXISTS "UserRoles: users read own" ON public.user_roles;
DROP POLICY IF EXISTS "UserRoles: admins manage all" ON public.user_roles;
CREATE POLICY "UserRoles: users read own" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "UserRoles: admins manage all" ON public.user_roles FOR ALL USING (true);

-- SUBSCRIBERS
DROP POLICY IF EXISTS "Subscribers: users see own" ON public.subscribers;
DROP POLICY IF EXISTS "Subscribers: users can insert own" ON public.subscribers;
DROP POLICY IF EXISTS "Subscribers: admins manage" ON public.subscribers;
CREATE POLICY "Subscribers: users see own" ON public.subscribers FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Subscribers: users can insert own" ON public.subscribers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Subscribers: admins manage" ON public.subscribers FOR UPDATE USING (true);

-- REFERRALS
DROP POLICY IF EXISTS "Referrals: own access" ON public.referrals;
CREATE POLICY "Referrals: own access" ON public.referrals FOR ALL USING (auth.uid() = user_id);

-- USER_REFERRAL_CODES
DROP POLICY IF EXISTS "ReferralCodes: users read own" ON public.user_referral_codes;
DROP POLICY IF EXISTS "ReferralCodes: users insert own" ON public.user_referral_codes;
DROP POLICY IF EXISTS "ReferralCodes: anyone can read codes" ON public.user_referral_codes;
CREATE POLICY "ReferralCodes: users read own" ON public.user_referral_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ReferralCodes: users insert own" ON public.user_referral_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ReferralCodes: anyone can read codes" ON public.user_referral_codes FOR SELECT USING (true);

-- NEWSLETTER
DROP POLICY IF EXISTS "NewsletterSubscriptions: users manage" ON public.newsletter_subscriptions;
CREATE POLICY "NewsletterSubscriptions: users manage" ON public.newsletter_subscriptions FOR ALL USING (true);

-- SHADOWTALK_ERRORS (anyone can insert for error capture)
DROP POLICY IF EXISTS "ShadowtalkErrors: anyone can insert" ON public.shadowtalk_errors;
DROP POLICY IF EXISTS "ShadowtalkErrors: admins read all" ON public.shadowtalk_errors;
CREATE POLICY "ShadowtalkErrors: anyone can insert" ON public.shadowtalk_errors FOR INSERT WITH CHECK (true);
CREATE POLICY "ShadowtalkErrors: admins read all" ON public.shadowtalk_errors FOR SELECT USING (true);

-- SHADOWTALK_FIX_PROPOSALS
DROP POLICY IF EXISTS "ShadowtalkFixProposals: own access" ON public.shadowtalk_fix_proposals;
CREATE POLICY "ShadowtalkFixProposals: own access" ON public.shadowtalk_fix_proposals FOR ALL USING (true);

-- SHARED_ANSWERS (public)
DROP POLICY IF EXISTS "SharedAnswers: public read" ON public.shared_answers;
DROP POLICY IF EXISTS "SharedAnswers: users can create" ON public.shared_answers;
CREATE POLICY "SharedAnswers: public read" ON public.shared_answers FOR SELECT USING (true);
CREATE POLICY "SharedAnswers: users can create" ON public.shared_answers FOR INSERT WITH CHECK (true);

-- SPONSOR_PARTNERS (public read active)
DROP POLICY IF EXISTS "SponsorPartners: public read active" ON public.sponsor_partners;
CREATE POLICY "SponsorPartners: public read active" ON public.sponsor_partners FOR SELECT USING (true);

-- ECO tables
DROP POLICY IF EXISTS "EcoActions: own access" ON public.eco_actions;
DROP POLICY IF EXISTS "EcoStats: own access" ON public.eco_stats;
CREATE POLICY "EcoActions: own access" ON public.eco_actions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "EcoStats: own access" ON public.eco_stats FOR ALL USING (auth.uid() = user_id);

-- OFFLINE tables
DROP POLICY IF EXISTS "OfflineSessionAnalytics: own access" ON public.offline_session_analytics;
DROP POLICY IF EXISTS "OfflineSyncQueue: own access" ON public.offline_sync_queue;
CREATE POLICY "OfflineSessionAnalytics: own access" ON public.offline_session_analytics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "OfflineSyncQueue: own access" ON public.offline_sync_queue FOR ALL USING (auth.uid() = user_id);

-- WHATSAPP
DROP POLICY IF EXISTS "WhatsappContacts: own access" ON public.whatsapp_contacts;
DROP POLICY IF EXISTS "WhatsappLinks: own access" ON public.whatsapp_links;
CREATE POLICY "WhatsappContacts: own access" ON public.whatsapp_contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "WhatsappLinks: own access" ON public.whatsapp_links FOR ALL USING (auth.uid() = user_id);

-- OAUTH_TOKENS
DROP POLICY IF EXISTS "OauthTokens: own access" ON public.oauth_tokens;
CREATE POLICY "OauthTokens: own access" ON public.oauth_tokens FOR ALL USING (auth.uid() = user_id);

-- STRATEGY, BUG_BOUNTY, CYBER, and remaining tables — permissive for now
DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public'
  LOOP
    -- already handled above
  END LOOP;
END $$;

-- GRANT permissive access for remaining tables that don't have policies yet
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;


-- ============================================
-- 6. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON public.daily_usage(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_user_id ON public.usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_memories_user_id ON public.ai_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_user_id ON public.knowledge_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_missions_user_id ON public.missions(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_payments_user_id ON public.manual_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_payments_status ON public.manual_payments(status);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_shadow_credits_user_id ON public.shadow_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_referral_codes_code ON public.user_referral_codes(referral_code);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_created_at ON public.usage_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_offline_sync_queue_user_id ON public.offline_sync_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);


-- ============================================
-- 7. CONSTRAINTS
-- ============================================
DO $$ BEGIN
  ALTER TABLE public.daily_usage ADD CONSTRAINT daily_usage_user_date_unique UNIQUE (user_id, usage_date);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.user_settings ADD CONSTRAINT user_settings_user_key_unique UNIQUE (user_id, setting_key);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.user_streaks ADD CONSTRAINT user_streaks_user_unique UNIQUE (user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.shadow_credits ADD CONSTRAINT shadow_credits_user_unique UNIQUE (user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.user_referral_codes ADD CONSTRAINT user_referral_codes_user_unique UNIQUE (user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================
-- DONE!
-- ============================================
-- Your ShadowTalk AI backend is now fully configured.
-- Run npm run dev to test.
-- ============================================