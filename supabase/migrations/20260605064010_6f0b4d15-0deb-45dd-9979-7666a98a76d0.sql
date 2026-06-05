
-- Enable pgvector for source code semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Errors captured from the running app
CREATE TABLE IF NOT EXISTS public.shadowtalk_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('runtime','promise','react','api','edge','rls','console','build')),
  message TEXT NOT NULL,
  stack TEXT,
  source_file TEXT,
  line_number INT,
  column_number INT,
  url TEXT,
  user_agent TEXT,
  route TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  fingerprint TEXT NOT NULL,
  occurrences INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','analyzing','proposed','applied','ignored','failed')),
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shadowtalk_errors_fingerprint_idx ON public.shadowtalk_errors(fingerprint);
CREATE INDEX IF NOT EXISTS shadowtalk_errors_status_idx ON public.shadowtalk_errors(status);
CREATE INDEX IF NOT EXISTS shadowtalk_errors_last_seen_idx ON public.shadowtalk_errors(last_seen_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.shadowtalk_errors TO authenticated;
GRANT ALL ON public.shadowtalk_errors TO service_role;
ALTER TABLE public.shadowtalk_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert their own errors"
  ON public.shadowtalk_errors FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins view all errors"
  ON public.shadowtalk_errors FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update errors"
  ON public.shadowtalk_errors FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- AI-generated fix proposals
CREATE TABLE IF NOT EXISTS public.shadowtalk_fix_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_id UUID NOT NULL REFERENCES public.shadowtalk_errors(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  diagnosis TEXT NOT NULL,
  patch_strategy TEXT NOT NULL CHECK (patch_strategy IN ('runtime_recover','source_patch','config_change','manual_only')),
  target_files JSONB DEFAULT '[]'::jsonb,
  patch_diff TEXT,
  runtime_handler JSONB,
  confidence REAL NOT NULL DEFAULT 0,
  applied_at TIMESTAMPTZ,
  applied_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rolled_back_at TIMESTAMPTZ,
  github_pr_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','applied','rolled_back','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shadowtalk_fix_proposals_error_idx ON public.shadowtalk_fix_proposals(error_id);
CREATE INDEX IF NOT EXISTS shadowtalk_fix_proposals_status_idx ON public.shadowtalk_fix_proposals(status);

GRANT SELECT, UPDATE ON public.shadowtalk_fix_proposals TO authenticated;
GRANT ALL ON public.shadowtalk_fix_proposals TO service_role;
ALTER TABLE public.shadowtalk_fix_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all proposals"
  ON public.shadowtalk_fix_proposals FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update proposals"
  ON public.shadowtalk_fix_proposals FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER shadowtalk_fix_proposals_updated
  BEFORE UPDATE ON public.shadowtalk_fix_proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Source code index (chunks + embeddings) for RAG
CREATE TABLE IF NOT EXISTS public.shadowtalk_source_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path TEXT NOT NULL,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  embedding vector(1536),
  language TEXT,
  symbols TEXT[],
  indexed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (file_path, chunk_index)
);

CREATE INDEX IF NOT EXISTS shadowtalk_source_chunks_file_idx ON public.shadowtalk_source_chunks(file_path);
CREATE INDEX IF NOT EXISTS shadowtalk_source_chunks_hash_idx ON public.shadowtalk_source_chunks(content_hash);
CREATE INDEX IF NOT EXISTS shadowtalk_source_chunks_embedding_idx
  ON public.shadowtalk_source_chunks USING hnsw (embedding vector_cosine_ops);

GRANT SELECT ON public.shadowtalk_source_chunks TO authenticated;
GRANT ALL ON public.shadowtalk_source_chunks TO service_role;
ALTER TABLE public.shadowtalk_source_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view source index"
  ON public.shadowtalk_source_chunks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Similarity search function
CREATE OR REPLACE FUNCTION public.match_source_chunks(
  query_embedding vector(1536),
  match_count int DEFAULT 8
) RETURNS TABLE (
  id UUID,
  file_path TEXT,
  content TEXT,
  similarity float
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    c.id, c.file_path, c.content,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.shadowtalk_source_chunks c
  WHERE c.embedding IS NOT NULL
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;
