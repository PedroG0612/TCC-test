"""
Appliety matching engine — explainable weighted criteria.

Implements the criteria model from the product prototype:

    Essenciais    50 pts  — coverage of the job's essential skills
    Desejáveis    10 pts  — coverage of the job's desired (differential) skills
    Experiência   25 pts  — seniority/years fit + TF-IDF text similarity
                            (scikit-learn) between profile and vacancy texts
    Preferências  15 pts  — location, work-mode and area-of-interest fit

Per-skill evidence follows the prototype rule: full evidence (skill declared)
earns full credit, partial evidence (skill mentioned in the free-text profile)
earns half credit, and missing information earns nothing — missing data never
proves absence of competence.

Every result returns the total score (0-100) plus a per-criterion breakdown so
the UI can show *why* a candidate/job matched. The score is decision support
for humans, never an automatic reject/approve signal.
"""

import re

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Criterion weights (must sum to 100) — mirrors the prototype.
W_ESSENTIAL = 50
W_DESIRED = 10
W_EXPERIENCE = 25
W_PREFERENCES = 15

# Seniority -> minimum years of experience expected.
SENIORITY_YEARS = {'junior': 1, 'pleno': 3, 'senior': 6}


def _tfidf_cosine(texts):
    """Fit TF-IDF on `texts` and return the pairwise cosine similarity matrix."""
    vectorizer = TfidfVectorizer(
        lowercase=True, ngram_range=(1, 2), min_df=1, sublinear_tf=True
    )
    matrix = vectorizer.fit_transform(texts)
    return cosine_similarity(matrix)


def _tokens(text):
    return set(re.findall(r'[a-zA-ZÀ-ÿ]{3,}', text.lower()))


def _skill_evidence(skill_name, candidate):
    """
    Return 1.0 (declared skill), 0.5 (mentioned in profile text) or 0.0.
    """
    if skill_name in set(candidate.skills.values_list('name', flat=True)):
        return 1.0
    # Partial evidence: the skill name (or all its significant tokens) appears
    # in the candidate's free-text profile.
    profile_tokens = _tokens(candidate.profile_text())
    name_tokens = _tokens(skill_name)
    if name_tokens and name_tokens <= profile_tokens:
        return 0.5
    return 0.0


def _skill_coverage(job_skills, candidate, max_points):
    """Weighted coverage of a skill set -> (points, matched, partial, missing)."""
    matched, partial, missing = [], [], []
    total_evidence = 0.0
    for skill in job_skills:
        evidence = _skill_evidence(skill.name, candidate)
        total_evidence += evidence
        if evidence == 1.0:
            matched.append(skill.name)
        elif evidence == 0.5:
            partial.append(skill.name)
        else:
            missing.append(skill.name)
    points = round(max_points * (total_evidence / len(job_skills)), 1) if job_skills else 0.0
    return points, matched, partial, missing


def _experience_score(candidate, job, text_sim):
    """Blend years-vs-seniority fit with TF-IDF text similarity."""
    expected = SENIORITY_YEARS.get(job.seniority, 3)
    years_fit = min(candidate.experience_years / expected, 1.0) if expected else 0.0
    # If the candidate declared no experience, don't penalize hard: treat as
    # junior-level evidence only through the text signal.
    blended = 0.5 * years_fit + 0.5 * float(text_sim)
    return round(W_EXPERIENCE * blended, 1), round(years_fit, 2), round(float(text_sim), 3)


def _norm(value):
    return (value or '').strip().lower()


def _location_match(candidate, job):
    """1.0 match, 0.5 undeclared, 0.0 mismatch."""
    wanted = _norm(candidate.user.city) or _norm(candidate.preferred_location)
    if not wanted:
        return 0.5
    job_loc = _norm(job.location)
    return 1.0 if wanted and (wanted in job_loc or job_loc in wanted) else 0.0


def _work_mode_match(candidate, job):
    modes = candidate.preferred_work_modes or []
    if not modes:
        return 0.5
    return 1.0 if job.work_mode in modes else 0.0


def _category_match(candidate, job):
    if not candidate.preferred_category:
        return 0.5
    return 1.0 if candidate.preferred_category == job.category else 0.0


