# Infrastructure & Development TODO

## Completed Tasks
- [x] Repository inspection & architecture plan alignment
- [x] Environment template configuration (`.env.example`) and `.gitignore` guardrails
- [x] Supabase PostgreSQL database schema migration DDL (15 normalized tables)
- [x] Comprehensive Row Level Security (RLS) policies on all tables
- [x] Private Supabase Storage bucket (`user-documents`) DDL & path security policies
- [x] Frontend Next.js Supabase client suite (`client.ts`, `server.ts`, `admin.ts`, `middleware.ts`)
- [x] Backend FastAPI Supabase integration, JWT auth dependencies, and Resend email service abstraction
- [x] Health check API endpoint `/health`
- [x] Comprehensive infrastructure documentation (`docs/SUPABASE_SETUP.md`)

## Next Steps (Future Scope)
- [ ] User authentication UI pages (Signup, Login, OTP verification, Password Reset)
- [ ] Document upload API & parser pipeline
- [ ] Global legal corpus ingestion & vector indexing
- [ ] LangGraph agent orchestration & Gemini integration
