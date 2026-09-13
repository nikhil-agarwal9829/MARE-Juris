CRITICAL FIX REQUIRED — DO NOT REPLACE THE EXISTING LEGAL ANSWER PIPELINE

The current MARE-Juris chat implementation is incorrect.

The screenshot shows that the system is currently producing one generic response:

"MARE-Juris Legal Intelligence Analysis..."

This is NOT what I need.

I need TWO completely independent legal answers for every valid legal query:

==================================================
PIPELINE A — MARE-JURIS RAG ANSWER
==================================================

This answer MUST come only from our controlled legal corpus stored in Supabase.

Current corpus:
1. Constitution of India, 1950
2. Consumer Protection Act, 2019
3. Digital Personal Data Protection Act, 2023
4. Information Technology Act, 2000
5. Transfer of Property Act, 1882
6. Indian Contract Act, 1872
7. Bharatiya Nyaya Sanhita, 2023
8. Bharatiya Nagarik Suraksha Sanhita, 2023
9. Protection of Women from Domestic Violence Act, 2005
10. Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013

RAG pipeline must remain:

User Query
→ Legal Query Filter
→ Query Understanding
→ Hybrid Retrieval
→ Supabase pgvector
→ BM25
→ Hybrid Merge
→ Reranking
→ Evidence Normalization
→ Claim Planning
→ LLM Synthesis
→ Citation/Grounding Verification
→ Verified RAG Answer

DO NOT allow the LLM to answer from general knowledge when RAG evidence is unavailable.

If the retrieved corpus does not contain sufficient evidence, explicitly display:

"Insufficient evidence in the MARE-Juris legal corpus to answer this part."

Do not fabricate:
- sections
- acts
- legal provisions
- case citations
- URLs
- authorities
- evidence

==================================================
PIPELINE B — LIVE OFFICIAL WEB/API RESEARCH
==================================================

This MUST be a completely separate pipeline.

It must NOT use the retrieved RAG chunks as its evidence.

Use the India Code API endpoints already provided in the project/API documentation.

Relevant API endpoints include:

GET /api/v1/acts
GET /api/v1/acts/{act}
GET /api/v1/{act}/section/{number}
GET /api/v1/search
GET /api/v1/judgments
GET /api/v1/mappings
GET /api/v1/instruments
GET /api/v1/meta

Also use current official Internet sources where necessary.

Prioritize:
1. India Code
2. Supreme Court / High Court official websites
3. Ministry / Department official websites
4. Government portals
5. Official regulators

Do NOT treat random blogs, Reddit, Quora, or legal marketing websites as authoritative legal sources.

The Live Web answer must be generated from the current retrieved official evidence.

==================================================
VERY IMPORTANT — DO NOT MERGE THE TWO ANSWERS
==================================================

Pipeline A and Pipeline B must execute independently.

DO NOT do:

RAG evidence + Web evidence
→ one combined LLM answer

Instead do:

Query
├── Pipeline A → RAG Answer
│                 └── RAG citations/evidence
│
└── Pipeline B → Live Official Answer
                  └── Web/API citations/evidence

Only AFTER both answers are independently generated may we run an optional comparison step.

==================================================
CITATIONS ARE MANDATORY
==================================================

The current implementation lost the citations.

Restore citation generation and rendering.

Every important legal claim should have a claim-level citation.

Each citation must contain:

{
  "citation_id": "RAG-1",
  "document_title": "...",
  "act": "...",
  "section": "...",
  "subsection": "...",
  "page": "...",
  "authority": "...",
  "jurisdiction": "India",
  "evidence_text": "...",
  "source_url": "...",
  "source_type": "RAG",
  "retrieved_at": "..."
}

For Live Web:

{
  "citation_id": "WEB-1",
  "title": "...",
  "section": "...",
  "authority": "...",
  "jurisdiction": "India",
  "evidence_text": "...",
  "source_url": "...",
  "source_type": "OFFICIAL_WEB",
  "retrieved_at": "..."
}

Never create a citation unless the source actually exists.

==================================================
EVIDENCE USED PANEL
==================================================

Restore the Evidence Used UI.

For RAG answer show:

Evidence Used
- Document
- Section
- Page
- Chunk ID
- Retrieved text
- Relevance/reranker score if available
- Official source URL

For Live answer show:

Official Sources Used
- Source title
- Authority
- URL
- Retrieved date/time
- Relevant section/evidence

==================================================
SOURCE BUTTON
==================================================

Every source must have:

"View Official Source ↗"

This button must open the REAL source_url.

Do not create fake URLs.

For RAG documents, source_url must point to the official source associated with the corpus document.

For web/API results, use the actual URL returned/discovered from the official source.

==================================================
CITATION VERIFICATION
==================================================

Restore the previous citation/legal-grounding verification behavior.

The verification layer must check:

