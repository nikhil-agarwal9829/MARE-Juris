# Architecture Overview

## System Diagram

```
User -> Next.js Frontend -> FastAPI Backend -> Supabase (Auth, Postgres DB, Storage) -> LangGraph -> Specialist Legal Agents (Statute, Case-Law, Document, Compliance) -> Evidence Normalization -> Claim Planning -> Gemini -> Citation & Legal-Grounding Auditor -> Repair / Abstention
```

## Data & Infrastructure Layer

- **Authentication & Identity**: Supabase Auth (JWT session management, Verification Link, Email OTP, Password Reset). Custom SMTP via Resend.
- **Database**: Supabase PostgreSQL with 15 normalized tables, strict Row Level Security (RLS) policies isolating user data, and read-only global legal knowledge corpus.
- **Storage**: Supabase Private Storage (`user-documents`) bucket with path-isolated user access policies.
- **Backend API**: FastAPI framework providing typed route handlers, Supabase database client abstractions, JWT authentication dependencies, and Resend transactional email notification service.
- **Frontend Client**: Next.js App Router featuring browser, server, and administrative Supabase client abstractions and authentication route-guard middleware.
- **Email Service**: Resend custom SMTP for Supabase Auth + Resend REST API wrapper in FastAPI for application-level notifications.
