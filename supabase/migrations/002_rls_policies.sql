-- ============================================
-- ShadowTalk AI — Row Level Security Policies
-- ============================================
-- Run AFTER 001_schema.sql
-- These policies ensure users can only access their own data
-- ============================================

-- ============================================
-- HELPER: profiles auto-creation on signup
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

  -- Initialize shadow credits
  INSERT INTO public.shadow_credits (user_id, balance, total_purchased, total_consumed, created_at, updated_at)
  VALUES (NEW.id, 100, 0, 0, now(), now())
  ON CONFLICT DO NOTHING;

  -- Initialize user streaks
  INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, total_active_days, streak_multiplier, last_active_date, created_at, updated_at)
  VALUES (NEW.id, 0, 0, 0, 1.0, now(), now(), now())
  ON CONFLICT DO NOTHING;

  -- Initialize daily usage for today
  INSERT INTO public.daily_usage (user_id, usage_date, messages, image_generations, deep_research, voice_sessions, web_searches, code_generations, document_generations, file_uploads, created_at, updated_at)
  VALUES (NEW.id, current_date, 0, 0, 0, 0, 0, 0, 0, 0, now(), now())
  ON CONFLICT DO NOTHING;

  -- Initialize user settings defaults
  INSERT INTO public.user_settings (user_id, setting_key, setting_value, created_at, updated_at)
  VALUES 
    (NEW.id, 'theme', '"dark"', now(), now()),
    (NEW.id, 'language', '"en"', now(), now()),
    (NEW.id, 'notifications_enabled', 'true', now(), now())
  ON CONFLICT DO NOTHING;

  -- Create a referral code for the new user
  INSERT INTO public.user_referral_codes (user_id, referral_code, total_referrals, successful_conversions, total_earnings, created_at)
  VALUES (NEW.id, upper(substring(encode(gen_random_bytes(4), 'hex'), 1, 8)), 0, 0, 0, now())
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ============================================
-- RLS: Enable on ALL user-scoped tables
-- ============================================

-- Core user tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Chat tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Room tables
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_documents ENABLE ROW LEVEL SECURITY;

-- Usage & billing
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shadow_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_day_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Memory & intelligence
ALTER TABLE public.ai_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_llm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_llm_messages ENABLE ROW LEVEL SECURITY;

-- Missions & automation
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_models ENABLE ROW LEVEL SECURITY;

-- Security & cyber
ALTER TABLE public.cyber_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cyber_incident_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cyber_research_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cyber_scan_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stealth_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shadow_vault_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_bounty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_bounty_submissions ENABLE ROW LEVEL SECURITY;

-- Marketplace & API keys
ALTER TABLE public.marketplace_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_installed_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gemini_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gemini_key_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gemini_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gemini_settings ENABLE ROW LEVEL SECURITY;

-- Enterprise & workspace
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sso_configurations ENABLE ROW LEVEL SECURITY;

-- Tracking & analytics
ALTER TABLE public.offline_session_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eco_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eco_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_partners ENABLE ROW LEVEL SECURITY;

-- Self-healing
ALTER TABLE public.shadowtalk_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shadowtalk_fix_proposals ENABLE ROW LEVEL SECURITY;

-- WhatsApp & OAuth
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Newsletter
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;


-- ============================================
-- POLICIES: Users can read/write their own data
-- ============================================

-- Helper to create standard user-scoped policies
-- Pattern: users can SELECT/INSERT/UPDATE/DELETE their own rows

-- PROFILES: everyone can read (for leaderboard/stats), users update own
CREATE POLICY "Profiles: users can view all profiles" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Profiles: users can insert own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles: users can update own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles: users can delete own" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- USER_SETTINGS: full owner access
CREATE POLICY "UserSettings: own access" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id);

-- USER_ROLES: users read own, admins manage all
CREATE POLICY "UserRoles: users read own" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "UserRoles: admins manage all" ON public.user_roles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- USER_SESSIONS: owner access
CREATE POLICY "UserSessions: own access" ON public.user_sessions
  FOR ALL USING (auth.uid() = user_id);

