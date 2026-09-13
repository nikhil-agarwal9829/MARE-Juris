# Graph Report - MARE-Juris  (2026-09-13)

## Corpus Check
- 91 files · ~150,061 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 384 nodes · 487 edges · 49 communities (35 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.55)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `561b11f0`
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
- createClient
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
- get_supabase_client
- WebResearchService
- MARE-Juris Dual-Source Legal RAG & Web Research Architecture
- 20260913_legal_corpus.sql
- MARE-Juris Initial Legal Corpus
- ingest_legal_documents.py

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 17 edges
2. `compilerOptions` - 16 edges
3. `get_supabase_admin_client()` - 14 edges
4. `createClient()` - 9 edges
5. `LegalRAGService` - 8 edges
6. `WebResearchService` - 8 edges
7. `Navbar()` - 8 edges
8. `Supabase & Brevo Infrastructure Setup for MARE-Juris` - 8 edges
9. `get_supabase_client()` - 7 edges
10. `scripts` - 7 edges

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

## Communities (49 total, 14 thin omitted)

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
Cohesion: 0.10
Nodes (23): ChatMessageRequest, ChatMessageResponse, compare_sources(), CompareRequest, delete_conversation(), get_conversation_messages(), get_user_conversations(), BaseModel (+15 more)

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
Cohesion: 0.11
Nodes (17): ForgotPasswordPage(), OtpPage(), ResetPasswordPage(), SignupPage(), VerificationState, VerifyEmailContent(), ChatMessage, FloatingAssistant() (+9 more)

### Community 17 - "createClient"
Cohesion: 0.17
Nodes (13): generateLegalAnalysis(), getFallbackCitations(), POST(), POST(), AskJurisPage(), HomePage(), ChatInterface(), ChatInterfaceProps (+5 more)

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
Cohesion: 0.28
Nodes (12): analyze_compliance(), AnalyzeRequest, extract_intent(), generate_questions(), get_history(), IntentRequest, BaseModel, get (+4 more)

### Community 34 - "ComplianceAgentService"
Cohesion: 0.24
Nodes (5): ComplianceAgentService, Any, Generate verified compliance roadmap matrix with official government sources., Extract structured business intent from natural language input., Generate 3-5 smart, non-repetitive adaptive questions based on intent.

### Community 38 - "get_supabase_client"
Cohesion: 0.15
Nodes (11): health_check(), get, Infrastructure Health Check Endpoint. Verifies FastAPI server running state,…, get_current_user(), get_current_user_token(), Extracts Bearer Token from HTTP Authorization Header., Validates Supabase JWT token and retrieves authenticated user object., get_supabase_client() (+3 more)

### Community 39 - "WebResearchService"
Cohesion: 0.26
Nodes (5): Any, Live Official Web Research Engine for MARE-Juris. Simulates fetching current…, Compares the MARE-Juris RAG output with the Live Web Research output and…, Executes Live Official Web Research pipeline. Currently uses a high-fidelity…, WebResearchService

### Community 40 - "MARE-Juris Dual-Source Legal RAG & Web Research Architecture"
Cohesion: 0.25
Nodes (7): 1. Overview, 2. Architecture Diagram, 3. Database Schema (Supabase), 4. Legal-Aware Chunking Strategy, 5. Security & Hallucination Prevention, 6. Live Official Web Research, MARE-Juris Dual-Source Legal RAG & Web Research Architecture

### Community 41 - "20260913_legal_corpus.sql"
Cohesion: 0.40
Nodes (3): public, public.legal_chunks, public.legal_documents

## Knowledge Gaps
- **98 isolated node(s):** `extends`, `next/core-web-vitals`, `nextConfig`, `name`, `version` (+93 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_supabase_admin_client()` connect `get_supabase_admin_client` to `compliance.py`, `get_supabase_client`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `extends`, `next/core-web-vitals`, `nextConfig` to the rest of the system?**
  _98 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `get_supabase_admin_client` be split into smaller, more focused modules?**
  _Cohesion score 0.1032258064516129 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `createClient` be split into smaller, more focused modules?**
  _Cohesion score 0.11428571428571428 - nodes in this community are weakly interconnected._