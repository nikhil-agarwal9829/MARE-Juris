MAJOR COMPLIANCE AGENT REFACTOR — QUERY-DRIVEN ADAPTIVE QUESTION GENERATION

The current Compliance Agent is fundamentally too hard-coded.

CURRENT PROBLEM:

The UI/page contains fixed compliance flows for examples such as:

- Opening a restaurant
- Starting a SaaS business
- Other predefined business types

When a user enters an unrelated query such as:

"I need to make/apply for a passport"

the system incorrectly asks restaurant-related questions.

This must be completely redesigned.

==================================================
CORE REQUIREMENT
==================================================

The Compliance Agent must NOT decide questions from hard-coded page examples.

The USER'S ACTUAL QUERY must be the primary input.

Send the user's natural-language query to the LLM first.

The LLM must determine:

- What the user wants to do
- Whether this is a business compliance task, government service, personal/legal process, registration, licence, permit, etc.
- Relevant domain
- Jurisdiction
- Entity/person involved
- Important missing information
- What questions are actually necessary

Then dynamically generate questions specifically for that query.

==================================================
NEW ARCHITECTURE
==================================================

USER QUERY
    ↓
LLM QUERY UNDERSTANDING
    ↓
Intent + Domain + Entity + Jurisdiction
    ↓
QUESTION PLANNER
    ↓
4–5 CORE QUESTIONS
    ↓
USER ANSWERS
    ↓
ADAPTIVE FOLLOW-UP QUESTIONS
    ↓
MAXIMUM 10 QUESTIONS TOTAL
    ↓
FINAL STRUCTURED PROFILE
    ↓
OFFICIAL-SOURCE RESEARCH
    ↓
REQUIREMENT EXTRACTION
    ↓
CONDITION / DOCUMENT / AUTHORITY MAPPING
    ↓
COMPLIANCE ROADMAP
    ↓
DASHBOARD + PDF

==================================================
1. USER QUERY MUST BE FREE-FORM
==================================================

Do NOT force users to select:

Restaurant
SaaS
Pharmacy
Clinic
etc.

Those can remain as example suggestions/cards on the landing page, but they MUST NOT control the actual compliance logic.

If the user writes:

"I want to get a passport"

the system must handle passport application.

If the user writes:

"I want to register a company"

handle company registration.

If the user writes:

"I want to open a restaurant"

handle restaurant compliance.

If the user writes:

"I want to start a SaaS platform"

handle SaaS/business compliance.

If the user writes:

"I want to obtain a driving licence"

handle that request.

The system must be domain-agnostic.

==================================================
2. FIRST LLM CALL — QUERY UNDERSTANDING
==================================================

Create a structured LLM output.

Example:

{
  "intent": "passport_application",
  "request_type": "government_service",
  "subject": "passport",
  "entity_type": "individual",
  "jurisdiction": "India",
  "location_known": false,
  "known_facts": [],
  "unknown_critical_facts": [
    "city_or_state",
    "new_or_renewal",
    "adult_or_minor",
    "ordinary_or_tatkal"
  ]
}

For SaaS:

{
  "intent": "start_saas_business",
  "request_type": "business_compliance",
  "subject": "SaaS business",
  "entity_type": "business",
  "jurisdiction": "India",
  "known_facts": [
    "SaaS",
    "subscription payments",
    "customer data"
  ],
  "unknown_critical_facts": [
    "business_structure",
    "registration_location",
    "customer_geography",
    "data_categories"
  ]
}

Do not fabricate facts.

==================================================
3. QUESTION GENERATION MUST ALSO BE DONE BY LLM
==================================================

After understanding the query, ask the LLM to generate the minimum useful questions.

Questions MUST depend on:

- user's query
- detected intent
- jurisdiction
- known facts
- previous answers

DO NOT use a fixed question list.

The LLM should return structured questions:

{
  "questions": [
    {
      "id": "location",
      "question": "Which city and state are you applying/operating from?",
      "type": "text",
      "required": true,
      "reason": "The applicable authority/process may depend on location."
    }
  ]
}

==================================================
4. QUESTION LIMIT
==================================================

Hard maximum:

10 QUESTIONS TOTAL.

This is an absolute limit.

Preferred:

4–5 questions initially.

Then generate adaptive follow-ups only if genuinely necessary.

Typical flow:

Round 1:
4–5 questions

Round 2:
0–5 additional questions

TOTAL:
Never exceed 10.

Do NOT ask unnecessary questions just to reach 10.

