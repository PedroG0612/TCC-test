# Installation & Configuration Manual — Appliety

## 1. Required software

- Python 3.11+ (developed on 3.13)
- Node.js 18+ and npm
- Git
- PostgreSQL 14+ **or** a Supabase project (used only as PostgreSQL hosting)

## 2. Backend setup

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate   |   Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
```

### Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable                  | Description                                                        |
|---------------------------|--------------------------------------------------------------------|
| `SECRET_KEY`              | Long random string (required in production)                        |
| `DEBUG`                   | `True` for local dev, `False` in production                        |
| `ALLOWED_HOSTS`           | Comma-separated hostnames                                          |
| `DATABASE_URL`            | `sqlite:///db.sqlite3` for dev, or `postgresql://...` for Supabase |
| `CORS_ALLOWED_ORIGINS`    | Frontend origins, e.g. `http://localhost:5173`                     |
| `DEMO_*_PASSWORD`         | Optional passwords for demo accounts                               |

`.env` is git-ignored — never commit real credentials.

### Supabase PostgreSQL

1. Create a project at https://supabase.com.
2. In **Project Settings → Database**, copy the connection string.
   - **Pooler (recommended, IPv4)**: use the *Session pooler* (port 5432) or
     *Transaction pooler* (port 6543) URI, e.g.
     `postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres`
   - Direct (`db.<ref>.supabase.co`) is **IPv6-only** and will not connect
     from networks without IPv6 — prefer the pooler.
3. Set `DATABASE_URL` to that string in `backend/.env`.
4. Run `python manage.py migrate` — Django creates the whole schema.

> Appliety uses Supabase **only** as PostgreSQL hosting. Authentication,
> users and all application data live in Django/PostgreSQL. Do not use
> Supabase Auth or the Supabase JS client.

### Migrations & demo data

```bash
python manage.py migrate
python manage.py setup_demo_accounts   # safe to run multiple times
python manage.py runserver             # http://127.0.0.1:8000
```

Demo account passwords are read from `DEMO_CANDIDATE_PASSWORD`,
`DEMO_COMPANY_PASSWORD`, `DEMO_ADMIN_PASSWORD`; if unset, the command
prompts interactively (hidden input). Never hardcode passwords in source.

For richer demonstration data (extra candidates, companies, jobs, posts,
connections and messages):

```bash
python manage.py seed_demo_data   # idempotent — safe to re-run
```

All `demo.*` accounts share the `DEMO_SEED_PASSWORD` environment variable;
if unset, a documented development-only password is used. Seeded users:
`demo.dev`, `demo.data`, `demo.design`, `demo.sec`, `demo.mkt` (candidates)
and `demo.fin`, `demo.health`, `demo.edu`, `demo.shop` (companies), plus the
base `demo.candidate`, `demo.company`, `demo.admin`.

## 3. Frontend setup

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173 — proxies /api to :8000
npm run build      # production build → dist/
npm run preview    # serve the production build locally
```

## 4. Running tests

```bash
cd backend
python manage.py test          # 28 backend tests
cd ../frontend
npm run build                  # type-checks (tsc -b) and bundles
```

## 5. Production notes

- Set `DEBUG=False`, a real `SECRET_KEY`, `ALLOWED_HOSTS`, and the Supabase
  `DATABASE_URL`.
- Serve the frontend build statically (or any static host) and point its API
  base URL at the Django deployment.
- Use `gunicorn`/`uvicorn` (or a PaaS) for Django; collectstatic for admin assets.
