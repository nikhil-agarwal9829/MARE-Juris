URGENT FIX — ASK MARE-JURIS RAG IS MARKING RELEVANT QUESTIONS AS "NOT SUPPORTED"

IMPORTANT:

This task is ONLY for ASK MARE-JURIS.

DO NOT MODIFY THE COMPLIANCE AGENT.

The Compliance Agent and Ask MARE-Juris are separate systems.

============================================================
CURRENT BUG
============================================================

The user asks:

"what is right to information"

The UI currently shows:

MARE-JURIS RAG
RAG Coverage: Not supported

"The current MARE-Juris legal corpus does not contain sufficient evidence to answer this question."

"Relevant corpus sources: None directly relevant."

But the controlled corpus contains:

Constitution of India

and the query is a legal question that may have relevant constitutional material.

The current RAG retrieval/coverage detection is therefore too aggressive or incorrectly implemented.

DO NOT simply change the UI label.

Find why relevant evidence is not being retrieved or why retrieved evidence is being classified as irrelevant.

============================================================
1. INSPECT THE ACTUAL RAG RETRIEVAL
============================================================

For this exact query:

"what is right to information"

run the actual RAG pipeline and inspect:

- query understanding
- query embedding
- vector search
- BM25 search
- merged candidates
- reranking
- final evidence
- relevance scores
- coverage classification

Log in development:

query
expanded_queries
vector_result_count
bm25_result_count
merged_result_count
reranked_result_count
final_evidence_count
top_documents
top_sections
relevance_scores
rag_coverage

DO NOT log secrets.

============================================================
2. DO NOT USE EXACT KEYWORD MATCHING
============================================================

The RAG system must NOT require the exact phrase:

"right to information"

to appear in a chunk.

Legal documents use different terminology.

For example, the Constitution may discuss:

- freedom of speech and expression
- Article 19(1)(a)
- communication
- access to information
- freedom of expression

The retrieval system must use semantic similarity.

============================================================
3. QUERY EXPANSION
============================================================

Before retrieval, use the query-understanding LLM to generate legal retrieval concepts.

For:

"what is right to information"

possible retrieval concepts include:

- right to information
- access to information
- freedom of speech and expression
- Article 19(1)(a)
- constitutional right to information
- freedom of expression
- citizen access to information

These are retrieval concepts only.

They are NOT answers.

Use them to improve retrieval.

============================================================
4. HYBRID RETRIEVAL
============================================================

For every query:

Run:

A. Original query → vector search

B. Expanded legal concepts → vector search

C. Original query → BM25

D. Expanded legal concepts → BM25

Then:

merge
↓
deduplicate
↓
normalize scores
↓
rerank
↓
select final evidence

Do not rely on only one retrieval method.

============================================================
5. DOCUMENT-LEVEL + CHUNK-LEVEL RETRIEVAL
============================================================

Do not immediately conclude:

"No relevant corpus"

based on one failed chunk search.

First determine relevant documents.

For example:

query:

"what is right to information"

may identify:

Constitution of India

as a potentially relevant document.

Then retrieve the most relevant chunks from that document.

Use chunk-level evidence for the final answer.

============================================================
6. DO NOT USE DOCUMENT TITLE MATCHING AS THE MAIN RETRIEVAL METHOD
============================================================

Do NOT implement:

if query contains "RTI":
    search RTI document

if no RTI document:
    RAG unavailable

This is WRONG.

The user may ask:

"right to information"

without mentioning:

"RTI Act"

The system should still retrieve constitutional material if it is relevant.

============================================================
7. RAG COVERAGE MUST BE EVIDENCE-BASED
============================================================

Coverage must be determined AFTER retrieval.

Use:

FULLY_SUPPORTED
PARTIALLY_SUPPORTED
NOT_SUPPORTED

Do NOT determine coverage before retrieval.

============================================================
FULLY_SUPPORTED
============================================================

Use when the retrieved chunks directly answer the user's question.

Example:

User:

"What is Article 14?"

If Constitution chunks contain Article 14:

RAG:

FULLY_SUPPORTED

Then answer from those chunks.

