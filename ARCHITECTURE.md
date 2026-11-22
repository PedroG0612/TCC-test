# Appliety — Architecture

## High-level architecture

```
┌────────────────────────────┐         ┌──────────────────────────────────┐
│  React SPA (Vite + TS)     │  HTTP   │  Django REST API (DRF)            │
│  Tailwind CSS design       │ ──────► │  ├─ accounts   users, profiles   │
│  Token auth (localStorage) │ ◄────── │  ├─ jobs       vacancies, apps    │
└────────────────────────────┘  JSON   │  ├─ matching   scikit-learn      │
                                       │  ├─ reports    stats + exports   │
                                       │  └─ api        serializers/views │
                                       └──────────┬───────────────────────┘
                                                  │ Django ORM
                                                  ▼
                                       ┌──────────────────────┐
                                       │ PostgreSQL           │
                                       │ (Supabase-hosted)    │
                                       └──────────────────────┘
```

Communication is strictly **React → Django REST API → Django ORM → PostgreSQL**.
React never talks to the database directly; Supabase provides only the
PostgreSQL instance.

## Backend (Django)

| App        | Responsibility                                                        |
|------------|-----------------------------------------------------------------------|
| `accounts` | `User` (role: candidate/company/admin), `CandidateProfile`, `CompanyProfile`, `Skill` |
| `jobs`     | `Job` (vacancy), `Application`, `ApplicationStatusHistory`, `JobFilter`, `ApplicationFilter` |
| `matching` | `engine.py` — explainable weighted criteria (50/10/25/15) + scikit-learn TF-IDF |
| `reports`  | `services.py` aggregations, `exports.py` Excel/PDF generation          |
| `api`      | DRF serializers, viewsets, auth views, permissions, tests              |
| `config`   | settings (env-driven), urls, spectacular schema                       |

### Authentication & authorization

- Django's built-in auth + DRF `TokenAuthentication`.
- `User.role` drives permissions via `api/permissions.py`
  (`IsAdminRole`, `IsCandidate`, `IsCompany`) and per-view `get_queryset()`
  scoping: candidates see only their applications/matches, companies see only
  their vacancies/applications, admins see everything.
- Public registration accepts only `candidate` or `company` — the serializer
  rejects `admin`. Admins are created via `setup_demo_accounts` or the admin.
- Routes are protected client-side by `ProtectedRoute` (role-aware redirects)
  and server-side by DRF permissions.

### Data model highlights

- `Application` has a DB-level `UniqueConstraint(job, candidate)` preventing
  duplicate applications.
- `ApplicationStatusHistory` records every status transition with the actor.
- `Job.slug` is auto-generated and unique.

### Matching (`matching/engine.py`)

- `profile_text()` on profiles/jobs produces a normalized text corpus.
- `TfidfVectorizer(ngram_range=(1,2), sublinear_tf=True)` + `cosine_similarity`.
- Score = 85% cosine similarity + 15% Jaccard skill overlap, scaled to 0–100.
- Batch functions rank all jobs for a candidate and all candidates for a job.

### Reports (`reports/`)

- `services.platform_overview()` — totals, applications per job, by status,
  by category ("most requested professional areas"), top skills, top locations,
  monthly trend.
- `services.company_stats()` — per-company vacancy/application stats.
- `exports.py` — `.xlsx` via openpyxl, `.pdf` via reportlab, from real querysets.

## Frontend (React)

- Vite + React 18 + TypeScript, React Router 6, axios client with token
  interceptor (`src/lib/api.ts`).
- `AuthContext` holds the current user and exposes login/register/logout.
- Design system in `src/index.css` (`@layer components`): `.btn-*`, `.input`,
  `.card`, `.badge`, `.label` + Tailwind `brand` (emerald) / `accent` (violet)
  tokens inspired by the JobFine reference.
- Pages mirror the three role areas: public (`/`, `/jobs`, `/jobs/:id`,
  `/login`, `/register`, `/about`), candidate (`/dashboard`, `/profile`,
  `/applications`, `/matching`), company (`/company/*`) and admin (`/admin/*`).

## Request flow example (candidate applies)

1. `JobDetail.tsx` → `POST /api/applications/` `{job, cover_letter}`
2. `ApplicationViewSet.create` → `IsCandidate` permission, sets
   `candidate=request.user.candidate_profile`, serializer blocks duplicates.
3. Row persisted in PostgreSQL; appears in candidate's `/applications` and the
   company's vacancy application list.

## Environment

All configuration comes from `backend/.env` (see `.env.example`):
`DATABASE_URL` switches between SQLite (dev) and Supabase PostgreSQL
(production) without code changes.
