# Graph Report - MARE-Juris  (2026-08-27)

## Corpus Check
- 24 files · ~5,309 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 134 nodes · 148 edges · 20 communities (13 shown, 7 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.55)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `185c71c4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- MARE-Juris Legal AI System
- 20260827000000_initial_schema.sql
- Supabase & Resend Infrastructure Setup for MARE-Juris
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

## God Nodes (most connected - your core abstractions)
1. `Supabase & Resend Infrastructure Setup for MARE-Juris` - 11 edges
2. `get_supabase_client()` - 7 edges
3. `EmailService` - 6 edges
4. `public.conversations` - 6 edges
5. `scripts` - 5 edges
6. `public.evidence` - 5 edges
7. `public.claims` - 5 edges
8. `MARE-Juris Legal AI System` - 5 edges
9. `health_check()` - 4 edges
10. `public.document_chunks` - 4 edges

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

## Communities (20 total, 7 thin omitted)

### Community 0 - "MARE-Juris Legal AI System"
Cohesion: 0.20
Nodes (11): Initial Repository Structure ADR, Backend Server & API, Define Backend Stack & Setup Server, Ingest Legal Domain Datasets, Data Ingestion & Indexing Pipeline, Build Evaluation Benchmark Suite, Benchmark Test Harness & Metrics, Web Client UI (+3 more)

### Community 1 - "20260827000000_initial_schema.sql"
Cohesion: 0.19
Nodes (21): auth.users, public.handle_new_user, on_auth_user_created, public.agent_events, public.agent_runs, public.audit_results, public.citation_audits, public.claim_evidence (+13 more)

### Community 2 - "Supabase & Resend Infrastructure Setup for MARE-Juris"
Cohesion: 0.09
Nodes (21): 1. Environment Variables, 2. Authentication Configuration, 3. PostgreSQL Database Schema & Migration, 4. Row Level Security (RLS) Policies, 5. Private Storage Bucket Setup, 6. Frontend & Backend Integration Architecture, 7. IPv6 & Networking Considerations, 8. Migration Execution & Local Setup (+13 more)

### Community 3 - "get_supabase_client"
Cohesion: 0.16
Nodes (13): health_check(), get, Infrastructure Health Check Endpoint. Verifies FastAPI server running state,…, get_current_user(), get_current_user_token(), Extracts Bearer Token from HTTP Authorization Header., Validates Supabase JWT token and retrieves authenticated user object., get_supabase_admin_client() (+5 more)

### Community 6 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, next, react, react-dom, @supabase/ssr, @supabase/supabase-js, next, react (+3 more)

### Community 7 - "EmailService"
Cohesion: 0.24
Nodes (5): EmailService, Sends a transactional application email using Resend API., Notifies user when legal document analysis completes., Notifies user regarding a compliance check update., Reusable Resend Transactional Email Service. Handles application-level…

### Community 8 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 9 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @types/node, @types/react, @types/react-dom, typescript, @types/node, @types/react, @types/react-dom (+1 more)

## Knowledge Gaps
- **39 isolated node(s):** `name`, `version`, `private`, `dev`, `build` (+34 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _39 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Supabase & Resend Infrastructure Setup for MARE-Juris` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._