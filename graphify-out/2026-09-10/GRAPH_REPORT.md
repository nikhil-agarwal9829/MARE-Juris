# Graph Report - MARE-Juris  (2026-09-10)

## Corpus Check
- 55 files · ~20,244 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 264 nodes · 333 edges · 30 communities (20 shown, 10 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.55)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9fe73661`
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
- LegalRAGService
- devDependencies
- Settings
- root
- middleware.ts
- rules/graphify.md
- workflows/graphify.md
- createClient
- createClient
- compilerOptions
- NewsRail.tsx
- .eslintrc.json
- layout.tsx
- next.config.js

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 17 edges
2. `compilerOptions` - 16 edges
3. `get_supabase_admin_client()` - 9 edges
4. `createClient()` - 9 edges
5. `Supabase & Brevo Infrastructure Setup for MARE-Juris` - 8 edges
6. `get_supabase_client()` - 7 edges
7. `LegalRAGService` - 7 edges
8. `EmailService` - 6 edges
9. `Navbar()` - 6 edges
10. `public.conversations` - 6 edges

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

## Communities (30 total, 10 thin omitted)

### Community 0 - "MARE-Juris Legal AI System"
Cohesion: 0.20
Nodes (11): Initial Repository Structure ADR, Backend Server & API, Define Backend Stack & Setup Server, Ingest Legal Domain Datasets, Data Ingestion & Indexing Pipeline, Build Evaluation Benchmark Suite, Benchmark Test Harness & Metrics, Web Client UI (+3 more)

### Community 1 - "20260827000000_initial_schema.sql"
Cohesion: 0.19
Nodes (21): auth.users, public.handle_new_user, on_auth_user_created, public.agent_events, public.agent_runs, public.audit_results, public.citation_audits, public.claim_evidence (+13 more)

### Community 2 - "Supabase & Brevo Infrastructure Setup for MARE-Juris"
Cohesion: 0.15
Nodes (12): 1. Environment Variables, 2. Authentication & Brevo Custom SMTP Setup, 3. PostgreSQL Database Schema & Migration, 4. Row Level Security (RLS) Policies, 5. Private Storage Bucket Setup, 6. Security Audit Checklist, Architecture Overview, Brevo Custom SMTP Settings for Supabase Dashboard (+4 more)

### Community 3 - "get_supabase_admin_client"
Cohesion: 0.08
Nodes (27): health_check(), get, Infrastructure Health Check Endpoint. Verifies FastAPI server running state,…, ChatMessageRequest, ChatMessageResponse, delete_conversation(), get_conversation_messages(), get_user_conversations() (+19 more)

### Community 6 - "dependencies"
Cohesion: 0.08
Nodes (25): clsx, dependencies, clsx, lucide-react, next, react, react-dom, @supabase/ssr (+17 more)

### Community 7 - "EmailService"
Cohesion: 0.24
Nodes (5): EmailService, Sends a transactional application email using Brevo REST API v3., Notifies user when legal document analysis completes., Reusable Brevo Transactional Email Service. Handles application-level…, Notifies user regarding a compliance check update.

### Community 8 - "LegalRAGService"
Cohesion: 0.33
Nodes (4): Any, LegalRAGService, Evidence-Grounded RAG Engine for MARE-Juris Legal Intelligence Platform.…, Processes a legal query through the RAG pipeline, generating grounded analysis…

### Community 9 - "devDependencies"
Cohesion: 0.11
Nodes (19): autoprefixer, eslint, eslint-config-next, devDependencies, autoprefixer, eslint, eslint-config-next, postcss (+11 more)

### Community 16 - "createClient"
Cohesion: 0.12
Nodes (16): ForgotPasswordPage(), OtpPage(), ResetPasswordPage(), SignupPage(), VerificationState, VerifyEmailContent(), ChatMessage, FloatingAssistant() (+8 more)

### Community 17 - "createClient"
Cohesion: 0.17
Nodes (13): generateLegalAnalysis(), getFallbackCitations(), POST(), ChatPage(), HomePage(), IndexPage(), ChatInterface(), ChatInterfaceProps (+5 more)

### Community 20 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+18 more)

### Community 21 - "NewsRail.tsx"
Cohesion: 0.29
Nodes (5): NewsArticle, NewsCard(), NewsSkeleton(), LegalPlaceholder(), LegalPlaceholderProps

## Knowledge Gaps
- **77 isolated node(s):** `extends`, `next/core-web-vitals`, `nextConfig`, `name`, `version` (+72 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `dependencies`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `createClient`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `extends`, `next/core-web-vitals`, `nextConfig` to the rest of the system?**
  _77 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `get_supabase_admin_client` be split into smaller, more focused modules?**
  _Cohesion score 0.0846774193548387 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `createClient` be split into smaller, more focused modules?**
  _Cohesion score 0.12473118279569892 - nodes in this community are weakly interconnected._