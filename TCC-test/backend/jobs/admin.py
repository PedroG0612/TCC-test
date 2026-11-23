from django.contrib import admin

from .models import Application, ApplicationStatusHistory, Job


class ApplicationStatusHistoryInline(admin.TabularInline):
    model = ApplicationStatusHistory
    extra = 0
    readonly_fields = ('from_status', 'to_status', 'changed_by', 'created_at')


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'company', 'category', 'location', 'status', 'created_at')
    list_filter = ('status', 'category', 'work_mode', 'job_type')
    search_fields = ('title', 'company__company_name', 'location')
    filter_horizontal = ('essential_skills', 'desired_skills')
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('job', 'candidate', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('job__title', 'candidate__user__username', 'candidate__user__email')
    inlines = [ApplicationStatusHistoryInline]
