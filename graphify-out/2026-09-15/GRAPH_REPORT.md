# Graph Report - MARE-Juris  (2026-09-15)

## Corpus Check
- 94 files · ~150,279 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 444 nodes · 609 edges · 51 communities (37 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.55)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c93fce13`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- MARE-Juris Legal AI System
- 20260827000000_initial_schema.sql
- Supabase & Brevo Infrastructure Setup for MARE-Juris
- get_supabase_admin_client
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
- NewsRail.tsx
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
- WebResearchService
- MARE-Juris RAG Pipeline & Two-Answer System
- 20260913_legal_corpus.sql
- MARE-Juris Initial Legal Corpus
- ingest_legal_documents.py
- LegalQueryAnalysisService
- ragupdate.md

## God Nodes (most connected - your core abstractions)
1. `ComplianceAgentService` - 17 edges
2. `createClient()` - 17 edges
3. `get_supabase_admin_client()` - 16 edges
4. `compilerOptions` - 16 edges
5. `LegalRetrievalService` - 13 edges
6. `WebResearchService` - 11 edges
7. `LegalRAGService` - 10 edges
8. `Navbar()` - 9 edges
9. `createClient()` - 9 edges
10. `Supabase & Brevo Infrastructure Setup for MARE-Juris` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Initial Repository Structure ADR` --DEFINES_STRUCTURE--> `MARE-Juris Legal AI System`  [EXTRACTED]
  docs/DECISIONS.md → README.md
- `MARE-Juris Legal AI System` --CONTAINS--> `Data Ingestion & Indexing Pipeline`  [EXTRACTED]
  README.md → docs/ARCHITECTURE.md
- `MARE-Juris Legal AI System` --CONTAINS--> `Benchmark Test Harness & Metrics`  [EXTRACTED]
  README.md → docs/ARCHITECTURE.md
- `MARE-Juris Legal AI System` --CONTAINS--> `Backend Server & API`  [EXTRACTED]
  README.md → docs/ARCHITECTURE.md
- `MARE-Juris Legal AI System` --CONTAINS--> `Web Client UI`  [EXTRACTED]
  README.md → docs/ARCHITECTURE.md

## Import Cycles
- None detected.

## Communities (51 total, 14 thin omitted)

### Community 0 - "MARE-Juris Legal AI System"
Cohesion: 0.20
Nodes (11): Initial Repository Structure ADR, Backend Server & API, Define Backend Stack & Setup Server, Ingest Legal Domain Datasets, Data Ingestion & Indexing Pipeline, Build Evaluation Benchmark Suite, Benchmark Test Harness & Metrics, Web Client UI (+3 more)

### Community 1 - "20260827000000_initial_schema.sql"
Cohesion: 0.19
Nodes (21): public.handle_new_user, on_auth_user_created, public.agent_events, public.agent_runs, public.audit_results, public.citation_audits, public.claim_evidence, public.claims (+13 more)

### Community 2 - "Supabase & Brevo Infrastructure Setup for MARE-Juris"
Cohesion: 0.15
Nodes (12): 1. Environment Variables, 2. Authentication & Brevo Custom SMTP Setup, 3. PostgreSQL Database Schema & Migration, 4. Row Level Security (RLS) Policies, 5. Private Storage Bucket Setup, 6. Security Audit Checklist, Architecture Overview, Brevo Custom SMTP Settings for Supabase Dashboard (+4 more)

### Community 3 - "get_supabase_admin_client"
Cohesion: 0.09
Nodes (28): health_check(), get, Infrastructure Health Check Endpoint. Verifies FastAPI server running state,…, ChatMessageRequest, ChatMessageResponse, compare_sources(), CompareRequest, delete_conversation() (+20 more)

### Community 6 - "dependencies"
Cohesion: 0.07
Nodes (27): clsx, dependencies, clsx, lucide-react, next, puppeteer, react, react-dom (+19 more)

### Community 7 - "EmailService"
Cohesion: 0.24
Nodes (5): EmailService, Sends a transactional application email using Brevo REST API v3., Notifies user when legal document analysis completes., Reusable Brevo Transactional Email Service. Handles application-level…, Notifies user regarding a compliance check update.

### Community 8 - "literacy/page.tsx"
Cohesion: 0.23
Nodes (11): LiteracyPage(), RightCard(), RightCardProps, RightDetailPanel(), RightDetailPanelProps, RightsHero(), RightsHeroProps, getCategories() (+3 more)

