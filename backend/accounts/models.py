from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Single user model for all three platform roles."""

    class Role(models.TextChoices):
        CANDIDATE = 'candidate', 'Candidate'
        COMPANY = 'company', 'Company'
        ADMIN = 'admin', 'Administrator'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CANDIDATE,
        db_index=True,
    )
    phone = models.CharField(max_length=30, blank=True)
    city = models.CharField(max_length=100, blank=True)

    class Meta:
        verbose_name = 'user'
        verbose_name_plural = 'users'

    def __str__(self):
        return f'{self.get_full_name() or self.username} ({self.get_role_display()})'

    @property
    def is_candidate(self):
        return self.role == self.Role.CANDIDATE

    @property
    def is_company(self):
        return self.role == self.Role.COMPANY

    @property
    def is_admin_role(self):
        return self.role == self.Role.ADMIN


class Skill(models.Model):
    """Controlled vocabulary of professional skills used for matching."""

    name = models.CharField(max_length=80, unique=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'skill'
        verbose_name_plural = 'skills'

    def __str__(self):
        return self.name


class CandidateProfile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='candidate_profile'
    )
    headline = models.CharField(max_length=150, blank=True)
    bio = models.TextField(blank=True)
    education = models.CharField(max_length=150, blank=True)
    experience_years = models.PositiveIntegerField(default=0)
    skills = models.ManyToManyField(Skill, blank=True, related_name='candidates')

    # Work preferences used by the matching engine ("Preferências" criteria).
    preferred_category = models.CharField(max_length=30, blank=True)
    preferred_work_modes = models.JSONField(default=list, blank=True)
    preferred_location = models.CharField(max_length=120, blank=True)

    resume = models.FileField(upload_to='resumes/', blank=True, null=True)
    photo = models.ImageField(upload_to='photos/', blank=True, null=True)
    cover = models.ImageField(upload_to='covers/', blank=True, null=True)
    certifications = models.TextField(blank=True)

    class Meta:
        verbose_name = 'candidate profile'
        verbose_name_plural = 'candidate profiles'

    def __str__(self):
        return f'Profile of {self.user}'

    def profile_text(self):
        """Free-text representation used by the matching engine."""
        skills = ', '.join(self.skills.values_list('name', flat=True))
        experiences = ' '.join(
            f'{e.role} {e.company} {e.description}' for e in self.experiences.all()
        )
        educations = ' '.join(
            f'{e.course} {e.institution}' for e in self.educations.all()
        )
        return ' '.join(
            part
            for part in [
                self.headline,
                self.bio,
                self.education,
                educations,
                experiences,
                skills,
                f'{self.experience_years} years of experience'
                if self.experience_years
                else '',
            ]
            if part
        )


class ExperienceEntry(models.Model):
    """A work experience entry on a candidate profile."""

    profile = models.ForeignKey(
        CandidateProfile, on_delete=models.CASCADE, related_name='experiences'
    )
    role = models.CharField(max_length=120)
    company = models.CharField(max_length=120)
    start = models.CharField(max_length=30, blank=True)
    end = models.CharField(max_length=30, blank=True)
    is_current = models.BooleanField(default=False)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ['-id']
        verbose_name = 'experience entry'
        verbose_name_plural = 'experience entries'

    def __str__(self):
        return f'{self.role} @ {self.company}'


class EducationEntry(models.Model):
    """An education entry on a candidate profile."""

    class Status(models.TextChoices):
        IN_PROGRESS = 'in_progress', 'In progress'
        COMPLETED = 'completed', 'Completed'
        DROPPED = 'dropped', 'Dropped out'

    profile = models.ForeignKey(
        CandidateProfile, on_delete=models.CASCADE, related_name='educations'
    )
    course = models.CharField(max_length=150)
    institution = models.CharField(max_length=150)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.COMPLETED
    )
    year = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ['-id']
        verbose_name = 'education entry'
        verbose_name_plural = 'education entries'

    def __str__(self):
        return f'{self.course} — {self.institution}'


class CompanyProfile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='company_profile'
    )
    company_name = models.CharField(max_length=150)
    legal_name = models.CharField(max_length=200, blank=True)
    trade_name = models.CharField(max_length=150, blank=True)
    cnpj = models.CharField(max_length=20, blank=True)
    sector = models.CharField(max_length=100, blank=True)
    size = models.CharField(max_length=50, blank=True)
    state = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    website = models.URLField(blank=True)
    logo = models.ImageField(upload_to='logos/', blank=True, null=True)
    cover = models.ImageField(upload_to='covers/', blank=True, null=True)

    class Meta:
        verbose_name = 'company profile'
        verbose_name_plural = 'company profiles'

    def __str__(self):
        return self.company_name
