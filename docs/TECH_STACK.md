# Technology Stack

## Frontend
- Framework: Next.js (App Router, TypeScript)
- Supabase Integration: `@supabase/supabase-js`, `@supabase/ssr`
- Styling: Vanilla CSS / Modern UI tokens

## Backend
- Language / Framework: Python 3.11+ / FastAPI
- Supabase Client: `supabase-py`
- Configuration: `pydantic-settings`
- Transactional Email: `resend`

## Database & Storage
- Primary Database: Supabase PostgreSQL (Normalized DDL, RLS multi-tenancy)
- Authentication: Supabase Auth (JWT, Magic link, OTP)
- Storage: Supabase Storage (`user-documents` private bucket)
- Transactional SMTP: Resend Custom SMTP

## AI & Multi-Agent Engine (Planned Future Scope)
- Agent Framework: LangGraph
- LLM Provider: Google Gemini API
