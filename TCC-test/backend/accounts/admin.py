from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import CandidateProfile, CompanyProfile, Skill, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Appliety', {'fields': ('role', 'phone', 'city')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Appliety', {'fields': ('role', 'phone', 'city')}),
    )


@admin.register(CandidateProfile)
class CandidateProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'headline', 'experience_years')
    filter_horizontal = ('skills',)
    search_fields = ('user__username', 'user__email', 'headline')


@admin.register(CompanyProfile)
class CompanyProfileAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'user', 'website')
    search_fields = ('company_name', 'user__username', 'user__email')


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)
