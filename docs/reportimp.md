MARE-JURIS — COMPLETE TECHNICAL METRICS, ARCHITECTURE & RAG EVALUATION REPORT

PURPOSE

Create a faculty-review-ready technical report for the MARE-Juris project.

This is NOT a request to invent impressive numbers.

Inspect the actual repository, configuration files, database/RAG code, ingestion scripts, Supabase schema, API routes, frontend, environment configuration structure, package manifests, documentation, and available logs/results.

Measure or derive every metric that can be reliably determined from the implementation.

For every number, clearly label it as:

MEASURED — directly observed from repository/database/runtime/logs

CALCULATED — mathematically derived from measured values

CONFIGURED — parameter currently set in code

ESTIMATED — only if estimation is unavoidable

NOT AVAILABLE — cannot be verified

NEVER invent a number.

If a metric cannot be measured without credentials or production access, state exactly what is missing.

The report must explain for every important metric:

What it means

Why it is used

Where it is configured/implemented

How it affects MARE-Juris

Whether higher/lower is better

Whether it is an implementation parameter or an evaluation result

============================================================

EXECUTIVE PROJECT SNAPSHOT
============================================================

Create a table containing:

Project name

Purpose

Frontend framework/version

Backend framework/version

Programming languages

Database

Vector database technology

Embedding technology/model

Embedding dimension

Retrieval methods

Reranking technology/model

LLM provider/model(s)

Live web/API research technology

Authentication

Storage

Deployment platform

Actual controlled legal corpus size

Number of legal documents

Number of chunks

Number of embeddings

Number of API routes

Number of major agents/modules

Number of retrieval stages

Inspect the code. Do not assume values.

Create a table:

Layer | Technology | Version | Purpose | Where used | Why selected

Inspect actual:

Next.js, React, TypeScript

CSS/Tailwind/UI libraries

Markdown renderer

Python/FastAPI/Node/Next API routes

Pydantic/schema validation

LLM provider/models

embedding model/dimension

reranker

NLP libraries

Supabase/PostgreSQL/pgvector

BM25

hybrid retrieval

query expansion

evidence normalization

claim planning

citation verification

storage

India Code API

official web research

authentication

Vercel/deployment

build/lint/type checking

logging/error handling

Inspect the actual legal-documents directory AND database.

Create:
Document # | Title | Year | Type | Source | Official URL | Local file | File size | Pages | Chunks | Embeddings | BM25 indexed | Vector indexed | Active | Checksum | Last verified

Verify the actual corpus count.

Compare intended corpus versus actual corpus.

If extra documents such as the Right to Information Act have been added, explicitly report them.

Measure/calculate:

total documents

total PDF files

total pages

total extracted characters

total words

total chunks

average/median/min/max chunks per document

total embeddings

embeddings per document/chunk

embedding dimension

missing embeddings

empty chunks

duplicate chunks/documents

database row counts

storage size if measurable

Show formulas for calculated metrics.

Inspect the real chunking implementation.

Report:

chunk size and unit

overlap

overlap percentage

min/max/average observed chunk size

legal section awareness

subsection handling

page/chapter/section metadata

heading detection

provision boundaries

schedules/annexures handling if implemented

Explain why legal-aware chunking matters.

Formula:
overlap percentage = overlap / chunk_size × 100

Report actual:

provider

model

vector dimension

preprocessing

normalization

batch size

retry logic

successful/failed embeddings

storage type

vector index

distance metric

Explain semantic retrieval with an example:
User says "tenant"; law may use "lessee".

Verify ingestion and query embeddings use compatible model/dimension.

Inspect the implementation and report:

similarity/distance metric

vector Top-K

raw similarity threshold

relevance thresholds

score normalization

rerank score

fusion formulas if present

If cosine similarity is used, explain:

cosine_similarity(A,B) = (A·B)/(||A|| ||B||)

Explain:

what higher/lower score means

threshold effect on precision/recall

difference between similarity and distance

Distinguish textbook explanation from actual configured values.

Search the entire codebase for all retrieval parameters, including:
VECTOR_TOP_K
BM25_TOP_K
RERANK_TOP_K
FINAL_EVIDENCE_K
VECTOR_MIN_RAW_SIMILARITY
MIN_RELEVANCE_PARTIAL
MIN_RELEVANCE_FULL
other thresholds
candidate limits
fusion weights
reranker thresholds
timeouts