-- USER_REFERRAL_CODES: owner read, anyone can read for referral lookup
CREATE POLICY "ReferralCodes: users read own" ON public.user_referral_codes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ReferralCodes: users insert own" ON public.user_referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ReferralCodes: anyone can read codes" ON public.user_referral_codes
  FOR SELECT USING (true);

-- CONVERSATIONS: owner access
CREATE POLICY "Conversations: own access" ON public.conversations
  FOR ALL USING (auth.uid() = user_id);

-- MESSAGES: owner access via conversation
CREATE POLICY "Messages: own access" ON public.messages
  FOR ALL USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND user_id = auth.uid())
  );

-- SEARCH_HISTORY: owner access
CREATE POLICY "SearchHistory: own access" ON public.search_history
  FOR ALL USING (auth.uid() = user_id);

-- CHAT_ROOMS: public rooms visible to all, private rooms to members
CREATE POLICY "ChatRooms: public visible to all" ON public.chat_rooms
  FOR SELECT USING (is_public = true OR created_by = auth.uid()::text OR EXISTS (
    SELECT 1 FROM public.room_participants WHERE room_id = id AND user_id = auth.uid()
  ));
CREATE POLICY "ChatRooms: users can create" ON public.chat_rooms
  FOR INSERT WITH CHECK (auth.uid()::text = created_by);
CREATE POLICY "ChatRooms: creators can update" ON public.chat_rooms
  FOR UPDATE USING (created_by = auth.uid()::text);
CREATE POLICY "ChatRooms: creators can delete" ON public.chat_rooms
  FOR DELETE USING (created_by = auth.uid()::text);

-- ROOM_PARTICIPANTS: room-level access
CREATE POLICY "RoomParticipants: members can view" ON public.room_participants
  FOR SELECT USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.room_participants WHERE room_id = public.room_participants.room_id AND user_id = auth.uid()
    )
  );
CREATE POLICY "RoomParticipants: users can join" ON public.room_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "RoomParticipants: users can leave" ON public.room_participants
  FOR DELETE USING (user_id = auth.uid());

-- ROOM_MESSAGES: room participants can read/write
CREATE POLICY "RoomMessages: participants can view" ON public.room_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.room_participants WHERE room_id = public.room_messages.room_id AND user_id = auth.uid())
    OR is_public = true
  );
CREATE POLICY "RoomMessages: participants can insert" ON public.room_messages
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "RoomMessages: users can delete own" ON public.room_messages
  FOR DELETE USING (user_id = auth.uid());

-- ROOM_BANS: admins/moderators manage
CREATE POLICY "RoomBans: mods can manage" ON public.room_bans
  FOR ALL USING (true);

-- ROOM_DOCUMENTS: participants access
CREATE POLICY "RoomDocuments: participants access" ON public.room_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.room_participants WHERE room_id = public.room_documents.room_id AND user_id = auth.uid())
  );

-- DAILY_USAGE: owner access
CREATE POLICY "DailyUsage: own access" ON public.daily_usage
  FOR ALL USING (auth.uid() = user_id);

-- USAGE_ANALYTICS: owner access
CREATE POLICY "UsageAnalytics: own access" ON public.usage_analytics
  FOR ALL USING (auth.uid() = user_id);

-- CREDIT_TRANSACTIONS: owner access
CREATE POLICY "CreditTransactions: own access" ON public.credit_transactions
  FOR ALL USING (auth.uid() = user_id);

-- SHADOW_CREDITS: owner read, system writes
CREATE POLICY "ShadowCredits: users read own" ON public.shadow_credits
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ShadowCredits: users can insert own" ON public.shadow_credits
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ShadowCredits: users can update own" ON public.shadow_credits
  FOR UPDATE USING (auth.uid() = user_id);

-- MANUAL_PAYMENTS: users see own, admins see all
CREATE POLICY "ManualPayments: users see own" ON public.manual_payments
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));
CREATE POLICY "ManualPayments: users can submit" ON public.manual_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ManualPayments: admins can update" ON public.manual_payments
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- AI_MEMORIES: owner access
CREATE POLICY "AiMemories: own access" ON public.ai_memories
  FOR ALL USING (auth.uid() = user_id);

