-- ==============================================================================
-- Rollback Plan: 20261012000000_case_law_isolated_schema_rollback.sql
-- Description: Safely and explicitly removes ONLY the isolated Case-Law schema.
-- Strict safety: Avoids CASCADE drops to prevent silent removal of any unexpected
-- dependencies. Drops objects in strict reverse dependency order.
-- ==============================================================================

-- 1. Revoke function permissions and drop RPC
REVOKE EXECUTE ON FUNCTION public.match_case_law_chunks(VECTOR(768), INT, TEXT, TEXT, INT, BOOLEAN, JSONB) FROM anon, authenticated, service_role;
DROP FUNCTION IF EXISTS public.match_case_law_chunks(VECTOR(768), INT, TEXT, TEXT, INT, BOOLEAN, JSONB);

-- 2. Explicitly drop chunks table RLS policies
DROP POLICY IF EXISTS "Allow public select on case_law_chunks" ON public.case_law_chunks;
DROP POLICY IF EXISTS "Allow service_role full management on case_law_chunks" ON public.case_law_chunks;

-- 3. Explicitly drop chunks table indexes
DROP INDEX IF EXISTS public.idx_case_law_chunks_embedding_hnsw;
DROP INDEX IF EXISTS public.idx_case_law_chunks_metadata_gin;
DROP INDEX IF EXISTS public.idx_case_law_chunks_doc_id;
DROP INDEX IF EXISTS public.idx_case_law_chunks_case_id;

-- 4. Drop chunks table RESTRICT (will fail if unexpected foreign keys reference it)
DROP TABLE IF EXISTS public.case_law_chunks RESTRICT;

-- 5. Explicitly drop documents master table RLS policies
DROP POLICY IF EXISTS "Allow public select on case_law_documents" ON public.case_law_documents;
DROP POLICY IF EXISTS "Allow service_role full management on case_law_documents" ON public.case_law_documents;

-- 6. Explicitly drop documents table indexes
DROP INDEX IF EXISTS public.idx_case_law_documents_citation;
DROP INDEX IF EXISTS public.idx_case_law_documents_court;
DROP INDEX IF EXISTS public.idx_case_law_documents_decision_date;
DROP INDEX IF EXISTS public.idx_case_law_documents_decision_year;
DROP INDEX IF EXISTS public.idx_case_law_documents_case_id;

-- 7. Drop documents master table RESTRICT
DROP TABLE IF EXISTS public.case_law_documents RESTRICT;
