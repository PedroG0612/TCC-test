from django.urls import path

from .views import CompanyStatsView, PlatformOverviewView, ReportExportView

urlpatterns = [
    path('overview/', PlatformOverviewView.as_view(), name='reports-overview'),
    path('company/', CompanyStatsView.as_view(), name='reports-company'),
    path('export/', ReportExportView.as_view(), name='reports-export'),
]