Report current values and visible historical changes.

At minimum investigate:
VECTOR_MIN_RAW_SIMILARITY: previous 0.02, current 0.015
MIN_RELEVANCE_PARTIAL: previous 0.15, current 0.10
VECTOR_TOP_K: previous 20, current 25

Do not assume these are the only parameters.

For every parameter explain:

what it means

why it exists

expected benefit

risk/tradeoff

whether higher/lower is generally better

actual current value

Example:
VECTOR_TOP_K = 25 means up to 25 vector candidates are considered before later filtering/reranking.

Do not claim a parameter improved accuracy unless measured.

Inspect actual BM25 implementation.

Report:

implementation/library

indexed chunk count

tokenizer

stopword handling

stemming if any

k1

b

Top-K

query expansion

root-level PDF handling

indexing time if available

Explain why BM25 complements vector search:
vector = semantic similarity
BM25 = lexical/statutory term matching

Include formula if available:
BM25(D,Q) = sum IDF(q) * [f(q,D)(k1+1)] / [f(q,D)+k1(1-b+b|D|/avgdl)]

Inspect exactly how vector and BM25 results are combined.

Report:

vector candidates

BM25 candidates

merge method

deduplication

score normalization

fusion weights

ranking formula

reranker input count

final evidence count

If:
hybrid_score = alpha*vector_score + (1-alpha)*bm25_score
report actual alpha only if implemented.

Explain why hybrid retrieval is used.

Inspect:

legal_query_analysis.py

legal_classifier.py

query analysis logic

query expansion

follow-up handling

Report:

LLM/model

classifier

categories

legal/non-legal detection

retrieval concept generation

fallback synonym packs

conversation context

resolved-query construction

Report all actually implemented retrieval concept/synonym packs.

For each:
Topic | Number of concepts | Examples | File/function

Clearly distinguish:
LLM-generated retrieval concepts
from
hardcoded fallback concepts.

Explain that fallback packs should supplement, not replace, semantic retrieval.

Inspect actual reranker.

Report:

model

provider

candidate input count

output count

score range

ranking method

batch size

threshold

latency

fallback behavior

Explain:
retrieval finds candidates; reranker selects candidates most relevant to the exact query.

Inspect whether the layer handles:

duplicates

conflicting provisions

outdated material

authority

jurisdiction

section metadata

pages

timestamps

source type

relevance scores

Explain its purpose.

Inspect whether claims are explicitly planned and mapped to evidence.

Report:

claim→evidence mapping

unsupported claim detection

condition preservation

source linking

abstention

Explain:
NO EVIDENCE → NO CLAIM.

Inspect:

provider/model

temperature

max tokens

system prompt

evidence injection

citation instructions

legal safety

hallucination controls

prompt-injection defense

context limits if known

Explain that the LLM synthesizes supplied evidence and is not itself the legal source.

Inspect actual citation verification.

Report:

verification checks

citation format

claim-to-source mapping

section verification

evidence support

URL validation

unsupported claim detection

repair

abstention

If measurable:
citation coverage = supported cited material claims / total material claims × 100

If not measurable, say NOT AVAILABLE.

Document independently:

PIPELINE A:
User Query
→ Query Understanding
→ RAG Retrieval
→ Vector + BM25
→ Reranking
→ Evidence
→ Claim Planning
→ LLM
→ Citation Verification
→ RAG Answer

PIPELINE B:
User Query
→ Live Official Research
→ India Code API / official sources
→ Evidence
→ LLM
→ Source verification
→ Live Official Research Answer

Verify no cross-contamination.

Inspect implementation of:
FULLY_SUPPORTED
PARTIALLY_SUPPORTED
NOT_SUPPORTED

Explain exactly how each is decided.

Distinguish:
document coverage
concept coverage
complete-answer coverage

Coverage must be based on retrieved evidence, not merely document-title matching.

Inspect Ask MARE-Juris follow-up logic.

Report:

LLM-generated or hardcoded

trigger

pending-question state

conversation context

follow-up answer

resolved query

topic switching

Verify:
Original: "What are my rights as a tenant?"
Assistant: "Which state?"
User: "Tamil Nadu"

must resolve to:
"What are my rights as a tenant in Tamil Nadu?"

not:
"Tamil Nadu"

IMPORTANT:
Ask MARE-Juris has NO fixed question limit.

Do not mix this with Compliance Agent.

