============================================================
MARE-JURIS — REDESIGN LEGAL LITERACY PAGE
============================================================

IMPORTANT:
This is a REDESIGN of the existing /literacy page.

Do NOT redesign the rest of MARE-Juris.

Do NOT change:
- navbar design
- Ask MARE-Juris
- Compliance Agent
- authentication
- homepage
- existing backend
- existing RAG architecture
- existing global dark theme
- existing typography system

ONLY improve the Legal Literacy experience.

============================================================
CORE PRODUCT DIRECTION
============================================================

The current Legal Literacy implementation is too focused on
a "scenario/game/3D object" experience.

CHANGE THE CONCEPT.

Legal Literacy should become:

AN INTERACTIVE LEGAL KNOWLEDGE & AWARENESS HUB

The user should be able to:

1. Browse legal rights.
2. Search for a right/topic.
3. Select a legal category.
4. Read a simple explanation.
5. Understand the right through examples.
6. See important practical points.
7. Expand the legal basis.
8. See the source.
9. Open the official source.
10. Learn what to do if the right is violated.

The experience should feel:

professional
educational
interactive
trustworthy
modern
visually interesting

NOT:

a textbook
a boring legal database
a generic blog
a children's game
a random 3D demo

============================================================
REMOVE THE CURRENT 3D HOUSE
============================================================

The current moving house/3D object in the Tenant Rights
scenario is NOT visually effective.

REMOVE IT.

Do not use continuously rotating 3D objects.

Do not use random floating 3D shapes merely to make the
page look "3D".

Do not use an animated object unless it contributes to
understanding the legal content.

The legal content is more important than visual effects.

============================================================
LIGHT + DARK THEME
============================================================

The Legal Literacy page MUST support:

DARK MODE
+
LIGHT MODE

The current dark theme is good.

DO NOT CHANGE THE EXISTING DARK THEME unnecessarily.

Create a carefully designed light-theme equivalent.

LIGHT MODE MUST NOT simply invert colors.

Define proper semantic design tokens:

--background
--surface
--surface-elevated
--surface-muted
--text-primary
--text-secondary
--text-muted
--border
--accent
--accent-muted
--gold
--success
--warning
--danger

Ensure:

WCAG-readable contrast
clear hierarchy
visible borders
visible buttons
visible secondary text
readable cards
readable source links

Test the entire page in both themes.

============================================================
PAGE HERO
============================================================

Keep the concept:

"Know Your Rights"

But make the messaging more informational.

Suggested:

KNOW YOUR RIGHTS

Understand Indian laws through simple explanations,
practical examples, and verified legal sources.

Supporting text:

"Explore common rights and legal protections across
property, consumer, employment, cyber, family and
business law."

Below:

SEARCH

"Search rights, laws, topics or Acts..."

Examples:

Tenant rights

Consumer refund

Workplace rights

Data protection

Women's rights

Business rights

============================================================
CATEGORY NAVIGATION
============================================================

Keep category navigation.

Categories:

All Rights
Tenant Rights
Consumer Rights
Employment Rights
Cyber Rights
Women & Family
Business Rights

Potential future categories:

Constitutional Rights
Education
Healthcare
Financial Rights
Senior Citizens
Children
Accessibility

Do not overload the first version.

Category buttons should be:

compact
clear
interactive
keyboard accessible

On mobile they should become horizontally scrollable.

============================================================
MAIN INFORMATION EXPERIENCE
============================================================

Instead of immediately showing a scenario with three
answers, display:

RIGHTS LIBRARY

Example:

TENANT RIGHTS

------------------------------------------

RIGHT CARD

Right to Proper Notice

Short explanation:

"Depending on the applicable tenancy arrangement,
agreement and local law, a tenant may have protections
against certain forms of abrupt termination."

[Learn more →]

------------------------------------------

RIGHT CARD

Security Deposit

Short explanation.

[Learn more →]

------------------------------------------

RIGHT CARD

Essential Services

Short explanation.

[Learn more →]

