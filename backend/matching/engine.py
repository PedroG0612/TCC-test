"""
Appliety matching engine.

Uses scikit-learn's TF-IDF vectorizer and cosine similarity to compare the
free-text profile of a candidate (headline, bio, education, skills,
experience) against the free-text description of a job vacancy
(title, description, requirements, category, location, skills).

The final score blends two signals:

* 85% — cosine similarity between TF-IDF vectors of the two texts.
* 15% — Jaccard overlap between the candidate's and the job's skill sets.

Scores are returned as percentages (0-100). This is intentionally a simple,
interpretable heuristic — not a machine-learning hiring model. It rewards
literal textual and skill overlap and cannot infer seniority, cultural fit
or intent. See docs/MATCHING.md for details and limitations.
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Weight of the skill-overlap component in the final score.
SKILL_WEIGHT = 0.15
TEXT_WEIGHT = 1.0 - SKILL_WEIGHT


def _tfidf_matrix(texts):
    """Fit a TF-IDF vectorizer on `texts` and return (vectorizer, matrix)."""
    vectorizer = TfidfVectorizer(
        lowercase=True,
        ngram_range=(1, 2),
        min_df=1,
        sublinear_tf=True,
    )
    matrix = vectorizer.fit_transform(texts)
    return vectorizer, matrix


def _skill_jaccard(candidate, job):
    candidate_skills = set(candidate.skills.values_list('name', flat=True))
    job_skills = set(job.skills.values_list('name', flat=True))
    if not candidate_skills and not job_skills:
        return 0.0
    union = candidate_skills | job_skills
    return len(candidate_skills & job_skills) / len(union) if union else 0.0


def score_pair(candidate, job):
    """Return a 0-100 compatibility score between a candidate and a job."""
    vectorizer, matrix = _tfidf_matrix([candidate.profile_text(), job.profile_text()])
    cosine = cosine_similarity(matrix[0:1], matrix[1:2])[0][0]
    score = TEXT_WEIGHT * float(cosine) + SKILL_WEIGHT * _skill_jaccard(candidate, job)
    return round(min(100.0, max(0.0, score * 100)), 1)


def recommend_jobs_for_candidate(candidate, queryset=None, limit=10):
    """
    Rank published jobs for a candidate.

    Returns a list of dicts: {'job': Job, 'score': float, 'matched_skills': [...]}.
    """
    from jobs.models import Job

    jobs = (
        queryset
        if queryset is not None
        else Job.objects.filter(status=Job.Status.PUBLISHED).prefetch_related('skills')
    )
    jobs = list(jobs.select_related('company'))
    if not jobs:
        return []

    texts = [candidate.profile_text()] + [job.profile_text() for job in jobs]
    _, matrix = _tfidf_matrix(texts)
    similarities = cosine_similarity(matrix[0:1], matrix[1:]).ravel()

    candidate_skills = set(candidate.skills.values_list('name', flat=True))
    results = []
    for job, sim in zip(jobs, similarities):
        job_skills = set(job.skills.values_list('name', flat=True))
        matched = sorted(candidate_skills & job_skills)
        score = TEXT_WEIGHT * float(sim) + SKILL_WEIGHT * _skill_jaccard(candidate, job)
        results.append(
            {
                'job': job,
                'score': round(min(100.0, max(0.0, score * 100)), 1),
                'matched_skills': matched,
            }
        )
    results.sort(key=lambda item: item['score'], reverse=True)
    return results[:limit]


def recommend_candidates_for_job(job, queryset=None, limit=10):
    """
    Rank candidate profiles for a job vacancy.

    Returns a list of dicts: {'candidate': CandidateProfile, 'score': float,
    'matched_skills': [...]}.
    """
    from accounts.models import CandidateProfile

    candidates = (
        queryset
        if queryset is not None
        else CandidateProfile.objects.select_related('user').prefetch_related('skills')
    )
    candidates = list(candidates)
    if not candidates:
        return []

    texts = [job.profile_text()] + [c.profile_text() for c in candidates]
    _, matrix = _tfidf_matrix(texts)
    similarities = cosine_similarity(matrix[0:1], matrix[1:]).ravel()

    job_skills = set(job.skills.values_list('name', flat=True))
    results = []
    for candidate, sim in zip(candidates, similarities):
        candidate_skills = set(candidate.skills.values_list('name', flat=True))
        matched = sorted(candidate_skills & job_skills)
        score = TEXT_WEIGHT * float(sim) + SKILL_WEIGHT * _skill_jaccard(candidate, job)
        results.append(
            {
                'candidate': candidate,
                'score': round(min(100.0, max(0.0, score * 100)), 1),
                'matched_skills': matched,
            }
        )
    results.sort(key=lambda item: item['score'], reverse=True)
    return results[:limit]
