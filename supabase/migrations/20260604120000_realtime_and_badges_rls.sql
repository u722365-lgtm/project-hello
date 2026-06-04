-- Security: scope Realtime channel access + stop user_badges UUID enumeration
-- Addresses scanner findings: realtime.messages (ERROR) and user_badges (WARNING)

-- ---------------------------------------------------------------------------
-- 1) user_badges — users may only read their own rows
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view all earned badges" ON public.user_badges;
DROP POLICY IF EXISTS "Anyone can view earned badges" ON public.user_badges;

-- "Users can view their own badges" (auth.uid() = user_id) remains from initial migration

-- ---------------------------------------------------------------------------
-- 2) realtime.messages — topic-scoped channel authorization
-- ---------------------------------------------------------------------------
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
BEGIN
  IF uid IS NULL OR p_topic IS NULL OR length(trim(p_topic)) = 0 THEN
    RETURN false;
  END IF;

  -- Admin dashboard realtime feeds
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

  -- App-wide feeds (postgres_changes row payloads still filtered by table RLS)
  IF p_topic IN (
    'announcements-banner',
    'threat-intel-cves-realtime',
    'missions-realtime',
    'business_memories_changes'
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.can_access_realtime_topic(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_realtime_topic(text) TO authenticated;

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
