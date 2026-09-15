MARE-JURIS — MAJOR FIX TO ASK MARE-JURIS LEGAL RESEARCH CHATBOT

IMPORTANT ARCHITECTURE RULE:

ASK MARE-JURIS AND COMPLIANCE AGENT ARE TWO COMPLETELY DIFFERENT AGENTS.

DO NOT MIX THEIR LOGIC.

The Compliance Agent has its own adaptive questionnaire and question limits.

DO NOT introduce the Compliance Agent's "maximum 10 questions" rule, business profiling, restaurant/SaaS flow, or compliance questionnaire logic into Ask MARE-Juris.

This task is ONLY for the MAIN "ASK MARE-JURIS" LEGAL RESEARCH CHATBOT.

==================================================
CURRENT STATE
==================================================

The main Ask MARE-Juris chatbot already has TWO response pipelines.

This is GOOD and MUST be preserved.

The current problem is NOT that two responses are missing.

The current problem is that the two responses are NOT CORRECTLY answering the user's actual query.

Current problems:

1. It often gives generic/normal-looking answers instead of properly answering the user's query.
2. It appears to rely on hardcoded responses/templates.
3. It does not intelligently determine when a follow-up question is required.
4. It does not generate follow-up questions based on the actual user's query.
5. The RAG response does not clearly reflect whether relevant evidence actually exists in our corpus.
6. It can behave as if the RAG corpus knows information that it does not contain.
7. The live/web response is not consistently answering the exact question asked.
8. The answers can be unnecessarily complicated.
9. Sources/citations/evidence are not consistently shown.
10. The two answers must remain independently generated.

DO NOT rebuild the entire chatbot unnecessarily.

Inspect the existing implementation and fix the reasoning/data flow.

==================================================
CORE GOAL
==================================================

For every legal query, the main chatbot should understand:

"What exactly is this user asking?"

Then determine:

- Can I answer this directly?
- Is important information missing?
- Do I need a clarification/follow-up question?
- What evidence is available in the controlled RAG corpus?
- What current official information is available online?

Then independently generate:

ANSWER A:
MARE-JURIS RAG ANSWER

ANSWER B:
LIVE OFFICIAL RESEARCH ANSWER

The two answers MUST remain separate.

==================================================
IMPORTANT DISTINCTION
==================================================

There is NO fixed follow-up-question limit for Ask MARE-Juris.

Do NOT implement:

"Ask exactly 5 questions."

Do NOT implement:

"Ask maximum 10 questions."

Do NOT use a brute-force questionnaire.

Do NOT use the Compliance Agent's question-generation architecture here.

Ask MARE-Juris is a conversational legal research chatbot.

It should ask:

ZERO follow-ups when the question is clear.

ONE follow-up when one clarification is needed.

MORE follow-ups only when genuinely necessary.

The number of questions is determined by the query and conversation context.

==================================================
1. QUERY UNDERSTANDING
==================================================

Every user query must first go through a query-understanding step.

Use the LLM to understand the ACTUAL QUERY.

Do NOT map the user into a small set of hardcoded topics.

Do NOT do:

if restaurant → restaurant answer
if tenant → tenant answer
if consumer → predefined consumer answer

Those are examples, not the chatbot's knowledge boundary.

The user can ask any legal research question.

Examples:

"What are my rights as a tenant?"

"Can my landlord evict me?"

"Can I cancel my contract?"

"What happens if someone misuses my personal data?"

"How can I file a consumer complaint?"

"What is Section 14?"

"Can my employer terminate me?"

"How do I apply for a passport?"

"Is this agreement valid?"

"What legal action can I take?"

The system must understand the actual query.

==================================================
2. STRUCTURED QUERY ANALYSIS
==================================================

Have the LLM produce structured query analysis.

Example:

{
  "intent": "...",
  "topic": "...",
  "jurisdiction": "...",
  "entities": [],
  "facts_explicitly_provided": [],
  "requested_information": [],
  "ambiguities": [],
  "missing_information": [],
  "requires_followup": true,
  "followup_reason": "..."
}

IMPORTANT:

Do not invent facts.

If the user did not provide a state, do not silently assume a state.

If the user did not provide the type of contract, do not assume it.

If the user did not provide dates, do not invent dates.

==================================================
3. FOLLOW-UP QUESTIONS
==================================================

The LLM should decide whether a follow-up question is necessary.

Ask a follow-up ONLY if the missing information could materially change the legal answer.

Example:

USER:
"Can my landlord evict me?"

