import django_filters

from .models import Application, Job


class JobFilter(django_filters.FilterSet):
    q = django_filters.CharFilter(method='search_all', label='Search')
    category = django_filters.ChoiceFilter(choices=Job.Category.choices)
    work_mode = django_filters.ChoiceFilter(choices=Job.WorkMode.choices)
    job_type = django_filters.ChoiceFilter(choices=Job.JobType.choices)
    status = django_filters.ChoiceFilter(choices=Job.Status.choices)
    location = django_filters.CharFilter(lookup_expr='icontains')
    company = django_filters.NumberFilter(field_name='company__id')
    salary_min = django_filters.NumberFilter(field_name='salary_min', lookup_expr='gte')
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='date__gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='date__lte')

    class Meta:
        model = Job
        fields = [
            'q', 'category', 'work_mode', 'job_type', 'status',
            'location', 'company', 'salary_min', 'created_after', 'created_before',
        ]

    @staticmethod
    def search_all(queryset, name, value):
        from django.db.models import Q

        return queryset.filter(
            Q(title__icontains=value)
            | Q(description__icontains=value)
            | Q(requirements__icontains=value)
            | Q(location__icontains=value)
            | Q(company__company_name__icontains=value)
            | Q(skills__name__icontains=value)
        ).distinct()


class ApplicationFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=Application.Status.choices)
    job = django_filters.NumberFilter(field_name='job__id')
    candidate = django_filters.NumberFilter(field_name='candidate__id')
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='date__gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='date__lte')

    class Meta:
        model = Application
        fields = ['status', 'job', 'candidate', 'created_after', 'created_before']