============================================================
PARTIALLY_SUPPORTED
============================================================

Use when the corpus contains relevant information but does not cover the entire question.

Example:

User:

"What are my rights as a tenant in Tamil Nadu?"

Corpus may contain:

Transfer of Property Act

but not all Tamil Nadu-specific tenancy legislation.

Then:

RAG Coverage:
PARTIALLY_SUPPORTED

Answer only what the corpus supports.

Clearly say:

"The current corpus contains relevant central-law material, but it does not contain enough Tamil Nadu-specific material for a complete state-specific answer."

Do NOT say:

"No relevant information."

============================================================
NOT_SUPPORTED
============================================================

Use NOT_SUPPORTED only when:

1. Retrieval was performed properly.
2. Vector + BM25 produced no meaningful evidence.
3. Reranking produced no relevant evidence.
4. There is genuinely no useful material in the corpus.

Then show:

"The current MARE-Juris corpus does not contain sufficient evidence to answer this question."

============================================================
8. IMPORTANT — DO NOT CONFUSE ACT COVERAGE WITH CONCEPT COVERAGE
============================================================

The corpus does NOT contain every Indian Act.

For example, if the Right to Information Act, 2005 is NOT part of the controlled 10-document corpus:

Do NOT conclude:

"Right to information is completely unavailable."

Instead distinguish:

A. Constitutional information available in corpus

B. RTI Act-specific information unavailable in corpus

Example:

RAG:

"RAG Coverage: Partial

The current corpus contains constitutional material relevant to access to information, but the Right to Information Act, 2005 is not part of the controlled corpus."

Only make this statement if the retrieved Constitution evidence actually supports the constitutional aspect.

============================================================
9. EXACT TEST — RIGHT TO INFORMATION
============================================================

Run:

"what is right to information"

Inspect the retrieved chunks.

Expected behavior:

The RAG pipeline should search the Constitution corpus and determine whether relevant evidence exists.

If relevant evidence exists:

Show it.

For example:

MARE-JURIS RAG

Coverage:
🟡 Partial

Short Answer:

[Simple explanation based ONLY on retrieved constitutional evidence.]

Key Points:

• Point
• Point
• Point

Important limitation:

"The current corpus does not contain the complete Right to Information Act, 2005."

Sources:

Constitution of India
Article/section actually retrieved

Evidence Used:

Actual retrieved chunk.

DO NOT invent an Article/section merely because you think it is relevant.

============================================================
10. LIVE OFFICIAL RESEARCH
============================================================

The Live Official Research pipeline is COMPLETELY INDEPENDENT.

It must NOT use the RAG chunks as its evidence.

For:

"what is right to information"

the Live pipeline should research current official sources.

Prioritize:

India Code
Government of India
official RTI portals
official ministries/departments
official judicial sources where appropriate

The Web response may discuss the Right to Information Act, 2005 even though it is not in the controlled RAG corpus.

That is exactly why we have two pipelines.

============================================================
11. SOURCE TYPE SEPARATION
============================================================

Every evidence item must have:

source_type:

RAG

OR

OFFICIAL_WEB

Never mix them.

RAG:

{
  "source_type": "RAG",
  "document": "Constitution of India",
  "section": "...",
  "evidence": "...",
  "source_url": "..."
}

WEB:

{
  "source_type": "OFFICIAL_WEB",
  "title": "...",
  "authority": "...",
  "evidence": "...",
  "source_url": "...",
  "retrieved_at": "..."
}

============================================================
12. WEB RESPONSE MUST NOT USE RAG SOURCES
============================================================

The Live Official Research answer shown in the screenshot must be checked.

It currently shows:

[WEB-2, WEB-5]

and the UI also displays an India Code/eCourts-style source.

Verify that these are genuinely from the Live Web/API pipeline.

Do NOT allow:

RAG evidence
→ Web answer

The Web pipeline must independently retrieve its sources.

============================================================
13. FOUR EXAMPLE QUESTIONS ON ASK MARE-JURIS
============================================================

The four questions displayed on the Ask MARE-Juris page must be REAL queries.

They must NOT map to hardcoded answers.

