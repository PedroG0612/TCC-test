# Appliety REST API Documentation

Base URL (dev): `http://127.0.0.1:8000/api`

Interactive docs (recommended): **Swagger UI** at `/api/docs/` and the
OpenAPI schema at `/api/schema/` (drf-spectacular).

## Authentication

Token-based auth via DRF `TokenAuthentication`.

- Obtain a token from `POST /auth/login/` or `POST /auth/register/`.
- Send it on every authenticated request:

```
Authorization: Token <token>
```

`POST /auth/logout/` deletes the token.

Roles: `candidate`, `company`, `admin`. Permissions are enforced per
endpoint — see each section.

## Conventions

- List endpoints are paginated (`?page=`, `page_size` default 12, max via
  `PAGE_SIZE`). Responses: `{count, next, previous, results}`.
- Errors return `4xx` with a JSON body describing field errors.
- `format` is a reserved DRF query param; report exports use
  `export_format` instead.

---

## Auth & profile

### POST /auth/register/
Public. Creates a user + role profile. `role=admin` is rejected.

```json
{
  "username": "jane", "email": "jane@x.com",
  "password": "Sup3rSecret!", "password_confirm": "Sup3rSecret!",
  "role": "candidate",
  "first_name": "Jane", "last_name": "Doe",
  "headline": "React developer", "bio": "...", "education": "...",
  "experience_years": 2, "company_name": "Acme (companies only)"
}
```
→ `201 {token, user}`

### POST /auth/login/
`{username, password}` → `200 {token, user}` · `401` invalid credentials.

### POST /auth/logout/
Auth. → `204`.

### GET /auth/me/
Auth. → current `User` incl. nested `candidate_profile`/`company_profile`.

### PATCH /auth/me/
Auth. Multipart or JSON. Updates user fields plus the role-specific profile
(`skills` = list of skill ids for candidates; `company_name`, `description`,
`website`, `logo` for companies; `resume`, `photo` uploads for candidates).

### POST /auth/password/change/
Auth. `{current_password, new_password}` → `200`.

---

## Skills

### GET /skills/?search=
Auth. List all skills (used for autocomplete).

### POST /skills/
Auth. `{name}` → `201`. Creates a skill if it doesn't exist.

---

## Jobs (`/jobs/`)

### GET /jobs/
Public (published only). Filters (`django-filter`):

| Param | Description |
|-------|-------------|
| `q` | full-text search (title, description, requirements, location, company, skills) |
| `category`, `work_mode`, `job_type` | choice filters |
| `location` | case-insensitive contains |
| `salary_min` | jobs with `salary_min >= value` |
| `status` | admins/companies only |
| `company` | company profile id |
| `created_after`, `created_before` | date range |
| `ordering` | `created_at`, `title`, `salary_min` |

Candidates/anonymous users always receive `status=published` only.
Companies see all their own vacancies; admins see everything.

### GET /jobs/{id}/
Detail. Adds `has_applied` for candidates, `application_count`.

### GET /jobs/{id}/match/
Candidate only. → `{job, score, matched_skills}` — compatibility 0–100.

### GET /jobs/{id}/candidates/
Company (own job) or admin. → ranked candidate matches with scores.

### POST /jobs/
Company (auto-assigns own profile) or admin (must pass `company` id).
Body: title, description, requirements, category, location, work_mode,
job_type, salary_min/max, currency, `skill_ids`, `status`.
→ `201`.

### PATCH /jobs/{id}/ · DELETE /jobs/{id}/
Owner company or admin. Companies cannot reassign `company`.

---

## Applications (`/applications/`)

### GET /applications/
Auth. Scoped: candidate → own; company → own jobs'; admin → all.
Filters: `status`, `job`, `candidate`, `created_after`, `created_before`.

### POST /applications/
Candidate only. `{job, cover_letter?}` → `201`.
- `400` if already applied (unique constraint also enforced at DB level).
- `400` if vacancy not published.

### PATCH /applications/{id}/
Company (own vacancy) or admin. `{status}` → `200`.
Valid statuses: `applied`, `under_review`, `shortlisted`, `rejected`, `hired`.
Every change writes an `ApplicationStatusHistory` row.
Candidates cannot change statuses (`403`).

---

## Matching

### GET /matching/jobs/
Candidate only. → `[{job, score, matched_skills}]` ranked desc.
`?limit=` (default 10, max 50).

### GET /matching/candidates/?job={id}
Company (must own the job) or admin. → `[{candidate, score, matched_skills}]`.

---

## Users (admin) — `/users/`

`GET` list (`?role=`, `?search=`), `GET/PATCH/DELETE /users/{id}/`.
PATCH accepts `role`, `is_active`, profile fields. Admin cannot delete
their own account.

---

## Reports — `/reports/`

### GET /reports/overview/
Admin only → totals, applications per job/status/category, top skills,
top locations, monthly trend.

### GET /reports/company/
Company (own stats) or admin (`?company={id}`).

### GET /reports/export/?dataset=&export_format=
Auth (company → own data; admin → platform-wide).

| Param | Values |
|-------|--------|
| `dataset` | `applications` (default), `jobs`, `overview` (admin only) |
| `export_format` | `xlsx` (default), `pdf` |

Returns a file download (`application/vnd...spreadsheetml` or `application/pdf`).

---

## Status codes

| Code | Meaning |
|------|---------|
| 200/201 | Success |
| 204 | Logout success |
| 400 | Validation error (field errors in body) |
| 401 | Missing/invalid token |
| 403 | Authenticated but wrong role / forbidden action |
| 404 | Object not found (or outside your scope) |
