"""Report aggregation services — all numbers come from real DB rows."""

from collections import Counter
from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone

from accounts.models import CandidateProfile, CompanyProfile, Skill, User
from jobs.models import Application, Job


def _top_counter(queryset, field, limit=10):
    counter = Counter()
    for value in queryset.values_list(field, flat=True):
        if value:
            counter[value] += 1
    return counter.most_common(limit)


def platform_overview():
    """Admin-facing platform statistics."""
    now = timezone.now()
    thirty_days_ago = now - timedelta(days=30)

    applications = Application.objects.all()
    jobs = Job.objects.all()

    applications_per_job = list(
        applications.values('job__title', 'job__company__company_name')
        .annotate(total=Count('id'))
        .order_by('-total')[:15]
    )
    for row in applications_per_job:
        row['job'] = row.pop('job__title')
        row['company'] = row.pop('job__company__company_name')

    applications_by_status = dict(
        applications.values_list('status').annotate(total=Count('id')).values_list('status', 'total')
    )

    label_map = dict(Job.Category.choices)
    applications_by_category = [
        {'category': code, 'label': label_map.get(code, code), 'count': count}
        for code, count in _top_counter(applications, 'job__category', limit=8)
    ]

    # Most demanded skills: count of published jobs requiring each skill
    # (essential + desired criteria both count as demand).
    essential_counts = dict(
        Skill.objects.annotate(
            total=Count('essential_jobs', filter=Q(essential_jobs__status=Job.Status.PUBLISHED))
        ).values_list('id', 'total')
    )
    desired_counts = dict(
        Skill.objects.annotate(
            total=Count('desired_jobs', filter=Q(desired_jobs__status=Job.Status.PUBLISHED))
        ).values_list('id', 'total')
    )
    demand = Counter()
    for skill_id, total in essential_counts.items():
        demand[skill_id] += total
    for skill_id, total in desired_counts.items():
        demand[skill_id] += total
    skill_names = dict(Skill.objects.values_list('id', 'name'))
    top_skills = [
        {'skill': skill_names[sid], 'count': total}
        for sid, total in demand.most_common(10)
    ]

    top_locations = [
        {'location': loc, 'count': count}
        for loc, count in _top_counter(Job.objects.filter(status=Job.Status.PUBLISHED), 'location', limit=10)
    ]

    monthly = []
    for i in range(5, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=30 * i)).replace(day=1)
        if i:
            next_month = (month_start + timedelta(days=32)).replace(day=1)
            month_end = next_month
        else:
            month_end = now
        count = applications.filter(created_at__gte=month_start, created_at__lt=month_end).count()
        monthly.append({'month': month_start.strftime('%Y-%m'), 'count': count})

    return {
        'totals': {
            'users': User.objects.count(),
            'candidates': CandidateProfile.objects.count(),
            'companies': CompanyProfile.objects.count(),
            'jobs': jobs.count(),
            'published_jobs': jobs.filter(status=Job.Status.PUBLISHED).count(),
            'applications': applications.count(),
            'applications_last_30_days': applications.filter(created_at__gte=thirty_days_ago).count(),
        },
        'applications_per_job': applications_per_job,
        'applications_by_status': applications_by_status,
        'applications_by_category': applications_by_category,
        'top_skills': top_skills,
        'top_locations': top_locations,
        'monthly_applications': monthly,
    }


def company_stats(company_profile):
    """Statistics scoped to a single company's vacancies."""
    jobs = Job.objects.filter(company=company_profile)
    applications = Application.objects.filter(job__company=company_profile)

    per_job = list(
        applications.values('job__title', 'status')
        .annotate(total=Count('id'))
        .order_by('job__title', 'status')
    )
    by_status = dict(
        applications.values_list('status').annotate(total=Count('id')).values_list('status', 'total')
    )
    recent = [
        {
            'id': app.id,
            'job': app.job.title,
            'candidate': app.candidate.user.get_full_name() or app.candidate.user.username,
            'candidate_email': app.candidate.user.email,
            'status': app.status,
            'status_display': app.get_status_display(),
            'created_at': app.created_at.isoformat(),
        }
        for app in applications.select_related('job', 'candidate__user').order_by('-created_at')[:10]
    ]

    per_job_out = [
        {'job': row['job__title'], 'status': row['status'], 'total': row['total']}
        for row in per_job
    ]

    return {
        'totals': {
            'jobs': jobs.count(),
            'published_jobs': jobs.filter(status=Job.Status.PUBLISHED).count(),
            'applications': applications.count(),
        },
        'applications_by_status': by_status,
        'applications_per_job': per_job_out,
        'recent_applications': recent,
    }
