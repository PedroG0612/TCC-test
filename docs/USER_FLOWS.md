# User Flow Diagrams — Appliety

## 1. Candidate registration & login

```mermaid
flowchart TD
    A([Visitor]) --> B[/register?role=candidate/]
    B --> C{Choose role:<br/>candidate or company}
    C -->|candidate| D[Fill form:<br/>credentials + headline,<br/>bio, education, experience]
    D --> E{Passwords match<br/>& valid?}
    E -->|No| D
    E -->|Yes| F[POST /api/auth/register/]
    F --> G[User + CandidateProfile created<br/>token issued]
    G --> H[/dashboard/]
    H --> I[Complete profile:<br/>skills, resume, photo]
    I --> J[Browse /jobs]

    K([Returning user]) --> L[/login/]
    L --> M[POST /api/auth/login/]
    M --> N{Valid credentials?}
    N -->|No| L
    N -->|Yes| O[Token stored → role dashboard]
```

## 2. Company registration & login

Same flow as candidate, except `role=company` requires `company_name`;
`CompanyProfile` is created and the user lands on `/company/dashboard`.

## 3. Company creates a vacancy

```mermaid
flowchart TD
    A[/company/jobs/] --> B[/company/jobs/new/]
    B --> C[Fill JobForm:<br/>title, description, requirements,<br/>category, location, work_mode,<br/>job_type, salary, skills]
    C --> D{Validation OK?}
    D -->|No| C
    D -->|Yes| E[POST /api/jobs/]
    E --> F[Job saved with<br/>company = own profile]
    F --> G{Status?}
    G -->|draft| H[Editable later]
    G -->|published| I[Visible in public /jobs]
    H --> J[/company/jobs/:id/edit/]
    J --> E
```

## 4. Candidate searches & applies

```mermaid
flowchart TD
    A[/jobs/] --> B[Filters: q, category,<br/>location, work_mode]
    B --> C[Job cards list]
    C --> D[/jobs/:id/]
    D --> E{Logged in as<br/>candidate?}
    E -->|No| F[Prompt to register/login]
    E -->|Yes| G[Show compatibility score<br/>+ matched skills]
    G --> H[Optional cover letter]
    H --> I[POST /api/applications/]
    I --> J{Already applied<br/>or job closed?}
    J -->|Yes| K[400 error shown]
    J -->|No| L[Application created<br/>status = applied]
    L --> M[/applications/ track status]
```

## 5. Matching recommendations

```mermaid
flowchart LR
    subgraph Candidate side
        CP[CandidateProfile:<br/>headline, bio, education,<br/>skills, experience]
    end
    subgraph Job side
        JP[Job:<br/>title, description,<br/>requirements, skills]
    end
    CP --> T[profile_text]
    JP --> T
    T --> V[TF-IDF vectorizer<br/>+ cosine similarity]
    CP -.->|Jaccard| S[Skill overlap]
    JP -.->|Jaccard| S
    V --> SC[score = 85% cosine<br/>+ 15% jaccard → 0-100]
    S --> SC
    SC --> R1[GET /matching/jobs/<br/>candidate view]
    SC --> R2[GET /matching/candidates/?job=<br/>company view]
```

## 6. Application management (company)

```mermaid
flowchart TD
    A[/company/jobs/:id/applications/] --> B[List applications<br/>for the vacancy]
    B --> C[Expand → cover letter,<br/>candidate email]
    C --> D[Change status:<br/>under_review / shortlisted /<br/>rejected / hired]
    D --> E[PATCH /api/applications/:id/]
    E --> F[ApplicationStatusHistory row<br/>recorded with actor+timestamp]
    F --> G[Candidate sees new status<br/>in /applications]
    B --> H[GET /company/matching?job=<br/>→ ranked candidate suggestions]
```

## 7. Admin oversight & reports

```mermaid
flowchart TD
    A[/admin/dashboard/] --> B[Platform overview:<br/>users, jobs, applications,<br/>monthly trend, top areas/skills]
    A --> C[/admin/users/ manage roles<br/>and activation]
    A --> D[/admin/jobs/ vacancy oversight]
    A --> E[/admin/applications/ pipeline]
    A --> F[/admin/reports/ export]
    F --> G{dataset}
    G -->|applications/jobs| H[Excel .xlsx or PDF<br/>download]
    G -->|overview| I[Admin-only platform<br/>summary export]
```