def score_pair(candidate, job, text_sim=None):
    """
    Return a dict with the compatibility breakdown for a candidate/job pair.

    `text_sim` may be supplied by batch callers to avoid recomputing TF-IDF.
    """
    if text_sim is None:
        text_sim = _tfidf_cosine([candidate.profile_text(), job.profile_text()])[0][1]

    essential_skills = list(job.essential_skills.all())
    desired_skills = list(job.desired_skills.all())
    essential_pts, ess_match, ess_partial, ess_missing = _skill_coverage(
        essential_skills, candidate, W_ESSENTIAL
    )
    desired_pts, des_match, des_partial, des_missing = _skill_coverage(
        desired_skills, candidate, W_DESIRED
    )

    # When a vacancy defines no essential skills, fall back to the textual
    # requirements similarity so the criterion still carries signal.
    if not essential_skills:
        essential_pts = round(W_ESSENTIAL * float(text_sim), 1)

    exp_pts, years_fit, sim = _experience_score(candidate, job, text_sim)

    loc = _location_match(candidate, job)
    mode = _work_mode_match(candidate, job)
    cat = _category_match(candidate, job)
    pref_pts = round(W_PREFERENCES * (loc + mode + cat) / 3, 1)

    total = round(essential_pts + desired_pts + exp_pts + pref_pts, 1)

    all_job_skills = set(job.essential_skills.values_list('name', flat=True)) | set(
        job.desired_skills.values_list('name', flat=True)
    )
    candidate_skills = set(candidate.skills.values_list('name', flat=True))

    return {
        'score': min(100.0, max(0.0, total)),
        'matched_skills': sorted(candidate_skills & all_job_skills),
        'criteria': {
            'essential': {
                'score': essential_pts, 'max': W_ESSENTIAL,
                'matched': ess_match, 'partial': ess_partial, 'missing': ess_missing,
            },
            'desired': {
                'score': desired_pts, 'max': W_DESIRED,
                'matched': des_match, 'partial': des_partial, 'missing': des_missing,
            },
            'experience': {
                'score': exp_pts, 'max': W_EXPERIENCE,
                'years_fit': years_fit, 'text_similarity': sim,
                'experience_years': candidate.experience_years,
                'seniority': job.get_seniority_display(),
            },
            'preferences': {
                'score': pref_pts, 'max': W_PREFERENCES,
                'location': loc, 'work_mode': mode, 'category': cat,
            },
        },
    }


def recommend_jobs_for_candidate(candidate, queryset=None, limit=10):
    """Rank published jobs for a candidate with explainable scores."""
    from jobs.models import Job

    jobs = (
        queryset
        if queryset is not None
        else Job.objects.filter(status=Job.Status.PUBLISHED)
        .prefetch_related('essential_skills', 'desired_skills')
        .select_related('company')
    )
    jobs = list(jobs)
    if not jobs:
        return []

    texts = [candidate.profile_text()] + [job.profile_text() for job in jobs]
    sims = _tfidf_cosine(texts)[0][1:]

    results = []
    for job, sim in zip(jobs, sims):
        breakdown = score_pair(candidate, job, text_sim=float(sim))
        results.append({'job': job, **breakdown})
    results.sort(key=lambda item: item['score'], reverse=True)
    return results[:limit]


def recommend_candidates_for_job(job, queryset=None, limit=10):
    """Rank candidate profiles for a job vacancy with explainable scores."""
    from accounts.models import CandidateProfile

    candidates = (
        queryset
        if queryset is not None
        else CandidateProfile.objects.select_related('user')
        .prefetch_related('skills', 'experiences', 'educations')
    )
    candidates = list(candidates)
    if not candidates:
        return []

    texts = [job.profile_text()] + [c.profile_text() for c in candidates]
    sims = _tfidf_cosine(texts)[0][1:]

    results = []
    for candidate, sim in zip(candidates, sims):
        breakdown = score_pair(candidate, job, text_sim=float(sim))
        results.append({'candidate': candidate, **breakdown})
    results.sort(key=lambda item: item['score'], reverse=True)
    return results[:limit]
