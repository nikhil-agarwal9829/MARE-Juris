-- Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- Table to store Legal Documents Metadata
CREATE TABLE IF NOT EXISTS public.legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    short_title TEXT,
    act_number TEXT,
    year INTEGER,
    document_type TEXT,
    authority TEXT,
    ministry TEXT,
    jurisdiction TEXT,
    source_url TEXT,
    source_type TEXT,
    storage_path TEXT,
    checksum TEXT,
    version TEXT,
    effective_date DATE,
    last_verified_at TIMESTAMPTZ,
    verification_status TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to store Legal Document Chunks with Vector Embeddings
CREATE TABLE IF NOT EXISTS public.legal_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES public.legal_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER,
    content TEXT NOT NULL,
    chapter TEXT,
    chapter_title TEXT,
    section_number TEXT,
    section_title TEXT,
    subsection TEXT,
    page_number INTEGER,
    embedding VECTOR(768), -- Assuming 768 dimensions for standard embedding models like Google GenAI
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a vector index for faster similarity search
CREATE INDEX IF NOT EXISTS legal_chunks_embedding_idx ON public.legal_chunks USING hnsw (embedding vector_cosine_ops);

-- Enable RLS
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_chunks ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users for legal corpus
CREATE POLICY "Allow public read access to legal documents" ON public.legal_documents FOR SELECT USING (true);
CREATE POLICY "Allow public read access to legal chunks" ON public.legal_chunks FOR SELECT USING (true);

-- Drop existing function if it exists to recreate it
DROP FUNCTION IF EXISTS match_legal_chunks;

-- Create function for vector similarity search (Hybrid Search possible via this or RPC)
CREATE OR REPLACE FUNCTION match_legal_chunks (
  query_embedding VECTOR(768),
  match_count INT DEFAULT 10,
  filter JSONB DEFAULT '{}'
) RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  section_number TEXT,
  section_title TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lc.id,
    lc.document_id,
    lc.content,
    lc.section_number,
    lc.section_title,
    1 - (lc.embedding <=> query_embedding) AS similarity
  FROM legal_chunks lc
  ORDER BY lc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
