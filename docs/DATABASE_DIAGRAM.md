# Database ER Diagram — Appliety

Entities and relationships as implemented in Django models
(`backend/accounts/models.py`, `backend/jobs/models.py`).

```mermaid
erDiagram
    USER ||--o| CANDIDATE_PROFILE : has
    USER ||--o| COMPANY_PROFILE : has
    CANDIDATE_PROFILE }o--o{ SKILL : "skills (M2M)"
    COMPANY_PROFILE ||--o{ JOB : publishes
    JOB }o--o{ SKILL : requires
    JOB ||--o{ APPLICATION : receives
    CANDIDATE_PROFILE ||--o{ APPLICATION : submits
    APPLICATION ||--o{ APPLICATION_STATUS_HISTORY : tracks
    APPLICATION }o--|| JOB : for
    APPLICATION }o--|| CANDIDATE_PROFILE : by

    USER {
        bigint id PK
        varchar username UK
        varchar email
        varchar first_name
        varchar last_name
        varchar password
        varchar role "candidate | company | admin"
        varchar phone
        varchar city
        bool is_active
        bool is_staff
        bool is_superuser
        datetime date_joined
    }

    CANDIDATE_PROFILE {
        bigint id PK
        bigint user_id FK,UK
        varchar headline
        text bio
        varchar education
        int experience_years
        file resume
        image photo
    }

    COMPANY_PROFILE {
        bigint id PK
        bigint user_id FK,UK
        varchar company_name
        text description
        varchar website
        image logo
    }

    SKILL {
        bigint id PK
        varchar name UK
    }

    JOB {
        bigint id PK
        bigint company_id FK
        varchar title
        varchar slug UK
        text description
        text requirements
        varchar category "technology|design|marketing|business|engineering|health|education|other"
        varchar location
        varchar work_mode "remote|hybrid|onsite"
        varchar job_type "full_time|part_time|internship|freelance"
        decimal salary_min
        decimal salary_max
        varchar currency
        varchar status "draft|published|closed"
        datetime created_at
        datetime updated_at
    }

    APPLICATION {
        bigint id PK
        bigint job_id FK
        bigint candidate_id FK
        text cover_letter
        varchar status "applied|under_review|shortlisted|rejected|hired"
        datetime created_at
        datetime updated_at
    }

    APPLICATION_STATUS_HISTORY {
        bigint id PK
        bigint application_id FK
        varchar from_status
        varchar to_status
        bigint changed_by_id FK
        datetime created_at
    }
```

## Key constraints & indexes

- `Application(job, candidate)` — **UNIQUE** (no duplicate applications).
- `Job.slug` — unique, auto-generated.
- `User.username`, `User.email`(non-unique), `Skill.name` — unique where noted.
- Indexes: `Job(status, category)`, `Job(location)`, `Job.status`,
  `Application.status`, `User.role`.
- `User` ↔ profiles are `OneToOne`; `User.role` selects which profile is used.
- M2M: `CandidateProfile.skills`, `Job.skills` → `Skill`.