------------------------------------------

RIGHT CARD

Written Rental Agreement

Short explanation.

[Learn more →]

============================================================
IMPORTANT
============================================================

DO NOT claim a universal "tenant right" unless the legal
source actually supports it.

Indian tenancy law can depend on:

state
local law
type of tenancy
contract
property
circumstances

The UI must communicate this where relevant.

============================================================
RIGHT DETAIL EXPERIENCE
============================================================

When the user clicks a right:

DO NOT immediately navigate away.

Open an elegant expandable detail panel OR a dedicated
detail route.

Example:

/literacy/tenant-rights/proper-notice

------------------------------------------------------------

PROPER NOTICE

Tenant Rights

PROPERTY LAW

------------------------------------------------------------

IN SIMPLE WORDS

Explain the concept in plain language.

------------------------------------------------------------

WHAT THIS MEANS

Use 2–4 short paragraphs or bullets.

------------------------------------------------------------

REAL-WORLD EXAMPLE

Example:

"Your landlord tells you verbally that you must leave
tomorrow..."

Then explain what the user should understand.

------------------------------------------------------------

WHAT TO CHECK

✓ Your rental agreement
✓ Applicable state/local tenancy rules
✓ Nature of the tenancy
✓ Any written notice
✓ Relevant dispute-resolution process

------------------------------------------------------------

LEGAL BASIS

Show:

Act
Section
Relevant provision

------------------------------------------------------------

VERIFIED SOURCE

[ View official source → ]

------------------------------------------------------------

IMPORTANT

"Legal requirements can vary depending on the applicable
state/local law, contract and circumstances."

============================================================
SOURCE-FIRST DESIGN
============================================================

EVERY LEGAL RIGHT MUST HAVE A SOURCE.

Do not create unsupported legal claims.

Each right should contain structured source metadata:

{
  title,
  act,
  section,
  jurisdiction,
  sourceUrl,
  sourceAuthority,
  lastVerified
}

Example:

{
  act: "Transfer of Property Act, 1882",
  section: "...",
  sourceAuthority: "India Code",
  sourceUrl: "...",
  jurisdiction: "India"
}

============================================================
OFFICIAL SOURCES
============================================================

Prefer authoritative sources.

Primary source hierarchy:

1. India Code
2. Official Government websites
3. Official regulatory authorities
4. State Government portals
5. Courts / official judicial sources
6. Other authoritative sources where necessary

Do NOT use random legal blogs as the primary legal basis.

India Code is an important primary source for Acts and
statutory provisions.

Use official sources such as India Code when available.

For example, official India Code material includes:

Constitution of India
Consumer Protection Act, 2019
Digital Personal Data Protection Act, 2023
Transfer of Property Act provisions

The implementation must verify the CURRENT source before
publishing a legal claim.

============================================================
SOURCE PANEL
============================================================

When a user clicks:

"Legal Source"

show a beautiful source panel.

Example:

┌──────────────────────────────────────────────┐
│ VERIFIED LEGAL SOURCE                        │
│                                              │
│ Transfer of Property Act, 1882               │
│ Section 106                                  │
│                                              │
│ Source: India Code                           │
│ Jurisdiction: India                          │
│                                              │
│ [ Open Official Source ↗ ]                   │
└──────────────────────────────────────────────┘

Do not hide the source.

The user should immediately understand:

"Where did MARE-Juris get this from?"

============================================================
SOURCE TRUST INDICATOR
============================================================

Use a subtle:

✓ VERIFIED SOURCE

badge.

Do NOT imply that MARE-Juris itself is a government
authority.

Correct:

"Verified against official source"

Incorrect:

"Government Verified by MARE-Juris"

============================================================
LEGAL CONTENT DESIGN
============================================================

Avoid huge paragraphs.

Use:

short sections
cards
bullets
highlighted phrases
accordions
timelines
examples
checklists

Example:

WHAT YOU SHOULD KNOW

