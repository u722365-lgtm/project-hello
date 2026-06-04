-- Harden realtime.messages: per-user topics for sensitive tables, deny table-name channels
-- Complements 20260604120000_realtime_and_badges_rls.sql (scanner: Realtime channel subscription)

CREATE OR REPLACE FUNCTION public.can_access_realtime_topic(p_topic text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  room_id uuid;
  doc_id uuid;
  topic_user_id uuid;
BEGIN
  IF uid IS NULL OR p_topic IS NULL OR length(trim(p_topic)) = 0 THEN
    RETURN false;
  END IF;

  -- Block using raw table names as channel topics (common abuse pattern)
  IF p_topic IN (
    'user_locations',
    'profiles',
    'admin_alerts',
    'business_memories',
    'missions',
    'mission_actions',
    'user_journeys',
    'usage_analytics',
    'feedback',
    'room_messages',
    'room_participants',
    'room_documents',
    'user_notifications',
    'announcements',
    'threat_intel_cves'
  ) THEN
    RETURN false;
  END IF;

  -- Legacy broad channels — disabled; use per-user topics below
  IF p_topic IN ('missions-realtime', 'business_memories_changes') THEN
    RETURN false;
  END IF;

  -- Admin-only dashboard feeds (user_locations, admin_alerts, journeys, etc.)
  IF p_topic IN (
    'admin-alerts',
    'admin-feedback-realtime',
    'geo-tracking',
    'timezone-updates',
    'journey-updates',
    'admin-presence-tracking',
    'admin-analytics'
  ) THEN
    RETURN public.has_role(uid, 'admin'::app_role);
  END IF;

  -- Per-user notification stream
  IF p_topic = 'user-notifications-' || uid::text THEN
    RETURN true;
  END IF;

  -- Per-user sensitive table channels (auth.uid() must match embedded user id)
  IF p_topic ~ '^user-locations-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    topic_user_id := substring(p_topic from '^user-locations-(.+)$')::uuid;
    RETURN topic_user_id = uid;
  END IF;

  IF p_topic ~ '^profiles-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    topic_user_id := substring(p_topic from '^profiles-(.+)$')::uuid;
    RETURN topic_user_id = uid;
  END IF;

  IF p_topic ~ '^business-memories-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    topic_user_id := substring(p_topic from '^business-memories-(.+)$')::uuid;
    RETURN topic_user_id = uid;
  END IF;

  IF p_topic ~ '^missions-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    topic_user_id := substring(p_topic from '^missions-(.+)$')::uuid;
    RETURN topic_user_id = uid;
  END IF;

  IF p_topic ~ '^mission-actions-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    topic_user_id := substring(p_topic from '^mission-actions-(.+)$')::uuid;
    RETURN topic_user_id = uid;
  END IF;

  -- Collaborative room postgres + broadcast topics
  room_id := CASE
    WHEN p_topic ~ '^room-messages-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN substring(p_topic from 'room-messages-(.+)$')::uuid
    WHEN p_topic ~ '^room-participants-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN substring(p_topic from 'room-participants-(.+)$')::uuid
    WHEN p_topic ~ '^room-document-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN substring(p_topic from 'room-document-(.+)$')::uuid
    WHEN p_topic ~ '^collab-ai:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN substring(p_topic from '^collab-ai:(.+)$')::uuid
    WHEN p_topic ~ '^presence:room-presence-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN substring(p_topic from '^presence:room-presence-(.+)$')::uuid
    WHEN p_topic ~ '^cursors-room-cursors-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN substring(p_topic from '^cursors-room-cursors-(.+)$')::uuid
    ELSE NULL
  END;

  IF room_id IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.room_participants rp
      WHERE rp.room_id = room_id
        AND rp.user_id = uid
    );
  END IF;

  -- Document-scoped presence (IDE / collab editor)
  IF p_topic ~ '^presence:document:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    doc_id := substring(p_topic from '^presence:document:(.+)$')::uuid;
    RETURN EXISTS (
      SELECT 1
      FROM public.room_documents rd
      INNER JOIN public.room_participants rp ON rp.room_id = rd.room_id
      WHERE rd.id = doc_id
        AND rp.user_id = uid
    );
  END IF;

  -- Non-sensitive authenticated feeds
  IF p_topic IN (
    'announcements-banner',
    'threat-intel-cves-realtime'
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.can_access_realtime_topic(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_realtime_topic(text) TO authenticated;

-- Ensure RLS + policies exist (idempotent if prior migration already ran)
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_can_read_realtime_topic" ON realtime.messages;
DROP POLICY IF EXISTS "authenticated_can_write_realtime_broadcast_presence" ON realtime.messages;

CREATE POLICY "authenticated_can_read_realtime_topic"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (public.can_access_realtime_topic((SELECT realtime.topic())));

CREATE POLICY "authenticated_can_write_realtime_broadcast_presence"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_access_realtime_topic((SELECT realtime.topic()))
    AND realtime.messages.extension IN ('broadcast', 'presence')
  );

-- Required for Realtime authorization checks against realtime.messages
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT SELECT, INSERT ON realtime.messages TO authenticated;
