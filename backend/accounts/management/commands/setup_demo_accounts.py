"""
Create demonstration accounts and seed data for Appliety.

Usage:
    python manage.py setup_demo_accounts

Passwords are read from the environment (DEMO_CANDIDATE_PASSWORD,
DEMO_COMPANY_PASSWORD, DEMO_ADMIN_PASSWORD) or prompted interactively with
hidden input. The command is idempotent: running it again updates the demo
records instead of duplicating them.

The admin account is created here directly — public registration never
creates administrators (see api.serializers.RegisterSerializer).
"""

import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import (
    CandidateProfile,
    CompanyProfile,
    EducationEntry,
    ExperienceEntry,
    Skill,
)
from jobs.models import Application, Job

User = get_user_model()

DEMO_DATA = {
    'candidate': {
        'username': 'demo.candidate',
        'email': 'candidato@appliety.demo',
        'first_name': 'Ana',
        'last_name': 'Souza',
        'role': User.Role.CANDIDATE,
        'password_env': 'DEMO_CANDIDATE_PASSWORD',
        'profile': {
            'headline': 'Desenvolvedora Front-End Jr.',
            'bio': 'Recém-formada em Sistemas de Informação, apaixonada por React, '
                   'acessibilidade e interfaces modernas. Busco uma oportunidade '
                   'para crescer como desenvolvedora.',
            'education': 'Tecnólogo em Sistemas de Informação — Universidade X',
            'experience_years': 1,
            'skills': ['Python', 'JavaScript', 'React', 'HTML', 'CSS', 'Git', 'Figma', 'SQL'],
            'preferred_category': 'technology',
            'preferred_work_modes': ['hybrid', 'remote'],
            'preferred_location': 'São Paulo',
            'city': 'São Paulo',
            'experiences': [{
                'role': 'Estagiária de Desenvolvimento',
                'company': 'Agência Web XYZ',
                'start': '2024-02', 'end': '', 'is_current': False,
                'description': 'Implementação de landing pages e correção de bugs '
                               'em React.',
            }],
            'educations': [{
                'course': 'Sistemas de Informação',
                'institution': 'Universidade X',
                'status': 'in_progress', 'year': 2026,
            }],
        },
    },
    'company': {
        'username': 'demo.company',
        'email': 'empresa@appliety.demo',
        'first_name': 'Carlos',
        'last_name': 'Mendes',
        'role': User.Role.COMPANY,
        'password_env': 'DEMO_COMPANY_PASSWORD',
        'profile': {
            'company_name': 'TechNova Soluções',
            'legal_name': 'TechNova Soluções Ltda.',
            'trade_name': 'TechNova',
            'cnpj': '12.345.678/0001-90',
            'sector': 'Tecnologia',
            'size': '11-50',
            'state': 'SP',
            'description': 'Startup de tecnologia focada em produtos digitais '
                           'para pequenas e médias empresas.',
            'website': 'https://technova.demo',
            'city': 'São Paulo',
        },
    },
    'admin': {
        'username': 'demo.admin',
        'email': 'admin@appliety.demo',
        'first_name': 'Admin',
        'last_name': 'Appliety',
        'role': User.Role.ADMIN,
        'password_env': 'DEMO_ADMIN_PASSWORD',
        'is_staff': True,
        'is_superuser': True,
    },
}

