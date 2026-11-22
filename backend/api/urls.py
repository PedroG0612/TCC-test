from django.urls import include, path
from rest_framework.routers import DefaultRouter

from api.views import (
    ApplicationViewSet,
    EducationEntryViewSet,
    ExperienceEntryViewSet,
    JobViewSet,
    LoginView,
    LogoutView,
    MeView,
    PasswordChangeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RecommendedCandidatesView,
    RecommendedJobsView,
    RegisterView,
    SkillViewSet,
    UserViewSet,
)
from reports.urls import urlpatterns as report_urls

router = DefaultRouter()
router.register('users', UserViewSet, basename='user')
router.register('skills', SkillViewSet, basename='skill')
router.register('jobs', JobViewSet, basename='job')
router.register('applications', ApplicationViewSet, basename='application')
router.register('experiences', ExperienceEntryViewSet, basename='experience')
router.register('education', EducationEntryViewSet, basename='education')

urlpatterns = [
    # Authentication & profile
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/me/', MeView.as_view(), name='auth-me'),
    path('auth/password/change/', PasswordChangeView.as_view(), name='auth-password-change'),
    path('auth/password/reset/', PasswordResetRequestView.as_view(), name='auth-password-reset'),
    path('auth/password/reset/confirm/', PasswordResetConfirmView.as_view(), name='auth-password-reset-confirm'),

    # Matching recommendations
    path('matching/jobs/', RecommendedJobsView.as_view(), name='matching-jobs'),
    path('matching/candidates/', RecommendedCandidatesView.as_view(), name='matching-candidates'),

    # Reports
    path('reports/', include(report_urls)),

    # Viewsets
    path('', include(router.urls)),
]
