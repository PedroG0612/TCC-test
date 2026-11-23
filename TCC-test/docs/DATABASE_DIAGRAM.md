# Database ER Diagram — Appliety

Entities and relationships as implemented in Django models
(`backend/accounts/models.py`, `backend/jobs/models.py`).

```mermaid
erDiagram
    USER ||--o| CANDIDATE_PROFILE : has
    USER ||--o| COMPANY_PROFILE : has
    CANDIDATE_PROFILE }o--o{ SKILL : "skills (M2M)"
    CANDIDATE_PROFILE ||--o{ EXPERIENCE_ENTRY : has
    CANDIDATE_PROFILE ||--o{ EDUCATION_ENTRY : has
    COMPANY_PROFILE ||--o{ JOB : publishes
    JOB }o--o{ SKILL : "essential_skills (M2M)"
    JOB }o--o{ SKILL : "desired_skills (M2M)"
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
        varchar preferred_category
        json preferred_work_modes
        varchar preferred_location
        file resume
        image photo
    }

    EXPERIENCE_ENTRY {
        bigint id PK
        bigint profile_id FK
        varchar role
        varchar company
        varchar start
        varchar end
        bool is_current
        text description
    }

    EDUCATION_ENTRY {
        bigint id PK
        bigint profile_id FK
        varchar course
        varchar institution
        varchar status "in_progress|completed|dropped"
        int year
    }

    COMPANY_PROFILE {
        bigint id PK
        bigint user_id FK,UK
        varchar company_name
        varchar legal_name
        varchar trade_name
        varchar cnpj
        varchar sector
        varchar size
        varchar state
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
        text responsibilities
        varchar category "technology|design|marketing|business|engineering|health|education|other"
        varchar location
        varchar work_mode "remote|hybrid|onsite"
        varchar job_type "full_time|part_time|internship|freelance"
        varchar seniority "junior|pleno|senior"
        varchar contract_type
        decimal salary_min
        decimal salary_max
        varchar currency
        varchar status "draft|published|paused"
        datetime created_at
        datetime updated_at
    }

    APPLICATION {
        bigint id PK
        bigint job_id FK
        bigint candidate_id FK
        text cover_letter
        varchar status "applied|under_review|interview|rejected|hired"
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
- `User.username`, `Skill.name` — unique.
- Indexes: `Job(status, category)`, `Job(location)`, `Job.status`,
  `Application.status`, `User.role`.
- `User` ↔ profiles are `OneToOne`; `User.role` selects which profile is used.
- M2M: `CandidateProfile.skills` → `Skill`;
  `Job.essential_skills` / `Job.desired_skills` → `Skill` (matching criteria).
- `ExperienceEntry`/`EducationEntry` are owned by `CandidateProfile`
  (CASCADE delete, ordered by `-id`).
