# Graph Report - MARE-Juris  (2026-08-26)

## Corpus Check
- Corpus is ~449 words - fits in a single context window. You may not need a graph.

## Summary
- 13 nodes · 11 edges · 6 communities (2 shown, 4 thin omitted)
- Extraction: 45% EXTRACTED · 55% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.5)
- Token cost: 1,200 input · 450 output

## Community Hubs (Navigation)
- Core System Architecture
- Backend Infrastructure
- Evaluation & Benchmarks
- Frontend Interface
- Project Objectives & Context
- Research & Technical Gaps

## God Nodes (most connected - your core abstractions)
1. `MARE-Juris Legal AI System` - 5 edges
2. `Backend Server & API` - 3 edges
3. `Web Client UI` - 3 edges
4. `Data Ingestion & Indexing Pipeline` - 2 edges
5. `Benchmark Test Harness & Metrics` - 2 edges
6. `Technology Stack Specification` - 2 edges
7. `Initial Repository Structure ADR` - 1 edges
8. `Define Backend Stack & Setup Server` - 1 edges
9. `Setup Frontend Application Scaffold` - 1 edges
10. `Ingest Legal Domain Datasets` - 1 edges

## Surprising Connections (you probably didn't know these)
- `MARE-Juris Legal AI System` --CONTAINS--> `Benchmark Test Harness & Metrics`  [EXTRACTED]
  README.md → docs/ARCHITECTURE.md
- `Initial Repository Structure ADR` --DEFINES_STRUCTURE--> `MARE-Juris Legal AI System`  [EXTRACTED]
  docs/DECISIONS.md → README.md
- `MARE-Juris Legal AI System` --CONTAINS--> `Backend Server & API`  [EXTRACTED]
  README.md → docs/ARCHITECTURE.md
- `MARE-Juris Legal AI System` --CONTAINS--> `Data Ingestion & Indexing Pipeline`  [EXTRACTED]
  README.md → docs/ARCHITECTURE.md
- `MARE-Juris Legal AI System` --CONTAINS--> `Web Client UI`  [EXTRACTED]
  README.md → docs/ARCHITECTURE.md

## Communities (6 total, 4 thin omitted)

### Community 0 - "Core System Architecture"
Cohesion: 0.50
Nodes (4): Initial Repository Structure ADR, Ingest Legal Domain Datasets, Data Ingestion & Indexing Pipeline, MARE-Juris Legal AI System

### Community 1 - "Backend Infrastructure"
Cohesion: 0.67
Nodes (3): Backend Server & API, Define Backend Stack & Setup Server, Technology Stack Specification

## Knowledge Gaps
- **7 isolated node(s):** `Initial Repository Structure ADR`, `Define Backend Stack & Setup Server`, `Setup Frontend Application Scaffold`, `Ingest Legal Domain Datasets`, `Build Evaluation Benchmark Suite` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `MARE-Juris Legal AI System` connect `Core System Architecture` to `Backend Infrastructure`, `Evaluation & Benchmarks`, `Frontend Interface`?**
  _High betweenness centrality (0.530) - this node is a cross-community bridge._
- **Why does `Backend Server & API` connect `Backend Infrastructure` to `Core System Architecture`?**
  _High betweenness centrality (0.182) - this node is a cross-community bridge._
- **Why does `Web Client UI` connect `Frontend Interface` to `Core System Architecture`, `Backend Infrastructure`?**
  _High betweenness centrality (0.182) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Backend Server & API` (e.g. with `Define Backend Stack & Setup Server` and `Technology Stack Specification`) actually correct?**
  _`Backend Server & API` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `Web Client UI` (e.g. with `Setup Frontend Application Scaffold` and `Technology Stack Specification`) actually correct?**
  _`Web Client UI` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Initial Repository Structure ADR`, `Define Backend Stack & Setup Server`, `Setup Frontend Application Scaffold` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._