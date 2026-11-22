from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from accounts.models import (
    CandidateProfile,
    CompanyProfile,
    EducationEntry,
    ExperienceEntry,
    Skill,
)
from jobs.models import Application, ApplicationStatusHistory, Job

User = get_user_model()


# ---------------------------------------------------------------------------
# Skills & profile entries
# ---------------------------------------------------------------------------
class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name']


class ExperienceEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExperienceEntry
        fields = ['id', 'role', 'company', 'start', 'end', 'is_current', 'description']
        read_only_fields = ['id']


class EducationEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = EducationEntry
        fields = ['id', 'course', 'institution', 'status', 'year']
        read_only_fields = ['id']


# ---------------------------------------------------------------------------
# Profiles
# ---------------------------------------------------------------------------
class CandidateProfileSerializer(serializers.ModelSerializer):
    skills = SkillSerializer(many=True, read_only=True)
    skill_ids = serializers.PrimaryKeyRelatedField(
        queryset=Skill.objects.all(), many=True, write_only=True,
        source='skills', required=False,
    )
    experiences = ExperienceEntrySerializer(many=True, read_only=True)
    educations = EducationEntrySerializer(many=True, read_only=True)
    resume_url = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = CandidateProfile
        fields = [
            'id', 'headline', 'bio', 'education', 'experience_years',
            'skills', 'skill_ids', 'preferred_category', 'preferred_work_modes',
            'preferred_location', 'experiences', 'educations',
            'resume', 'resume_url', 'photo', 'photo_url',
        ]
        extra_kwargs = {
            'resume': {'write_only': True, 'required': False},
            'photo': {'write_only': True, 'required': False},
        }

    def get_resume_url(self, obj):
        return obj.resume.url if obj.resume else None

    def get_photo_url(self, obj):
        return obj.photo.url if obj.photo else None


class CompanyProfileSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = CompanyProfile
        fields = [
            'id', 'company_name', 'legal_name', 'trade_name', 'cnpj', 'sector',
            'size', 'state', 'description', 'website', 'logo', 'logo_url',
        ]
        extra_kwargs = {'logo': {'write_only': True, 'required': False}}

    def get_logo_url(self, obj):
        return obj.logo.url if obj.logo else None


