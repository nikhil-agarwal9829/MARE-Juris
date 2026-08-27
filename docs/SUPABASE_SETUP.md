# Supabase & Brevo Infrastructure Setup for MARE-Juris

This document outlines the architecture, database schema, security rules (Row Level Security), storage policies, and Brevo SMTP email integration for the **MARE-Juris** platform.

---

## Architecture Overview

MARE-Juris relies on Supabase as its primary backend data platform and Brevo for transactional email delivery via custom SMTP.

```
                      +-------------------+
                      |   Next.js Client  |
                      +---------+---------+
                                |
             +------------------+------------------+
             |                                     |
             v                                     v
  (Browser Supabase Client)              (FastAPI Backend)
  - Anon Key                             - Service Role Key / User JWT
  - User Session Auth                    - Supabase Client Layer
             |                                     |
             +------------------+------------------+
                                |
                                v
                       +-------------------+
                       | Supabase Platform |
                       | - PostgreSQL DB   |
                       | - Auth (JWT)      |
                       | - Storage Buckets |
                       +---------+---------+
                                 |
                                 v
                       +-------------------+
                       | Brevo Custom      |
                       | SMTP (Port 587)   |
                       | - Auth Emails     |
                       | - App Emails      |
                       +-------------------+
```

---

## 1. Environment Variables