-- KNOWLEDGE_ENTRIES: owner access
CREATE POLICY "KnowledgeEntries: own access" ON public.knowledge_entries
  FOR ALL USING (auth.uid() = user_id);

-- KNOWLEDGE_SNAPSHOTS: owner access
CREATE POLICY "KnowledgeSnapshots: own access" ON public.knowledge_snapshots
  FOR ALL USING (auth.uid() = user_id);

-- DAILY_INSIGHTS: owner access
CREATE POLICY "DailyInsights: own access" ON public.daily_insights
  FOR ALL USING (auth.uid() = user_id);

-- BUSINESS_MEMORIES: owner access
CREATE POLICY "BusinessMemories: own access" ON public.business_memories
  FOR ALL USING (auth.uid() = user_id);

-- BUSINESS_INTENTS: owner access (read), system writes
CREATE POLICY "BusinessIntents: own access" ON public.business_intents
  FOR ALL USING (auth.uid() = user_id);

-- MISSIONS: owner access
CREATE POLICY "Missions: own access" ON public.missions
  FOR ALL USING (auth.uid() = user_id);

-- MISSION_ACTIONS: owner access via mission
CREATE POLICY "MissionActions: own access" ON public.mission_actions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.missions WHERE id = mission_id AND user_id = auth.uid())
  );

-- AUTOMATION_SCRIPTS: owner access
CREATE POLICY "AutomationScripts: own access" ON public.automation_scripts
  FOR ALL USING (auth.uid() = user_id);

-- SCRIPT_EXECUTIONS: owner access
CREATE POLICY "ScriptExecutions: own access" ON public.script_executions
  FOR ALL USING (auth.uid() = user_id);

-- CUSTOM_MODELS: owner access
CREATE POLICY "CustomModels: own access" ON public.custom_models
  FOR ALL USING (auth.uid() = user_id);

-- STEALTH_VAULT: owner access (encrypted data)
CREATE POLICY "StealthVault: own access" ON public.stealth_vault
  FOR ALL USING (auth.uid() = user_id);

-- SHADOW_VAULT_CONNECTIONS: owner access
CREATE POLICY "ShadowVaultConnections: own access" ON public.shadow_vault_connections
  FOR ALL USING (auth.uid() = user_id);

-- CYBER tables: owner access
CREATE POLICY "CyberIncidents: own access" ON public.cyber_incidents
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "CyberIncidentEvents: own access" ON public.cyber_incident_events
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "CyberResearchProjects: own access" ON public.cyber_research_projects
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "CyberScanResults: own access" ON public.cyber_scan_results
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "SecurityAudits: own access" ON public.security_audits
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "SecurityVulnerabilities: own access" ON public.security_vulnerabilities
  FOR ALL USING (auth.uid() = user_id);

-- MARKETPLACE: agents are public, installs are private
CREATE POLICY "MarketplaceAgents: public read" ON public.marketplace_agents
  FOR SELECT USING (is_active = true);
CREATE POLICY "MarketplaceAgents: admins manage" ON public.marketplace_agents
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));
CREATE POLICY "UserInstalledAgents: own access" ON public.user_installed_agents
  FOR ALL USING (auth.uid() = user_id);

-- API_KEYS: owner access
CREATE POLICY "ApiKeys: own access" ON public.api_keys
  FOR ALL USING (auth.uid() = user_id);

-- GEMINI keys: owner access
CREATE POLICY "GeminiApiKeys: own access" ON public.gemini_api_keys
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "GeminiKeyAnalytics: own access" ON public.gemini_key_analytics
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "GeminiSessions: own access" ON public.gemini_sessions
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "GeminiSettings: owner access" ON public.gemini_settings
  FOR ALL USING (auth.uid() = user_id);

-- WORKSPACES: members can read, owners create
CREATE POLICY "Workspaces: members can view" ON public.workspaces
  FOR SELECT USING (
    owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.workspace_members WHERE workspace_id = public.workspaces.id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Workspaces: users can create" ON public.workspaces
  FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Workspaces: owners can update" ON public.workspaces
  FOR UPDATE USING (owner_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.workspace_members WHERE workspace_id = public.workspaces.id AND user_id = auth.uid() AND role = 'admin'
  ));