Explicitly document:
Ask MARE-Juris = legal research + RAG + live official research + clarification.

Compliance Agent = adaptive compliance questioning + business profile + requirements + roadmap.

Verify they are code-isolated.

Inspect actual schema and report every relevant table.

At minimum check:
legal_documents
legal_chunks
user_documents
user_document_chunks
chat/citation/evidence tables if present

For each:

row count

purpose

primary key

foreign keys

important columns

vector column

vector dimension

indexes

RLS

unique constraints

Do not invent tables.

Report:

extension enabled

vector dimension

index type

distance operator

index parameters

approximate/exact search

RPC function

filters

Explain why pgvector is used.

Report:

legal source storage

user document storage

bucket names

public/private status

file counts

storage size if measurable

Explain the separation of PDFs/originals from searchable database records if that is the current architecture.

Document:
official source
→ download
→ validate
→ checksum
→ storage
→ extraction
→ legal structure detection
→ chunking
→ embeddings
→ BM25
→ database

Report:

scripts

libraries

retries

duplicate prevention

checksum algorithm

failed-document handling

idempotency

batching

ingestion time if available

Report whether each document tracks:

source URL

authority

title

Act number

year

jurisdiction

effective date

version

checksum

verification date

storage path

retrieval source

active status

Explain why provenance matters.

Inspect actual API integration.

Report only endpoints actually used:

acts

act detail

section

search

judgments

mappings

instruments

meta

other endpoints

For each:
endpoint
purpose
actual usage in MARE-Juris

Distinguish API capabilities from endpoints actually used.

If measurable, report:

query understanding latency

embedding latency

vector search latency

BM25 latency

merge latency

reranking latency

LLM latency

web research latency

total RAG latency

total Web latency

total dual-answer latency

ingestion time/document

throughput

Where enough data exists:
minimum / average / median / maximum.

Otherwise: NOT MEASURED.

Report/calculate:

PDF storage

extracted text size

vector storage

database rows

average chunk size

vector count

approximate vector memory

If float32:
raw vector bytes = number_of_vectors × dimensions × 4

Clearly mark calculations as CALCULATED.

Check for an existing labeled evaluation dataset.

If available, calculate:

Precision@K

Recall@K

Hit Rate@K

MRR

NDCG@K

Vector-only vs BM25-only vs Hybrid

Reranker improvement

Formulas:

Precision@K = relevant retrieved / K

Recall@K = relevant retrieved / total relevant

MRR = 1 / rank of first relevant result

NDCG@K if graded relevance exists.

NEVER invent results.

If no labeled dataset:
"Not currently measured."

Check whether enough data exists to measure:

citation correctness

citation completeness

evidence support rate

unsupported claim rate

hallucination rate

abstention accuracy

follow-up accuracy

source validity

answer latency

If unavailable, say so.

Inspect/report:

authentication

authorization

RLS

private user document isolation

API-key protection

environment variables

prompt injection defenses

document injection defenses

source/URL validation

SSRF protection if present

rate limiting if present

privacy-safe logging

secret handling

Classify each:
IMPLEMENTED / PARTIAL / NOT IMPLEMENTED

Inspect handling for:

embedding failure

database failure

vector RPC failure

BM25 failure

reranker failure

LLM failure

API failure

invalid source

missing corpus

insufficient evidence

timeout

malformed JSON

frontend network failure

Report fallback behavior.

Create a table:

Parameter | Previous | Current | Meaning | Why changed | Expected effect | Risk

At minimum:
VECTOR_MIN_RAW_SIMILARITY
MIN_RELEVANCE_PARTIAL
VECTOR_TOP_K

Do not claim measured improvement unless evaluation proves it.

Create a section explaining these numbers:

legal documents

pages

sections/articles if reliably extractable

chunks

embeddings

embedding dimension

vector Top-K

BM25 Top-K

reranker Top-K

final evidence K

similarity threshold

relevance thresholds

chunk size

overlap

BM25 k1/b

reranker

citation checks

official sources

API endpoints

database rows

retrieval latency

end-to-end latency

For every item:
WHAT | NUMBER | TYPE | WHY | IMPACT

Produce a final shortlist containing only REAL values:

