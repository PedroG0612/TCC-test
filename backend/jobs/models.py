from django.conf import settings
from django.db import models
from django.utils.text import slugify

from accounts.models import CompanyProfile, Skill


class Job(models.Model):
    """A job vacancy published by a company."""

    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        PUBLISHED = 'published', 'Published'
        PAUSED = 'paused', 'Paused'

    class WorkMode(models.TextChoices):
        REMOTE = 'remote', 'Remote'
        HYBRID = 'hybrid', 'Hybrid'
        ONSITE = 'onsite', 'On-site'

    class JobType(models.TextChoices):
        FULL_TIME = 'full_time', 'Full-time'
        PART_TIME = 'part_time', 'Part-time'
        INTERNSHIP = 'internship', 'Internship'
        FREELANCE = 'freelance', 'Freelance'

    class Seniority(models.TextChoices):
        JUNIOR = 'junior', 'Junior'
        PLENO = 'pleno', 'Pleno'
        SENIOR = 'senior', 'Senior'

    class Category(models.TextChoices):
        TECHNOLOGY = 'technology', 'Technology'
        DESIGN = 'design', 'Design'
        MARKETING = 'marketing', 'Marketing'
        BUSINESS = 'business', 'Business'
        ENGINEERING = 'engineering', 'Engineering'
        HEALTH = 'health', 'Health'
        EDUCATION = 'education', 'Education'
        OTHER = 'other', 'Other'

    company = models.ForeignKey(
        CompanyProfile, on_delete=models.CASCADE, related_name='jobs'
    )
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, blank=True)
    description = models.TextField()
    requirements = models.TextField(blank=True)
    responsibilities = models.TextField(blank=True)
    category = models.CharField(
        max_length=30, choices=Category.choices, default=Category.OTHER, db_index=True
    )
    location = models.CharField(max_length=120)
    work_mode = models.CharField(
        max_length=20, choices=WorkMode.choices, default=WorkMode.ONSITE
    )
    job_type = models.CharField(
        max_length=20, choices=JobType.choices, default=JobType.FULL_TIME
    )
    seniority = models.CharField(
        max_length=20, choices=Seniority.choices, default=Seniority.PLENO
    )
    contract_type = models.CharField(max_length=60, blank=True)
    salary_min = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    salary_max = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    currency = models.CharField(max_length=3, default='BRL')

    # Matching criteria (Figma 03.2): essential vs desired competencies.
    essential_skills = models.ManyToManyField(
        Skill, blank=True, related_name='essential_jobs'
    )
    desired_skills = models.ManyToManyField(
        Skill, blank=True, related_name='desired_jobs'
    )

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'job'
        verbose_name_plural = 'jobs'
        indexes = [
            models.Index(fields=['status', 'category']),
            models.Index(fields=['location']),
        ]

    def __str__(self):
        return f'{self.title} @ {self.company.company_name}'

    @property
    def all_skills(self):
        """Union of essential and desired skills (for display/search)."""
        return Skill.objects.filter(
            models.Q(essential_jobs=self) | models.Q(desired_jobs=self)
        ).distinct()

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(f'{self.title}-{self.company.company_name}')[:200]
            slug, i = base, 1
            while Job.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                i += 1
                slug = f'{base}-{i}'[:220]
            self.slug = slug
        super().save(*args, **kwargs)

    def profile_text(self):
        """Free-text representation used by the matching engine."""
        skills = ', '.join(self.all_skills.values_list('name', flat=True))
        return ' '.join(
            part
            for part in [
                self.title,
                self.description,
                self.requirements,
                self.responsibilities,
                self.category,
                self.location,
                self.work_mode.replace('_', ' '),
                skills,
            ]
            if part
        )


class Application(models.Model):
    """A candidate's application to a job vacancy."""

    class Status(models.TextChoices):
        APPLIED = 'applied', 'Enviada'
        UNDER_REVIEW = 'under_review', 'Em análise'
        INTERVIEW = 'interview', 'Entrevista'
        REJECTED = 'rejected', 'Não avançou'
        HIRED = 'hired', 'Contratado'

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    candidate = models.ForeignKey(
        'accounts.CandidateProfile', on_delete=models.CASCADE, related_name='applications'
    )
    cover_letter = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.APPLIED, db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['job', 'candidate'], name='unique_application_per_job'
            )
        ]
        verbose_name = 'application'
        verbose_name_plural = 'applications'

    def __str__(self):
        return f'{self.candidate} -> {self.job.title}'


class ApplicationStatusHistory(models.Model):
    """Audit trail of application status changes (drives the candidate timeline)."""

    application = models.ForeignKey(
        Application, on_delete=models.CASCADE, related_name='status_history'
    )
    from_status = models.CharField(max_length=20, blank=True)
    to_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='application_status_changes',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = 'application status history'
        verbose_name_plural = 'application status histories'

    def __str__(self):
        return f'{self.application_id}: {self.from_status or "-"} -> {self.to_status}'


class SavedJob(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='saved_jobs',
    )
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='saves',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('user', 'job')]
        ordering = ['-created_at']
        verbose_name = 'saved job'
        verbose_name_plural = 'saved jobs'

    def __str__(self):
        return f'{self.user} saved {self.job}'