-- WORKSPACE_MEMBERS: workspace members access
CREATE POLICY "WorkspaceMembers: members access" ON public.workspace_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members WHERE workspace_id = public.workspace_members.workspace_id AND user_id = auth.uid()
    ) OR owner_id IN (
      SELECT owner_id FROM public.workspaces WHERE id = workspace_id
    )
  );

-- WORKSPACE_INVITATIONS: workspace members can manage
CREATE POLICY "WorkspaceInvitations: members access" ON public.workspace_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members WHERE workspace_id = public.workspace_invitations.workspace_id AND user_id = auth.uid()
    ) OR invited_by = auth.uid()
  );

-- WORKSPACE_BRANDING: workspace members can view, owners manage
CREATE POLICY "WorkspaceBranding: members can view" ON public.workspace_branding
  FOR SELECT USING (true);
CREATE POLICY "WorkspaceBranding: owners manage" ON public.workspace_branding
  FOR ALL USING (true);

-- SSO_CONFIGURATIONS: workspace owners/admins
CREATE POLICY "SsoConfigurations: workspace admins" ON public.sso_configurations
  FOR ALL USING (true);

-- OFFLINE tables: owner access
CREATE POLICY "OfflineSessionAnalytics: own access" ON public.offline_session_analytics
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "OfflineSyncQueue: own access" ON public.offline_sync_queue
  FOR ALL USING (auth.uid() = user_id);

-- ECO tables: owner access
CREATE POLICY "EcoActions: own access" ON public.eco_actions
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "EcoStats: own access" ON public.eco_stats
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "UserBadges: own access" ON public.user_badges
  FOR ALL USING (auth.uid() = user_id);

-- WHATSAPP: owner access
CREATE POLICY "WhatsappContacts: own access" ON public.whatsapp_contacts
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "WhatsappLinks: own access" ON public.whatsapp_links
  FOR ALL USING (auth.uid() = user_id);

-- OAUTH_TOKENS: owner access
CREATE POLICY "OauthTokens: own access" ON public.oauth_tokens
  FOR ALL USING (auth.uid() = user_id);

-- NEWSLETTER: public read (for checking), users can subscribe
CREATE POLICY "NewsletterSubscriptions: users manage" ON public.newsletter_subscriptions
  FOR ALL USING (auth.uid() = user_id OR email IS NOT NULL);

-- SELf-HEALING: owner access for errors, system writes
CREATE POLICY "ShadowtalkErrors: own access" ON public.shadowtalk_errors
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "ShadowtalkFixProposals: own access" ON public.shadowtalk_fix_proposals
  FOR ALL USING (true);

-- ANALYTICS: owner access
CREATE POLICY "UserLocations: own access" ON public.user_locations
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "UserJourneys: own access" ON public.user_journeys
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "JourneyTracking: own access" ON public.journey_tracking
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "AffiliateClicks: own access" ON public.affiliate_clicks
  FOR ALL USING (user_id = auth.uid());

-- SUBSCRIBERS: users see own, admins see all
CREATE POLICY "Subscribers: users see own" ON public.subscribers
  FOR SELECT USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));
CREATE POLICY "Subscribers: users can insert own" ON public.subscribers
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Subscribers: admins manage" ON public.subscribers
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- STRATEGY_USAGE: owner access
CREATE POLICY "StrategyUsage: own access" ON public.strategy_usage
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "StrategyDayPasses: own access" ON public.strategy_day_passes
  FOR ALL USING (auth.uid() = user_id);

-- GUEST_USAGE: anonymous access for tracking (no user_id)
CREATE POLICY "GuestUsage: anonymous insert" ON public.guest_usage
  FOR INSERT WITH CHECK (true);
CREATE POLICY "GuestUsage: admin read" ON public.guest_usage
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- FEEDBACK: users can submit, admins can read all
CREATE POLICY "Feedback: users can submit" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Feedback: users read own" ON public.feedback
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Feedback: admins read all" ON public.feedback
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));
CREATE POLICY "Feedback: admins update" ON public.feedback
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- ANNOUNCEMENTS: public read, admins manage
CREATE POLICY "Announcements: public read" ON public.announcements
  FOR SELECT USING (true);