==================================================
5. ADAPTIVE QUESTIONING
==================================================

After every user response, send the current structured profile back to the LLM.

Example:

User:
"I want to apply for a passport."

Questions:

Q1:
Are you applying for a new passport or renewing an existing passport?

User:
"New passport."

Now the next questions should be generated based on that answer.

Do NOT repeat questions.

Do NOT ask restaurant questions.

Do NOT ask SaaS questions.

Do NOT ask questions whose answers are already known.

==================================================
6. QUESTION QUALITY RULES
==================================================

Every question must have a reason.

Ask only information that can change:

- applicable requirement
- authority
- procedure
- documents
- eligibility
- fees
- timeline
- renewal
- jurisdiction

Avoid unnecessary personal information.

Do not ask sensitive information unless genuinely required for the requested process.

Never ask for:

- passwords
- OTPs
- bank passwords
- authentication secrets

==================================================
7. PASSPORT EXAMPLE
==================================================

Input:

"I need to make a passport."

The system should understand:

intent:
passport application

It should NOT ask:

"What type of restaurant?"

"What type of food?"

"Will you serve alcohol?"

Instead generate relevant questions such as:

1. Which city/state are you applying from?
2. Is this your first passport or a renewal/reissue?
3. Is the applicant an adult or minor?
4. Do you need Ordinary or Tatkal processing?
5. Is there any existing passport-related issue that affects the application?

Only ask questions that are actually relevant after considering the current official process.

==================================================
8. RESTAURANT EXAMPLE
==================================================

Input:

"I want to open a restaurant in Chennai."

Possible questions:

1. What type of restaurant/food establishment?
2. Where in Chennai will it operate?
3. Will food be prepared on-site?
4. Will alcohol be served?
5. Will you provide dine-in, takeaway, delivery, or a combination?

These questions must come from the query understanding layer.

They must NOT be hard-coded as the universal compliance questions.

==================================================
9. SAAS EXAMPLE
==================================================

Input:

"I want to start a SaaS business in India."

Possible questions:

1. Where will the business be registered?
2. What business structure are you considering?
3. Will customers be in India, outside India, or both?
4. What categories of personal data will the SaaS process?
5. Will you collect recurring online payments?

Again, these are generated dynamically.

==================================================
10. FINAL PROFILE
==================================================

After questioning, create:

{
  "request": "...",
  "intent": "...",
  "domain": "...",
  "entity_type": "...",
  "jurisdiction": "...",
  "location": "...",
  "facts": {},
  "answers": {},
  "assumptions": [],
  "questions_asked": 5
}

Do not invent missing information.

If something critical remains unknown, mark it as:

"unknown"

rather than guessing.

==================================================
11. COMPLIANCE RESEARCH
==================================================

ONLY AFTER collecting sufficient information should compliance research begin.

Research based on the FINAL USER PROFILE.

Do NOT research based only on:

Restaurant
SaaS
or another hard-coded category.

Research:

final intent
+
jurisdiction
+
entity
+
user answers
+
known facts

Prioritize official sources:

- India Code
- Central Government portals
- State Government portals
- Ministries
- Departments
- Regulators
- Official authority websites

==================================================
12. REQUIREMENT GENERATION
==================================================

Generate structured requirements:

{
  "requirement": "...",
  "status": "required|conditional|not_applicable|unknown",
  "reason": "...",
  "condition": "...",
  "authority": "...",
  "documents": [],
  "application_link": "...",
  "renewal": "...",
  "source": "...",
  "retrievedAt": "..."
}

Every legal/compliance requirement must be supported by evidence.

Do NOT hallucinate requirements.

==================================================
13. FULL ROADMAP
==================================================

After research, generate a complete step-by-step roadmap.

Example structure:

# Compliance Roadmap

## Step 1 — Before starting
...

## Step 2 — Registration/Application
...

## Step 3 — Documents
...

## Step 4 — Licences/Approvals
...

## Step 5 — Ongoing compliance
...

## Step 6 — Renewal/recurring obligations
...

For each item show:

- What to do
- Why it is needed
- Who requires it
- Documents
- Authority
- Application/process link
- Conditions
- Deadline/renewal where applicable
- Official source

==================================================
14. NO HALLUCINATION
==================================================

The LLM must NOT invent:

- licences
- government schemes
- fees
- deadlines
- documents
- eligibility rules
- authorities
- URLs

If official evidence is unavailable:

"Unable to verify this requirement from the available official sources."

==================================================
15. FRONTEND CHANGES
==================================================

