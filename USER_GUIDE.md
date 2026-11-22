# User Guide — Appliety

## For candidates

1. **Sign up** at `/register` choosing *"I'm a candidate"*. You can already add
   a headline, bio, education and experience — you can refine everything later.
2. **Complete your profile** (`/profile`): personal info, photo, resume (PDF)
   and — most importantly — **skills**. Skills directly power the matching
   engine.
3. **Find jobs** (`/jobs`): search by title/skill/company, filter by category,
   location and work mode (remote/hybrid/on-site).
4. **Open a vacancy** to see the full description, requirements, salary and —
   if you're logged in — your **compatibility score** with shared skills.
5. **Apply** with an optional cover letter. You can't apply twice to the same
   vacancy.
6. **Track applications** (`/applications`) — filter by status
   (applied → under review → shortlisted → rejected/hired).
7. **Get matches** (`/matching` or the candidate dashboard): vacancies ranked
   by compatibility with explanations (shared skills).

## For companies

1. **Sign up** choosing *"I'm hiring"* and provide your company name.
2. **Complete your company profile** (`/company/profile`): description, website,
   logo — shown on your vacancies.
3. **Publish a vacancy** (`/company/jobs/new`): title, description, requirements,
   location, work mode, job type, salary range, category and required skills.
   Save as **draft** or **published**; edit, close or delete later.
4. **Review applications** per vacancy (`Applications` button): see candidate
   name/email, cover letter, and change the pipeline status — every change is
   recorded.
5. **Find candidates** (`/company/matching`): select a vacancy to see ranked
   candidate profiles with compatibility scores and shared skills.
6. **Reports** (`/admin/reports`-style export page is role-aware): download
   applications/vacancies as Excel or PDF.

## For administrators

1. Log in with an admin account (created via `setup_demo_accounts` or Django
   admin — never via public registration).
2. **Dashboard** (`/admin/dashboard`): platform totals, applications per month,
   most requested areas, applications per vacancy, top skills/locations.
3. **Users** (`/admin/users`): search, filter by role, change roles, enable/disable.
4. **Vacancies** (`/admin/jobs`): oversight of all postings and their statuses.
5. **Applications** (`/admin/applications`): platform-wide pipeline management.
6. **Reports** (`/admin/reports`): export platform overview, applications or
   vacancies to Excel/PDF.

## Demo accounts

Run `python manage.py setup_demo_accounts` (see SETUP_GUIDE.md), then log in
with `demo.candidate`, `demo.company` or `demo.admin` and the passwords you
provided via env vars/prompts. The seed data includes three published
vacancies and one application so every screen has content.
