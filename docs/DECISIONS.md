# Architectural Decisions

## ADR-001: Supabase as Primary Data & Authentication Platform
- **Date**: 2026-08-27
- **Status**: Accepted
- **Context**: MARE-Juris requires robust PostgreSQL storage, user session management, document storage, and row-level security.
- **Decision**: Adopt Supabase for PostgreSQL Database, Supabase Auth for identity/sessions, and Supabase Storage for private user document uploads.

## ADR-002: Resend for Transactional Email Delivery
- **Date**: 2026-08-27
- **Status**: Accepted
- **Context**: Transactional authentication emails (signup verification, OTP, password resets) and application notifications must be reliably delivered.
- **Decision**: Configure Supabase Auth to use Resend via custom SMTP (`smtp.resend.com`). Build a backend `EmailService` using Resend REST API for application-level email notifications.

## ADR-003: Strict Row Level Security (RLS) & Storage Path Isolation
- **Date**: 2026-08-27
- **Status**: Accepted
- **Context**: LegalTech applications must prevent any cross-user data leakage.
- **Decision**: Enable RLS on all 15 database tables. Enforce `auth.uid() = user_id` for private resources and separate global legal knowledge tables into read-only public tables. Enforce folder-path user isolation (`user-documents/{user_id}/{filename}`) on private storage buckets.