1. Check your agreement.
2. Identify the applicable law.
3. Keep written records.
4. Check the relevant notice requirements.
5. Seek appropriate assistance if necessary.

============================================================
INTERACTIVE LEARNING
============================================================

We still want engagement.

But engagement should come from:

reading
exploration
hover
expand
comparison
visual timelines
source exploration
micro interactions

NOT from a game-like quiz everywhere.

Add optional:

"Test your understanding"

at the bottom of a topic.

Example:

QUESTION

"Which document should you check first?"

[ Rental Agreement ]

[ Random WhatsApp message ]

[ Social media post ]

Then show:

WHY?

Short explanation.

This should be OPTIONAL.

============================================================
VISUAL STORYTELLING
============================================================

Instead of the current moving house:

use meaningful visual storytelling.

Possible visual systems:

LEGAL TIMELINE

Agreement
   ↓
Notice
   ↓
Response
   ↓
Dispute resolution
   ↓
Outcome

DOCUMENT STACK

Act
↓
Section
↓
Rule
↓
Practical meaning

RIGHTS MAP

User
 |
 ├── Property
 ├── Consumer
 ├── Employment
 ├── Cyber
 ├── Family
 └── Business

Use animated SVG/CSS graphics.

These are preferred over heavy 3D.

============================================================
OPTIONAL 3D
============================================================

3D is allowed ONLY when it improves comprehension.

Examples:

A document unfolding

A shield forming around personal data

A contract opening

A timeline being assembled

A courthouse silhouette

A legal book opening

Keep them:

small
subtle
non-distracting
GPU efficient

NO constant rotation.

NO floating house.

NO random spinning objects.

NO 3D background that competes with text.

============================================================
LEGAL QUOTES / CALLOUTS
============================================================

Add visually attractive callouts.

Examples:

"Know the rule before you take the next step."

"Your contract matters. So does the law that governs it."

"Legal awareness begins with knowing where the rule comes
from."

IMPORTANT:

If using an actual quotation from a statute or judgment,
do not fabricate it.

Clearly distinguish:

Official quotation

from:

MARE-Juris educational explanation.

============================================================
VISUAL ASSETS
============================================================

Use the web for DESIGN REFERENCE and suitable legal imagery.

Research:

interactive legal education websites

legal knowledge platforms

modern editorial websites

interactive documentation

educational storytelling

legal technology products

high-quality SVG legal illustrations

professional justice imagery

Use these for inspiration.

Do NOT copy another website.

Do NOT use random stock images just for decoration.

Prefer:

custom SVG illustrations
licensed illustrations
official/public-domain imagery
self-created visual elements

============================================================
INFORMATION ARCHITECTURE
============================================================

The page should follow:

HERO

↓

SEARCH

↓

CATEGORY FILTERS

↓

FEATURED RIGHTS

↓

RIGHTS LIBRARY

↓

RIGHT DETAIL

↓

LEGAL SOURCE

↓

PRACTICAL TAKEAWAY

↓

OPTIONAL LEARNING CHECK

↓

RELATED RIGHTS

============================================================
FEATURED RIGHTS
============================================================

Create 3–4 highlighted rights at the top.

Example:

FEATURED

"Know what protections may apply before signing
a rental agreement."

"Understand your consumer remedies."

"Know what data rights you may have."

"Understand basic workplace protections."

Each card:

small icon
title
short description
category
source indicator

============================================================
SEARCH
============================================================

Search should actually work.

Search across:

title
description
category
Act
section
keywords

Example:

Search:

"deposit"

Results:

Security Deposit

Tenant Rights

Relevant source

Search:

"data"

Results:

Personal Data Rights

Cyber Rights

DPDP Act

============================================================
FILTERING
============================================================

Category filters must work instantly.

No full-page reload.

Use client-side filtering for small datasets.

If content becomes large:

server-side search/indexing.

============================================================
RIGHT DATA ARCHITECTURE
============================================================

Do NOT hardcode the content directly into JSX.

Create structured data.

Example:

{
  id: "tenant-proper-notice",

  category: "Tenant Rights",

  title: "Notice Before Termination",

  summary: "...",

  explanation: "...",

  practicalExample: "...",

  whatToCheck: [
    "...",
    "...",
    "..."
  ],

  legalBasis: [
    {
      act: "...",
      section: "...",
      jurisdiction: "..."
    }
  ],

  source: {
    authority: "...",
    title: "...",
    url: "...",
    verifiedAt: "..."
  },

  relatedRights: []
}

============================================================
LEGAL ACCURACY
============================================================

CRITICAL:

Do NOT invent rights.

Do NOT oversimplify a conditional rule into an absolute rule.

Do NOT state:

"Every tenant has X right"

unless the applicable legal source actually supports it.

For legal rules that depend on:

state
contract
property type
circumstances
date
jurisdiction

explicitly say so.

============================================================
SOURCE VERIFICATION
============================================================

Before publishing a legal content item:

1. Identify the legal proposition.
2. Find authoritative source.
3. Verify Act.
4. Verify section.
5. Verify current status.
6. Store source URL.
7. Store verification date.
8. Display source to user.

If no authoritative source can be verified:

DO NOT present the claim as verified law.

Mark:

"Source verification required."

============================================================
CURRENT LAW
============================================================

The implementation must account for changes in Indian law.

Do not assume old legal material is still current.

Where legislation has changed/repealed/replaced provisions,
show the current applicable framework.

============================================================
TENANT RIGHTS EXAMPLE
============================================================

The existing "Arbitrary Immediate Eviction Notice" example
is too narrow as the primary experience.

Instead create a broader:

TENANT RIGHTS

Explore common topics:

• Rental Agreement
• Notice / Termination
• Security Deposit
• Essential Services
• Rent & Receipts
• Repairs & Maintenance
• Privacy / Entry
• Eviction Procedures
• Dispute Resolution

IMPORTANT:

These are topic categories.

Each individual legal proposition must be verified against
the applicable law and jurisdiction.

============================================================
CONSUMER RIGHTS
============================================================

Create topics such as:

• Right to Information
• Protection from Unfair Trade Practices
• Product Defects
• Deficient Services
• Refund / Remedy concepts
• Complaints
• Consumer Commissions

Verify each proposition against current official sources.

============================================================
CYBER / DATA RIGHTS
============================================================

Create educational topics around:

• Personal Data
• Consent
• Access to information
• Correction / Erasure
• Grievance Redressal
• Online fraud awareness
• Cybercrime reporting

Clearly distinguish:

data protection rights

from

general cybercrime remedies.

============================================================
EMPLOYMENT RIGHTS
============================================================

Create topics around:

• Employment contracts
• Wages
• Working conditions
• Leave
• Workplace safety
• Harassment protections
• Social security

Do not claim a particular entitlement without checking
applicable legislation and worker/category/state context.

============================================================
WOMEN & FAMILY
============================================================

Possible topics:

• Domestic violence protections
• Maintenance concepts
• Inheritance
• Marriage-related legal protections
• Workplace protections
• Child-related protections

Every legal proposition requires source verification.

============================================================
BUSINESS RIGHTS
============================================================

Possible topics:

• Contracts
• Intellectual property
• Consumer obligations
• Data protection
• Employment compliance
• Business registration
• Dispute resolution

This section should connect naturally to:

COMPLIANCE AGENT

with:

"Starting a business?"

[ Explore Compliance Agent → ]

============================================================
RELATED CONTENT
============================================================

At the bottom of every right:

RELATED RIGHTS

Example:

Tenant Rights
→ Security Deposit

→ Notice

→ Rental Agreement

→ Dispute Resolution

This encourages exploration.

============================================================
LIGHT MODE DESIGN
============================================================

Create a premium editorial-style light theme.

Suggested direction:

warm/off-white background

dark navy text

deep charcoal

muted gold

subtle green/teal accent

soft borders

high readability

Do NOT use pure white everywhere.

Avoid:

yellow text on white

gray text with insufficient contrast