class UserSerializer(serializers.ModelSerializer):
    candidate_profile = CandidateProfileSerializer(read_only=True)
    company_profile = CompanyProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'role',
            'phone', 'city', 'is_staff', 'is_active', 'date_joined',
            'candidate_profile', 'company_profile',
        ]
        read_only_fields = ['id', 'date_joined']


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=User.Role.choices)

    # Candidate profile fields (optional at registration)
    headline = serializers.CharField(required=False, allow_blank=True, max_length=150)
    bio = serializers.CharField(required=False, allow_blank=True)
    education = serializers.CharField(required=False, allow_blank=True, max_length=150)
    experience_years = serializers.IntegerField(required=False, min_value=0, default=0)
    preferred_category = serializers.CharField(required=False, allow_blank=True, max_length=30)
    preferred_work_modes = serializers.ListField(
        child=serializers.CharField(), required=False
    )
    preferred_location = serializers.CharField(required=False, allow_blank=True, max_length=120)

    # Company profile fields
    company_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    legal_name = serializers.CharField(required=False, allow_blank=True, max_length=200)
    trade_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    cnpj = serializers.CharField(required=False, allow_blank=True, max_length=20)
    sector = serializers.CharField(required=False, allow_blank=True, max_length=100)
    size = serializers.CharField(required=False, allow_blank=True, max_length=50)
    state = serializers.CharField(required=False, allow_blank=True, max_length=50)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm', 'role',
            'first_name', 'last_name', 'phone', 'city',
            'headline', 'bio', 'education', 'experience_years',
            'preferred_category', 'preferred_work_modes', 'preferred_location',
            'company_name', 'legal_name', 'trade_name', 'cnpj', 'sector', 'size',
            'state',
        ]

    PROFILE_FIELDS = {
        'headline', 'bio', 'education', 'experience_years',
        'preferred_category', 'preferred_work_modes', 'preferred_location',
        'company_name', 'legal_name', 'trade_name', 'cnpj', 'sector', 'size',
        'state',
    }

    def validate_role(self, value):
        # Public registration must never create administrators.
        if value == User.Role.ADMIN:
            raise serializers.ValidationError('Administrator accounts cannot be self-registered.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        try:
            validate_password(attrs['password'])
        except DjangoValidationError as exc:
            raise serializers.ValidationError({'password': list(exc.messages)})
        return attrs

    def create(self, validated_data):
        profile_data = {
            key: validated_data.pop(key)
            for key in self.PROFILE_FIELDS
            if key in validated_data
        }
        role = validated_data['role']
        user = User.objects.create_user(**validated_data)

        if role == User.Role.CANDIDATE:
            CandidateProfile.objects.create(
                user=user,
                headline=profile_data.get('headline', ''),
                bio=profile_data.get('bio', ''),
                education=profile_data.get('education', ''),
                experience_years=profile_data.get('experience_years', 0),
                preferred_category=profile_data.get('preferred_category', ''),
                preferred_work_modes=profile_data.get('preferred_work_modes', []),
                preferred_location=profile_data.get('preferred_location', ''),
            )
        elif role == User.Role.COMPANY:
            CompanyProfile.objects.create(
                user=user,
                company_name=profile_data.get('company_name') or user.username,
                legal_name=profile_data.get('legal_name', ''),
                trade_name=profile_data.get('trade_name', ''),
                cnpj=profile_data.get('cnpj', ''),
                sector=profile_data.get('sector', ''),
                size=profile_data.get('size', ''),
                state=profile_data.get('state', ''),
            )
        return user


class ProfileUpdateSerializer(serializers.Serializer):
    """Updates user fields and the role-specific profile in one request."""

    # User fields
    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=30)
    city = serializers.CharField(required=False, allow_blank=True, max_length=100)

    # Candidate profile fields
    headline = serializers.CharField(required=False, allow_blank=True, max_length=150)
    bio = serializers.CharField(required=False, allow_blank=True)
    education = serializers.CharField(required=False, allow_blank=True, max_length=150)
    experience_years = serializers.IntegerField(required=False, min_value=0)
    skills = serializers.ListField(
        child=serializers.IntegerField(), required=False, write_only=True
    )
    preferred_category = serializers.CharField(required=False, allow_blank=True, max_length=30)
    preferred_work_modes = serializers.ListField(
        child=serializers.CharField(), required=False
    )
    preferred_location = serializers.CharField(required=False, allow_blank=True, max_length=120)
    resume = serializers.FileField(required=False, allow_null=True)
    photo = serializers.ImageField(required=False, allow_null=True)

    # Company profile fields
    company_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    legal_name = serializers.CharField(required=False, allow_blank=True, max_length=200)
    trade_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    cnpj = serializers.CharField(required=False, allow_blank=True, max_length=20)
    sector = serializers.CharField(required=False, allow_blank=True, max_length=100)
    size = serializers.CharField(required=False, allow_blank=True, max_length=50)
    state = serializers.CharField(required=False, allow_blank=True, max_length=50)
    description = serializers.CharField(required=False, allow_blank=True)
    website = serializers.URLField(required=False, allow_blank=True)
    logo = serializers.ImageField(required=False, allow_null=True)

    USER_FIELDS = {'email', 'first_name', 'last_name', 'phone', 'city'}
    CANDIDATE_FIELDS = {
        'headline', 'bio', 'education', 'experience_years', 'skills',
        'preferred_category', 'preferred_work_modes', 'preferred_location',
        'resume', 'photo',
    }
    COMPANY_FIELDS = {
        'company_name', 'legal_name', 'trade_name', 'cnpj', 'sector', 'size',
        'state', 'description', 'website', 'logo',
    }

    def update(self, instance, validated_data):
        for key, value in validated_data.items():
            if key in self.USER_FIELDS:
                setattr(instance, key, value)
        instance.save()

        if instance.is_candidate:
            profile = instance.candidate_profile
            for key in self.CANDIDATE_FIELDS & validated_data.keys():
                if key == 'skills':
                    profile.skills.set(validated_data['skills'])
                else:
                    setattr(profile, key, validated_data[key])
            profile.save()
        elif instance.is_company:
            profile = instance.company_profile
            for key in self.COMPANY_FIELDS & validated_data.keys():
                setattr(profile, key, validated_data[key])
            profile.save()
        return instance