Redesign the Compliance Agent UI around:

STEP 1
"Tell us what you want to do"

Large natural-language input.

Example placeholder:

"Describe what you want to start, register, apply for, or comply with..."

Example suggestions can be displayed:

Open a restaurant
Start a SaaS business
Apply for a passport
Register a company
Obtain a licence

BUT these suggestions are merely examples.

Clicking one should simply populate the query field.

They must NOT activate a hard-coded questionnaire.

==================================================
STEP 2
Dynamic Questions

Show:

"To build your roadmap, I need a few details."

Then display LLM-generated questions.

Show progress:

Questions 1–5 of approximately 10

Do not promise exactly 10.

==================================================
STEP 3
Review Profile

Show what the system understood:

Request
Location
Entity
Jurisdiction
Known details

Allow user to correct details before research.

==================================================
STEP 4
Generate Roadmap

Button:

"Generate Compliance Roadmap"

==================================================
STEP 5
Roadmap

Display:

Overview
Required actions
Conditional requirements
Documents
Authorities
Official sources
Timeline/order
Renewals
Warnings

==================================================
16. ISOLATION
==================================================

Every compliance session must be independent.

A previous restaurant session MUST NOT influence a new passport query.

A previous SaaS session MUST NOT influence a new restaurant query.

Reset:

- intent
- domain
- questions
- answers
- profile
- requirements
- roadmap

when a new assessment starts.

Persist each assessment separately.

==================================================
17. EXISTING EXAMPLE CARDS
==================================================

Keep the existing "Open Restaurant", "Start SaaS", etc. examples if useful.

But convert them to:

setQuery("I want to open a restaurant...")

rather than:

setComplianceType("restaurant")

The LLM must then determine the appropriate flow.

==================================================
18. BACKEND API DESIGN
==================================================

Create/modify APIs so the process is stateful.

Suggested:

POST /api/v1/compliance/analyze

Input:
{
  "query": "..."
}

Output:
{
  "intent": {...},
  "questions": [...]
}

Then:

POST /api/v1/compliance/questions

Input:
{
  "query": "...",
  "profile": {...},
  "answers": {...}
}

Output:
{
  "questions": [...],
  "complete": false
}

Finally:

POST /api/v1/compliance/roadmap

Input:
{
  "query": "...",
  "profile": {...},
  "answers": {...}
}

Output:

{
  "profile": {...},
  "requirements": [...],
  "roadmap": [...],
  "sources": [...]
}

Use the project's existing API architecture if equivalent endpoints already exist. Do not create duplicate systems unnecessarily.

==================================================
19. IMPORTANT — LLM STRUCTURED OUTPUT
==================================================

Use structured JSON/schema validation for:

- intent analysis
- question generation
- final profile
- requirements
- roadmap

Do NOT parse arbitrary natural-language LLM responses using fragile string matching.

Validate:

maximum 10 questions
unique question IDs
no duplicate questions
required fields
valid status values

==================================================
20. FINAL ACCEPTANCE TESTS
==================================================

Test at least these queries independently:

TEST 1:

"I want to open a restaurant in Chennai."

Expected:
Restaurant-specific questions.

TEST 2:

"I want to start a SaaS company."

Expected:
SaaS/business-specific questions.

TEST 3:

"I need to apply for a passport."

Expected:
Passport/government-service-specific questions.

It MUST NOT ask restaurant questions.

TEST 4:

"I want to register a company in Hyderabad."

Expected:
Company-registration-specific questions.

TEST 5:

"I want to obtain a driving licence."

Expected:
Driving-licence-specific questions.

For every test:

- Initial questions <= 5 preferred
- Total questions <= 10
- No irrelevant questions
- No context leakage
- Final roadmap matches the user's actual request
- Requirements backed by official sources
- No hallucinated compliance obligations

==================================================
21. BUILD
==================================================

Run:

npm run build

Fix all TypeScript/ESLint errors properly.

Do not disable ESLint.

Do not break existing:

- authentication
- RAG
- Legal Literacy
- Ask MARE-Juris
- citations
- evidence
- chat history
- PDF generation

==================================================
FINAL GOAL
==================================================

The Compliance Agent should behave like:

USER:
"I want to do X"

MARE-Juris:
"Understood. I need these few details to determine the applicable requirements."

USER:
answers questions

MARE-Juris:
"Based on your specific situation, here is your evidence-backed compliance roadmap."

The system must be driven by the user's actual request, NOT by the four example businesses shown on the page.