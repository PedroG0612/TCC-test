from django.urls import include, path
from rest_framework.routers import DefaultRouter

from social.views import (
    ConnectionStatusView,
    ConnectionSuggestionsView,
    ConnectionViewSet,
    ConversationViewSet,
    NotificationViewSet,
)

router = DefaultRouter()
router.register('connections', ConnectionViewSet, basename='connection')
router.register('conversations', ConversationViewSet, basename='conversation')
router.register('notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('connections/status/', ConnectionStatusView.as_view(), name='connection-status'),
    path('connections/suggestions/', ConnectionSuggestionsView.as_view(), name='connection-suggestions'),
    path('', include(router.urls)),
]
