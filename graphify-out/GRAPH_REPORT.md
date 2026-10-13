# Graph Report - MARE-Juris  (2026-10-13)

## Corpus Check
- 137 files · ~7,478,399 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 962 nodes · 1604 edges · 93 communities (72 shown, 21 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `69e8c940`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- MARE-Juris Legal AI System
- 20260827000000_initial_schema.sql
- Supabase & Brevo Infrastructure Setup for MARE-Juris
- MARE-Juris — Complete Technical Metrics, Architecture & RAG Evaluation Report
- Project Context & Objectives
- Research & Technical Gaps
- dependencies
- EmailService
- literacy/page.tsx
- devDependencies
- Settings
- root
- middleware.ts
- rules/graphify.md
- workflows/graphify.md
- createClient
- LegalRetrievalService
- vercel.json
- compilerOptions
- test_collection_pipeline.py
- .eslintrc.json
- layout.tsx
- next.config.js
- LegalQueryClassifier
- website-assistant/route.ts
- compliance.py
- ComplianceAgentService
- compliance_assessments
- Compliance Roadmap
- LegalRAGService
- LiveCaseLawAgent
- MARE-Juris RAG Pipeline & Two-Answer System
- 20260913_legal_corpus.sql
- MARE-Juris Initial Legal Corpus
- ingest_legal_documents.py
- compare/route.ts
- ragimplementation.md
- LegalQueryAnalysisService
- ragupdate.md
- get_supabase_client
- test_document_agent.py
- rag_retrieval_config.py
- MARE-Juris RAG Evaluation Summary
- compute_chunk_upsert_state
- MARE-Juris RAG Evaluation Summary
- Idle prompt: MARE-Juris Case-Law Collection
- MARE-Juris Case-Law Collection Setup
- main
- run_controlled_ingestion.py
- run_full_ingestion.py
- 20261012000000_case_law_isolated_schema.sql
- vercel.json
- test_timeout_and_latency_hotfix.py
- test_rpc_search.py
- MultiAgentOrchestrator
- generate_all_diagrams.py
- createClient
- ChatInterface.tsx
- DocumentExtractionService
- documents.py
- generate_full_reports.py
- chat.py
- get_supabase_admin_client
- CaseLawCorpusAgent
- NewsRail.tsx
- HomeContent.tsx
- scripts
- login/page.tsx
- package.json
- react
- react-dom
- react-markdown
- remark-gfm
- @supabase/ssr

## God Nodes (most connected - your core abstractions)
1. `MultiAgentOrchestrator` - 69 edges
2. `MARE-Juris — Complete Technical Metrics, Architecture & RAG Evaluation Report` - 38 edges
3. `save_fig()` - 32 edges
4. `draw_box()` - 32 edges
5. `main()` - 32 edges
6. `LiveCaseLawAgent` - 31 edges
7. `draw_arrow()` - 29 edges
8. `get_supabase_admin_client()` - 22 edges
9. `run_all_tests()` - 20 edges
10. `ComplianceAgentService` - 19 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `get_supabase_admin_client()`  [INFERRED]
  evaluation/rag_eval_harness/run_evaluation.py → backend/app/db/supabase.py
- `Initial Repository Structure ADR` --DEFINES_STRUCTURE--> `MARE-Juris Legal AI System`  [EXTRACTED]
  docs/DECISIONS.md → README.md
- `MARE-Juris Legal AI System` --CONTAINS--> `Data Ingestion & Indexing Pipeline`  [EXTRACTED]
  README.md → docs/ARCHITECTURE.md
- `MARE-Juris Legal AI System` --CONTAINS--> `Benchmark Test Harness & Metrics`  [EXTRACTED]
  README.md → docs/ARCHITECTURE.md
- `upload_document()` --uses--> `DocumentExtractionResult`  [INFERRED]
  backend/app/api/v1/documents.py → backend/app/services/document_extraction_service.py

## Import Cycles
- None detected.

## Communities (93 total, 21 thin omitted)

### Community 0 - "MARE-Juris Legal AI System"
Cohesion: 0.20
Nodes (11): Initial Repository Structure ADR, Backend Server & API, Define Backend Stack & Setup Server, Ingest Legal Domain Datasets, Data Ingestion & Indexing Pipeline, Build Evaluation Benchmark Suite, Benchmark Test Harness & Metrics, Web Client UI (+3 more)

### Community 1 - "20260827000000_initial_schema.sql"
Cohesion: 0.19
Nodes (21): public.handle_new_user, on_auth_user_created, public.agent_events, public.agent_runs, public.audit_results, public.citation_audits, public.claim_evidence, public.claims (+13 more)

### Community 2 - "Supabase & Brevo Infrastructure Setup for MARE-Juris"
Cohesion: 0.15
Nodes (12): 1. Environment Variables, 2. Authentication & Brevo Custom SMTP Setup, 3. PostgreSQL Database Schema & Migration, 4. Row Level Security (RLS) Policies, 5. Private Storage Bucket Setup, 6. Security Audit Checklist, Architecture Overview, Brevo Custom SMTP Settings for Supabase Dashboard (+4 more)

### Community 3 - "MARE-Juris — Complete Technical Metrics, Architecture & RAG Evaluation Report"
Cohesion: 0.04
Nodes (46): 10. Query Understanding & Classification, 11. Query Expansion & Synonym Packs, 12. Reranking, 13. Evidence Normalization & Claim Planning, 14. LLM Answer Generation, 15. Citation Verification, 16. Dual-Answer Architecture, 17. Follow-Up Conversation Handling (+38 more)

### Community 6 - "dependencies"
Cohesion: 0.12
Nodes (17): clsx, dependencies, clsx, lucide-react, next, puppeteer, @supabase/supabase-js, tailwind-merge (+9 more)

### Community 7 - "EmailService"
Cohesion: 0.24
Nodes (5): EmailService, Sends a transactional application email using Brevo REST API v3., Notifies user when legal document analysis completes., Reusable Brevo Transactional Email Service. Handles application-level…, Notifies user regarding a compliance check update.

### Community 8 - "literacy/page.tsx"
Cohesion: 0.23
Nodes (11): LiteracyPage(), RightCard(), RightCardProps, RightDetailPanel(), RightDetailPanelProps, RightsHero(), RightsHeroProps, getCategories() (+3 more)

### Community 9 - "devDependencies"
Cohesion: 0.11
Nodes (19): autoprefixer, eslint, eslint-config-next, devDependencies, autoprefixer, eslint, eslint-config-next, postcss (+11 more)

### Community 16 - "createClient"
Cohesion: 0.25
Nodes (9): ForgotPasswordPage(), OtpPage(), ResetPasswordPage(), SignupPage(), VerificationState, VerifyEmailContent(), Navbar(), NavbarProps (+1 more)

### Community 17 - "LegalRetrievalService"
Cohesion: 0.24
Nodes (3): LegalRetrievalService, Any, Hybrid retrieval: Supabase pgvector + BM25 + query expansion + rerank.

### Community 19 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, framework, outputDirectory

### Community 20 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+18 more)

### Community 21 - "test_collection_pipeline.py"
Cohesion: 0.10
Nodes (26): calculate_sha256(), chunk_structural_blocks(), extract_metadata_from_ik_html(), extract_pdf_pages_and_blocks(), extract_structural_blocks_from_html(), IndiaCodeClient, IndianKanoonClient, load_env_token() (+18 more)

### Community 30 - "LegalQueryClassifier"
Cohesion: 0.40
Nodes (3): LegalQueryClassifier, Any, Semantic Legal Query Relevance Classifier for MARE-Juris. Evaluates intent…

### Community 33 - "compliance.py"
Cohesion: 0.13
Nodes (20): AnalyzeRequest, extract_intent(), generate_questions(), generate_roadmap(), get_history(), IntentRequest, BaseModel, Exception (+12 more)

### Community 34 - "ComplianceAgentService"
Cohesion: 0.17
Nodes (10): ComplianceAgentService, Any, Exception, One LLM call for intent + first questions; heuristic fallback if API fails., Extract structured intent from natural language input using LLM., Assemble structured profile after questioning; unknowns stay explicit., Generate the next batch of adaptive questions (max 10 total across the session)., Generate compliance roadmap from final profile; optional web-research context. (+2 more)

### Community 36 - "Compliance Roadmap"
Cohesion: 0.25
Nodes (7): Compliance Roadmap, Step 1 — Before starting, Step 2 — Registration/Application, Step 3 — Documents, Step 4 — Licences/Approvals, Step 5 — Ongoing compliance, Step 6 — Renewal/recurring obligations

### Community 38 - "LegalRAGService"
Cohesion: 0.33
Nodes (4): LegalRAGService, Any, Lightweight check: cited RAG ids exist and some evidence terms appear., Evidence-grounded RAG for Ask MARE-Juris. Hybrid retrieval + query…

### Community 39 - "LiveCaseLawAgent"
Cohesion: 0.12
Nodes (25): _clean_html_snippet(), LiveCaseLawAgent, Any, Agent 4: Live Case-Law API Research Agent. Isolated backend service that…, Executes live legal judgment research across external public APIs. Returns a…, Retrieves the complete document text from Indian Kanoon via /doc/<docid>/ as…, Strips HTML formatting and scripts while preserving text content., Agent 4: Live Case-Law API Research Agent. (+17 more)

### Community 40 - "MARE-Juris RAG Pipeline & Two-Answer System"
Cohesion: 0.25
Nodes (7): 1. Document Corpus Management, 2. Supabase Integration, 3. Two-Answer Dual Pipeline, 4. Source Comparison, 5. Security & Verification, Architecture Flow, MARE-Juris RAG Pipeline & Two-Answer System

### Community 41 - "20260913_legal_corpus.sql"
Cohesion: 0.40
Nodes (3): public.legal_chunks, public.legal_documents, public

### Community 44 - "compare/route.ts"
Cohesion: 0.67
Nodes (3): getBackendUrl(), maxDuration, POST()

### Community 46 - "ragimplementation.md"
Cohesion: 0.40
Nodes (4): Important, Key Points, Short Answer, Sources

### Community 49 - "LegalQueryAnalysisService"
Cohesion: 0.33
Nodes (4): LegalQueryAnalysisService, Any, LLM query understanding for Ask MARE-Juris (not Compliance Agent)., Merge clarification into a resolved legal research query.

### Community 50 - "ragupdate.md"
Cohesion: 0.25
Nodes (7): Important, Official Sources, RAG Sources, Short Answer, Sources, What this means, What you can do

### Community 51 - "get_supabase_client"
Cohesion: 0.15
Nodes (11): health_check(), get, Infrastructure Health Check Endpoint. Verifies FastAPI server running state,…, get_current_user(), get_current_user_token(), Extracts Bearer Token from HTTP Authorization Header., Validates Supabase JWT token and retrieves authenticated user object., get_supabase_client() (+3 more)

### Community 52 - "test_document_agent.py"
Cohesion: 0.07
Nodes (40): DocumentAgent, Any, Document Analysis Agent for MARE-Juris. Implements the standard agent interface…, Legal Document Analysis Agent., Executes document analysis and returns standard agent response contract., ClauseExcerpt, DocumentContextPackage, DocumentContextService (+32 more)

### Community 54 - "MARE-Juris RAG Evaluation Summary"
Cohesion: 0.14
Nodes (13): BNS, BSA, Citation & Grounding, Document Results, Latency, Limitations, MARE-Juris RAG Comprehensive Evaluation Report, MARE-Juris RAG Evaluation Summary (+5 more)

### Community 55 - "compute_chunk_upsert_state"
Cohesion: 0.24
Nodes (11): compute_chunk_upsert_state(), compute_content_hash(), Any, MARE-Juris Case-Law Idempotent Ingestion Service. Implements safe, idempotent…, Computes the exact state for chunk upsert respecting embedding freshness rules:…, Unit tests for embedding freshness and idempotency logic. Tests: 1. Unchanged…, test_changed_content_invalidates_old_embedding_when_null(), test_changed_content_with_new_embedding_updates() (+3 more)

### Community 56 - "MARE-Juris RAG Evaluation Summary"
Cohesion: 0.17
Nodes (11): BNS, BSA, Citation & Grounding, Document Results, Latency, Limitations, MARE-Juris RAG Evaluation Summary, Overall Results (Hybrid) (+3 more)

### Community 57 - "Idle prompt: MARE-Juris Case-Law Collection"
Cohesion: 0.25
Nodes (7): Credentials, Deliverables, Files, Goal, Idle prompt: MARE-Juris Case-Law Collection, Required behavior, Strict scope limits

### Community 58 - "MARE-Juris Case-Law Collection Setup"
Cohesion: 0.25
Nodes (7): API strategy, Before running collection, Full collection process, Included files, Legal and data-quality rules, MARE-Juris Case-Law Collection Setup, Set the Indian Kanoon token safely

### Community 59 - "main"
Cohesion: 0.52
Nodes (6): calc_mrr(), calc_ndcg_k(), calc_precision_k(), calc_recall_k(), llm_judge_hallucination(), main()

### Community 60 - "run_controlled_ingestion.py"
Cohesion: 0.60
Nodes (4): embed_batch(), get_db_connection(), Controlled Ingestion Script for 5 Cases into Case-Law Supabase Tables. Includes…, run_controlled_ingestion()

### Community 61 - "run_full_ingestion.py"
Cohesion: 0.23
Nodes (12): embed_batch_with_retry(), get_db_connection(), now_iso(), Any, Exception, QuotaExhaustedException, Safe, Resumable Case-Law Ingestion Pipeline for MARE-Juris. Target tables:…, Embeds a batch of texts using gemini-embedding-001 with robust error and rate-… (+4 more)

### Community 62 - "20261012000000_case_law_isolated_schema.sql"
Cohesion: 0.50
Nodes (3): public.case_law_chunks, public.case_law_documents, public

### Community 63 - "vercel.json"
Cohesion: 0.40
Nodes (4): builds, env, PYTHONPATH, rewrites

### Community 64 - "test_timeout_and_latency_hotfix.py"
Cohesion: 0.14
Nodes (20): Production Hotfix Timeout & Latency Regression Test Suite for MARE-Juris.…, Verify that if Source Comparison hangs, it triggers fallback without failing…, Verify that 3 independent agents run concurrently rather than sequentially., Verify that when all selected agents fail, combined answer includes…, Verify empty search results are reported as 'No records found' rather than…, Verify accurate classification of document-centric, hybrid, and general legal…, Verify that chat endpoint handles orchestrator timeouts at 28s with graceful…, Ensure compliance files remain completely unmodified. (+12 more)

### Community 73 - "MultiAgentOrchestrator"
Cohesion: 0.06
Nodes (59): classify_document_query_intent(), MultiAgentOrchestrator, Any, Multi-Agent Orchestrator for MARE-Juris Legal Assistant. Orchestrates the 4…, Executes Source Comparison Analysis across the executed agents. Preserves the…, Optional Citation and Source Verification flow. Audits citations, checks URLs,…, Orchestrates multi-agent execution, synthesis, comparison, and verification., Returns any unrecognized agent IDs requested by the client. (+51 more)

### Community 74 - "generate_all_diagrams.py"
Cohesion: 0.23
Nodes (37): draw_arrow(), draw_box(), draw_lifeline(), main(), make_fig_01(), make_fig_02(), make_fig_03(), make_fig_04() (+29 more)

### Community 75 - "createClient"
Cohesion: 0.22
Nodes (10): maxDuration, POST(), getBackendUrl(), POST(), POST(), AskJurisPage(), HomePage(), ChatInterface() (+2 more)

### Community 76 - "ChatInterface.tsx"
Cohesion: 0.17
Nodes (11): AgentResponseItem, AVAILABLE_AGENTS, ChatInterfaceProps, Citation, CombinedAnswerData, ComparisonData, Conversation, FollowUpInfo (+3 more)

### Community 77 - "DocumentExtractionService"
Cohesion: 0.14
Nodes (15): DocumentExtractionResult, DocumentExtractionService, ExtractedPage, Document Extraction Service for MARE-Juris. Supports: 1. Text-based PDFs…, Returns True if pytesseract and Tesseract OCR binary are both available., Validates file size, extension, and content type. Returns: (is_valid,…, Applies OpenCV image enhancement (grayscale, Otsu thresholding) for better OCR…, Runs OCR on a PIL Image and computes confidence score. Returns:… (+7 more)

### Community 78 - "documents.py"
Cohesion: 0.17
Nodes (14): DocumentDetailResponse, DocumentUploadResponse, get_document(), get_document_data(), Any, BaseModel, get, post (+6 more)

### Community 79 - "generate_full_reports.py"
Cohesion: 0.38
Nodes (13): add_bullet(), add_callout(), add_figure_image(), add_header_footer(), add_heading_styled(), add_p(), format_table(), build_complete_documentation.py Builds the complete MARE-Juris Project Report… (+5 more)

### Community 80 - "chat.py"
Cohesion: 0.22
Nodes (16): ChatMessageRequest, ChatMessageResponse, compare_sources(), CompareRequest, _history_for_analysis(), _load_conversation_messages(), Any, BaseModel (+8 more)

### Community 81 - "get_supabase_admin_client"
Cohesion: 0.20
Nodes (10): delete_conversation(), get_conversation_messages(), get_user_conversations(), delete, get, delete_document(), delete, Deletes an uploaded document and its chunks. (+2 more)

### Community 82 - "CaseLawCorpusAgent"
Cohesion: 0.22
Nodes (5): CaseLawCorpusAgent, Any, Agent 3: Case-Law Corpus Research Agent for MARE-Juris. Isolated service that…, Agent 3: Retrieves authoritative precedents from the curated Supabase case-law…, Executes vector search against public.match_case_law_chunks in Supabase.…

### Community 83 - "NewsRail.tsx"
Cohesion: 0.29
Nodes (5): NewsArticle, NewsCard(), NewsSkeleton(), LegalPlaceholder(), LegalPlaceholderProps

### Community 84 - "HomeContent.tsx"
Cohesion: 0.29
Nodes (5): ChatMessage, FloatingAssistant(), ComplianceInterface(), HomeContentProps, ComplianceScene3D()

### Community 85 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, corpus:status, dev, ingest:legal, lint, start

### Community 86 - "login/page.tsx"
Cohesion: 0.38
Nodes (3): LoginForm(), NewsRail(), ScalesOfJustice3D()

### Community 87 - "package.json"
Cohesion: 0.50
Nodes (3): name, private, version

## Knowledge Gaps
- **200 isolated node(s):** `extends`, `next/core-web-vitals`, `nextConfig`, `name`, `version` (+195 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `MultiAgentOrchestrator` connect `MultiAgentOrchestrator` to `test_timeout_and_latency_hotfix.py`, `test_document_agent.py`, `LiveCaseLawAgent`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `get_supabase_admin_client()` connect `get_supabase_admin_client` to `compliance.py`, `LegalRAGService`, `documents.py`, `chat.py`, `LegalRetrievalService`, `CaseLawCorpusAgent`, `get_supabase_client`, `main`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `get_document_data()` connect `documents.py` to `MultiAgentOrchestrator`, `get_supabase_admin_client`, `test_document_agent.py`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `extends`, `next/core-web-vitals`, `nextConfig` to the rest of the system?**
  _200 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `MARE-Juris — Complete Technical Metrics, Architecture & RAG Evaluation Report` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._