If the user clicks:

"What are my rights as a tenant?"

the UI should simply put that query into the chat.

Then execute the normal pipeline:

Query Understanding
→ RAG retrieval
→ Live Official Research
→ two independent answers
→ sources
→ evidence
→ optional comparison

The same must happen if the user manually types exactly the same query.

There must be NO:

tenantAnswer()
consumerAnswer()
contractAnswer()

or equivalent hardcoded answer function.

============================================================
14. TENANT QUERY
============================================================

Test:

"What are my rights as a tenant?"

The RAG system should recognize that:

tenant ≈ lessee

and:

landlord ≈ lessor

and:

tenancy ≈ lease

These are retrieval concepts.

Search the Transfer of Property Act chunks.

Do NOT require the document to contain the exact phrase:

"rights as a tenant"

If relevant evidence exists:

show RAG answer.

If only central-law evidence exists:

show partial coverage if necessary.

Live Web independently researches current official information.

============================================================
15. FOLLOW-UP STATE MUST STILL WORK
============================================================

If the chatbot asks:

"Which state is the property located in?"

and user answers:

"Tamil Nadu"

DO NOT send only:

"Tamil Nadu"

to the legal query filter.

Resolve:

"What are my rights as a tenant in Tamil Nadu?"

Then run both pipelines.

The previous question and the follow-up answer must be combined.

============================================================
16. SHORT ANSWERS MUST NOT BE REJECTED
============================================================

If:

pendingFollowUp = true

then the next user message is an answer to the pending clarification.

Examples:

"Tamil Nadu"
"yes"
"renewal"
"company"
"individual"
"Chennai"

These should NOT be rejected as:

"not a legal question."

They must be interpreted using conversation context.

============================================================
17. HUMAN-READABLE ANSWERS
============================================================

Both RAG and Web answers should use simple language.

Preferred:

### Short Answer

1–3 sentences.

### Key Points

• Easy point
• Easy point
• Easy point

### Important

Conditions/exceptions.

### Sources

Actual sources.

Avoid large legal paragraphs.

Avoid unnecessarily complicated legal terminology.

============================================================
18. DO NOT CHANGE LEGAL ACCURACY
============================================================

Simple language must NOT remove legal conditions.

Do not turn:

"subject to conditions"

into:

"always."

Preserve:

- jurisdiction
- conditions
- exceptions
- dates
- applicability
- amendments

============================================================
19. DEBUG THE ACTUAL SUPABASE SEARCH
============================================================

Verify that the production/local RAG search is actually querying the populated:

legal_chunks

table.

Verify:

- embeddings exist
- embedding dimensions match
- vector RPC works
- document_id is correct
- active documents are included
- chunk content is not empty
- metadata is available
- BM25 index/search works
- query embedding is generated using the same embedding model/dimension as stored vectors

Run a real diagnostic query:

"what is right to information"

and print the top 10 retrieved candidates in development.

For each:

document
section
chunk ID
similarity score
content preview

This is necessary to determine whether the problem is retrieval or coverage classification.

============================================================
20. CHECK EMBEDDING MODEL CONSISTENCY
============================================================

Verify:

INGESTION EMBEDDING MODEL
=
QUERY EMBEDDING MODEL

Verify dimensions are identical.

If corpus embeddings were generated with one model and query embeddings with another incompatible model, fix this properly.

Do NOT re-ingest unnecessarily if the models are already compatible.

============================================================
21. DO NOT JUST LOWER THE THRESHOLD
============================================================

Do NOT solve this by setting:

MIN_RELEVANCE_SCORE = 0

or another arbitrary low value.

That will introduce irrelevant legal evidence.

Instead:

retrieve a reasonable candidate pool
→ rerank
→ evaluate evidence quality.

If threshold tuning is required, make it configurable and test it using multiple known queries.

============================================================
22. TEST AGAINST THE ACTUAL CORPUS
============================================================

Run these queries:

1.
"What is Article 14?"

Expected:
Constitution retrieval.

2.
"What is Article 19?"

Expected:
Constitution retrieval.

3.
"What is the right to information?"

