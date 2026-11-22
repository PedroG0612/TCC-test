# Functional Requirements — Appliety

Checklist against the official SENAI assignment. ✅ = implemented & tested.

## 1. User authentication ✅

- [x] Three profiles: **Candidate**, **Company**, **Administrator** (`User.role`)
- [x] Registration (public, candidate/company only — admin rejected server-side)
- [x] Login / logout (DRF token auth)
- [x] Password management (change password endpoint + UI on every profile)
- [x] Profile management (candidate & company profile CRUD via `PATCH /auth/me/`)
- [x] Role-based permissions (`IsAdminRole`, `IsCandidate`, `IsCompany`, queryset scoping)
- [x] Protected routes (`ProtectedRoute` per role area + DRF permissions)
- [x] Post-auth redirects (role-aware dashboards)
- [x] Django authentication (sessions + tokens); `django-allauth` intentionally
      not used (social login optional per spec)

## 2. Job registration & publication ✅

- [x] Vacancy fields: title, description, requirements, location, company,
      category, work mode, job type, salary range, currency, skills, status
- [x] Create / edit / delete / list own vacancies (company), full CRUD for admin
- [x] `django-crispy-forms` + `crispy-tailwind` installed for Django-rendered
      forms (admin/report surfaces); SPA forms are React controlled components
- [x] File/image uploads via Pillow: candidate resume + photo, company logo
      (`MEDIA_ROOT`, served in DEBUG)

## 3. Application system ✅

- [x] Candidates: browse, search & filter vacancies, view details, apply
      (with optional cover letter), view & track history
- [x] Companies: view received applications, candidate info (name/email),
      manage statuses (`applied → under_review → interview → rejected/hired`)
      with audit history, access application history
- [x] `django-filter` on jobs (q, category, work_mode, job_type, location,
      salary_min, dates) and applications (status, job, candidate, dates)
- [x] History persisted for both sides; duplicate applications blocked by
      serializer validation **and** a DB unique constraint

## 4. Intelligent matching ✅

- [x] Candidate → job suggestions (`GET /matching/jobs/`)
- [x] Job → candidate suggestions (`GET /matching/candidates/?job=` and
      `GET /jobs/{id}/candidates/`)
- [x] Per-job compatibility score on vacancy detail (`GET /jobs/{id}/match/`)
- [x] scikit-learn used meaningfully: `TfidfVectorizer` + `cosine_similarity`
      blended with skill-overlap (Jaccard); NLTK evaluated but sklearn chosen
      (see docs/MATCHING.md)
- [x] Score + matched skills displayed in UI
- [x] Algorithm documented incl. limitations

## 5. Reports & statistics ✅

- [x] Applications per job
- [x] Most requested professional areas (applications by job category)
- [x] Top skills, top locations, monthly trend, platform totals
- [x] Excel (.xlsx via openpyxl) and PDF (reportlab) exports from live data
- [x] Admin dashboard UI + export UI for companies

## 6. REST API ✅

- [x] Endpoints for registration/users, vacancies, applications (+ matching,
      reports, skills, profile)
- [x] Proper HTTP methods, status codes, validation, token auth, permissions
- [x] Consistent paginated JSON structures
- [x] OpenAPI schema + Swagger UI (`/api/schema/`, `/api/docs/`)
- [x] Architecture ready for future LinkedIn/mobile integrations

## 7. Demo accounts ✅

- [x] `python manage.py setup_demo_accounts` — idempotent, env/prompt passwords,
      seeds candidate/company/admin + profiles + skills + 3 vacancies + 1 application
- [x] Admin gets `is_staff`/`is_superuser`; public registration cannot create admins

## 8. UI/UX ✅

- [x] Design system: brand/accent color tokens, type scale, spacing, radii,
      shadows, buttons, inputs, cards, badges, responsive breakpoints
- [x] Job cards, dashboards, forms, loading/empty/error states, mobile nav
- [x] JobFine-inspired aesthetic (emerald + violet), original implementation

## 9. Documentation ✅

- [x] This file, ARCHITECTURE.md, API_DOCUMENTATION.md, SETUP_GUIDE.md,
      USER_GUIDE.md, docs/MATCHING.md, docs/DATABASE_DIAGRAM.md,
      docs/USER_FLOWS.md
