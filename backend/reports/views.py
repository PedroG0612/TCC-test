from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import CompanyProfile
from api.permissions import IsAdminRole, IsCompany
from jobs.models import Application, Job

from . import exports, services


class PlatformOverviewView(APIView):
    """Admin-only platform statistics."""

    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        return Response(services.platform_overview())


class CompanyStatsView(APIView):
    """Statistics for the authenticated company (admins can pass ?company=<id>)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        company_id = request.query_params.get('company')
        if request.user.is_admin_role and company_id:
            company = CompanyProfile.objects.filter(pk=company_id).first()
        elif request.user.is_company:
            company = getattr(request.user, 'company_profile', None)
        else:
            return Response({'detail': 'Forbidden.'}, status=403)

        if company is None:
            return Response({'detail': 'Company profile not found.'}, status=404)
        return Response(services.company_stats(company))


class ReportExportView(APIView):
    """
    Export report data as Excel (.xlsx) or PDF.

    Query params:
      dataset       = applications | jobs | overview   (default: applications)
      export_format = xlsx | pdf                        (default: xlsx)
      ('format' is reserved by DRF content negotiation, so we use export_format.)
    Admins can export platform-wide data; companies export only their own.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        dataset = request.query_params.get('dataset', 'applications')
        fmt = request.query_params.get('export_format', 'xlsx')
        if fmt not in ('xlsx', 'pdf'):
            return Response({'detail': "format must be 'xlsx' or 'pdf'."}, status=400)

        if request.user.is_admin_role:
            applications = Application.objects.all()
            jobs = Job.objects.all()
        elif request.user.is_company:
            company = getattr(request.user, 'company_profile', None)
            if company is None:
                return Response({'detail': 'Company profile not found.'}, status=404)
            applications = Application.objects.filter(job__company=company)
            jobs = Job.objects.filter(company=company)
        else:
            return Response({'detail': 'Forbidden.'}, status=403)

        if dataset == 'applications':
            headers, rows = exports.applications_rows(applications)
            title = 'Appliety — Applications Report'
            filename = 'appliety_applications'
        elif dataset == 'jobs':
            headers, rows = exports.jobs_rows(jobs)
            title = 'Appliety — Jobs Report'
            filename = 'appliety_jobs'
        elif dataset == 'overview':
            if not request.user.is_admin_role:
                return Response({'detail': 'Overview export is admin-only.'}, status=403)
            headers, rows = exports.overview_rows(services.platform_overview())
            title = 'Appliety — Platform Overview'
            filename = 'appliety_overview'
        else:
            return Response(
                {'detail': "dataset must be 'applications', 'jobs' or 'overview'."},
                status=400,
            )

        return exports.export_table(filename, title, headers, rows, fmt)
