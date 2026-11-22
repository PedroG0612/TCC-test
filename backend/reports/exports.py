"""Export helpers: applications/jobs tables to Excel (.xlsx) and PDF."""

from io import BytesIO

from openpyxl import Workbook
from openpyxl.styles import Font
from openpyxl.utils import get_column_letter


def _xlsx_response(filename, headers, rows):
    wb = Workbook()
    ws = wb.active
    ws.title = 'Report'
    ws.append(headers)
    for cell in ws[1]:
        cell.font = Font(bold=True)
    for row in rows:
        ws.append(row)
    for idx, header in enumerate(headers, start=1):
        width = max(len(str(header)) + 2, 12)
        ws.column_dimensions[get_column_letter(idx)].width = width
    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    from django.http import HttpResponse

    response = HttpResponse(
        buffer.read(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


def _pdf_response(filename, title, headers, rows):
    from django.http import HttpResponse
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))
    styles = getSampleStyleSheet()
    elements = [Paragraph(title, styles['Title']), Spacer(1, 12)]

    table_data = [headers] + [[str(cell) for cell in row] for row in rows]
    table = Table(table_data, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1f7a4d')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.25, colors.grey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f2f7f4')]),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]
        )
    )
    elements.append(table)
    doc.build(elements)
    buffer.seek(0)

    response = HttpResponse(buffer.read(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


def export_table(filename_base, title, headers, rows, fmt):
    """Dispatch to Excel or PDF export."""
    if fmt == 'pdf':
        return _pdf_response(f'{filename_base}.pdf', title, headers, rows)
    return _xlsx_response(f'{filename_base}.xlsx', headers, rows)


def applications_rows(applications):
    headers = [
        'Application ID', 'Candidate', 'Email', 'Job', 'Company',
        'Status', 'Applied at',
    ]
    rows = [
        [
            app.id,
            app.candidate.user.get_full_name() or app.candidate.user.username,
            app.candidate.user.email,
            app.job.title,
            app.job.company.company_name,
            app.get_status_display(),
            app.created_at.strftime('%Y-%m-%d %H:%M'),
        ]
        for app in applications.select_related(
            'candidate__user', 'job__company'
        ).order_by('-created_at')
    ]
    return headers, rows


def jobs_rows(jobs):
    headers = [
        'ID', 'Title', 'Company', 'Category', 'Location', 'Work mode',
        'Job type', 'Status', 'Applications', 'Created at',
    ]
    rows = [
        [
            job.id,
            job.title,
            job.company.company_name,
            job.get_category_display(),
            job.location,
            job.get_work_mode_display(),
            job.get_job_type_display(),
            job.get_status_display(),
            job.applications.count(),
            job.created_at.strftime('%Y-%m-%d'),
        ]
        for job in jobs.select_related('company').order_by('-created_at')
    ]
    return headers, rows


def overview_rows(stats):
    headers = ['Metric', 'Value']
    rows = [[key.replace('_', ' ').title(), value] for key, value in stats['totals'].items()]
    return headers, rows
