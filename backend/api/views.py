from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import (
    CandidateProfile,
    CompanyProfile,
    EducationEntry,
    ExperienceEntry,
    Skill,
)
from api.permissions import IsAdminRole, IsCandidate, IsCompany
from api.serializers import (
    ApplicationSerializer,
    ApplicationStatusUpdateSerializer,
    CandidateMatchSerializer,
    EducationEntrySerializer,
    ExperienceEntrySerializer,
    JobMatchSerializer,
    JobSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    SkillSerializer,
    UserSerializer,
)
from jobs.filters import ApplicationFilter, JobFilter
from jobs.models import Application, ApplicationStatusHistory, Job
from matching import engine as matching_engine

User = get_user_model()


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------
class RegisterView(APIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {'token': token.key, 'user': UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username') or request.data.get('email')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is None and '@' in str(username or ''):
            # Allow login with e-mail: resolve to username first.
            account = User.objects.filter(email__iexact=username).first()
            if account:
                user = authenticate(
                    request, username=account.username, password=password
                )
        if user is None:
            return Response(
                {'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED
            )
        if not user.is_active:
            return Response(
                {'detail': 'This account has been deactivated.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': UserSerializer(user).data})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(instance=request.user, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class PasswordResetRequestView(APIView):
    """Request a password-reset link. Always returns the same response to
    avoid leaking which e-mails are registered."""

    permission_classes = [AllowAny]

    def post(self, request):
        from django.contrib.auth.tokens import default_token_generator
        from django.core.mail import send_mail
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        email = (request.data.get('email') or '').strip()
        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = (
                f"{request.scheme}://{request.get_host()}/reset-password/"
                f"?uid={uid}&token={token}"
            )
            send_mail(
                subject='Appliety — Redefinição de senha',
                message=(
                    f'Olá, {user.get_full_name() or user.username}!\n\n'
                    f'Para redefinir sua senha, acesse:\n{reset_url}\n\n'
                    'Se você não solicitou isso, ignore este e-mail.'
                ),
                from_email=None,
                recipient_list=[user.email],
                fail_silently=True,
            )
        return Response(
            {'detail': 'If an account exists for this e-mail, a reset link was sent.'}
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_str
        from django.utils.http import urlsafe_base64_decode

        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(uid)))
        except (User.DoesNotExist, ValueError, TypeError):
            user = None
        if user is None or not default_token_generator.check_token(user, token):
            return Response({'detail': 'Invalid or expired reset link.'}, status=400)
        try:
            validate_password(new_password, user=user)
        except DjangoValidationError as exc:
            return Response({'new_password': list(exc.messages)}, status=400)
        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Password updated. You can now log in.'})


class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current = request.data.get('current_password')
        new = request.data.get('new_password')
        if not request.user.check_password(current):
            return Response(
                {'current_password': ['Wrong password.']}, status=status.HTTP_400_BAD_REQUEST
            )
        try:
            validate_password(new, user=request.user)
        except DjangoValidationError as exc:
            return Response({'new_password': list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)
        request.user.set_password(new)
        request.user.save()
        return Response({'detail': 'Password updated.'})


# ---------------------------------------------------------------------------
# Admin user management
# ---------------------------------------------------------------------------
class UserViewSet(viewsets.ModelViewSet):
    """Administrator-only user management."""

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]
    http_method_names = ['get', 'patch', 'put', 'delete', 'head', 'options']

    def get_queryset(self):
        qs = User.objects.all().order_by('-date_joined')
        role = self.request.query_params.get('role')
        search = self.request.query_params.get('search')
        if role:
            qs = qs.filter(role=role)
        if search:
            qs = qs.filter(
                Q(username__icontains=search)
                | Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
            )
        return qs

    def perform_update(self, serializer):
        # An admin cannot remove their own admin role through this endpoint
        # accidentally demoting themselves is still allowed but flagged.
        serializer.save()

    def perform_destroy(self, instance):
        if instance == self.request.user:
            from rest_framework.exceptions import ValidationError

            raise ValidationError('You cannot delete your own account.')
        instance.delete()


class SkillViewSet(viewsets.ModelViewSet):
    """Skills vocabulary — readable by everyone, writable by authenticated users."""

    serializer_class = SkillSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']
    queryset = Skill.objects.all().order_by('name')

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search)
        return qs

    def perform_create(self, serializer):
        serializer.save()


# ---------------------------------------------------------------------------
# Candidate profile entries (experience & education)
# ---------------------------------------------------------------------------
class _CandidateEntryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsCandidate]
    http_method_names = ['get', 'post', 'patch', 'put', 'delete', 'head', 'options']

    @property
    def profile(self):
        profile = getattr(self.request.user, 'candidate_profile', None)
        if profile is None:
            from rest_framework.exceptions import NotFound

            raise NotFound('Candidate profile not found.')
        return profile

    def get_queryset(self):
        return self.model.objects.filter(profile=self.profile)

    def perform_create(self, serializer):
        serializer.save(profile=self.profile)


class ExperienceEntryViewSet(_CandidateEntryViewSet):
    serializer_class = ExperienceEntrySerializer
    model = ExperienceEntry


class EducationEntryViewSet(_CandidateEntryViewSet):
    serializer_class = EducationEntrySerializer
    model = EducationEntry


# ---------------------------------------------------------------------------
# Jobs
# ---------------------------------------------------------------------------
class JobViewSet(viewsets.ModelViewSet):
    serializer_class = JobSerializer
    filterset_class = JobFilter
    search_fields = ['title', 'description', 'requirements', 'company__company_name']
    ordering_fields = ['created_at', 'title', 'salary_min']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAuthenticated()]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        qs = Job.objects.select_related('company').prefetch_related(
            'essential_skills', 'desired_skills'
        )

        if user.is_authenticated and user.is_admin_role:
            pass  # admins see everything
        elif user.is_authenticated and user.is_company:
            profile = getattr(user, 'company_profile', None)
            qs = qs.filter(company=profile) if profile else qs.none()
        else:
            qs = qs.filter(status=Job.Status.PUBLISHED)

        # Allow ?status= filter only for privileged users; candidates/anon
        # always see published jobs regardless.
        if not (user.is_authenticated and (user.is_admin_role or user.is_company)):
            qs = qs.filter(status=Job.Status.PUBLISHED)

        return qs.annotate(application_count=Count('applications')).order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_company:
            profile = getattr(user, 'company_profile', None)
            if profile is None:
                from rest_framework.exceptions import ValidationError

                raise ValidationError('Your account has no company profile.')
            serializer.save(company=profile)
        elif user.is_admin_role:
            company = serializer.validated_data.get('company')
            if company is None:
                from rest_framework.exceptions import ValidationError

                raise ValidationError({'company': 'Administrator must specify a company.'})
            serializer.save(company=company)
        else:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied('Only companies can publish vacancies.')

    def _can_modify(self, job):
        user = self.request.user
        if user.is_admin_role:
            return True
        if user.is_company:
            profile = getattr(user, 'company_profile', None)
            return profile is not None and job.company_id == profile.id
        return False

    def perform_update(self, serializer):
        # Only the owning company or an admin may modify a vacancy.
        from rest_framework.exceptions import PermissionDenied

        if not self._can_modify(serializer.instance):
            raise PermissionDenied('You cannot modify this vacancy.')
        # Companies cannot reassign ownership.
        if not self.request.user.is_admin_role:
            serializer.validated_data.pop('company', None)
        serializer.save()

    def perform_destroy(self, instance):
        from rest_framework.exceptions import PermissionDenied

        if not self._can_modify(instance):
            raise PermissionDenied('You cannot delete this vacancy.')
        instance.delete()

    @action(detail=True, methods=['get'], url_path='match')
    def match(self, request, pk=None):
        """Compatibility score between the requesting candidate and this job."""
        job = self.get_object()
        user = request.user
        if not (user.is_authenticated and user.is_candidate):
            return Response(
                {'detail': 'Only candidates can compute a match score.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        profile = getattr(user, 'candidate_profile', None)
        if profile is None:
            return Response({'detail': 'Candidate profile not found.'}, status=404)
        score = matching_engine.score_pair(profile, job)
        job_skills = set(job.all_skills.values_list('name', flat=True))
        candidate_skills = set(profile.skills.values_list('name', flat=True))
        return Response(
            {
                'job': job.pk,
                'score': score['score'],
                'matched_skills': score['matched_skills'],
                'criteria': score['criteria'],
            }
        )

    @action(detail=True, methods=['get'], url_path='candidates')
    def candidates(self, request, pk=None):
        """Top matching candidates for this vacancy (company/admin only)."""
        user = request.user
        if not (user.is_authenticated and (user.is_company or user.is_admin_role)):
            return Response(
                {'detail': 'Only companies and admins can view candidate matches.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        job = self.get_object()
        results = matching_engine.recommend_candidates_for_job(job, limit=20)
        return Response(CandidateMatchSerializer(results, many=True).data)


# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------
class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    filterset_class = ApplicationFilter
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), IsCandidate()]
        if self.action in ('partial_update', 'update'):
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Application.objects.select_related(
            'job__company', 'candidate__user'
        ).prefetch_related('status_history', 'job__essential_skills', 'job__desired_skills', 'candidate__skills')

        if user.is_admin_role:
            pass
        elif user.is_company:
            profile = getattr(user, 'company_profile', None)
            qs = qs.filter(job__company=profile) if profile else qs.none()
        elif user.is_candidate:
            profile = getattr(user, 'candidate_profile', None)
            qs = qs.filter(candidate=profile) if profile else qs.none()
        else:
            qs = qs.none()
        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        profile = self.request.user.candidate_profile
        serializer.save(candidate=profile)

    def _can_manage(self, application):
        user = self.request.user
        if user.is_admin_role:
            return True
        if user.is_company:
            profile = getattr(user, 'company_profile', None)
            return profile is not None and application.job.company_id == profile.id
        return False

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        if not self._can_manage(instance):
            return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ApplicationStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data['status']
        old_status = instance.status
        if new_status != old_status:
            instance.status = new_status
            instance.save(update_fields=['status', 'updated_at'])
            ApplicationStatusHistory.objects.create(
                application=instance,
                from_status=old_status,
                to_status=new_status,
                changed_by=request.user,
            )
        return Response(ApplicationSerializer(instance, context={'request': request}).data)

    def update(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)


# ---------------------------------------------------------------------------
# Matching recommendations
# ---------------------------------------------------------------------------
class RecommendedJobsView(APIView):
    """Job recommendations for the authenticated candidate, with scores."""

    permission_classes = [IsAuthenticated, IsCandidate]

    def get(self, request):
        profile = getattr(request.user, 'candidate_profile', None)
        if profile is None:
            return Response({'detail': 'Candidate profile not found.'}, status=404)
        try:
            limit = min(int(request.query_params.get('limit', 10)), 50)
        except (TypeError, ValueError):
            limit = 10
        results = matching_engine.recommend_jobs_for_candidate(profile, limit=limit)
        return Response(JobMatchSerializer(results, many=True).data)


class RecommendedCandidatesView(APIView):
    """Candidate recommendations for a vacancy (company owns it / admin)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not (user.is_company or user.is_admin_role):
            return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            job_id = int(request.query_params.get('job'))
        except (TypeError, ValueError):
            return Response({'detail': 'Query param "job" is required.'}, status=400)

        job = Job.objects.filter(pk=job_id).select_related('company').first()
        if job is None:
            return Response({'detail': 'Job not found.'}, status=404)

        if user.is_company:
            profile = getattr(user, 'company_profile', None)
            if profile is None or job.company_id != profile.id:
                return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        # Optional filters (Figma 05.1): name/skill search, minimum score and
        # origin = only candidates who actually applied to this vacancy.
        queryset = CandidateProfile.objects.select_related('user').prefetch_related(
            'skills', 'experiences', 'educations'
        )
        source = request.query_params.get('source')
        if source == 'applications':
            queryset = queryset.filter(applications__job=job).distinct()

        search = (request.query_params.get('q') or '').strip()
        if search:
            from django.db.models import Q

            queryset = queryset.filter(
                Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(user__username__icontains=search)
                | Q(headline__icontains=search)
                | Q(skills__name__icontains=search)
                | Q(bio__icontains=search)
            ).distinct()

        try:
            limit = min(int(request.query_params.get('limit', 10)), 50)
        except (TypeError, ValueError):
            limit = 10
        try:
            min_score = float(request.query_params.get('min_score') or 0)
        except (TypeError, ValueError):
            min_score = 0
        # Fetch a wider pool when filtering by score so the cutoff isn't
        # applied to an already-truncated ranking.
        pool = 50 if min_score > 0 else limit
        results = matching_engine.recommend_candidates_for_job(
            job, queryset=queryset, limit=pool
        )
        if min_score > 0:
            results = [r for r in results if r['score'] >= min_score][:limit]
        else:
            results = results[:limit]

        return Response(CandidateMatchSerializer(results, many=True).data)
