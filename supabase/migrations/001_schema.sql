-- ============================================
-- ShadowTalk AI — Supabase Database Schema
-- Generated from src/integrations/local/types.ts
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');

-- ============================================
-- STORAGE BUCKETS (create via Supabase Dashboard or SQL)
-- ============================================
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
-- insert into storage.buckets (id, name, public) values ('payment-receipts', 'payment-receipts', false);

CREATE TABLE public.api_keys (
    created_at timestamptz,
    expires_at timestamptz,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    is_active boolean,
    key_hash text NOT NULL,
    key_prefix text NOT NULL,
    last_used_at timestamptz,
    name text NOT NULL,
    permissions jsonb,
    rate_limit numeric,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id text
);

CREATE TABLE public.chat_rooms (
    banned_users text[],
    created_at timestamptz DEFAULT now(),
    created_by text,
    description text,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    is_public boolean,
    max_participants numeric,
    name text NOT NULL,
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.conversations (
    created_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text,
    updated_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.credit_transactions (
    amount numeric NOT NULL,
    created_at timestamptz DEFAULT now(),
    description text,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    metadata jsonb,
    session_type text,
    transaction_type text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.daily_usage (
    code_generations numeric NOT NULL,
    created_at timestamptz DEFAULT now(),
    deep_research numeric NOT NULL,
    document_generations numeric NOT NULL,
    file_uploads numeric NOT NULL,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    image_generations numeric NOT NULL,
    messages numeric NOT NULL,
    updated_at timestamptz DEFAULT now(),
    usage_date timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    voice_sessions numeric NOT NULL,
    web_searches numeric NOT NULL
);

CREATE TABLE public.manual_payments (
    amount numeric NOT NULL,
    created_at timestamptz DEFAULT now(),
    currency text NOT NULL,
    email text NOT NULL,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text,
    notes text,
    payment_method text NOT NULL,
    phone text,
    plan_type text NOT NULL,
    receipt_url text,
    status text NOT NULL,
    transaction_reference text,
    updated_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    verified_at timestamptz,
    verified_by text
);

CREATE TABLE public.messages (
    content text NOT NULL,
    conversation_id text NOT NULL,
    created_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    personality text,
    role text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.oauth_tokens (
    access_token text NOT NULL,
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    provider text NOT NULL,
    refresh_token text,
    scope text,
    updated_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.profiles (
    avatar_url text,
    bio text,
    created_at timestamptz DEFAULT now(),
    display_name text,
    email text,
    id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    notification_email boolean,
    notification_mentions boolean,
    notification_push boolean,
    plan text NOT NULL DEFAULT 'free',
    stripe_customer_id text,
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.room_bans (
    banned_at timestamptz DEFAULT now(),
    banned_by text NOT NULL,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    reason text,
    room_id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.room_documents (
    content text NOT NULL,
    created_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    last_edited_by text,
    room_id text NOT NULL,
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.room_messages (
    content text NOT NULL,
    created_at timestamptz DEFAULT now(),
    display_name text,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    role text NOT NULL,
    room_id text,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.room_participants (
    display_name text,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    joined_at timestamptz DEFAULT now(),
    room_id text,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.shadow_credits (
    balance numeric NOT NULL,
    created_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    total_consumed numeric NOT NULL,
    total_purchased numeric NOT NULL,
    updated_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.subscribers (
    created_at timestamptz DEFAULT now(),
    email text NOT NULL,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_customer_id text,
    subscribed boolean,
    subscription_end text,
    subscription_tier text,
    updated_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.usage_analytics (
    action_type text NOT NULL,
    created_at timestamptz DEFAULT now(),
    feature_used text,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    metadata jsonb,
    query_category text,
    tokens_used numeric,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.user_referral_codes (
    created_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    referral_code text NOT NULL,
    successful_conversions numeric,
    total_earnings numeric,
    total_referrals numeric,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.user_roles (
    created_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    role text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.user_sessions (
    city text,
    country text,
    created_at timestamptz DEFAULT now(),
    device_label text,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_hash text,
    is_current boolean NOT NULL,
    last_seen_at timestamptz DEFAULT now(),
    revoked_at timestamptz,
    session_token text NOT NULL,
    updated_at timestamptz DEFAULT now(),
    user_agent text,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.user_settings (
    created_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key text NOT NULL,
    setting_value jsonb NOT NULL,
    updated_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================
-- MEMORY & INTELLIGENCE TABLES
-- ============================================
CREATE TABLE public.ai_memories (
    category text NOT NULL,
    confidence numeric NOT NULL,
    content text NOT NULL,
    created_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    last_referenced_at timestamptz DEFAULT now(),
    source text NOT NULL,
    times_referenced numeric NOT NULL,
    updated_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.business_intents (
    country text,
    created_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    industry text,
    intent_category text NOT NULL,
    intent_keywords text[],
    query_summary text,
    region text
);

CREATE TABLE public.business_memories (
    category text NOT NULL,
    content text NOT NULL,
    created_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    is_active boolean,
    priority numeric,
    title text NOT NULL,
    updated_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.daily_insights (
    category text NOT NULL,
    content text NOT NULL,
    expires_at timestamptz,
    generated_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    is_pinned boolean NOT NULL,
    is_read boolean NOT NULL,
    metadata jsonb,
    source text NOT NULL,
    title text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.knowledge_entries (
    access_count numeric NOT NULL,
    connections text[],
    content text NOT NULL,
    created_at timestamptz DEFAULT now(),
    entry_type text NOT NULL,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    last_accessed_at timestamptz,
    source_conversation_id text,
    source_message_id text,
    tags text[],
    title text NOT NULL,
    updated_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.knowledge_snapshots (
    checksum text,
    created_at timestamptz DEFAULT now(),
    entity_count numeric NOT NULL,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    relationship_count numeric NOT NULL,
    snapshot_data jsonb NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    version numeric NOT NULL
);

CREATE TABLE public.personal_llm_conversations (
    created_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    message_count numeric,
    model_used text,
    system_prompt text,
    title text,
    total_tokens numeric,
    updated_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.personal_llm_messages (
    content text NOT NULL,
    conversation_id text NOT NULL,
    created_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    role text NOT NULL,
    tokens numeric,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.search_history (
    created_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    query text NOT NULL,
    results_count numeric,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.user_streaks (
    created_at timestamptz DEFAULT now(),
    current_streak numeric NOT NULL,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    last_active_date timestamptz DEFAULT now(),
    longest_streak numeric NOT NULL,
    streak_multiplier numeric NOT NULL,
    total_active_days numeric NOT NULL,
    updated_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================
-- MISSIONS & AUTOMATION TABLES
-- ============================================
CREATE TABLE public.automation_scripts (
    created_at timestamptz,
    description text,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    is_active boolean,
    last_run_at timestamptz,
    name text NOT NULL,
    run_count numeric,
    script_code text NOT NULL,
    trigger_config jsonb,
    trigger_type text NOT NULL,
    updated_at timestamptz,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.custom_models (
    config jsonb NOT NULL,
    created_at timestamptz,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    is_active boolean,
    name text NOT NULL,
    training_examples jsonb,
    updated_at timestamptz,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.mission_actions (
    action_name text NOT NULL,
    action_type text NOT NULL,
    approved_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    duration_ms numeric,
    error_message text,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    input_data jsonb,
    mission_id text NOT NULL,
    output_data jsonb,
    requires_approval boolean NOT NULL,
    started_at timestamptz,
    status text NOT NULL,
    tool_id text,
    tool_name text,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.missions (
    actual_duration_ms numeric,
    auto_approve boolean NOT NULL,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    current_step numeric,
    description text,
    error_message text,
    estimated_duration_ms numeric,
    goal text NOT NULL,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    max_retries numeric NOT NULL,
    notify_on_complete boolean NOT NULL,
    priority numeric NOT NULL,
    progress numeric NOT NULL,
    result jsonb,
    retry_count numeric NOT NULL,
    scheduled_at timestamptz,
    started_at timestamptz,
    status text NOT NULL,
    steps jsonb NOT NULL,
    title text NOT NULL,
    updated_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.script_executions (
    completed_at timestamptz,
    error text,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    output jsonb,
    script_id text NOT NULL,
    started_at timestamptz,
    status text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================
-- PAYMENT & SUBSCRIPTION TABLES
-- ============================================
CREATE TABLE public.referrals (
    commission_amount numeric,
    commission_paid boolean,
    converted_at timestamptz,
    created_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    paid_at timestamptz,
    referral_code text NOT NULL,
    referred_email text NOT NULL,
    referred_email_masked text,
    referred_user_id text,
    referrer_id text NOT NULL,
    status text NOT NULL
);

CREATE TABLE public.strategy_day_passes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_method text NOT NULL,
    purchased_at timestamptz DEFAULT now(),
    status text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    valid_until text NOT NULL
);

CREATE TABLE public.strategy_usage (
    business_name text NOT NULL,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    industry text,
    report_type text NOT NULL,
    used_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================
-- SECURITY & CYBER TABLES
-- ============================================
CREATE TABLE public.bug_bounty_programs (
    created_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    max_bounty numeric,
    notes text,
    platform text NOT NULL,
    program_name text NOT NULL,
    program_url text,
    scope text,
    status text NOT NULL,
    updated_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.bug_bounty_submissions (
    bounty_amount numeric,
    created_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    notes text,
    program_id text,
    report_url text,
    resolved_at timestamptz,
    severity text NOT NULL,
    status text NOT NULL,
    submitted_at timestamptz DEFAULT now(),
    title text NOT NULL,
    updated_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vulnerability_type text NOT NULL
);

CREATE TABLE public.cyber_ai_chats (
    context text,
    created_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    messages jsonb NOT NULL,
    title text,
    updated_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.cyber_incident_events (
    created_at timestamptz DEFAULT now(),
    event_description text NOT NULL,
    event_time text NOT NULL,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_id text NOT NULL,
    mitre_tactic text,
    severity text NOT NULL,
    source text,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.cyber_incidents (
    created_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    severity text NOT NULL,
    status text NOT NULL,
    title text NOT NULL,
    updated_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.cyber_research_projects (
    created_at timestamptz DEFAULT now(),
    estimated_bounty numeric,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    notes text,
    progress numeric,
    project_code text NOT NULL,
    status text NOT NULL,
    target text NOT NULL,
    updated_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vulnerability_type text NOT NULL
);

CREATE TABLE public.cyber_scan_results (
    completed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    files_found numeric,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    results jsonb,
    risk_score numeric,
    scan_depth text NOT NULL,
    started_at timestamptz,
    status text NOT NULL,
    target_url text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vulnerabilities_found numeric
);

CREATE TABLE public.security_audits (
    compliance_scores jsonb,
    created_at timestamptz DEFAULT now(),
    critical_count numeric NOT NULL,
    dependencies_vulnerable numeric NOT NULL,
    files_scanned numeric NOT NULL,
    high_count numeric NOT NULL,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    info_count numeric NOT NULL,
    low_count numeric NOT NULL,
    medium_count numeric NOT NULL,
    project_name text NOT NULL,
    risk_score numeric NOT NULL,
    scan_mode text NOT NULL,
    secrets_found numeric NOT NULL,
    summary text,
    total_vulnerabilities numeric NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.security_vulnerabilities (
    affected_files text[],
    attack_chain text[],
    audit_id text NOT NULL,
    category text NOT NULL,
    code_fix text,
    compliance_mappings jsonb,
    created_at timestamptz DEFAULT now(),
    cvss_score numeric,
    cwe_id text,
    description text,
    exploit text,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    is_dependency boolean,
    is_secret boolean,
    location text,
    remediation text,
    severity text NOT NULL,
    title text NOT NULL
);

CREATE TABLE public.shadow_vault_connections (
    access_token_encrypted text,
    created_at timestamptz DEFAULT now(),
    credentials_encrypted text,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    is_active boolean NOT NULL,
    is_connected boolean NOT NULL,
    iv text,
    last_sync_at timestamptz,
    last_used_at timestamptz,
    permissions jsonb,
    refresh_token_encrypted text,
    salt text,
    scopes text[],
    service_name text NOT NULL,
    service_type text NOT NULL,
    sync_status text,
    token_expires_at timestamptz,
    updated_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.stealth_vault (
    category text,
    content_encrypted text NOT NULL,
    created_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    iv text NOT NULL,
    salt text NOT NULL,
    title_encrypted text NOT NULL,
    updated_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.threat_actors (
    activity_status text NOT NULL,
    created_at timestamptz DEFAULT now(),
    description text,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    last_seen_at timestamptz,
    name text NOT NULL,
    origin_country text,
    origin_flag text,
    targets text,
    ttps_count numeric NOT NULL,
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.threat_intel_cves (
    attack_complexity text,
    attack_vector text,
    auth_required text,
    created_at timestamptz DEFAULT now(),
    cve_id text NOT NULL,
    cvss_score numeric NOT NULL,
    description text NOT NULL,
    exploit_available boolean NOT NULL,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product text NOT NULL,
    published_at timestamptz DEFAULT now(),
    severity text NOT NULL,
    updated_at timestamptz DEFAULT now()
);

-- ============================================
-- MARKETPLACE & AGENTS
-- ============================================
CREATE TABLE public.gemini_api_keys (
    auto_disabled boolean,
    created_at timestamptz DEFAULT now(),
    disabled_reason text,
    exhaustion_count numeric NOT NULL,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    is_exhausted boolean NOT NULL,
    key_string text NOT NULL,
    last_exhausted_at timestamptz,
    updated_at timestamptz DEFAULT now(),
    usage_count numeric NOT NULL
);

CREATE TABLE public.gemini_key_analytics (
    created_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    key_id text NOT NULL,
    request_count numeric NOT NULL,
    response_time_ms numeric,
    session_id text NOT NULL,
    tokens_used numeric,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    was_exhausted boolean NOT NULL
);

CREATE TABLE public.gemini_sessions (
    created_at timestamptz DEFAULT now(),
    history jsonb NOT NULL,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id text NOT NULL,
    updated_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.gemini_settings (
    created_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key text NOT NULL,
    setting_value text NOT NULL,
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.marketplace_agents (
    author text NOT NULL,
    author_id text,
    category text NOT NULL,
    created_at timestamptz DEFAULT now(),
    description text NOT NULL,
    downloads numeric NOT NULL,
    icon text NOT NULL,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    is_active boolean NOT NULL,
    name text NOT NULL,
    price text NOT NULL,
    rating numeric NOT NULL,
    tags text[] NOT NULL,
    updated_at timestamptz DEFAULT now(),
    verified boolean NOT NULL
);

CREATE TABLE public.user_installed_agents (
    agent_id text NOT NULL,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    installed_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================
-- ENTERPRISE & WORKSPACE TABLES
-- ============================================
CREATE TABLE public.sso_configurations (
    authorization_url text,
    certificate text,
    client_id text,
    client_secret_encrypted text,
    created_at timestamptz,
    entity_id text,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    is_active boolean,
    issuer_url text,
    provider text NOT NULL,
    sso_url text,
    token_url text,
    updated_at timestamptz,
    user_info_url text,
    workspace_id text NOT NULL
);

CREATE TABLE public.workspace_branding (
    accent_color text,
    app_name text NOT NULL,
    background_color text,
    border_radius text,
    created_at timestamptz,
    custom_domain text,
    favicon_url text,
    font_family text,
    foreground_color text,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    logo_url text,
    primary_color text,
    secondary_color text,
    tagline text,
    updated_at timestamptz,
    workspace_id text NOT NULL
);

CREATE TABLE public.workspace_invitations (
    accepted_at timestamptz,
    created_at timestamptz,
    email text NOT NULL,
    expires_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    invited_by text NOT NULL,
    role text NOT NULL,
    token text NOT NULL,
    workspace_id text NOT NULL
);

CREATE TABLE public.workspace_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    joined_at timestamptz,
    role text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id text NOT NULL
);

-- ============================================
-- CMS, CONTENT & NOTIFICATIONS
-- ============================================
CREATE TABLE public.admin_alerts (
    alert_type text NOT NULL,
    created_by text,
    dismissed_at timestamptz,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    is_dismissed boolean,
    is_read boolean,
    message text NOT NULL,
    metadata jsonb,
    read_at timestamptz,
    severity text NOT NULL,
    title text NOT NULL,
    triggered_at timestamptz DEFAULT now()
);

CREATE TABLE public.announcements (
    created_at timestamptz DEFAULT now(),
    created_by text NOT NULL,
    ends_at timestamptz,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    is_active boolean NOT NULL,
    message text NOT NULL,
    starts_at timestamptz DEFAULT now(),
    title text NOT NULL,
    type text NOT NULL,
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.blog_posts (
    author text NOT NULL,
    category text NOT NULL,
    content text NOT NULL,
    cover_image_url text,
    created_at timestamptz DEFAULT now(),
    created_by text,
    excerpt text,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    is_published boolean NOT NULL,
    published_at timestamptz,
    read_time_minutes numeric,
    slug text NOT NULL,
    tags text[],
    title text NOT NULL,
    updated_at timestamptz DEFAULT now(),
    views_count numeric
);

CREATE TABLE public.changelog_entries (
    change_type text NOT NULL,
    created_at timestamptz DEFAULT now(),
    created_by text,
    description text NOT NULL,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    is_published boolean NOT NULL,
    published_at timestamptz,
    tags text[],
    title text NOT NULL,
    updated_at timestamptz DEFAULT now(),
    version text NOT NULL
);

CREATE TABLE public.docs_pages (
    category text NOT NULL,
    content text NOT NULL,
    created_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    is_published boolean NOT NULL,
    parent_id text,
    slug text NOT NULL,
    sort_order numeric,
    title text NOT NULL,
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.faq_items (
    answer text NOT NULL,
    category text NOT NULL,
    created_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    is_published boolean NOT NULL,
    question text NOT NULL,
    sort_order numeric,
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.feedback (
    category text NOT NULL,
    created_at timestamptz DEFAULT now(),
    email text,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    message text NOT NULL,
    rating numeric,
    status text NOT NULL,
    updated_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.newsletter_subscriptions (
    email text NOT NULL,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    is_active boolean NOT NULL,
    source text,
    subscribed_at timestamptz DEFAULT now(),
    unsubscribed_at timestamptz
);

CREATE TABLE public.shared_answers (
    answer text NOT NULL,
    created_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    model text,
    prompt text NOT NULL,
    slug text NOT NULL,
    source text NOT NULL,
    title text,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    views numeric NOT NULL
);

CREATE TABLE public.status_monitors (
    created_at timestamptz DEFAULT now(),
    description text,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    is_active boolean NOT NULL,
    last_checked_at timestamptz,
    last_incident_at timestamptz,
    service_name text NOT NULL,
    sort_order numeric,
    status text NOT NULL,
    updated_at timestamptz DEFAULT now(),
    uptime_percentage numeric
);

CREATE TABLE public.user_notifications (
    action_url text,
    created_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    is_read boolean NOT NULL,
    message text NOT NULL,
    metadata jsonb,
    title text NOT NULL,
    type text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================
-- ANALYTICS & TRACKING TABLES
-- ============================================
CREATE TABLE public.affiliate_clicks (
    clicked_at timestamptz DEFAULT now(),
    commission_earned numeric,
    converted boolean,
    converted_at timestamptz,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id text,
    session_id text,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.eco_actions (
    category text NOT NULL,
    co2_saved numeric NOT NULL,
    completed_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    description text,
    energy_saved numeric NOT NULL,
    eroi numeric NOT NULL,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    money_saved numeric NOT NULL,
    title text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    water_saved numeric NOT NULL
);

CREATE TABLE public.eco_stats (
    actions_completed numeric NOT NULL,
    co2_saved numeric NOT NULL,
    created_at timestamptz DEFAULT now(),
    energy_saved numeric NOT NULL,
    high_eroi_actions numeric NOT NULL,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    last_action_date timestamptz,
    level numeric NOT NULL,
    money_saved numeric NOT NULL,
    streak numeric NOT NULL,
    updated_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    water_saved numeric NOT NULL,
    xp numeric NOT NULL
);

CREATE TABLE public.guest_usage (
    chats numeric NOT NULL,
    created_at timestamptz DEFAULT now(),
    deep_research numeric NOT NULL,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    images numeric NOT NULL,
    ip_address text,
    last_reset text NOT NULL,
    session_id text NOT NULL
);

CREATE TABLE public.journey_tracking (
    completed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id text,
    step_data jsonb,
    step_name text NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.offline_session_analytics (
    created_at timestamptz DEFAULT now(),
    device_type text,
    duration_ms numeric,
    features_used text[],
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    messages_sent numeric NOT NULL,
    metadata jsonb,
    model_used text,
    session_end text,
    session_start text NOT NULL,
    synced_at timestamptz,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    was_synced boolean NOT NULL
);

CREATE TABLE public.offline_sync_queue (
    created_at timestamptz DEFAULT now(),
    device_id text,
    error_message text,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    max_retries numeric NOT NULL,
    operation_data jsonb NOT NULL,
    operation_type text NOT NULL,
    priority numeric NOT NULL,
    processed_at timestamptz,
    retry_count numeric NOT NULL,
    status text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.sponsor_partners (
    affiliate_url text,
    category text NOT NULL,
    commission_rate numeric,
    created_at timestamptz DEFAULT now(),
    description text,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    is_active boolean,
    keywords text[] NOT NULL,
    logo_url text,
    name text NOT NULL,
    priority numeric,
    updated_at timestamptz DEFAULT now(),
    website_url text
);

CREATE TABLE public.user_badges (
    badge_icon text NOT NULL,
    badge_id text NOT NULL,
    badge_name text NOT NULL,
    earned_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.user_journeys (
    created_at timestamptz DEFAULT now(),
    duration_seconds numeric,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    page_path text NOT NULL,
    page_title text,
    referrer_path text,
    session_id text NOT NULL,
    timestamp text NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.user_locations (
    city text,
    country text,
    country_code text,
    created_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address text,
    isp text,
    last_seen_at timestamptz DEFAULT now(),
    latitude numeric,
    longitude numeric,
    region text,
    session_id text NOT NULL,
    timezone text,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.whatsapp_contacts (
    created_at timestamptz DEFAULT now(),
    group_name text,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    last_messaged_at timestamptz,
    name text NOT NULL,
    notes text,
    phone text NOT NULL,
    source text NOT NULL,
    tags text[] NOT NULL,
    updated_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.whatsapp_links (
    created_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    is_active boolean NOT NULL,
    is_verified boolean NOT NULL,
    last_message_at timestamptz,
    message_count numeric NOT NULL,
    phone_number text NOT NULL,
    updated_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    verification_code text,
    verification_expires_at timestamptz
);

-- ============================================
-- SELF-HEALING & OBSERVABILITY
-- ============================================
CREATE TABLE public.email_send_log (
    created_at timestamptz DEFAULT now(),
    error_message text,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id text,
    metadata jsonb,
    recipient_email text NOT NULL,
    status text NOT NULL,
    template_name text NOT NULL
);

CREATE TABLE public.email_send_state (
    auth_email_ttl_minutes numeric NOT NULL,
    batch_size numeric NOT NULL,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    retry_after_until text,
    send_delay_ms numeric NOT NULL,
    transactional_email_ttl_minutes numeric NOT NULL,
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.email_unsubscribe_tokens (
    created_at timestamptz DEFAULT now(),
    email text NOT NULL,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    token text NOT NULL,
    used_at timestamptz
);

CREATE TABLE public.push_subscriptions (
    auth text NOT NULL,
    created_at timestamptz,
    endpoint text NOT NULL,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    p256dh text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.shadowtalk_errors (
    column_number numeric,
    context jsonb,
    created_at timestamptz DEFAULT now(),
    fingerprint text NOT NULL,
    first_seen_at timestamptz DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    kind text NOT NULL,
    last_seen_at timestamptz DEFAULT now(),
    line_number numeric,
    message text NOT NULL,
    occurrences numeric NOT NULL,
    route text,
    source_file text,
    stack text,
    status text NOT NULL,
    url text,
    user_agent text,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.shadowtalk_fix_proposals (
    applied_at timestamptz,
    applied_by text,
    confidence numeric NOT NULL,
    created_at timestamptz DEFAULT now(),
    diagnosis text NOT NULL,
    error_id text NOT NULL,
    github_pr_url text,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    model text NOT NULL,
    patch_diff text,
    patch_strategy text NOT NULL,
    rolled_back_at timestamptz,
    runtime_handler jsonb,
    status text NOT NULL,
    target_files jsonb,
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.shadowtalk_source_chunks (
    chunk_index numeric NOT NULL,
    content text NOT NULL,
    content_hash text NOT NULL,
    embedding text,
    file_path text NOT NULL,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    indexed_at timestamptz DEFAULT now(),
    language text,
    symbols text[]
);

CREATE TABLE public.suppressed_emails (
    created_at timestamptz DEFAULT now(),
    email text NOT NULL,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    metadata jsonb,
    reason text NOT NULL
);

CREATE TABLE public.webhooks (
    created_at timestamptz,
    events text[] NOT NULL,
    failure_count numeric,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    is_active boolean,
    last_triggered_at timestamptz,
    name text NOT NULL,
    secret_hash text NOT NULL,
    url text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id text
);

-- ============================================
-- REMAINING TABLES
-- ============================================
CREATE TABLE public.workspaces (
    created_at timestamptz,
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    owner_id text NOT NULL,
    settings jsonb,
    slug text NOT NULL,
    updated_at timestamptz
);
