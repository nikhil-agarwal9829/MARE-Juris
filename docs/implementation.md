GLOBAL LIGHT THEME REDESIGN — MARE-JURIS ENTIRE WEBSITE

IMPORTANT:
Previously the light theme was implemented mainly for the Legal Literacy page.

Now implement the light theme CONSISTENTLY across the ENTIRE MARE-Juris website.

Do NOT redesign only Legal Literacy.

The entire application must use one coherent professional legal-tech light design system.

==================================================
1. FIRST INSPECT THE ENTIRE FRONTEND
==================================================

Before modifying code, inspect:

- global CSS
- Tailwind configuration
- layout.tsx
- navbar/header
- footer
- Home
- Ask MARE-Juris / ChatInterface
- Legal Literacy
- Compliance Agent
- Login
- Signup/Create Account
- authentication screens
- dashboards
- modals
- drawers
- cards
- buttons
- forms
- inputs
- dropdowns
- tabs
- alerts
- loading states
- error states
- citation/evidence components
- PDF/compliance UI
- mobile navigation

Find all places where dark-theme colors are hard-coded.

Search for:

bg-black
bg-gray
bg-slate-900
bg-zinc-900
bg-neutral-900
text-white
text-gray-*
text-slate-*
border-gray-*
border-slate-*
dark:
black
#000
#0*
rgba(...)

Do not blindly replace every color.

Understand the component first.

==================================================
2. CREATE ONE GLOBAL DESIGN SYSTEM
==================================================

Do NOT create different color systems for different pages.

Create centralized theme variables/tokens.

Preferred CSS variables:

--background
--surface
--surface-elevated
--primary
--primary-hover
--secondary
--accent
--foreground
--muted-foreground
--border
--success
--warning
--error

==================================================
3. APPROVED COLOR PALETTE
==================================================

Use this professional legal-tech palette:

Background:
#F8FAFC

Surface/Card:
#FFFFFF

Elevated Surface:
#FFFFFF

Primary Legal Navy:
#1E3A5F

Primary Hover:
#16304F

Action Blue:
#2563EB

Action Blue Hover:
#1D4ED8

Accent / Verified Teal:
#0F766E

Main Text:
#0F172A

Secondary Text:
#475569

Muted Text:
#64748B

Border:
#E2E8F0

Light Border:
#F1F5F9

Success:
#15803D

Warning:
#B45309

Error:
#B91C1C

Info:
#0369A1

==================================================
4. DESIGN PRINCIPLE
==================================================

MARE-Juris is a legal research and compliance platform.

The visual style should communicate:

- trustworthy
- professional
- authoritative
- modern
- clean
- accessible
- calm
- research-oriented

Avoid:

- excessive gradients
- neon colors
- excessive glassmorphism
- very bright backgrounds
- excessive shadows
- cartoon styling
- overly colorful cards

Use whitespace and hierarchy instead.

==================================================
5. GLOBAL BACKGROUND
==================================================

Entire website should use:

background: #F8FAFC

NOT:

black
dark navy
dark gray

Cards/panels:

background: #FFFFFF
border: #E2E8F0

Use subtle shadows only where needed.

Example:

shadow-sm

or equivalent subtle elevation.

==================================================
6. NAVBAR
==================================================

Create a clean white navbar.

Navbar:

background:
#FFFFFF

border-bottom:
#E2E8F0

Primary text:
#0F172A

Logo/brand:
#1E3A5F

Active navigation:
#1E3A5F

Hover:
#2563EB

The navbar must remain visually consistent on:

- Home
- Ask MARE-Juris
- Legal Literacy
- Compliance Agent
- Login
- Signup

Do not create separate navbar themes for individual pages.

==================================================
7. HOME PAGE
==================================================

Convert the Home page completely to the new light theme.

Hero:

background:
#F8FAFC

Main heading:
#0F172A

Highlighted legal-tech words:
#1E3A5F or #2563EB

Description:
#475569

Primary CTA:
#1E3A5F

Primary CTA hover:
#16304F

Secondary CTA:
white background
#1E3A5F border/text

Feature cards:
white
border #E2E8F0

==================================================
8. ASK MARE-JURIS
==================================================

This page must use the same light system.

Chat background:
#F8FAFC

User message:
#1E3A5F background
white text

Assistant message:
#FFFFFF
#E2E8F0 border
#0F172A text

Input:
white
border #CBD5E1

Send button:
#1E3A5F

Citations:
#2563EB

Verified:
#0F766E

Evidence panels:
white
subtle border
light elevation

RAG and Live Web responses must remain visually distinct.

For example:

MARE-JURIS RAG:
navy accent

LIVE OFFICIAL RESEARCH:
blue accent

Verified evidence:
teal accent

DO NOT change the dual-answer functionality.

==================================================
9. LEGAL LITERACY
==================================================

Preserve the existing Legal Literacy design/content.

Adapt it to the global palette.

Do not create a separate theme just for this page.

Use:

Category:
white cards

Category selected:
light navy/blue background

Rights cards:
white

Headings:
#0F172A

Source labels:
#475569

Verified Source:
#0F766E

Official source links:
#2563EB

Drawer:
white
border #E2E8F0