Potential follow-up:

"Which state is the property in, and do you have a written rental agreement?"

Why?

Because applicable tenancy rules can depend on jurisdiction and circumstances.

Another example:

USER:
"What is the Consumer Protection Act?"

Do NOT ask a follow-up.

Answer directly.

Another:

USER:
"Can I cancel my contract?"

A useful follow-up may be:

"What type of contract is it, and are you trying to end it before the agreed term?"

The follow-up must come from the actual query.

==================================================
4. FOLLOW-UP MUST BE CONVERSATIONAL
==================================================

If clarification is needed:

DO NOT generate a giant questionnaire.

Return a natural response such as:

"To give you an accurate answer, I need one detail: which state is the property located in?"

Then wait for the user.

After the user answers:

Reconstruct the complete query using the conversation context.

Example:

Original:
"Can my landlord evict me?"

User:
"Chennai."

Internal query becomes:

"Can my landlord evict me in Chennai?"

Do not ask for Chennai again.

==================================================
5. WHEN TO ANSWER DIRECTLY
==================================================

If enough information exists, do NOT ask unnecessary questions.

For example:

USER:
"What is the Digital Personal Data Protection Act?"

Answer directly.

USER:
"What does Section 10 of the Indian Contract Act say?"

Answer using available evidence.

USER:
"What are the basic rights of a consumer?"

Answer directly if evidence is available.

The goal is:

MINIMUM NECESSARY CLARIFICATION.

==================================================
6. RESPONSE A — MARE-JURIS RAG
==================================================

The first response must use the controlled MARE-Juris legal corpus.

Current controlled corpus contains the project's configured legal documents.

RAG pipeline:

USER QUERY
↓
QUERY UNDERSTANDING
↓
EMBEDDING
↓
SUPABASE PGVECTOR
+
BM25
↓
HYBRID RETRIEVAL
↓
DEDUPLICATION
↓
RERANKING
↓
EVIDENCE NORMALIZATION
↓
CLAIM PLANNING
↓
LLM SYNTHESIS
↓
CITATION / GROUNDING VERIFICATION
↓
RAG ANSWER

Do NOT bypass retrieval.

Do NOT answer from the LLM's general knowledge and call it RAG.

==================================================
7. RAG COVERAGE MUST BE TRANSPARENT
==================================================

This is critical.

The current corpus does NOT contain every Indian law or every government procedure.

Therefore:

If relevant evidence exists:

Generate a RAG answer based on that evidence.

If only partial evidence exists:

Generate a partial RAG answer and clearly state the limitation.

If no relevant evidence exists:

DO NOT hallucinate a RAG answer.

Show:

"RAG Coverage:
The current MARE-Juris legal corpus does not contain sufficient information to answer this question."

Then show:

"Relevant sources available in the corpus:
None directly relevant."

OR show whatever partial relevant evidence was actually retrieved.

This is a FEATURE, not a failure.

==================================================
8. EXAMPLE — RAG DOES NOT COVER THE QUESTION
==================================================

USER:

"How do I apply for a passport?"

If passport procedure is not present in the controlled RAG corpus:

RAG response:

"### MARE-Juris RAG

The current MARE-Juris legal corpus does not contain sufficient passport-application information to answer this question.

No directly relevant passport procedure was retrieved from the current corpus."

DO NOT invent passport information.

DO NOT use general LLM knowledge.

DO NOT pretend a generic government procedure came from RAG.

==================================================
9. PARTIAL RAG COVERAGE
==================================================

If the query has multiple parts and only some are covered:

Example:

User asks about a state-specific legal process.

RAG may contain the relevant central Act but not the state rules.

Then say:

"### MARE-Juris RAG

The corpus contains relevant central-law material, but it does not contain enough state-specific material to give a complete answer."

Then explain ONLY what the retrieved evidence supports.

==================================================
10. RESPONSE B — LIVE OFFICIAL RESEARCH
==================================================

The second answer must independently answer the user's actual question using CURRENT official information.

Use:

- India Code API
- India Code official website
- Official Government of India websites
- Ministries
- Departments
- Official regulators
- Supreme Court official sources
- High Court official sources
- State government official portals where appropriate

Use the India Code API endpoints already configured/shared in this project.

Do NOT restrict Live Research to the 10-document RAG corpus.

That is the purpose of the second pipeline.

==================================================
11. TWO ANSWERS MUST BE INDEPENDENT
==================================================

CORRECT:

USER QUERY
      │
      ├───────────────┐
      ↓               ↓
    RAG             LIVE WEB/API
      ↓               ↓