Store all environment variables in local `.env` (never commit real credentials). Reference template in [.env.example](file:///c:/Users/Nikhil%20Agarwal/Desktop/MARE-Juris/.env.example).

| Variable | Scope | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Frontend & Backend | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Frontend & Backend | Safe public API key for browser client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-Only / Backend & Admin | Privileged service key (Bypasses RLS). **NEVER expose to frontend!** |
| `SUPABASE_DB_URL` | Server-Only | Direct or Pooler PostgreSQL connection string |
| `BREVO_SMTP_HOST` | Server-Only / Backend | `smtp-relay.brevo.com` |
| `BREVO_SMTP_PORT` | Server-Only / Backend | `587` (TLS) |
| `BREVO_SMTP_USERNAME` | Server-Only / Backend | Brevo SMTP Login (Account email / SMTP login) |
| `BREVO_SMTP_PASSWORD` | Server-Only / Backend | Brevo SMTP Key (`xsmtpsib-...`) |
| `BREVO_API_KEY` | Server-Only / Backend | Brevo API Key (`xkeysib-...`) |
| `BREVO_FROM_EMAIL` | Server-Only / Backend | Verified sender email address |
| `BREVO_FROM_NAME` | Server-Only / Backend | Transactional sender display name (`MARE-Juris Legal`) |
| `GEMINI_API_KEY` | Server-Only / Backend | Gemini API key for future agent reasoning |

---

## 2. Authentication & Brevo Custom SMTP Setup

Supabase Auth handles user identity, credentials, OTP generation, verification, and sessions, while Brevo is responsible for transactional email delivery.

### Required Auth Flows Supported
1. **Email / Password Signup**: Requires email confirmation link delivered via Brevo SMTP.
2. **Email / Password Login**: Authenticates credentials and returns JWT session tokens (`access_token` and `refresh_token`).
3. **Email Verification**: Supabase Auth verification link sent via Brevo SMTP.
4. **Email OTP**: One-Time Passcode login/verification via Supabase Auth OTP API.
5. **Password Reset**: Password recovery email link sent via Brevo SMTP.
6. **Session Persistence**: Managed via secure cookies in Next.js (`@supabase/ssr`) and Bearer tokens in FastAPI.
7. **Protected Routes**: Enforced via Next.js Middleware (`frontend/src/middleware.ts`) and FastAPI Auth Dependency (`backend/app/auth/deps.py`).

### Brevo Custom SMTP Settings for Supabase Dashboard
In your Supabase Dashboard under **Project Settings -> Authentication -> Email Settings**:
- **Enable Custom SMTP**: `ON`
- **SMTP Host**: `smtp-relay.brevo.com`
- **Port**: `587` (TLS)
- **SMTP Username**: Your Brevo SMTP Login email (e.g. `nikhilsinghal9785@gmail.com`)
- **SMTP Password**: Your Brevo SMTP Key (`xsmtpsib-...`)
- **Sender Email**: `nikhilsinghal9785@gmail.com` (or your verified domain email)
- **Sender Name**: `MARE-Juris Legal`

---

## 3. PostgreSQL Database Schema & Migration

The database schema is defined in [supabase/migrations/20260827000000_initial_schema.sql](file:///c:/Users/Nikhil%20Agarwal/Desktop/MARE-Juris/supabase/migrations/20260827000000_initial_schema.sql).

### Normalized Logical Entities

1. **User & Identity**:
   - `profiles`: User account profiles linked to `auth.users(id)`.
   - `user_sessions`: Active user device/session isolation tracking.

2. **Conversations & Chat**:
   - `conversations`: Threads initiated by users.
   - `messages`: Contextual messages exchanged with legal agents.

3. **Global Legal Knowledge Corpus** (Shared / Read-Only):
   - `legal_sources`: Primary acts, statutes, legal authorities, codes.
   - `legal_documents`: Structured legal documents.
   - `legal_document_versions`: Sections, subsections, content, and amendment tracking.

4. **Private User Uploaded Documents**:
   - `uploaded_documents`: User legal case files (PDF, DOCX, TXT metadata).
   - `document_chunks`: Processed text chunks for user document analysis.

5. **Evidence & Claims**:
   - `evidence`: Grounded evidence snippets linked to legal sources or user document chunks.
   - `claims`: Formulated legal claims.
   - `claim_evidence`: Mapping table linking claims to evidence with relevance scores.

6. **Audit & Compliance**:
   - `citation_audits`: Citation and legal grounding audit runs.
   - `audit_results`: Grounding verification and repair outcomes per claim.
   - `compliance_checks`: User compliance evaluation runs.
   - `compliance_items`: Specific compliance findings.

7. **Agent Execution Logs**:
   - `agent_runs`: Orchestrated agent run telemetry.
   - `agent_events`: Event streams during multi-agent reasoning.

---

## 4. Row Level Security (RLS) Policies

RLS is enabled on **all 15 tables**.

### Security Rules Matrix

| Table Category | Tables | RLS Rule | Allowed Operations |
|---|---|---|---|
| **User Private Data** | `profiles`, `user_sessions`, `conversations`, `messages`, `uploaded_documents`, `document_chunks`, `evidence`, `claims`, `claim_evidence`, `citation_audits`, `audit_results`, `compliance_checks`, `compliance_items`, `agent_runs`, `agent_events` | `auth.uid() = user_id` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` for resource owner only |
| **Global Legal Corpus** | `legal_sources`, `legal_documents`, `legal_document_versions` | `auth.role() = 'authenticated'` for read; `auth.role() = 'service_role'` for write | `SELECT` for all authenticated users; `INSERT`/`UPDATE`/`DELETE` for Service Role only |

> [!CAUTION]
> User A can **NEVER** query or modify User B's private data. The database enforces this at the engine level via RLS policies.

---

## 5. Private Storage Bucket Setup

Supabase Storage is configured for user document uploads.

- **Bucket Name**: `user-documents`
- **Public Access**: `false` (Private bucket)
- **Path Hierarchy**: `user-documents/{user_id}/{filename}`

---

## 6. Security Audit Checklist

- [x] Brevo SMTP credentials and API keys are restricted to server-side `.env`.
- [x] `SUPABASE_SERVICE_ROLE_KEY` is restricted to server-side code and backend `.env`.
- [x] `NEXT_PUBLIC_*` prefix is used ONLY for `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
- [x] All 15 PostgreSQL tables have Row Level Security (`ENABLE ROW LEVEL SECURITY`) turned on.
- [x] User-owned tables enforce `auth.uid() = user_id`.
- [x] Private storage bucket `user-documents` requires `auth.uid()` path matching.
- [x] `.env` files are included in `.gitignore`.
