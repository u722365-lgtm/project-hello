
-- 1) Fix mutable search_path on pgmq wrapper functions
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pgmq AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pgmq AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pgmq AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pgmq AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN PERFORM pgmq.create(dlq_name); EXCEPTION WHEN OTHERS THEN NULL; END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN PERFORM pgmq.delete(source_queue, message_id); EXCEPTION WHEN undefined_table THEN NULL; END;
  RETURN new_id;
END;
$$;

-- 2) shared_answers: remove blanket public read; expose via slug-only function
DROP POLICY IF EXISTS "Anyone can read shared answers" ON public.shared_answers;

REVOKE SELECT ON public.shared_answers FROM anon;
REVOKE SELECT ON public.shared_answers FROM authenticated;

CREATE OR REPLACE FUNCTION public.get_shared_answer(_slug text)
RETURNS TABLE (
  slug text,
  title text,
  prompt text,
  answer text,
  model text,
  source text,
  views integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.slug, s.title, s.prompt, s.answer, s.model, s.source, s.views, s.created_at
  FROM public.shared_answers s
  WHERE s.slug = _slug
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_answer(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.increment_shared_answer_views(_slug text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.shared_answers SET views = COALESCE(views, 0) + 1 WHERE slug = _slug;
$$;

GRANT EXECUTE ON FUNCTION public.increment_shared_answer_views(text) TO anon, authenticated;

-- 3) email-assets storage bucket: keep public read (email logos are hardcoded),
--    but add explicit RLS policies so only service_role can write/delete.
DROP POLICY IF EXISTS "email-assets public read" ON storage.objects;
CREATE POLICY "email-assets public read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'email-assets');

DROP POLICY IF EXISTS "email-assets service write" ON storage.objects;
CREATE POLICY "email-assets service write"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'email-assets' AND false);

DROP POLICY IF EXISTS "email-assets service update" ON storage.objects;
CREATE POLICY "email-assets service update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'email-assets' AND false);

DROP POLICY IF EXISTS "email-assets service delete" ON storage.objects;
CREATE POLICY "email-assets service delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'email-assets' AND false);