DEMO_JOBS = [
    {
        'title': 'Desenvolvedor Front-End Jr.',
        'description': 'Vaga para desenvolvedor front-end júnior em nosso time de '
                       'produto. Você vai atuar com React, TypeScript e Tailwind CSS '
                       'construindo interfaces modernas.',
        'requirements': 'Conhecimento em HTML, CSS, JavaScript e React. Noções de '
                        'Git e Figma são diferenciais. Facilidade para trabalho '
                        'em equipe.',
        'category': Job.Category.TECHNOLOGY,
        'location': 'São Paulo',
        'work_mode': Job.WorkMode.HYBRID,
        'job_type': Job.JobType.FULL_TIME,
        'seniority': Job.Seniority.JUNIOR,
        'contract_type': 'CLT',
        'responsibilities': 'Desenvolver interfaces web com React e TypeScript; '
                            'participar de code reviews; colaborar com design.',
        'salary_min': '3500.00',
        'salary_max': '5000.00',
        'essential_skills': ['JavaScript', 'React', 'HTML', 'CSS'],
        'desired_skills': ['Git', 'Figma', 'TypeScript'],
        'status': Job.Status.PUBLISHED,
    },
    {
        'title': 'Estágio em Ciência de Dados',
        'description': 'Estágio na área de dados para apoiar análises e dashboards '
                       'comerciais usando Python e SQL.',
        'requirements': 'Cursando cursos de Exatas. Conhecimento básico de Python '
                        'e SQL. Interesse em análise de dados.',
        'category': Job.Category.TECHNOLOGY,
        'location': 'Remoto',
        'work_mode': Job.WorkMode.REMOTE,
        'job_type': Job.JobType.INTERNSHIP,
        'seniority': Job.Seniority.JUNIOR,
        'contract_type': 'Estágio',
        'responsibilities': 'Apoiar análises e dashboards comerciais; limpar e '
                            'organizar bases de dados; documentar aprendizados.',
        'salary_min': '1500.00',
        'salary_max': '2200.00',
        'essential_skills': ['Python', 'SQL'],
        'desired_skills': ['Excel'],
        'status': Job.Status.PUBLISHED,
    },
    {
        'title': 'Designer de Produto Pleno',
        'description': 'Buscamos designer de produto para liderar projetos de UX/UI '
                       'em nossos aplicativos mobile e web.',
        'requirements': 'Portfólio com projetos de produto. Domínio de Figma, '
                        'design systems e pesquisa com usuários.',
        'category': Job.Category.DESIGN,
        'location': 'São Paulo',
        'work_mode': Job.WorkMode.HYBRID,
        'job_type': Job.JobType.FULL_TIME,
        'seniority': Job.Seniority.PLENO,
        'contract_type': 'CLT',
        'responsibilities': 'Liderar projetos de UX/UI em aplicativos; manter '
                            'design system; conduzir pesquisas com usuários.',
        'salary_min': '6000.00',
        'salary_max': '9000.00',
        'essential_skills': ['Figma', 'UI Design', 'UX Research'],
        'desired_skills': ['Design Systems'],
        'status': Job.Status.PUBLISHED,
    },
]


