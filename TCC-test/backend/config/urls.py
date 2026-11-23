from django.conf import settings
from django.contrib import admin
from django.http import Http404
from django.urls import include, path, re_path
from django.views.static import serve as media_serve
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView


def serve_media(request, path):
    if (
        not (settings.DEBUG or getattr(settings, 'SERVE_MEDIA', False))
        or getattr(settings, 'USE_S3_MEDIA', False)
        or settings.MEDIA_URL.startswith(('http://', 'https://'))
    ):
        raise Http404()
    return media_serve(request, path, document_root=settings.MEDIA_ROOT)


urlpatterns = [
    path('admin/', admin.site.urls),

    # REST API
    path('api/', include('api.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if not settings.MEDIA_URL.startswith(('http://', 'https://')):
    media_prefix = settings.MEDIA_URL.lstrip('/')
    urlpatterns += [
        re_path(rf'^{media_prefix}(?P<path>.*)$', serve_media),
    ]