==================================================
10. COMPLIANCE AGENT
==================================================

Completely convert Compliance Agent to the same light system.

Business input:
white card

Questions:
white cards

Selected options:
light blue background
blue border

Progress:
#1E3A5F

Completed:
#15803D

Pending:
#B45309

Requirements dashboard:
white cards

Official source links:
#2563EB

Do NOT use the old dark background.

==================================================
11. AUTHENTICATION
==================================================

Login and Signup/Create Account pages must also use the same theme.

Background:
#F8FAFC

Auth card:
#FFFFFF

Border:
#E2E8F0

Heading:
#0F172A

Input:
white

Focus:
#2563EB

Primary button:
#1E3A5F

Errors:
#B91C1C

Success:
#15803D

==================================================
12. BUTTON SYSTEM
==================================================

Primary:

background #1E3A5F
text white

Hover:

#16304F

Secondary:

background white
border #CBD5E1
text #1E3A5F

Hover:

#F1F5F9

Link:

#2563EB

Success:

#15803D

Warning:

#B45309

Danger:

#B91C1C

Maintain consistent border radius throughout.

Do not make every element excessively rounded.

==================================================
13. INPUTS
==================================================

All inputs should be:

background: #FFFFFF
border: #CBD5E1
text: #0F172A

Placeholder:
#64748B

Focus:
blue border/ring

Disabled:
#F1F5F9

==================================================
14. TYPOGRAPHY
==================================================

Use the existing project font if already configured.

Maintain:

strong page headings
clear section headings
comfortable body text
good line height

Main text:
#0F172A

Secondary:
#475569

Muted:
#64748B

Do not use pure black everywhere.

==================================================
15. DARK MODE
==================================================

The requirement is now:

LIGHT THEME FIRST / PRIMARY EXPERIENCE.

Do not keep random dark components visible.

If the application already has a theme toggle, make sure:

LIGHT = coherent complete theme

If dark mode is retained as an optional future mode, do not allow dark styles to leak into the light theme.

The default application appearance should be light.

==================================================
16. REMOVE DARK THEME LEAKS
==================================================

After implementation, search the frontend again for:

bg-black
bg-gray-900
bg-slate-900
bg-zinc-900
bg-neutral-900
text-white
dark:bg-
dark:text-
dark:border-

Some text-white may be valid on dark primary buttons.

Do NOT blindly remove legitimate white text.

Remove dark backgrounds that appear unintentionally in the light UI.

==================================================
17. MODALS / DRAWERS / DROPDOWNS
==================================================

Every modal/drawer/dropdown must use:

background:
#FFFFFF

border:
#E2E8F0

text:
#0F172A

Backdrop:
rgba(15, 23, 42, 0.35)

Do not use opaque black backdrops.

==================================================
18. TABLES
==================================================

Tables:

header:
#F1F5F9

body:
#FFFFFF

border:
#E2E8F0

hover:
#F8FAFC

Text:
#0F172A

Links:
#2563EB

==================================================
19. STATUS COLORS
==================================================

Use semantic colors consistently.

VERIFIED:
teal/green

SUCCESS:
green

WARNING:
amber

ERROR:
red

INFO:
blue

Do not use arbitrary colors.

==================================================
20. ACCESSIBILITY
==================================================

Check contrast carefully.

Do not use:

light gray text on white
light blue text on white
very pale borders that disappear

Interactive elements must have clear hover/focus states.

Keyboard focus must remain visible.

==================================================
21. RESPONSIVE DESIGN
==================================================

The light theme must work correctly on:

Desktop
Laptop
Tablet
Mobile

Do not introduce horizontal overflow.

Check:

navbar
chat
cards
drawers
tables
forms
compliance dashboard
legal literacy cards

==================================================
22. IMPORTANT — PRESERVE FUNCTIONALITY
==================================================

This is a VISUAL/THEME change.

Do NOT break:

- authentication
- routing
- Legal Literacy
- Ask MARE-Juris
- RAG
- Live Web Research
- citations
- evidence
- source comparison
- Compliance Agent
- Supabase
- PDF generation
- chat persistence
- history
- API endpoints

Do not rewrite business logic.

==================================================
23. BUILD CHECK
==================================================

After implementation run:

npm run build

Fix any TypeScript/ESLint errors properly.

Do not disable ESLint or TypeScript checking.

==================================================
24. FINAL VISUAL AUDIT
==================================================

Inspect every major route.

Verify:

/home
/legal-literacy
/ask-mare-juris
/compliance
/login
/signup

and any other existing application routes.

The entire website must visually feel like ONE application.

There should NOT be:

dark Home
light Legal Literacy
dark Compliance
different Login theme

Everything must use the same design system.

==================================================
FINAL RESULT
==================================================

MARE-Juris should look like a professional modern Indian legal-tech platform:

Soft off-white background
White cards
Deep legal navy
Professional blue actions
Teal verification indicators
Slate typography
Subtle borders
Minimal shadows
Clean spacing

The design should prioritize trust and readability over flashy visual effects.

After completing the implementation, report:

1. Files changed
2. Global theme variables created
3. Routes updated
4. Dark-theme leaks removed
5. npm run build result
6. Any remaining visual inconsistencies