RAG evidence      Current evidence
      ↓               ↓
RAG LLM           Web LLM
      ↓               ↓
RAG Answer        Web Answer
      │               │
      └───────┬───────┘
              ↓
       Optional comparison

INCORRECT:

RAG evidence + Web evidence
↓
one LLM
↓
one combined answer

DO NOT merge the evidence before answer generation.

==================================================
12. LIVE WEB ANSWER MUST ANSWER WHAT USER ACTUALLY ASKED
==================================================

Do not return a generic legal overview.

If user asks:

"How do I apply for a passport?"

The Live response should actually explain the current official passport application process using official sources.

If user asks:

"Can my landlord evict me?"

The Live response should answer the eviction question and mention relevant conditions.

If user asks:

"Can I cancel this contract?"

The Live response should address contract termination based on the information available.

The answer must be query-specific.

==================================================
13. HUMAN-READABLE ANSWER STYLE
==================================================

Both answers should be written for a normal person.

Do NOT produce unnecessarily complicated legal language.

Do NOT write giant paragraphs.

Prefer:

### Short Answer

Simple explanation in 1–3 sentences.

### What this means

- Easy point
- Easy point
- Easy point

### What you can do

1. Step one
2. Step two
3. Step three

### Important

Mention important conditions/exceptions.

### Sources

List the supporting sources.

Use legal terminology when necessary, but explain it.

Example:

BAD:

"Pursuant to the statutory framework governing the lessor-lessee relationship..."

BETTER:

"Whether your landlord can evict you depends on the tenancy agreement, the reason for eviction, and the law that applies in your location."

==================================================
14. SIMPLE DOES NOT MEAN INACCURATE
==================================================

Keep legal conditions intact.

If evidence says:

"X applies subject to conditions A, B and C"

DO NOT simplify it into:

"X always applies."

Preserve:

- exceptions
- conditions
- jurisdiction
- dates
- eligibility
- limitations

==================================================
15. CITATIONS — MANDATORY
==================================================

Restore and preserve the citation system.

Important claims must be traceable to actual evidence.

RAG citation:

[RAG-1]

Document:
Transfer of Property Act, 1882

Section:
...

Evidence:
"...actual retrieved evidence..."

Source:
Official source URL

Type:
RAG

Live citation:

[WEB-1]

Source:
India Code / official authority

Section:
...

Evidence:
"...actual retrieved evidence..."

Retrieved:
<date/time>

Type:
OFFICIAL_WEB

Never fabricate citations.

==================================================
16. SOURCE INFORMATION
==================================================

Every answer must have a visible source section.

For RAG:

### RAG Sources

- Act/document name
- Section/article
- Authority
- Evidence used
- Official source

For Web:

### Official Sources

- Source title
- Authority
- Relevant section/page
- Evidence used
- Retrieved date/time
- Official URL

Add:

"View Official Source ↗"

The button must open the real source URL.

==================================================
17. EVIDENCE USED PANEL
==================================================

Both responses must have an expandable:

"Evidence Used"

section.

RAG Evidence:

- document
- section
- chunk ID
- retrieved evidence
- reranker/relevance score if available

Web Evidence:

- official website/API
- relevant section
- retrieved evidence
- retrieval timestamp

The user should be able to understand:

"Why did MARE-Juris say this?"

==================================================
18. RAG VERIFICATION
==================================================

Before displaying the RAG answer, verify:

1. The document exists.
2. The cited section exists.
3. The retrieved evidence supports the claim.
4. The answer does not introduce unsupported legal facts.
5. Conditions/exceptions are preserved.
6. Jurisdiction is correct.
7. Citation points to the actual evidence.
8. Source URL is valid.

If verification fails:

- repair the answer, OR
- remove unsupported claim, OR
- abstain.

Never silently hallucinate.

==================================================
19. WEB VERIFICATION
==================================================

Before displaying Live Web Research:

Verify:

1. Source is official/reliable.
2. Source actually contains the cited information.
3. URL is real.
4. Claim is supported.
5. Current date/retrieval time is available where relevant.

Do not call information "officially verified" if no authoritative source supports it.

==================================================
20. HARD-CODED ANSWERS MUST NOT CONTROL THE CHATBOT
==================================================

Inspect the codebase for hardcoded answer logic.

Search for:

- hardcoded legal answers
- predefined legal paragraphs
- fixed topic → answer mappings
- restaurant → answer
- tenant → answer
- consumer → answer
- SaaS → answer
- fixed legal response templates containing legal conclusions
- if/else blocks returning legal answers