# ---------------------------------------------------------------------------
# Jobs & applications
# ---------------------------------------------------------------------------
class JobSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(
        queryset=CompanyProfile.objects.all(), required=False
    )
    company_name = serializers.CharField(source='company.company_name', read_only=True)
    company_logo = serializers.SerializerMethodField()

    essential_skills = SkillSerializer(many=True, read_only=True)
    desired_skills = SkillSerializer(many=True, read_only=True)
    skills = serializers.SerializerMethodField()
    essential_skill_ids = serializers.PrimaryKeyRelatedField(
        queryset=Skill.objects.all(), many=True, write_only=True,
        source='essential_skills', required=False,
    )
    desired_skill_ids = serializers.PrimaryKeyRelatedField(
        queryset=Skill.objects.all(), many=True, write_only=True,
        source='desired_skills', required=False,
    )
    application_count = serializers.IntegerField(read_only=True, required=False)
    has_applied = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'slug', 'description', 'requirements', 'responsibilities',
            'category', 'location', 'work_mode', 'job_type', 'seniority',
            'contract_type', 'salary_min', 'salary_max', 'currency',
            'essential_skills', 'desired_skills', 'skills',
            'essential_skill_ids', 'desired_skill_ids',
            'status', 'company', 'company_name', 'company_logo',
            'application_count', 'has_applied', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']

    def get_company_logo(self, obj):
        return obj.company.logo.url if obj.company.logo else None

    def get_skills(self, obj):
        return SkillSerializer(obj.all_skills, many=True).data

    def get_has_applied(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated or not request.user.is_candidate:
            return False
        return obj.applications.filter(candidate__user=request.user).exists()

    def validate(self, attrs):
        salary_min = attrs.get('salary_min')
        salary_max = attrs.get('salary_max')
        if salary_min and salary_max and salary_min > salary_max:
            raise serializers.ValidationError(
                {'salary_max': 'Maximum salary must be greater than minimum salary.'}
            )
        return attrs


class ApplicationStatusHistorySerializer(serializers.ModelSerializer):
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = ApplicationStatusHistory
        fields = ['id', 'from_status', 'to_status', 'status_display', 'created_at']

    def get_status_display(self, obj):
        try:
            return Application.Status(obj.to_status).label
        except ValueError:
            return obj.to_status


class ApplicationSerializer(serializers.ModelSerializer):
    candidate_name = serializers.SerializerMethodField()
    candidate_email = serializers.SerializerMethodField()
    job_title = serializers.CharField(source='job.title', read_only=True)
    company_name = serializers.CharField(source='job.company.company_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    status_history = ApplicationStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Application
        fields = [
            'id', 'job', 'candidate', 'cover_letter', 'status', 'status_display',
            'candidate_name', 'candidate_email', 'job_title', 'company_name',
            'status_history', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'candidate', 'created_at', 'updated_at']

    def get_candidate_name(self, obj):
        user = obj.candidate.user
        return user.get_full_name() or user.username

    def get_candidate_email(self, obj):
        return obj.candidate.user.email

    def validate_job(self, job):
        if job.status != Job.Status.PUBLISHED:
            raise serializers.ValidationError('This vacancy is not open for applications.')
        return job

    def validate(self, attrs):
        request = self.context['request']
        job = attrs.get('job') or (self.instance.job if self.instance else None)
        candidate = getattr(request.user, 'candidate_profile', None)
        if candidate and job and job.applications.filter(candidate=candidate).exists():
            raise serializers.ValidationError(
                {'job': 'You have already applied to this vacancy.'}
            )
        return attrs


class ApplicationStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Application.Status.choices)


# ---------------------------------------------------------------------------
# Matching
# ---------------------------------------------------------------------------
class MatchBreakdownSerializer(serializers.Serializer):
    score = serializers.FloatField()
    matched_skills = serializers.ListField(child=serializers.CharField())
    criteria = serializers.DictField()


class JobMatchSerializer(MatchBreakdownSerializer):
    job = JobSerializer()


class CandidateMatchSerializer(MatchBreakdownSerializer):
    candidate = serializers.SerializerMethodField()

    def get_candidate(self, obj):
        profile = obj['candidate']
        return {
            'id': profile.id,
            'user': UserSerializer(profile.user).data,
            'headline': profile.headline,
            'bio': profile.bio,
            'education': profile.education,
            'experience_years': profile.experience_years,
            'preferred_category': profile.preferred_category,
            'preferred_work_modes': profile.preferred_work_modes,
            'preferred_location': profile.preferred_location,
            'city': profile.user.city,
            'skills': SkillSerializer(profile.skills.all(), many=True).data,
            'experiences': ExperienceEntrySerializer(profile.experiences.all(), many=True).data,
            'educations': EducationEntrySerializer(profile.educations.all(), many=True).data,
        }