light gray borders that disappear

gold text that becomes unreadable

============================================================
DARK MODE
============================================================

KEEP THE CURRENT DARK THEME.

Do not unnecessarily modify it.

Maintain:

navy/black background

cream typography

gold accent

green/teal verification accent

subtle borders

============================================================
ANIMATION SYSTEM
============================================================

Use animation only for interaction.

Examples:

Card hover:

small elevation
border glow
icon movement

Source open:

panel expands smoothly

Category change:

content fades/slides subtly

Right detail:

accordion expands

Timeline:

steps reveal sequentially

Search:

results transition smoothly

Do NOT continuously animate the page.

Respect:

prefers-reduced-motion.

============================================================
MOBILE
============================================================

The Legal Literacy page must work perfectly on:

desktop
tablet
mobile

On mobile:

category tabs become horizontally scrollable

cards become single-column

source panels become full width

search remains accessible

animations become lighter

============================================================
ACCESSIBILITY
============================================================

Support:

keyboard navigation

focus states

screen reader labels

semantic headings

ARIA where required

reduced motion

sufficient contrast

Do not make hover the only way to access information.

============================================================
PERFORMANCE
============================================================

Do not load large 3D assets on page load.

Prefer:

SVG
CSS
small illustrations
lazy-loaded media

Use:

dynamic imports
intersection observers
lazy loading

if 3D/large assets are actually needed.

============================================================
LEGAL SOURCE UX
============================================================

The user should NEVER have to wonder:

"Where did this information come from?"

Every detailed legal item should have:

SOURCE

ACT

SECTION

AUTHORITY

JURISDICTION

VERIFIED DATE

OPEN SOURCE

============================================================
DISCLAIMER
============================================================

Add a subtle educational disclaimer:

"MARE-Juris provides general legal information for
educational and awareness purposes. Legal requirements
may vary by jurisdiction, contract and circumstances.
This content is not a substitute for professional legal
advice."

Do not make the disclaimer dominate the UI.

============================================================
DO NOT BREAK EXISTING FEATURES
============================================================

Before implementation:

inspect the current repository.

Identify:

existing /literacy route

components

data files

design tokens

theme provider

animation utilities

source components

API routes

existing legal data

Do not duplicate existing components.

Reuse existing architecture wherever possible.

============================================================
USE INSTALLED SKILLS
============================================================

Before implementation inspect:

~/.agents/skills

Use ALL RELEVANT skills available for this task.

Especially relevant categories:

UI/UX
frontend design
design systems
React
Next.js
accessibility
motion
Three.js/WebGL
creative coding
performance
legal information architecture
RAG
LLM
web research
source verification
backend
security

Do NOT load unrelated skills just to increase context.

============================================================
TESTING
============================================================

Test:

1. Dark mode
2. Light mode
3. Search
4. Category filtering
5. Right detail
6. Source panel
7. External source links
8. Mobile
9. Keyboard navigation
10. Reduced motion
11. Loading states
12. Empty states
13. Error states

Run:

npm run lint

npm run build

Fix all errors.

============================================================
FINAL UX TARGET
============================================================

The final Legal Literacy page should feel like:

"An interactive legal knowledge magazine"

combined with:

"An authoritative legal source explorer"

combined with:

"A modern educational experience."

NOT:

a chatbot

NOT:

a legal textbook

NOT:

a 3D game

NOT:

a collection of static cards.

============================================================
SUCCESS CRITERIA
============================================================

A user should be able to enter the page and within seconds:

1. Understand what Legal Literacy is.
2. Search for a legal topic.
3. Browse rights.
4. Open a right.
5. Read a simple explanation.
6. See a practical example.
7. See the legal basis.
8. Open the official source.
9. Explore related rights.
10. Switch between dark and light themes.

The experience must make legal information:

EASY TO FIND
EASY TO UNDERSTAND
EASY TO VERIFY
EASY TO EXPLORE

while maintaining professional LegalTech credibility.

============================================================
END OF PROMPT
============================================================