1. Does the cited document exist?
2. Does the cited section exist?
3. Does the retrieved evidence support the claim?
4. Does the answer preserve conditions/exceptions?
5. Is the jurisdiction correct?
6. Is the citation actually linked to the evidence?
7. Is the official source URL valid?
8. Is the corpus source potentially stale?

If verification fails:

- repair the answer using available evidence, OR
- remove the unsupported claim, OR
- explicitly abstain.

NEVER silently fabricate a citation.

==================================================
UI REQUIREMENT
==================================================

The chat MUST clearly identify which answer is which.

Use two clearly separated cards/tabs:

[ MARE-JURIS RAG ]

and

[ LIVE OFFICIAL RESEARCH ]

Default view can be MARE-Juris RAG, but both answers must remain visible/accessible.

Example UI:

--------------------------------------------------
MARE-JURIS RAG
Controlled 10-document corpus
--------------------------------------------------

Answer...

[1] Transfer of Property Act, 1882 — Section ...

Evidence Used
> retrieved evidence...

View Official Source ↗


--------------------------------------------------
LIVE OFFICIAL RESEARCH
Current official Internet/API sources
--------------------------------------------------

Answer...

[WEB-1] India Code — ...

Evidence Used
> current official evidence...

View Official Source ↗


--------------------------------------------------
SOURCE COMPARISON
--------------------------------------------------

Agreement:
...

Differences:
...

Freshness warning:
...

==================================================
DO NOT SHOW GENERIC RESPONSE
==================================================

Remove/replace generic output such as:

"MARE-Juris Legal Intelligence Analysis for query..."

"Statutory Framework Under Indian Law..."

"Legal Action Guidance..."

unless those sentences are actually generated from verified evidence.

The response must be evidence-grounded and source-linked.

==================================================
BACKEND RESPONSE SCHEMA
==================================================

The /chat endpoint or equivalent should return BOTH results.

Use a structure similar to:

{
  "query": "...",

  "rag": {
    "status": "verified",
    "answer": "...",
    "citations": [],
    "evidence": [],
    "sources": [],
    "verification": {
      "verified": true,
      "issues": []
    }
  },

  "web": {
    "status": "verified",
    "answer": "...",
    "citations": [],
    "evidence": [],
    "sources": [],
    "verification": {
      "verified": true,
      "issues": []
    }
  },

  "comparison": {
    "available": true,
    "agreements": [],
    "differences": [],
    "freshness_flags": [],
    "conflicts": []
  }
}

==================================================
FRONTEND STATE
==================================================

Do NOT use one shared answer variable.

Maintain separate state:

ragAnswer
ragStatus
ragCitations
ragEvidence
ragSources
ragVerification

webAnswer
webStatus
webCitations
webEvidence
webSources
webVerification

comparison

The existing disappearing-first-response bug must also be fixed.

After the first query:

1. RAG answer must remain visible.
2. Web answer must remain visible.
3. Both must be persisted.
4. Refreshing the page must restore both.
5. Clicking conversation history must restore both.
6. Switching tabs must never delete either answer.
7. Streaming RAG must not overwrite Web state.
8. Streaming Web must not overwrite RAG state.

==================================================
COMPARISON ENDPOINT
==================================================

The existing /api/v1/chat/compare endpoint may ONLY compare the two already-generated answers/evidence.

It must NOT replace either answer.

Flow:

RAG generation
+
Live Web generation
↓
Comparison
↓
UI

NOT:

RAG + Web
↓
Comparison LLM
↓
one answer

==================================================
TEST THIS EXACT QUERY
==================================================

Use:

"what are my rights as tenant"

Expected result:

TAB 1:
MARE-JURIS RAG

- answer from controlled 10-document corpus
- citations
- evidence
- document/section information
- official source link
- verification status

TAB 2:
LIVE OFFICIAL RESEARCH

- current official web/API answer
- official sources
- citations
- evidence
- source links
- retrieval timestamp
- verification status

Then:

SOURCE COMPARISON

- agreement
- differences
- corpus freshness
- conflicts if any

==================================================
IMPORTANT IMPLEMENTATION RULE
==================================================

Before changing anything:

1. Inspect current chat.py
2. Inspect rag_service.py
3. Inspect ChatInterface.tsx
4. Inspect citation components
5. Inspect evidence/source components
6. Inspect existing chat persistence/history code
7. Inspect the previous implementation that generated citations and verification
8. Identify exactly where the old verified legal answer was replaced.

Do NOT rewrite the entire system unnecessarily.

Restore the old verified/citation answer behavior and ADD the new independent RAG answer beside it.

==================================================
FINAL ACCEPTANCE TEST
==================================================

The implementation is NOT complete unless one user query visibly produces:

1. MARE-Juris RAG Answer
2. Live Official Web Research Answer
3. Citations for both
4. Evidence Used for both
5. Official source links
6. Verification status
7. Source comparison
8. Both answers persist after refresh/history navigation

Do not report "complete" until this exact behavior is verified end-to-end.