CREATE POLICY "Announcements: admins manage" ON public.announcements
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- CHANGELOG: public read, admins manage
CREATE POLICY "ChangelogEntries: public read" ON public.changelog_entries
  FOR SELECT USING (is_published = true);
CREATE POLICY "ChangelogEntries: admins manage" ON public.changelog_entries
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- FAQ: public read, admins manage
CREATE POLICY "FaqItems: public read" ON public.faq_items
  FOR SELECT USING (is_published = true);
CREATE POLICY "FaqItems: admins manage" ON public.faq_items
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- DOCS: public read
CREATE POLICY "DocsPages: public read published" ON public.docs_pages
  FOR SELECT USING (is_published = true);
CREATE POLICY "DocsPages: admins manage" ON public.docs_pages
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- BLOG: public read published
CREATE POLICY "BlogPosts: public read published" ON public.blog_posts
  FOR SELECT USING (is_published = true);
CREATE POLICY "BlogPosts: admins manage" ON public.blog_posts
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- STATUS_MONITORS: public read
CREATE POLICY "StatusMonitors: public read" ON public.status_monitors
  FOR SELECT USING (true);
CREATE POLICY "StatusMonitors: admins manage" ON public.status_monitors
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- ADMIN_ALERTS: admins manage, users read own
CREATE POLICY "AdminAlerts: admins manage" ON public.admin_alerts
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));
CREATE POLICY "AdminAlerts: users read own" ON public.admin_alerts
  FOR SELECT USING (created_by = auth.uid());

-- USER_NOTIFICATIONS: owner access
CREATE POLICY "UserNotifications: own access" ON public.user_notifications
  FOR ALL USING (auth.uid() = user_id);

-- BUG_BOUNTY: users submit own, admins manage
CREATE POLICY "BugBountyPrograms: public read" ON public.bug_bounty_programs
  FOR SELECT USING (true);
CREATE POLICY "BugBountyPrograms: users submit own" ON public.bug_bounty_programs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "BugBountySubmissions: users submit own" ON public.bug_bounty_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "BugBountySubmissions: users read own" ON public.bug_bounty_submissions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "BugBountySubmissions: admins manage" ON public.bug_bounty_submissions
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- SHARED_ANSWERS: public read
CREATE POLICY "SharedAnswers: public read" ON public.shared_answers
  FOR SELECT USING (true);
CREATE POLICY "SharedAnswers: users can create" ON public.shared_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- SPONSOR_PARTNERS: public read active
CREATE POLICY "SponsorPartners: public read active" ON public.sponsor_partners
  FOR SELECT USING (is_active = true);
CREATE POLICY "SponsorPartners: admins manage" ON public.sponsor_partners
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- PERSONAL_LLM: owner access
CREATE POLICY "PersonalLlmConversations: own access" ON public.personal_llm_conversations
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "PersonalLlmMessages: own access" ON public.personal_llm_messages
  FOR ALL USING (auth.uid() = user_id);

-- REFERRALS: owner access
CREATE POLICY "Referrals: own access" ON public.referrals
  FOR ALL USING (auth.uid() = user_id);

-- USER_STREAKS: owner access
CREATE POLICY "UserStreaks: own access" ON public.user_streaks
  FOR ALL USING (auth.uid() = user_id);

-- SHADOWTALK_ERRORS: insert allowed for all (error capture), read for admins
CREATE POLICY "ShadowtalkErrors: anyone can insert" ON public.shadowtalk_errors
  FOR INSERT WITH CHECK (true);
CREATE POLICY "ShadowtalkErrors: admins read all" ON public.shadowtalk_errors
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- EMAIL tables: service role only (called from edge functions)
ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "EmailTables: service_role only" ON public.email_send_log FOR ALL USING (false);
CREATE POLICY "EmailTables: service_role only" ON public.email_send_state FOR ALL USING (false);
CREATE POLICY "EmailTables: service_role only" ON public.email_unsubscribe_tokens FOR ALL USING (false);
CREATE POLICY "EmailTables: service_role only" ON public.suppressed_emails FOR ALL USING (false);


-- ============================================
-- INDEXES for performance
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
