# Testing Report — Appliety

## Backend — `python manage.py test api` → **29 tests, all passing**

| Area | Coverage |
|------|----------|
| Auth | register (candidate/company), admin registration rejected, password mismatch, login ok/wrong, logout, password change |
| Jobs | public sees published only, company sees own drafts, company creates job (auto company), candidate cannot create/edit/delete, cross-company edit → 404, search filter |
| Applications | candidate applies, duplicate rejected, company status change + history row, candidate cannot change status, per-role queryset scoping |
| Matching | `score_pair` relevance, `/matching/jobs/` ranking + matched skills, `/matching/candidates/` forbidden for candidates |
| Reports | overview admin-only, company stats, xlsx + pdf export content types, candidate export forbidden |

Additionally verified manually against a live server:

- `POST /auth/login|register`, `GET /auth/me`, `GET/PATCH /jobs`,
  `GET /applications`, `GET /matching/jobs`, `GET /matching/candidates`,
  `GET /reports/overview|company`, `GET /reports/export` (xlsx + pdf),
  `GET /api/docs/` (Swagger UI 200), `GET /api/schema/`.
- Candidate attempting `PATCH /jobs/{id}` → **403** (regression test added).

## Frontend

- `npx tsc -b` — type-check clean.
- `npm run build` — production bundle builds (121 modules, ~312 kB JS).
- Manual smoke: dev server on :5173 proxies `/api` → Django :8000;
  landing, jobs list, login and role dashboards render.

## Known limitations

- Frontend has no automated unit/e2e suite (no test runner configured);
  coverage is via backend tests + manual/browser verification.
- Matching scores are lexical heuristics (see docs/MATCHING.md).
- File uploads verified via API fields; large-file handling relies on
  Django defaults.