X Legal Documents
X Pages
X Legal Chunks
X Vector Embeddings
X Embedding Dimensions
X BM25 Indexed Chunks
X Vector Top-K
X BM25 Top-K
X Reranked Candidates
X Final Evidence Chunks
X Official Sources
X Database Records
X ms Retrieval Latency
X ms End-to-End Latency
X% Citation Coverage
X Evaluation Queries
X Precision@K
X Recall@K
X MRR
X NDCG@K

Label every metric:
MEASURED / CALCULATED / CONFIGURED / NOT AVAILABLE.

Generate 20 likely faculty questions with answers based ONLY on the actual implementation.

Include:

Why RAG?

Why embeddings?

Why BM25?

Why hybrid?

Why reranking?

What is Top-K?

What is similarity threshold?

Why legal-aware chunking?

How is hallucination reduced?

How are citations verified?

What happens when corpus lacks evidence?

How are outdated laws handled?

Why two answers?

How does follow-up context work?

How are private documents isolated?

Why Supabase/pgvector?

How does it scale?

What happens with irrelevant retrieval?

What is the contribution?

What are the limitations?

Clearly report:

corpus limitations

missing state laws

missing evaluation benchmark

live-source variability

jurisdiction limitations

API limitations

extraction/OCR issues

latency

cost

unsupported domains

Clearly separate:
CURRENTLY IMPLEMENTED
from
FUTURE WORK

Do not present future features as implemented.

Create Mermaid diagrams based ONLY on actual implementation.

Include:
A. Ask MARE-Juris dual-answer flow
B. Legal corpus ingestion flow
C. Private user-document RAG flow
D. Compliance Agent flow only if already implemented, clearly separate

Create:

docs/MARE_JURIS_TECHNICAL_METRICS_REPORT.md

Optional second file:

docs/MARE_JURIS_FACULTY_METRICS.md

Main report sections:

Executive Summary

System Architecture

Technology Stack

Legal Corpus

Corpus Statistics

Chunking

Embeddings

Vector Search

BM25

Hybrid Retrieval

Query Understanding

Query Expansion

Reranking

Evidence Normalization

Claim Planning

LLM Generation

Citation Verification

Dual-Answer Architecture

Follow-Up Conversation

Supabase Database

pgvector

Ingestion

Provenance

India Code/API

Performance

Storage/Scale

Retrieval Evaluation

Answer Quality

Security

Error Handling

Configuration

Faculty Metrics

Faculty Q&A

Limitations

Future Work

Final Technical Summary

At the end include:

MARE-Juris Technical Snapshot

Corpus:
X documents
X pages
X chunks
X embeddings

Retrieval:
Vector + BM25
Top-K
Reranking
Final evidence

AI:
LLM
Embedding model
Reranker

Database:
PostgreSQL
Supabase
pgvector

Grounding:
Evidence normalization
Claim planning
Citation verification

Dual Answer:
Controlled RAG
Live Official Research

Security:
RLS/private documents/etc.

Performance:
actual measured values

Evaluation:
actual values or NOT AVAILABLE

Limitations:
actual limitations

Perform READ-ONLY inspection wherever possible.

Inspect:

source code

package.json

Python requirements

SQL migrations

Supabase schema

legal-documents directory

ingestion scripts

corpus status

configuration

API routes

tests

logs

documentation

If Supabase credentials are available through environment configuration, use safe existing tooling to obtain real counts.

NEVER print secrets, tokens, passwords, or API keys.

Do not modify production data.

Do not modify application code merely to produce the report.

If a value cannot be measured, state what access/data is required.

Print:

Documents:
Pages:
Chunks:
Embeddings:
Embedding dimension:
Vector Top-K:
BM25 Top-K:
Rerank Top-K:
Final Evidence K:
Vector threshold:
Partial threshold:
BM25 parameters:
Reranker:
LLM:
Embedding model:
API endpoints used:
Supabase tables:
Vector index:
Distance metric:
Average retrieval latency:
Average end-to-end latency:
Citation coverage:
Evaluation dataset size:
Precision@K:
Recall@K:
MRR:
NDCG:
Unsupported-claim/hallucination rate:
Metrics not currently measurable:

MOST IMPORTANT:

Accuracy is more important than impressive numbers.

Never manufacture metrics.

Clearly distinguish:

"we configured this value"

from:

"we measured this performance."

The report must allow a faculty member to understand exactly how MARE-Juris works, what mathematical/retrieval parameters it uses, why those parameters exist, how large the corpus is, how many vectors/chunks exist, how retrieval works, how answers are grounded, and what has actually been evaluated.