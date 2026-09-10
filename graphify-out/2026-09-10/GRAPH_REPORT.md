# Graph Report - MARE-Juris  (2026-08-28)

## Corpus Check
- 48 files · ~12,622 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 220 nodes · 262 edges · 30 communities (20 shown, 10 thin omitted)
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
- get_supabase_client
- Project Context & Objectives
- Research & Technical Gaps
- dependencies
- EmailService
- package.json
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
- include
- .eslintrc.json
- layout.tsx
- next.config.js

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `createClient()` - 15 edges
3. `Supabase & Brevo Infrastructure Setup for MARE-Juris` - 8 edges
4. `get_supabase_client()` - 7 edges
5. `createClient()` - 7 edges
6. `EmailService` - 6 edges
7. `public.conversations` - 6 edges
8. `scripts` - 5 edges
9. `include` - 5 edges
10. `public.evidence` - 5 edges

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

### Community 3 - "get_supabase_client"
Cohesion: 0.16
Nodes (13): health_check(), get, Infrastructure Health Check Endpoint. Verifies FastAPI server running state,…, get_current_user(), get_current_user_token(), Extracts Bearer Token from HTTP Authorization Header., Validates Supabase JWT token and retrieves authenticated user object., get_supabase_admin_client() (+5 more)

### Community 6 - "dependencies"
Cohesion: 0.12
Nodes (17): clsx, dependencies, clsx, lucide-react, next, react, react-dom, @supabase/ssr (+9 more)

### Community 7 - "EmailService"
Cohesion: 0.24
Nodes (5): EmailService, Sends a transactional application email using Brevo REST API v3., Notifies user when legal document analysis completes., Reusable Brevo Transactional Email Service. Handles application-level…, Notifies user regarding a compliance check update.

### Community 8 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 9 - "devDependencies"
Cohesion: 0.11
Nodes (19): autoprefixer, eslint, eslint-config-next, devDependencies, autoprefixer, eslint, eslint-config-next, postcss (+11 more)

### Community 16 - "createClient"
Cohesion: 0.15
Nodes (12): ForgotPasswordPage(), OtpPage(), ResetPasswordPage(), SignupPage(), VerifyEmailContent(), LoginForm(), HomeContent(), HomeContentProps (+4 more)

### Community 17 - "createClient"
Cohesion: 0.46
Nodes (4): GET(), HomePage(), IndexPage(), createClient()

### Community 20 - "compilerOptions"
Cohesion: 0.11
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 21 - "NewsRail.tsx"
Cohesion: 0.29
Nodes (5): NewsArticle, NewsCard(), NewsSkeleton(), LegalPlaceholder(), LegalPlaceholderProps

### Community 22 - "include"
Cohesion: 0.25
Nodes (7): exclude, include, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx

## Knowledge Gaps
- **70 isolated node(s):** `extends`, `next/core-web-vitals`, `nextConfig`, `name`, `version` (+65 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `extends`, `next/core-web-vitals`, `nextConfig` to the rest of the system?**
  _70 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `createClient` be split into smaller, more focused modules?**
  _Cohesion score 0.14666666666666667 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._