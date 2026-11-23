# Matching Algorithm — How it works

## Goal

Given a candidate profile and a job vacancy, produce a **compatibility score
(0–100)** plus a **per-criterion breakdown with evidence**, in both directions:

- jobs recommended for a candidate (`GET /api/matching/jobs/`)
- candidates recommended for a job (`GET /api/matching/candidates/?job=`)

The model follows the Appliety prototype: the score is **decision support for
humans**, never an automatic approve/reject signal, and missing information is
reported as "not informed" — never as proof of missing competence.

## Score composition (weights sum to 100)

| Criterion | Points | What it measures |
|---|---|---|
| Essenciais | 50 | Coverage of the job's **essential skills** (weighted evidence per skill) |
| Desejáveis | 10 | Coverage of the job's **desired (differential) skills** |
| Experiência | 25 | 50% years-of-experience vs. seniority expectation + 50% TF-IDF text similarity |
| Preferências | 15 | Location (⅓), work mode (⅓), area of interest (⅓) |

### Per-skill evidence levels

For every essential/desired skill the engine assigns:

- **1.0 — declared**: the skill is in the candidate's skill list → full credit.
- **0.5 — partial**: all significant tokens of the skill name appear in the
  candidate's free-text profile (headline, bio, experiences, education) → half credit.
- **0.0 — missing**: no evidence found → zero credit, listed under `missing`.

Points = `max_points × (Σ evidence / #skills)`. When a vacancy defines **no**
essential skills, that criterion falls back to `50 × text_similarity` so it
still carries signal.

### Preferences (each sub-signal 0 / 0.5 / 1.0)

- **Location**: candidate's `city` or `preferred_location` vs `job.location`
  (substring match either way); undeclared → 0.5.
- **Work mode**: `job.work_mode` must be in `preferred_work_modes`;
  undeclared → 0.5.
- **Category**: `preferred_category` vs `job.category`; undeclared → 0.5.

## Text signal (scikit-learn)

`TfidfVectorizer(lowercase=True, ngram_range=(1,2), min_df=1,
sublinear_tf=True)` + `cosine_similarity` over `profile_text()` corpora:

- Candidate text: headline, bio, education, experience/education entries,
  skills, years of experience.
- Job text: title, description, requirements, responsibilities, category,
  location, work mode, essential + desired skills.

Batch endpoints fit the vectorizer **once** over the whole corpus, then score
each pair — O(n) similarity computations per request.

## Response shape

```json
{
  "score": 89.8,
  "matched_skills": ["CSS", "Figma", "Git"],
  "criteria": {
    "essential":  { "score": 50.0, "max": 50, "matched": [...], "partial": [...], "missing": [...] },
    "desired":    { "score": 10.0, "max": 10, "matched": [...], "partial": [...], "missing": [...] },
    "experience": { "score": 22.3, "max": 25, "years_fit": 1.0, "text_similarity": 0.78, "experience_years": 3, "seniority": "Pleno" },
    "preferences":{ "score": 7.5,  "max": 15, "location": 1.0, "work_mode": 0.5, "category": 0.5 }
  }
}
```

The UI renders this breakdown verbatim (matched/partial/missing chips and
per-criterion bars) in the candidate "Vagas para meu perfil" page, the job
detail sidebar, and the company "Analisar currículo" view.

## Company-side filters

`GET /api/matching/candidates/?job=<id>` accepts:

- `q` — search by name, headline, bio or skill (icontains).
- `min_score` — minimum total score (applied over a wider pool before slicing).
- `source=applications` — restrict to candidates who actually applied to that job.
- `limit` — default 10, max 50.

## Limitations (honest)

- Lexical heuristic, not a learned hiring model: no seniority inference beyond
  the declared years, no motivation or culture fit.
- Skill matching is name/token based; synonyms ("JS" vs "JavaScript") only
  count when they literally appear in the profile text.
- TF-IDF rewards shared vocabulary; very short profiles produce noisy text
  signals — which is why skills carry 60% of the weight.
- Scores are **relative** within a result set.
- No feedback loop from application outcomes.
- Next step for scale: embeddings or learning-to-rank trained on outcomes.

## Why scikit-learn (and not NLTK)

TF-IDF + cosine is vectorized, deterministic, needs no corpus downloads, and
plugs cleanly into the numeric breakdown. NLTK could later add Portuguese
stop-word removal/lemmatization.