Remove these from the actual answer-generation path.

They may remain only as:

- UI examples
- placeholder text
- error messages
- loading states
- demonstration content explicitly marked as examples

The actual user query must reach the LLM + retrieval pipeline.

==================================================
21. DO NOT USE THE EXAMPLE CARDS AS CLASSIFIERS
==================================================

If the UI has example questions/topics, they are only shortcuts for the user.

Example:

"Tenant Rights"

may populate:

"What are my rights as a tenant?"

But selecting the card must NOT execute:

tenantAnswer()

Similarly:

"Consumer Rights"

must NOT execute a hardcoded consumer response.

Everything must still go through the same actual query pipeline.

==================================================
22. CONVERSATION CONTEXT
==================================================

Maintain conversational context.

Example:

USER:
"Can my landlord evict me?"

ASSISTANT:
"Which state is the property in?"

USER:
"Chennai."

The next generation should use:

"Can my landlord evict me in Chennai?"

Then generate RAG and Live answers.

Do not lose previous context.

==================================================
23. TOPIC SWITCHING
==================================================

If the user changes topic:

USER:
"Now how can I apply for a passport?"

Do NOT carry the previous landlord context into the new query.

Re-run query understanding.

The chat history can remain visible, but the current query context must be reset appropriately.

==================================================
24. RESPONSE OBJECT
==================================================

The backend should return something similar to:

{
  "query": "...",

  "follow_up": {
    "required": false,
    "question": null,
    "reason": null
  },

  "rag": {
    "status": "fully_supported",
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
    "status": "official_sources_found",
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

If clarification is necessary:

{
  "query": "...",

  "follow_up": {
    "required": true,
    "question": "Which state is the property located in?",
    "reason": "The applicable law may depend on jurisdiction."
  },

  "rag": null,
  "web": null
}

Do NOT generate final answers until the required clarification has been received.

==================================================
25. FRONTEND RESPONSE DISPLAY
==================================================

The user must clearly see TWO independent responses.

---------------------------------------------
MARE-JURIS RAG
Controlled Legal Corpus
---------------------------------------------

Short Answer

• Easy point
• Easy point
• Easy point

RAG Coverage:
🟢 Fully supported

Sources:
[RAG-1] Act — Section
[View Official Source ↗]

Evidence Used ▼


---------------------------------------------
LIVE OFFICIAL RESEARCH
Current Official Sources
---------------------------------------------

Short Answer

• Easy point
• Easy point
• Easy point

Sources:
[WEB-1] Official Source
[View Official Source ↗]

Evidence Used ▼


---------------------------------------------
SOURCE COMPARISON
---------------------------------------------

Agreement:
...

Differences:
...

Freshness:
...

RAG limitation:
...

Do not allow comparison to replace either answer.

==================================================
26. IF RAG HAS NO INFORMATION
==================================================

Display:

---------------------------------------------
MARE-JURIS RAG
---------------------------------------------

RAG Coverage: Not Available

"The current MARE-Juris corpus does not contain sufficient evidence for this question."

Relevant corpus sources:
None directly relevant.

---------------------------------------------
LIVE OFFICIAL RESEARCH
---------------------------------------------

Then provide the actual current answer.

This is EXPECTED behavior.

Do not hide the RAG limitation.

==================================================
27. IF RAG HAS PARTIAL INFORMATION
==================================================

Display:

RAG Coverage: Partial

"The corpus contains relevant material on X, but it does not contain enough information on Y."

Then show only supported information.

Live Web can provide the missing current information.

==================================================
28. NO BRUTE-FORCE QUESTIONING
==================================================

Again:

THIS IS NOT THE COMPLIANCE AGENT.

There is no fixed question count.

Ask a follow-up only when needed.

The LLM should decide:

answer now
OR
ask clarification

Do not ask questions simply to collect more information.

==================================================
29. STREAMING
==================================================

Maintain independent streaming states.

RAG:

ragAnswer
ragStatus
ragCitations
ragEvidence
ragSources
ragVerification

WEB:

webAnswer
webStatus
webCitations
webEvidence
webSources
webVerification

FOLLOW-UP:

followUpRequired
followUpQuestion
followUpReason

COMPARISON:

comparison

One stream must NEVER overwrite another.

==================================================
30. CHAT PERSISTENCE
==================================================

Persist:

query
follow-up
rag answer
rag status
rag citations
rag evidence
rag sources
rag verification
web answer
web status
web citations
web evidence
web sources
web verification
comparison

When opening chat history:

Both answers must be restored.

Do not store only:

"answer"

because that loses the distinction between RAG and Web.

==================================================
31. TEST CASES
==================================================

Test these actual queries.

TEST 1:

"What is the Consumer Protection Act?"

Expected:

No follow-up.

RAG:
Relevant evidence from Consumer Protection Act.

Web:
Current official information.

Both with citations and sources.

--------------------------------------------

TEST 2:

"What are my rights as a tenant?"

Expected:

RAG:
Show relevant evidence if available.

If corpus coverage is incomplete, clearly say so.

Web:
Research current official information.

Do not use a hardcoded tenant answer.

--------------------------------------------

TEST 3:

"Can my landlord evict me?"

Expected:

Determine whether clarification is needed.

If location/type of tenancy matters:

Ask a natural follow-up question.

Do NOT immediately dump a generic hardcoded answer.

After user responds:

Generate both independent answers.

--------------------------------------------

TEST 4:

"How can I apply for a passport?"

Expected:

RAG:
Clearly state whether passport information exists in current corpus.

If unavailable:
show RAG coverage limitation.

Web:
Actually answer the passport question using current official sources.

Do NOT force passport into one of the 10 corpus documents.

--------------------------------------------

TEST 5:

"I want to understand my rights if my personal data is misused."

Expected:

RAG:
Use DPDP/IT Act evidence if relevant.

Web:
Use current official sources.

Human-readable explanation.

Sources.

--------------------------------------------

TEST 6:

"Can I cancel my contract?"

Expected:

If necessary, ask what type of contract / relevant missing context.

Do not return a generic hardcoded contract answer.

==================================================
32. IMPORTANT SEPARATION FROM COMPLIANCE AGENT
==================================================

DO NOT modify Compliance Agent while implementing this task.

Do NOT import:

- compliance question planner
- business profile
- business type detection
- 10-question limit
- compliance roadmap generation
- compliance requirements

into Ask MARE-Juris.

The two systems are separate.

Ask MARE-Juris:
LEGAL RESEARCH + RAG + LIVE OFFICIAL RESEARCH

Compliance Agent:
ADAPTIVE COMPLIANCE ASSESSMENT + COMPLIANCE ROADMAP

Keep them isolated.

==================================================
33. BUILD
==================================================

After implementation:

npm run build

Fix all TypeScript and ESLint errors properly.

Do not disable ESLint.

Do not break:

- authentication
- chat history
- RAG
- pgvector
- BM25
- citations
- evidence
- Live Official Research
- comparison
- Legal Literacy
- Compliance Agent

==================================================
34. FINAL ACCEPTANCE CRITERIA
==================================================

Ask MARE-Juris is NOT complete until:

✓ Actual user query drives the answer

✓ No hardcoded legal answer controls the response

✓ LLM understands the query

✓ LLM decides whether clarification is needed

✓ Follow-up questions are query-specific

✓ No fixed number of follow-up questions

✓ RAG answer is clearly labeled

✓ RAG uses only retrieved corpus evidence

✓ RAG limitation is explicitly shown when evidence is unavailable

✓ Live Official Research independently answers the query

✓ RAG and Web answers are NOT merged before generation

✓ Both answers are human-readable

✓ Both answers contain citations/sources where applicable

✓ Evidence Used is visible

✓ Official source links work

✓ Citation verification remains active

✓ Conversation context works

✓ Topic switching works

✓ Both responses persist in chat history

✓ Comparison remains a separate layer

✓ Compliance Agent remains completely separate

✓ npm run build succeeds

==================================================
FINAL PRODUCT BEHAVIOR
==================================================

The user should feel like they are talking to an intelligent legal research assistant, not selecting from predefined answer categories.

USER:
"Can my landlord evict me?"

MARE-JURIS:
asks a clarification only if genuinely necessary.

USER:
"Chennai, and I have a written agreement."

MARE-JURIS:

1. MARE-JURIS RAG
   → what our controlled corpus supports

2. LIVE OFFICIAL RESEARCH
   → what current official sources say

3. SOURCE COMPARISON
   → agreement/differences/freshness

Each answer is:
- simple
- structured
- human-readable
- evidence-backed
- source-linked

If the RAG corpus does not cover something:

Say so explicitly.

NEVER hallucinate RAG coverage.

NEVER replace the actual user query with a hardcoded topic.

NEVER mix this architecture with the Compliance Agent.