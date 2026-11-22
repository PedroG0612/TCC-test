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
`{username|email, password}` → `200 {token, user}` · `401` invalid credentials.
Login accepts either the username or the account e-mail.

### POST /auth/logout/
Auth. → `204`.

### GET /auth/me/
Auth. → current `User` incl. nested `candidate_profile`/`company_profile`.

### PATCH /auth/me/
Auth. Multipart or JSON. Updates user fields plus the role-specific profile.
Candidates: `headline`, `bio`, `education`, `experience_years`, `skills`
(list of skill ids), `preferred_category`, `preferred_work_modes`,
`preferred_location`, `resume`, `photo`. Companies: `company_name`,
`legal_name`, `trade_name`, `cnpj`, `sector`, `size`, `state`,
`description`, `website`, `logo`.

### POST /auth/password/change/
Auth. `{current_password, new_password}` → `200`.

### POST /auth/password/reset/
Public. `{email}` → `200` (always the same response — no account enumeration).
Sends a reset link by e-mail when an active account exists.

### POST /auth/password/reset/confirm/
Public. `{uid, token, new_password}` → `200`. `uid`/`token` come from the
reset link (`/reset-password/?uid=…&token=…`).

---

## Skills

### GET /skills/?search=
Auth. List all skills (used for autocomplete).

### POST /skills/
Auth. `{name}` → `201`. Creates a skill if it doesn't exist.

## Candidate profile entries

### GET/POST /experiences/ · PATCH/DELETE /experiences/{id}/
Candidate only, scoped to own profile. Fields: `role`, `company`, `start`,
`end`, `is_current`, `description`.

### GET/POST /education/ · PATCH/DELETE /education/{id}/
Candidate only, scoped to own profile. Fields: `course`, `institution`,
`status` (`in_progress|completed|dropped`), `year`.

---

## Jobs (`/jobs/`)

### GET /jobs/
Public (published only). Filters (`django-filter`):

| Param | Description |
|-------|-------------|
| `q` | full-text search (title, description, requirements, location, company, skills) |
| `skill` | matches essential or desired skill names |
| `category`, `work_mode`, `job_type` | choice filters |
| `location` | case-insensitive contains |
| `salary_min` | jobs with `salary_min >= value` |
| `status` | admins/companies only |
| `company` | company profile id |
| `created_after`, `created_before` | date range |
| `ordering` | `created_at`, `-created_at`, `title`, `-title`, `salary_min` |

Candidates/anonymous users always receive `status=published` only.
Companies see all their own vacancies; admins see everything.

### GET /jobs/{id}/
Detail. Adds `has_applied` for candidates, `application_count`.

### GET /jobs/{id}/match/
Candidate only. → `{job, score, matched_skills, criteria}` — explainable
compatibility 0–100 (see docs/MATCHING.md for the 50/10/25/15 breakdown).

### GET /jobs/{id}/candidates/
Company (own job) or admin. → ranked candidate matches with scores.

### POST /jobs/
Company (auto-assigns own profile) or admin (must pass `company` id).
Body: title, description, requirements, responsibilities, category,
location, work_mode, job_type, seniority (`junior|pleno|senior`),
contract_type, salary_min/max, currency, `essential_skill_ids`,
`desired_skill_ids`, `status` (`draft|published|paused`).
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
Valid statuses: `applied` (Enviada), `under_review` (Em análise),
`interview` (Entrevista), `rejected` (Não avançou), `hired` (Contratado).
Responses include `status_history` for the status timeline.
Every change writes an `ApplicationStatusHistory` row.
Candidates cannot change statuses (`403`).

---

## Saved jobs (`/saved-jobs/`)

### GET /saved-jobs/
Auth. → list of jobs saved by the current user (full `Job` payload + `saved_at`).

### POST /saved-jobs/
Auth. `{job}` → `{saved: bool, job}` — toggles the save state.
Jobs in `GET /jobs/` responses include `is_saved` for the authenticated user.

---

## Matching

### GET /matching/jobs/
Candidate only. → `[{job, score, matched_skills, criteria}]` ranked desc.
`?limit=` (default 10, max 50).

### GET /matching/candidates/?job={id}
Company (must own the job) or admin. → `[{candidate, score, matched_skills, criteria}]`.
Filters: `q` (name/headline/bio/skill), `min_score`, `source=applications`
(only candidates who applied to that job), `limit` (default 10, max 50).

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

## Social — feed, connections, messaging, notifications

Base prefix `/api/`. All endpoints require `Authorization: Token <token>` unless noted.

### Feed — `/feed/posts/`

| Method & path | Description |
|---------------|-------------|
| `GET /feed/posts/?ordering=&page=` | Paginated posts. `ordering`: `-created_at` (default), `-like_count,-created_at`, `created_at`, `like_count`. Optional `?author=<username>`. |
| `POST /feed/posts/` | Create a post — `multipart/form-data` or JSON: `text` (required unless `image`), `image` (optional). |
| `DELETE /feed/posts/{id}/` | Delete own post (staff may delete any). |
| `POST /feed/posts/{id}/like/` | Toggle like → `{liked, like_count}`. |
| `GET /feed/posts/{id}/comments/` | List comments. |
| `POST /feed/posts/{id}/comments/` | Add comment `{text}`. |

Post objects include `author` (compact public card), `text`, `image_url`,
`like_count`, `comment_count`, `has_liked`, `is_own`, timestamps.

### Public profiles — `/public-profiles/{username}/`

Public read-only profile (candidate or company). Returns `username`, `name`,
`role`, `city`, `profile` (safe public subset) and `jobs` (company only).

### Connections — `/connections/` (candidates only)

| Method & path | Description |
|---------------|-------------|
| `GET /connections/` | `{accepted, incoming, outgoing}` lists. |
| `POST /connections/` | Send request `{username}` or `{user_id}`. Duplicates rejected; rejected pairs may re-request. |
| `GET /connections/status/?username=` | `{state, connection_id}` — `none`/`incoming`/`outgoing`/`connected`. |
| `POST /connections/{id}/accept/` | Addressee accepts → both connected. |
| `POST /connections/{id}/reject/` | Addressee rejects. |
| `POST /connections/{id}/cancel/` | Requester cancels a pending request. |
| `GET /connections/suggestions/` | Up to 12 candidates without a pending/accepted link. |

### Conversations & messages — `/conversations/` (connected candidates only)

| Method & path | Description |
|---------------|-------------|
| `GET /conversations/` | List with `other_user`, `last_message`, `unread_count`. |
| `POST /conversations/` | Start/resume `{username}` — requires accepted connection. |
| `GET /conversations/{id}/messages/` | Latest 100 messages. |
| `POST /conversations/{id}/messages/` | Send `{text}` (max 2000 chars). |
| `POST /conversations/{id}/read/` | Mark incoming messages as read. |

### Notifications — `/notifications/`

| Method & path | Description |
|---------------|-------------|
| `GET /notifications/?page=&page_size=&unread=1` | `{count, unread_count, results}`. |
| `POST /notifications/{id}/read/` | Mark one as read. |
| `POST /notifications/read-all/` | Mark all as read. |

Notification `type`s: `post_created`, `connection_request`,
`connection_accepted`, `message_received`, `application_received`,
`application_status`. Each includes `text`, optional `link`, `actor`,
`is_read`, `created_at`.

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