Expected:
Search Constitution and determine actual evidence.

4.
"What are my rights as a tenant?"

Expected:
Transfer of Property Act retrieval.

5.
"What obligations does a lessor have?"

Expected:
Transfer of Property Act retrieval.

6.
"What rights does a lessee have?"

Expected:
Transfer of Property Act retrieval.

7.
"What is a valid contract?"

Expected:
Indian Contract Act retrieval if evidence supports it.

8.
"What rights do consumers have?"

Expected:
Consumer Protection Act retrieval.

9.
"What rights do I have regarding my personal data?"

Expected:
DPDP Act retrieval.

10.
"What is cyber crime?"

Expected:
Search IT Act/BNS/other corpus evidence and determine actual coverage.

============================================================
23. IMPORTANT — DO NOT EXPECT ALL QUESTIONS TO BE IN THE CORPUS
============================================================

The corpus has 10 documents.

It will NOT answer every Indian legal question.

That is expected.

The correct behavior is:

Relevant evidence exists
→ RAG answers.

Partial evidence exists
→ RAG gives partial answer + limitation.

No evidence exists
→ RAG explicitly says not supported.

Live Official Research
→ independently answers using current official sources.

This is the purpose of the dual-answer architecture.

============================================================
24. FINAL UI
============================================================

For every query display:

┌─────────────────────────────────────┐
│ MARE-JURIS RAG                      │
│ CONTROLLED CORPUS                   │
├─────────────────────────────────────┤
│ Coverage: Fully / Partial / None    │
│                                     │
│ Short Answer                        │
│                                     │
│ • Easy point                        │
│ • Easy point                        │
│ • Easy point                        │
│                                     │
│ Sources                             │
│ [RAG-1] Constitution...             │
│                                     │
│ Evidence Used ▼                     │
│                                     │
│ View Official Source ↗              │
└─────────────────────────────────────┘


┌─────────────────────────────────────┐
│ LIVE OFFICIAL RESEARCH              │
│ CURRENT OFFICIAL SOURCES            │
├─────────────────────────────────────┤
│ Short Answer                        │
│                                     │
│ • Easy point                        │
│ • Easy point                        │
│ • Easy point                        │
│                                     │
│ Sources                             │
│ [WEB-1] Official source             │
│                                     │
│ Evidence Used ▼                     │
│                                     │
│ View Official Source ↗              │
└─────────────────────────────────────┘

============================================================
25. FINAL ACCEPTANCE CRITERIA
============================================================

The fix is NOT complete until:

✓ "what is right to information" no longer automatically becomes RAG NOT_SUPPORTED

✓ Actual Supabase chunks are inspected

✓ Vector retrieval works

✓ BM25 retrieval works

✓ Semantic query expansion works

✓ Legal terminology variations are handled

✓ Reranking works

✓ Coverage is decided AFTER retrieval

✓ Full/partial/not-supported states work correctly

✓ RAG only uses RAG evidence

✓ Live Web only uses live official evidence

✓ Web does not reuse RAG evidence

✓ Tenant query retrieves lease/lessee evidence

✓ Exact example queries work through the real pipeline

✓ No hardcoded legal answer controls the result

✓ Follow-up answers are combined with the original query

✓ "Tamil Nadu" is not rejected after a pending clarification

✓ No fixed number of follow-up questions is introduced

✓ Answers are simple and human-readable

✓ Citations are displayed

✓ Evidence Used is displayed

✓ Official source links are displayed

✓ Conversation history persists both answers

✓ npm run build succeeds

============================================================
DO NOT MODIFY COMPLIANCE AGENT
============================================================

Again:

ASK MARE-JURIS ≠ COMPLIANCE AGENT.

Do not change the Compliance Agent as part of this fix.

============================================================
FINAL TEST
============================================================

Test:

"what is right to information"

Then:

"What are my rights as a tenant?"

Then:

"Can my landlord evict me?"

For each query inspect the ACTUAL retrieved RAG chunks.

Do not declare success based only on the UI label.

The RAG answer must be traceable to actual Supabase evidence.
The Web answer must be traceable to actual official live evidence.