### Community 9 - "devDependencies"
Cohesion: 0.07
Nodes (29): autoprefixer, eslint, eslint-config-next, devDependencies, autoprefixer, eslint, eslint-config-next, postcss (+21 more)

### Community 16 - "createClient"
Cohesion: 0.07
Nodes (32): POST(), POST(), AskJurisPage(), ForgotPasswordPage(), OtpPage(), HomePage(), ResetPasswordPage(), SignupPage() (+24 more)

### Community 17 - "LegalRetrievalService"
Cohesion: 0.24
Nodes (4): LegalRetrievalService, Any, Returns (citations, coverage_status). coverage_status: fully_supported |…, Hybrid retrieval: Supabase pgvector + local corpus BM25 over ingested PDFs.

### Community 19 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, framework, outputDirectory

### Community 20 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+18 more)

### Community 21 - "NewsRail.tsx"
Cohesion: 0.29
Nodes (5): NewsArticle, NewsCard(), NewsSkeleton(), LegalPlaceholder(), LegalPlaceholderProps

### Community 30 - "LegalQueryClassifier"
Cohesion: 0.40
Nodes (3): LegalQueryClassifier, Any, Semantic Legal Query Relevance Classifier for MARE-Juris. Evaluates intent…

### Community 33 - "compliance.py"
Cohesion: 0.26
Nodes (15): AnalyzeRequest, extract_intent(), generate_questions(), generate_roadmap(), IntentRequest, BaseModel, Exception, post (+7 more)

### Community 34 - "ComplianceAgentService"
Cohesion: 0.17
Nodes (10): ComplianceAgentService, Any, Exception, One LLM call for intent + first questions; heuristic fallback if API fails., Extract structured intent from natural language input using LLM., Assemble structured profile after questioning; unknowns stay explicit., Generate the next batch of adaptive questions (max 10 total across the session)., Generate compliance roadmap from final profile; optional web-research context. (+2 more)

### Community 36 - "Compliance Roadmap"
Cohesion: 0.25
Nodes (7): Compliance Roadmap, Step 1 — Before starting, Step 2 — Registration/Application, Step 3 — Documents, Step 4 — Licences/Approvals, Step 5 — Ongoing compliance, Step 6 — Renewal/recurring obligations

### Community 38 - "LegalRAGService"
Cohesion: 0.29
Nodes (4): LegalRAGService, Any, Lightweight check: cited RAG ids exist and some evidence terms appear., Evidence-grounded RAG for Ask MARE-Juris. Hybrid retrieval + query…

### Community 39 - "WebResearchService"
Cohesion: 0.32
Nodes (3): Any, Live official-source research (independent from RAG corpus)., WebResearchService

### Community 40 - "MARE-Juris RAG Pipeline & Two-Answer System"
Cohesion: 0.25
Nodes (7): 1. Document Corpus Management, 2. Supabase Integration, 3. Two-Answer Dual Pipeline, 4. Source Comparison, 5. Security & Verification, Architecture Flow, MARE-Juris RAG Pipeline & Two-Answer System

### Community 41 - "20260913_legal_corpus.sql"
Cohesion: 0.40
Nodes (3): public, public.legal_chunks, public.legal_documents

### Community 49 - "LegalQueryAnalysisService"
Cohesion: 0.39
Nodes (3): LegalQueryAnalysisService, Any, LLM query understanding for Ask MARE-Juris (not Compliance Agent).

### Community 50 - "ragupdate.md"
Cohesion: 0.25
Nodes (7): Important, Official Sources, RAG Sources, Short Answer, Sources, What this means, What you can do

## Knowledge Gaps
- **114 isolated node(s):** `extends`, `next/core-web-vitals`, `nextConfig`, `name`, `version` (+109 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_supabase_admin_client()` connect `get_supabase_admin_client` to `LegalRAGService`, `compliance.py`, `LegalRetrievalService`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `ComplianceAgentService` connect `ComplianceAgentService` to `compliance.py`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `WebResearchService` connect `WebResearchService` to `compliance.py`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `extends`, `next/core-web-vitals`, `nextConfig` to the rest of the system?**
  _114 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `get_supabase_admin_client` be split into smaller, more focused modules?**
  _Cohesion score 0.08912655971479501 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._