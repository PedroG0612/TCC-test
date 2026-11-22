# Matching Algorithm — How it works

## Goal

Given a candidate profile and a job vacancy, produce a **compatibility score
(0–100)** plus the list of **shared skills**, in both directions:

- jobs recommended for a candidate (`GET /api/matching/jobs/`)
- candidates recommended for a job (`GET /api/matching/candidates/?job=`)

## Implementation (`backend/matching/engine.py`)

Built on **scikit-learn**:

1. **Text corpus.** Each side is flattened to text via `profile_text()`:
   - Candidate: headline, bio, education, comma-joined skills, experience years.
   - Job: title, description, requirements, category, location, work mode, skills.
2. **TF-IDF vectorization.** `TfidfVectorizer(lowercase=True,
   ngram_range=(1,2), sublinear_tf=True)` is fit on the corpus; cosine
   similarity between vectors measures textual relevance (unigrams + bigrams,
   sub-linear term frequency to reduce common-word dominance).
3. **Skill overlap.** Jaccard index between the candidate's and job's skill
   sets — an explicit signal that survives paraphrasing.
4. **Blend.** `score = 0.85 * cosine + 0.15 * jaccard`, scaled to 0–100 and
   rounded to 1 decimal.
5. **Ranking.** Batch functions vectorize the whole corpus once and sort by
   score descending (`limit`, default 10, max 50).

## What it analyzes

- Skills (explicit M2M sets) — strongest, most interpretable signal.
- Free text: bio/headline/education/experience vs description/requirements.
- Vacancies' structured fields (category, location, work mode) as weak signals.

## Limitations (honest)

- It is a **lexical similarity heuristic**, not a learned hiring model. It
  cannot infer seniority, career trajectory, motivation or cultural fit.
- Paraphrases with no shared vocabulary score low; very short profiles produce
  noisy scores. Rare skills dominate IDF, which can skew results on small data.
- Scores are **relative** within a result set — a 60% match means "more similar
  than others", not an absolute hiring probability.
- No feedback loop: applications/hiring outcomes do not retrain the model.
- For production scale, embeddings (e.g., sentence transformers) or a
  learning-to-rank model trained on application outcomes would be the next
  step — the current design keeps scoring explainable and cheap.

## Why scikit-learn (and not NLTK)

NLTK was evaluated as an alternative. scikit-learn's TF-IDF + cosine
pipeline was chosen because it is vectorized, deterministic, requires no
corpus downloads, and integrates cleanly with the numeric score display.
NLTK could complement it later for Portuguese stop-word removal or
lemmatization.
