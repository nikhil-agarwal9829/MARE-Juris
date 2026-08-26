-- MARE-Juris Initial Database Schema & RLS Policy Migration
-- Created: 2026-08-27

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================================================
-- 1. USER & IDENTITY
-- ==================================================

-- User Profiles (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    organization TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Session Isolation Tracking
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_info JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==================================================
-- 2. CONVERSATIONS & MESSAGES
-- ==================================================

CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================================================
-- 3. GLOBAL LEGAL KNOWLEDGE CORPUS (Isolated Shared Data)
-- ==================================================

CREATE TABLE IF NOT EXISTS public.legal_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type TEXT NOT NULL, -- Act, Judgment, Regulation, Rules, etc.
    authority TEXT NOT NULL,   -- Supreme Court of India, High Court, Parliament, etc.
    title TEXT NOT NULL,
    citation TEXT,
    publication_date DATE,
    effective_date DATE,
    source_url TEXT,
    document_identifier TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES public.legal_sources(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    document_identifier TEXT,
    version TEXT DEFAULT '1.0',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.legal_document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_document_id UUID NOT NULL REFERENCES public.legal_documents(id) ON DELETE CASCADE,
    section TEXT,
    subsection TEXT,
    content TEXT NOT NULL,
    amendment_info JSONB DEFAULT '{}'::jsonb,
    version TEXT NOT NULL DEFAULT '1.0',
    effective_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================================================
-- 4. PRIVATE USER UPLOADED DOCUMENTS
-- ==================================================

CREATE TABLE IF NOT EXISTS public.uploaded_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    status TEXT DEFAULT 'uploaded', -- uploaded, processing, indexed, error
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploaded_document_id UUID NOT NULL REFERENCES public.uploaded_documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================================================
-- 5. EVIDENCE & CLAIMS
-- ==================================================

CREATE TABLE IF NOT EXISTS public.evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('global_legal', 'user_document')),
    legal_version_id UUID REFERENCES public.legal_document_versions(id) ON DELETE CASCADE,
    user_doc_chunk_id UUID REFERENCES public.document_chunks(id) ON DELETE CASCADE,
    content_snippet TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    claim_text TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, audited, repaired, rejected
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.claim_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    evidence_id UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
    relevance_score FLOAT DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================================================
-- 6. CITATION AUDITS & COMPLIANCE
-- ==================================================

CREATE TABLE IF NOT EXISTS public.citation_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    audit_type TEXT DEFAULT 'citation_grounding',
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES public.citation_audits(id) ON DELETE CASCADE,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    verification_status TEXT NOT NULL CHECK (verification_status IN ('verified', 'unverified', 'repaired', 'abstained')),
    explanation TEXT,
    repair_details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.compliance_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.compliance_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_id UUID NOT NULL REFERENCES public.compliance_checks(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('compliant', 'non_compliant', 'warning', 'needs_review')),
    details TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================================================
-- 7. AGENT EXECUTION LOGS
-- ==================================================

CREATE TABLE IF NOT EXISTS public.agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    agent_type TEXT NOT NULL,
    status TEXT DEFAULT 'running',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.agent_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================================================
-- INDEXES FOR PERFORMANCE & LOOKUPS
-- ==================================================

CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_docs_user ON public.uploaded_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_doc_chunks_doc ON public.document_chunks(uploaded_document_id);
CREATE INDEX IF NOT EXISTS idx_doc_chunks_user ON public.document_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_user ON public.claims(user_id);
CREATE INDEX IF NOT EXISTS idx_evidence_user ON public.evidence(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_user ON public.compliance_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_user ON public.agent_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_docs_source ON public.legal_documents(source_id);
CREATE INDEX IF NOT EXISTS idx_legal_doc_versions_doc ON public.legal_document_versions(legal_document_id);

-- ==================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==================================================

-- Enable RLS on ALL tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citation_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_events ENABLE ROW LEVEL SECURITY;

-- Helper macro function for user policies
-- User Private Table Policies (Profiles)
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- User Sessions Policies
CREATE POLICY "Users view own sessions" ON public.user_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sessions" ON public.user_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own sessions" ON public.user_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Conversations & Messages Policies
CREATE POLICY "Users manage own conversations" ON public.conversations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own messages" ON public.messages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Uploaded Documents & Chunks Policies
CREATE POLICY "Users manage own uploaded documents" ON public.uploaded_documents FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own document chunks" ON public.document_chunks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Evidence & Claims Policies
CREATE POLICY "Users manage own evidence" ON public.evidence FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own claims" ON public.claims FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own claim evidence" ON public.claim_evidence FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.claims WHERE id = claim_id AND user_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.claims WHERE id = claim_id AND user_id = auth.uid())
);

-- Citation Audits & Results Policies
CREATE POLICY "Users manage own citation audits" ON public.citation_audits FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own audit results" ON public.audit_results FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.citation_audits WHERE id = audit_id AND user_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.citation_audits WHERE id = audit_id AND user_id = auth.uid())
);

-- Compliance Checks Policies
CREATE POLICY "Users manage own compliance checks" ON public.compliance_checks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own compliance items" ON public.compliance_items FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.compliance_checks WHERE id = check_id AND user_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.compliance_checks WHERE id = check_id AND user_id = auth.uid())
);

-- Agent Runs & Events Policies
CREATE POLICY "Users manage own agent runs" ON public.agent_runs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own agent events" ON public.agent_events FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.agent_runs WHERE id = run_id AND user_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.agent_runs WHERE id = run_id AND user_id = auth.uid())
);

-- Global Legal Knowledge Corpus Policies (Authenticated Read-Only, Service Role Full Access)
CREATE POLICY "Authenticated users read legal sources" ON public.legal_sources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users read legal documents" ON public.legal_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users read legal doc versions" ON public.legal_document_versions FOR SELECT TO authenticated USING (true);

-- ==================================================
-- 9. SUPABASE STORAGE BUCKET & STORAGE RLS POLICIES
-- ==================================================

-- Insert private storage bucket 'user-documents'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'user-documents',
    'user-documents',
    false,
    52428800, -- 50MB
    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Storage Objects Policies for user-documents bucket
CREATE POLICY "Users read own storage documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users upload own storage documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own storage documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own storage documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
