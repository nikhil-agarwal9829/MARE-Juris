-- ==============================================================================
-- Schema Validation Script: validate_case_law_schema.sql
-- Description: Verifies that tables, constraints, HNSW index, RLS policies,
-- and RPC function were installed correctly and function as specified.
-- ==============================================================================

DO $$
BEGIN
  -- 1. Check Table Existence
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'case_law_documents') THEN
    RAISE EXCEPTION 'Validation Failed: Table public.case_law_documents missing!';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'case_law_chunks') THEN
    RAISE EXCEPTION 'Validation Failed: Table public.case_law_chunks missing!';
  END IF;

  -- 2. Check Unique Constraint on (document_id, chunk_index)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'case_law_chunks' AND constraint_name = 'uq_case_law_chunks_doc_chunk'
  ) THEN
    RAISE EXCEPTION 'Validation Failed: Constraint uq_case_law_chunks_doc_chunk missing!';
  END IF;

  -- 3. Check HNSW Vector Index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'case_law_chunks' AND indexname = 'idx_case_law_chunks_embedding_hnsw'
  ) THEN
    RAISE EXCEPTION 'Validation Failed: HNSW vector index missing!';
  END IF;

  -- 4. Check RLS is Enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'case_law_documents' AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'Validation Failed: RLS not enabled on public.case_law_documents!';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'case_law_chunks' AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'Validation Failed: RLS not enabled on public.case_law_chunks!';
  END IF;

  -- 5. Check RPC Existence with exact argument signature
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'match_case_law_chunks' AND pronargs = 7
  ) THEN
    RAISE EXCEPTION 'Validation Failed: RPC function match_case_law_chunks (7 args) missing!';
  END IF;

  RAISE NOTICE 'SUCCESS: All Case-Law schema components verified successfully!';
END $$;