class Command(BaseCommand):
    help = 'Create demo candidate, company and admin accounts plus seed data.'

    def _get_password(self, env_name, username):
        password = os.environ.get(env_name, '').strip()
        if password:
            return password
        import getpass

        password = getpass.getpass(f'Password for {username}: ')
        confirm = getpass.getpass('Confirm password: ')
        if password != confirm:
            raise ValueError('Passwords do not match.')
        return password

    @transaction.atomic
    def handle(self, *args, **options):
        passwords = {}
        for key, data in DEMO_DATA.items():
            password = self._get_password(data['password_env'], data['username'])
            if len(password) < 8:
                raise ValueError(f'Password for {data["username"]} must be at least 8 characters.')
            passwords[key] = password

        users = {}
        profiles = {}

        # --- Candidate -----------------------------------------------------
        data = DEMO_DATA['candidate']
        user, created = User.objects.update_or_create(
            username=data['username'],
            defaults={
                'email': data['email'],
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'role': data['role'],
                'is_active': True,
                'is_staff': False,
                'is_superuser': False,
            },
        )
        if created or not user.has_usable_password():
            user.set_password(passwords['candidate'])
        else:
            user.set_password(passwords['candidate'])
        user.save()
        profile = user.candidate_profile if hasattr(user, 'candidate_profile') else None
        if profile is None:
            profile = CandidateProfile(user=user)
        p = data['profile']
        profile.headline = p['headline']
        profile.bio = p['bio']
        profile.education = p['education']
        profile.experience_years = p['experience_years']
        profile.preferred_category = p.get('preferred_category', '')
        profile.preferred_work_modes = p.get('preferred_work_modes', [])
        profile.preferred_location = p.get('preferred_location', '')
        profile.save()
        profile.user.city = p['city']
        profile.user.save(update_fields=['city'])
        for exp in p.get('experiences', []):
            ExperienceEntry.objects.update_or_create(
                profile=profile, role=exp['role'], company=exp['company'],
                defaults={
                    'start': exp.get('start', ''), 'end': exp.get('end', ''),
                    'is_current': exp.get('is_current', False),
                    'description': exp.get('description', ''),
                },
            )
        for edu in p.get('educations', []):
            EducationEntry.objects.update_or_create(
                profile=profile, course=edu['course'],
                institution=edu['institution'],
                defaults={'status': edu.get('status', 'completed'),
                          'year': edu.get('year')},
            )
        users['candidate'], profiles['candidate'] = user, profile
        self.stdout.write(f'Candidate: {user.username} ({"created" if created else "updated"})')

        # --- Company -------------------------------------------------------
        data = DEMO_DATA['company']
        user, created = User.objects.update_or_create(
            username=data['username'],
            defaults={
                'email': data['email'],
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'role': data['role'],
                'is_active': True,
                'is_staff': False,
                'is_superuser': False,
            },
        )
        user.set_password(passwords['company'])
        user.save()
        profile = getattr(user, 'company_profile', None)
        if profile is None:
            profile = CompanyProfile(user=user)
        p = data['profile']
        profile.company_name = p['company_name']
        profile.legal_name = p.get('legal_name', '')
        profile.trade_name = p.get('trade_name', '')
        profile.cnpj = p.get('cnpj', '')
        profile.sector = p.get('sector', '')
        profile.size = p.get('size', '')
        profile.state = p.get('state', '')
        profile.description = p['description']
        profile.website = p['website']
        profile.save()
        profile.user.city = p['city']
        profile.user.save(update_fields=['city'])
        users['company'], profiles['company'] = user, profile
        self.stdout.write(f'Company:   {user.username} / {profile.company_name} ({"created" if created else "updated"})')

        # --- Admin ---------------------------------------------------------
        data = DEMO_DATA['admin']
        user, created = User.objects.update_or_create(
            username=data['username'],
            defaults={
                'email': data['email'],
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'role': data['role'],
                'is_active': True,
                'is_staff': data.get('is_staff', True),
                'is_superuser': data.get('is_superuser', True),
            },
        )
        user.set_password(passwords['admin'])
        user.save()
        users['admin'] = user
        self.stdout.write(f'Admin:     {user.username} ({"created" if created else "updated"})')

        # --- Skills --------------------------------------------------------
        skill_names = sorted(
            {s for job in DEMO_JOBS for s in job['essential_skills'] + job['desired_skills']}
            | set(DEMO_DATA['candidate']['profile']['skills'])
        )
        skill_map = {}
        for name in skill_names:
            skill, _ = Skill.objects.get_or_create(name=name)
            skill_map[name] = skill
        profiles['candidate'].skills.set(skill_map.values())

        # --- Jobs ----------------------------------------------------------
        for job_data in DEMO_JOBS:
            job, job_created = Job.objects.update_or_create(
                title=job_data['title'],
                company=profiles['company'],
                defaults={
                    k: v for k, v in job_data.items()
                    if k not in ('essential_skills', 'desired_skills')
                },
            )
            job.essential_skills.set(
                [skill_map[s] for s in job_data['essential_skills']]
            )
            job.desired_skills.set(
                [skill_map[s] for s in job_data['desired_skills']]
            )
            self.stdout.write(f'Job:      {job.title} ({"created" if job_created else "updated"})')

        # --- One demo application ------------------------------------------
        front_end_job = Job.objects.filter(
            title='Desenvolvedor Front-End Jr.', company=profiles['company']
        ).first()
        if front_end_job and not Application.objects.filter(
            job=front_end_job, candidate=profiles['candidate']
        ).exists():
            Application.objects.create(
                job=front_end_job,
                candidate=profiles['candidate'],
                cover_letter='Tenho interesse na vaga e gostaria de apresentar '
                             'meu portfólio de projetos com React.',
            )
            self.stdout.write('Application: demo candidate -> Front-End Jr. vacancy')

        self.stdout.write(self.style.SUCCESS('Demo accounts ready.'))
        self.stdout.write('  Candidate: demo.candidate')
        self.stdout.write('  Company:   demo.company')
        self.stdout.write('  Admin:     demo.admin')
