# Appliety

Appliety is a smart job marketplace and recruitment platform. It centralizes
companies, candidates, job vacancies and applications, using simple matching
algorithms (explainable weighted criteria + scikit-learn TF-IDF) to recommend suitable
opportunities and candidates.

## Stack

| Layer    | Technology                                                        |
|----------|-------------------------------------------------------------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS                          |
| Backend  | Python, Django 5, Django REST Framework                           |
| Database | PostgreSQL (Supabase in production) / SQLite for local dev        |
| Matching | scikit-learn (TF-IDF + cosine similarity) inside explainable weighted criteria |
| Reports  | openpyxl (Excel) and reportlab (PDF)                              |
| Docs     | drf-spectacular (OpenAPI / Swagger UI)                            |

## Repository layout

```
TCC/
├── backend/            # Django project (config + apps)
│   ├── accounts/       # User roles, candidate/company profiles, skills
│   ├── jobs/           # Vacancies, applications, status history, filters
│   ├── matching/       # scikit-learn matching engine
│   ├── reports/        # Statistics aggregation + Excel/PDF exports
│   ├── api/            # DRF serializers, views, permissions, tests
│   └── config/         # Django settings & URLs
├── frontend/           # React + Vite + Tailwind SPA
└── docs/               # Diagrams and technical documentation
```

## Quick start

```bash
# Backend (from backend/)
python -m venv .venv && .venv/Scripts/activate   # Windows
pip install -r requirements.txt
cp .env.example .env                             # edit SECRET_KEY
python manage.py migrate
python manage.py setup_demo_accounts             # creates demo users + seed data
python manage.py runserver                       # http://127.0.0.1:8000

# Frontend (from frontend/)
npm install
npm run dev                                       # http://localhost:5173
```

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for the full installation manual,
including Supabase PostgreSQL configuration and demo account credentials.

## Key URLs (dev)

- Frontend: http://localhost:5173
- API schema (OpenAPI): http://127.0.0.1:8000/api/schema/
- Swagger UI: http://127.0.0.1:8000/api/docs/
- Django admin: http://127.0.0.1:8000/admin/

## Demo accounts

After `python manage.py setup_demo_accounts` (passwords come from
`DEMO_*_PASSWORD` env vars or interactive prompts):

| Role      | Username        |
|-----------|-----------------|
| Candidate | `demo.candidate` |
| Company   | `demo.company`   |
| Admin     | `demo.admin`     |

## Documentation

- [SETUP_GUIDE.md](SETUP_GUIDE.md) — installation & configuration
- [ARCHITECTURE.md](ARCHITECTURE.md) — system architecture
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) — REST API reference
- [FUNCTIONAL_REQUIREMENTS.md](FUNCTIONAL_REQUIREMENTS.md) — what the system does
- [USER_GUIDE.md](USER_GUIDE.md) — end-user guide
- [MATCHING.md](docs/MATCHING.md) — how the matching algorithm works
- [DATABASE_DIAGRAM.md](docs/DATABASE_DIAGRAM.md) — ER diagram
- [USER_FLOWS.md](docs/USER_FLOWS.md) — user flow diagrams
