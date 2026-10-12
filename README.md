# MARE-Juris

**Multi-Agent Retrieval-Enhanced Framework for Intelligent Legal Decision Support**

MARE-Juris is an Indian legal research platform that answers legal questions with source citations. It uses a **dual-answer architecture**: a controlled-corpus RAG answer and a separate live research pipeline over official sources, so the origin of every piece of evidence is always clear.

---

## Features

- **Dual-answer research**
  - **Ask MARE-Juris (RAG):** answers grounded only in a controlled corpus of Indian statutes.
  - **Live Official Research:** independently searches current official sources (e.g. India Code), so it can answer questions outside the corpus.
- **Hybrid retrieval:** semantic vector search (pgvector) combined with BM25 keyword search to catch both paraphrased questions and exact section numbers or defined terms.
- **Coverage awareness:** every RAG result is classified as `FULLY_SUPPORTED`, `PARTIALLY_SUPPORTED` or `NOT_SUPPORTED`.
- **Grounded citations:** answers carry citation IDs (`[RAG-1]`, `OFFICIAL_WEB`), and a verifier checks that every cited ID exists in the supplied evidence.
- **Abstains when unsure:** if the corpus has no supporting evidence, the system declines instead of making unsupported legal claims.
- **Prompt-injection awareness:** retrieved text is treated as untrusted data.
- **Separate agents:** legal research, a Compliance Agent and a Website Assistant are independent services.
- **Auth and privacy:** Supabase Auth (JWT), Row Level Security and per-user storage paths.

---

## How it works

```
User question
    -> Next.js UI + API route
    -> FastAPI orchestration
    -> Query analysis (effective legal query)
         |-- A. RAG (controlled corpus)
         |      expand (<=14 variants) -> vector + BM25 -> fuse -> rerank -> evidence -> Gemini -> verify
         |-- B. Live official research
                official sources -> independent evidence -> Gemini synthesis
    -> Response: two answers with labelled citations
```

### RAG pipeline

1. **Query:** the user's question is turned into an effective legal query.
2. **Expand:** up to 14 variants using semantic phrases and synonym packs (5-8 retrieval concepts).
3. **Retrieve:** pgvector HNSW cosine search (top 25 per variant) and in-process BM25 (top 20 per variant).
4. **Fuse:** candidates are merged by chunk ID and scored at 0.55 vector + 0.45 BM25.
5. **Select:** top 12 reranked candidates, then 8 evidence items.
6. **Generate:** Gemini writes the answer using only the supplied evidence, with citations.
7. **Verify:** the grounding verifier checks the cited IDs.

### Key parameters

| Parameter | Value |
|---|---|
| Embedding model / dimension | `text-embedding-004` / 768 |
| Max query variants | 14 |
| Vector top-K per variant | 25 |
| BM25 top-K per variant | 20 |
| Hybrid weights | 0.55 vector / 0.45 BM25 |
| Rerank top-K / final evidence K | 12 / 8 |
| Vector similarity threshold | 0.015 |
| Partial / full coverage thresholds | 0.10 / 0.38 |
| BM25 k1 / b | 1.2 / 0.75 |
| Vector index | HNSW (cosine) |

### Controlled corpus

| Document | Coverage |
|---|---|
| Bharatiya Nyaya Sanhita, 2023 (BNS) | Criminal offences and punishments |
| Right to Information Act, 2005 (RTI) | Access to information, PIO duties, timelines |
| Bharatiya Sakshya Adhiniyam, 2023 (BSA) | Law of evidence, incl. electronic evidence |

About 191 pages in total.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | FastAPI, Uvicorn, Pydantic |
| Database | PostgreSQL on Supabase (19 tables) |
| Vector search | pgvector with HNSW |
| Auth | Supabase Auth / JWT, Row Level Security |
| Embeddings | Google `text-embedding-004` |
| LLM | Google Gemini (primary and fallback models) |
| Lexical retrieval | Custom Python BM25 |
| PDF processing | pypdf |
| Research / HTTP | httpx, official APIs, Puppeteer |
| Email | Resend |

The system exposes 7 backend API routes and 4 frontend API routes.

---

## Getting started

> Replace the placeholders below with your actual repo layout and variable names.

### Prerequisites

- Node.js 18+
- Python 3.10+
- A Supabase project with the `pgvector` extension enabled
- A Google AI (Gemini) API key

### 1. Clone

```bash
git clone <your-repo-url>
cd mare-juris
```

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # add your keys
uvicorn main:app --reload
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local       # add your keys
npm run dev
```

### 4. Ingest the corpus

Run your ingestion script to extract text from the legal PDFs, chunk it, embed it with `text-embedding-004`, and store it in Supabase.

### Environment variables (examples)

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
RESEND_API_KEY=
```

Never commit real secrets. Keep them in environment configuration.

---

## Design principles

- **Evidence first:** Gemini synthesizes supplied evidence; it is not the legal source.
- **Hybrid over single-method retrieval:** semantic and lexical signals complement each other.
- **Explicit provenance:** RAG evidence and official-web evidence are always labelled separately.
- **Modularity:** retrieval, analysis, web research and compliance are separate services.

---

## Limitations and roadmap

- The controlled corpus currently covers three statutes; expanding it is the main next step.
- A formal retrieval and answer-quality evaluation (test question set, hit rate, citation accuracy) is still to be added.
- Fusion weights and coverage thresholds are fixed values and could be tuned against an evaluation set.

---

## Disclaimer

MARE-Juris is a research aid and does not provide legal advice. Always verify answers against the official text of the law and consult a qualified professional.

---

