-- ==============================================================================
-- Migration: 20261012000000_case_law_isolated_schema.sql
-- Description: Isolated schema, indexes, RLS, and search RPC for MARE-Juris Case-Law Agent.
-- Complete separation from statutory legal_documents and legal_chunks.
-- DO NOT APPLY WITHOUT EXPLICIT APPROVAL.
-- ==============================================================================

-- 1. Ensure pgvector extension exists
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Master Table: public.case_law_documents
CREATE TABLE IF NOT EXISTS public.case_law_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id TEXT UNIQUE NOT NULL,                       -- e.g. 'MARE-CASE-001'
    title TEXT NOT NULL,                                 -- e.g. 'Bachan Singh v. State of Punjab'
    decision_year INTEGER,                              -- e.g. 1980
    decision_date DATE,                                 -- e.g. '1980-05-09' (normalized ISO DATE or NULL)
    court TEXT,                                         -- e.g. 'Supreme Court of India'
    citation TEXT,                                      -- e.g. 'AIR 1980 SC 898; (1980) 2 SCC 684'
    bench TEXT,                                         -- e.g. 'Y.V. Chandrachud, A.C. Gupta, ...'
    author TEXT,                                        -- e.g. 'R.S. Sarkaria'
    source_document_id TEXT,                            -- e.g. '307021'
    source_url TEXT,                                    -- Original catalog/IK URL
    official_source_url TEXT,                           -- Official eCourts/IndiaCode URL
    official_source_verified BOOLEAN DEFAULT FALSE,     -- Verified against official court record
    full_text_verified BOOLEAN DEFAULT FALSE,           -- STRICTLY requires human review flag
    text_char_count INTEGER DEFAULT 0,
    chunk_count INTEGER DEFAULT 0,
    raw_sha256 TEXT,                                    -- SHA-256 of raw HTML download
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Chunks Table: public.case_law_chunks
CREATE TABLE IF NOT EXISTS public.case_law_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.case_law_documents(id) ON DELETE CASCADE,
    case_id TEXT NOT NULL,                              -- Enforces foreign parent consistency
    chunk_index INTEGER NOT NULL,                       -- 0-indexed chunk within case
    paragraph_reference TEXT,                           -- e.g. 'p_1-p_4' or 'page_3'
    content TEXT NOT NULL,                              -- Plaintext chunk body
    char_count INTEGER,
    embedding VECTOR(768),                              -- Google GenAI retrieval_document vector (dim=768)
    metadata JSONB DEFAULT '{}'::jsonb,                 -- Structural chunk metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_case_law_chunks_doc_chunk UNIQUE (document_id, chunk_index)
);

-- 4. Relational & Filter Indexes
CREATE INDEX IF NOT EXISTS idx_case_law_documents_case_id ON public.case_law_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_case_law_documents_decision_year ON public.case_law_documents(decision_year);
CREATE INDEX IF NOT EXISTS idx_case_law_documents_decision_date ON public.case_law_documents(decision_date);
CREATE INDEX IF NOT EXISTS idx_case_law_documents_court ON public.case_law_documents(court);
CREATE INDEX IF NOT EXISTS idx_case_law_documents_citation ON public.case_law_documents USING gin (to_tsvector('english', coalesce(citation, '')));

CREATE INDEX IF NOT EXISTS idx_case_law_chunks_case_id ON public.case_law_chunks(case_id);
CREATE INDEX IF NOT EXISTS idx_case_law_chunks_doc_id ON public.case_law_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_case_law_chunks_metadata_gin ON public.case_law_chunks USING gin (metadata);

-- 5. HNSW Vector Index on VECTOR(768) with cosine distance (excludes NULL embeddings)
CREATE INDEX IF NOT EXISTS idx_case_law_chunks_embedding_hnsw 
ON public.case_law_chunks USING hnsw (embedding vector_cosine_ops)
WHERE embedding IS NOT NULL;

-- 6. Row Level Security (RLS) Configuration
ALTER TABLE public.case_law_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_law_chunks ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.case_law_documents FROM PUBLIC;
REVOKE ALL ON public.case_law_chunks FROM PUBLIC;

GRANT SELECT ON public.case_law_documents TO anon, authenticated;
GRANT SELECT ON public.case_law_chunks TO anon, authenticated;

CREATE POLICY "Allow public select on case_law_documents"
ON public.case_law_documents FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public select on case_law_chunks"
ON public.case_law_chunks FOR SELECT
TO anon, authenticated
USING (true);

GRANT ALL ON public.case_law_documents TO service_role;
GRANT ALL ON public.case_law_chunks TO service_role;

CREATE POLICY "Allow service_role full management on case_law_documents"
ON public.case_law_documents FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow service_role full management on case_law_chunks"
ON public.case_law_chunks FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 7. Secure Vector Search RPC: match_case_law_chunks
-- Strictly separates document-level filters from chunk_metadata JSONB containment
CREATE OR REPLACE FUNCTION public.match_case_law_chunks (
  query_embedding VECTOR(768),
  match_count INT DEFAULT 8,
  filter_court TEXT DEFAULT NULL,
  filter_case_id TEXT DEFAULT NULL,
  filter_year INT DEFAULT NULL,
  filter_official_only BOOLEAN DEFAULT NULL,
  filter_chunk_metadata JSONB DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  document_id UUID,
  case_id TEXT,
  case_title TEXT,
  court TEXT,
  decision_date DATE,
  citation TEXT,
  chunk_index INT,
  paragraph_reference TEXT,
  content TEXT,
  chunk_metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
  v_limit INT;
BEGIN
  -- Input Validation: reject NULL query embedding
  IF query_embedding IS NULL THEN
    RAISE EXCEPTION 'query_embedding cannot be NULL';
  END IF;

  -- Validate match_count (clamped between 1 and 50)
  v_limit := LEAST(GREATEST(COALESCE(match_count, 8), 1), 50);

  -- Validate filter_year range if provided
  IF filter_year IS NOT NULL AND (filter_year < 1800 OR filter_year > 2100) THEN
    RAISE EXCEPTION 'filter_year out of valid range (1800-2100): %', filter_year;
  END IF;

  RETURN QUERY
  SELECT
    clc.id,
    clc.document_id,
    clc.case_id,
    cld.title AS case_title,
    cld.court,
    cld.decision_date,
    cld.citation,
    clc.chunk_index,
    clc.paragraph_reference,
    clc.content,
    clc.metadata AS chunk_metadata,
    ROUND((1 - (clc.embedding <=> query_embedding))::NUMERIC, 6)::FLOAT AS similarity
  FROM public.case_law_chunks clc
  JOIN public.case_law_documents cld ON clc.document_id = cld.id
  WHERE clc.embedding IS NOT NULL
    -- Authoritative Document-level Column Filters
    AND (filter_court IS NULL OR cld.court ILIKE '%' || filter_court || '%')
    AND (filter_case_id IS NULL OR clc.case_id = filter_case_id)
    AND (filter_year IS NULL OR cld.decision_year = filter_year)
    AND (filter_official_only IS NULL OR cld.official_source_verified = filter_official_only)
    -- Explicit Chunk Metadata JSONB Containment Filter
    AND (filter_chunk_metadata IS NULL OR filter_chunk_metadata = '{}'::jsonb OR clc.metadata @> filter_chunk_metadata)
  ORDER BY clc.embedding <=> query_embedding
  LIMIT v_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.match_case_law_chunks(VECTOR(768), INT, TEXT, TEXT, INT, BOOLEAN, JSONB) TO anon, authenticated, service_role;
