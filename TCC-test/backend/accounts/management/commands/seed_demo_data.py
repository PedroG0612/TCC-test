"""
Seed realistic demonstration data for Appliety: candidates, companies,
job openings, social posts, connections and messages.

Usage:
    python manage.py seed_demo_data

Idempotent: safe to run repeatedly — it updates/creates by natural keys and
never deletes existing data. Only accounts whose username starts with
"demo." are touched, so real user data is never overwritten.

Passwords: all seeded users share DEMO_SEED_PASSWORD from the environment.
If unset, a documented demo password is used (development only).
"""

import os
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import (
    CandidateProfile,
    CompanyProfile,
    EducationEntry,
    ExperienceEntry,
    Skill,
)
from feed.models import Post
from jobs.models import Job
from social.models import Connection, Conversation, Message
from social.models import Notification
from social.services import notify

User = get_user_model()

DEMO_PASSWORD = os.environ.get('DEMO_SEED_PASSWORD', '').strip() or 'ApplietyDemo@2024'

CANDIDATES = [
    {
        'username': 'demo.dev', 'email': 'joao.lima@appliety.demo',
        'first_name': 'João Pedro', 'last_name': 'Lima', 'city': 'São Paulo',
        'headline': 'Desenvolvedor Full Stack Pleno',
        'bio': '5 anos desenvolvendo produtos web com Python e React. Gosto de '
               'arquitetura limpa, testes e mentoria de devs juniores.',
        'education': 'Ciência da Computação — USP',
        'experience_years': 5,
        'preferred_category': 'technology',
        'preferred_work_modes': ['hybrid', 'remote'],
        'preferred_location': 'São Paulo',
        'skills': ['Python', 'JavaScript', 'React', 'Django', 'PostgreSQL', 'Docker', 'Git', 'AWS'],
        'certifications': 'AWS Certified Developer — 2023\nScrum Master PSM I — 2022',
        'experiences': [{
            'role': 'Desenvolvedor Full Stack', 'company': 'Nubank-like Fintech X',
            'start': '2021-03', 'end': '', 'is_current': True,
            'description': 'APIs em Django e interfaces em React para o app de '
                           'investimentos. Liderança técnica de squad de 4 pessoas.',
        }],
        'educations': [{
            'course': 'Ciência da Computação', 'institution': 'USP',
            'status': 'completed', 'year': 2020,
        }],
    },
    {
        'username': 'demo.data', 'email': 'mariana.costa@appliety.demo',
        'first_name': 'Mariana', 'last_name': 'Costa', 'city': 'Belo Horizonte',
        'headline': 'Analista de Dados',
        'bio': 'Transformo dados em decisões. Especialista em SQL, Python e '
               'visualização com Power BI e Tableau.',
        'education': 'Estatística — UFMG',
        'experience_years': 4,
        'preferred_category': 'technology',
        'preferred_work_modes': ['remote', 'hybrid'],
        'preferred_location': 'Remoto',
        'skills': ['Python', 'SQL', 'Excel', 'Power BI', 'Tableau', 'Estatística', 'Machine Learning'],
        'experiences': [{
            'role': 'Analista de Dados', 'company': 'Varejo Alpha',
            'start': '2022-01', 'end': '', 'is_current': True,
            'description': 'Dashboards executivos, modelos de churn e análise de '
                           'campanhas de marketing.',
        }],
        'educations': [{
            'course': 'Estatística', 'institution': 'UFMG',
            'status': 'completed', 'year': 2019,
        }],
    },
    {
        'username': 'demo.design', 'email': 'rafael.almeida@appliety.demo',
        'first_name': 'Rafael', 'last_name': 'Almeida', 'city': 'Curitiba',
        'headline': 'UX/UI Designer',
        'bio': 'Designer de produto focado em pesquisa com usuários, design '
               'systems e prototipação no Figma.',
        'education': 'Design — UTFPR',
        'experience_years': 3,
        'preferred_category': 'design',
        'preferred_work_modes': ['hybrid'],
        'preferred_location': 'Curitiba',
        'skills': ['Figma', 'UI Design', 'UX Research', 'Design Systems', 'Prototipação', 'HTML', 'CSS'],
        'experiences': [{
            'role': 'UX/UI Designer', 'company': 'Estúdio Delta',
            'start': '2022-06', 'end': '', 'is_current': True,
            'description': 'Projetos de redesign de apps fintech e e-commerce; '
                           'manutenção de design system.',
        }],
        'educations': [{
            'course': 'Design de Interfaces', 'institution': 'UTFPR',
            'status': 'completed', 'year': 2021,
        }],
    },
    {
        'username': 'demo.sec', 'email': 'beatriz.rocha@appliety.demo',
        'first_name': 'Beatriz', 'last_name': 'Rocha', 'city': 'Rio de Janeiro',
        'headline': 'Analista de Segurança da Informação',
        'bio': 'Interessada em segurança ofensiva e defensiva, SOC, pentest e '
               'conscientização de usuários.',
        'education': 'Segurança da Informação — Estácio',
        'experience_years': 2,
        'preferred_category': 'technology',
        'preferred_work_modes': ['onsite', 'hybrid'],
        'preferred_location': 'Rio de Janeiro',
        'skills': ['Segurança da Informação', 'Linux', 'Redes', 'Python', 'Pentest', 'SIEM'],
        'experiences': [{
            'role': 'Analista de SOC', 'company': 'SOC Services BR',
            'start': '2023-02', 'end': '', 'is_current': True,
            'description': 'Monitoramento de incidentes, triagem de alertas e '
                           'resposta a eventos de segurança.',
        }],
        'educations': [{
            'course': 'Segurança da Informação', 'institution': 'Estácio',
            'status': 'in_progress', 'year': 2026,
        }],
    },
    {
        'username': 'demo.mkt', 'email': 'lucas.ferreira@appliety.demo',
        'first_name': 'Lucas', 'last_name': 'Ferreira', 'city': 'São Paulo',
        'headline': 'Analista de Marketing Digital',
        'bio': 'Performance marketing, SEO e growth. Já gerenciei campanhas com '
               'ROI acima de 4x em e-commerce.',
        'education': 'Marketing — ESPM',
        'experience_years': 4,
        'preferred_category': 'marketing',
        'preferred_work_modes': ['remote', 'hybrid'],
        'preferred_location': 'São Paulo',
        'skills': ['Marketing Digital', 'SEO', 'Google Ads', 'Meta Ads', 'Analytics', 'Copywriting'],
        'experiences': [{
            'role': 'Analista de Marketing', 'company': 'E-commerce Gamma',
            'start': '2021-08', 'end': '', 'is_current': True,
            'description': 'Gestão de campanhas pagas, SEO técnico e relatórios '
                           'de performance mensal.',
        }],
        'educations': [{
            'course': 'Marketing', 'institution': 'ESPM',
            'status': 'completed', 'year': 2020,
        }],
    },
]

COMPANIES = [
    {
        'username': 'demo.fin', 'email': 'rh@bancomeridiano.demo',
        'first_name': 'Patrícia', 'last_name': 'Nunes', 'city': 'São Paulo',
        'company_name': 'Banco Meridiano',
        'legal_name': 'Banco Meridiano S.A.', 'trade_name': 'Meridiano',
        'cnpj': '45.678.901/0001-23', 'sector': 'Finanças', 'size': '201-500',
        'state': 'SP', 'website': 'https://bancomeridiano.demo',
        'description': 'Banco digital com foco em crédito e investimentos para '
                       'pessoas físicas e PMEs.',
    },
    {
        'username': 'demo.health', 'email': 'contato@vitacare.demo',
        'first_name': 'Dr. Eduardo', 'last_name': 'Salles', 'city': 'Campinas',
        'company_name': 'VitaCare Saúde',
        'legal_name': 'VitaCare Serviços Médicos Ltda.', 'trade_name': 'VitaCare',
        'cnpj': '23.456.789/0001-45', 'sector': 'Saúde', 'size': '51-200',
        'state': 'SP', 'website': 'https://vitacare.demo',
        'description': 'Rede de clínicas de atenção primária e telemedicina em '
                       'expansão nacional.',
    },
    {
        'username': 'demo.edu', 'email': 'parcerias@educatech.demo',
        'first_name': 'Camila', 'last_name': 'Braga', 'city': 'Belo Horizonte',
        'company_name': 'EducaTech',
        'legal_name': 'EducaTech Educação S.A.', 'trade_name': 'EducaTech',
        'cnpj': '67.890.123/0001-67', 'sector': 'Educação', 'size': '11-50',
        'state': 'MG', 'website': 'https://educatech.demo',
        'description': 'Plataforma de cursos online e formação continuada para '
                       'profissionais de tecnologia.',
    },
    {
        'username': 'demo.shop', 'email': 'trabalho@lojasprime.demo',
        'first_name': 'Renata', 'last_name': 'Dias', 'city': 'Curitiba',
        'company_name': 'LojaPrime E-commerce',
        'legal_name': 'LojaPrime Comércio Ltda.', 'trade_name': 'LojaPrime',
        'cnpj': '89.012.345/0001-89', 'sector': 'Varejo', 'size': '51-200',
        'state': 'PR', 'website': 'https://lojasprime.demo',
        'description': 'E-commerce de moda e casa com logística própria e mais '
                       'de 2 milhões de pedidos/ano.',
    },
]

JOBS = [
    # Banco Meridiano
    {'title': 'Desenvolvedor Backend Python Pleno', 'company': 'demo.fin',
     'description': 'Desenvolver APIs de pagamentos e Open Banking em Python/Django.',
     'requirements': 'Python, Django/DRF, PostgreSQL, testes automatizados.',
     'category': 'technology', 'location': 'São Paulo', 'work_mode': 'hybrid',
     'job_type': 'full_time', 'seniority': 'pleno', 'contract_type': 'CLT',
     'salary_min': '7000.00', 'salary_max': '10000.00',
     'essential': ['Python', 'Django', 'PostgreSQL'],
     'desired': ['Docker', 'AWS', 'Git']},
    {'title': 'Analista de Dados Jr.', 'company': 'demo.fin',
     'description': 'Apoiar o time de risco com análises e dashboards em SQL e Python.',
     'requirements': 'SQL, Excel, noções de Python. Curso superior em Exatas em andamento.',
     'category': 'technology', 'location': 'Remoto', 'work_mode': 'remote',
     'job_type': 'full_time', 'seniority': 'junior', 'contract_type': 'CLT',
     'salary_min': '3500.00', 'salary_max': '5500.00',
     'essential': ['SQL', 'Python', 'Excel'],
     'desired': ['Power BI', 'Estatística']},
    # VitaCare
    {'title': 'Enfermeiro(a) de Telemedicina', 'company': 'demo.health',
     'description': 'Atendimento remoto a pacientes em nossa plataforma de telemedicina.',
     'requirements': 'Registro no COREN, experiência em atendimento ao paciente.',
     'category': 'health', 'location': 'Campinas', 'work_mode': 'remote',
     'job_type': 'full_time', 'seniority': 'pleno', 'contract_type': 'PJ',
     'salary_min': '5000.00', 'salary_max': '8000.00',
     'essential': ['Enfermagem', 'Telemedicina'],
     'desired': ['Python']},
    {'title': 'Analista de Segurança da Informação', 'company': 'demo.health',
     'description': 'Monitorar e responder a incidentes de segurança da rede hospitalar.',
     'requirements': 'Conhecimentos em redes, Linux e SIEM. Certificações são diferenciais.',
     'category': 'technology', 'location': 'Campinas', 'work_mode': 'hybrid',
     'job_type': 'full_time', 'seniority': 'pleno', 'contract_type': 'CLT',
     'salary_min': '6500.00', 'salary_max': '9500.00',
     'essential': ['Segurança da Informação', 'Linux', 'Redes', 'SIEM'],
     'desired': ['Pentest', 'Python']},
    # EducaTech
    {'title': 'Designer Instrucional', 'company': 'demo.edu',
     'description': 'Criar cursos online de tecnologia com foco em aprendizado ativo.',
     'requirements': 'Experiência com EAD, domínio de ferramentas de autoria e Figma.',
     'category': 'education', 'location': 'Belo Horizonte', 'work_mode': 'remote',
     'job_type': 'full_time', 'seniority': 'pleno', 'contract_type': 'CLT',
     'salary_min': '5000.00', 'salary_max': '7500.00',
     'essential': ['Figma', 'EAD', 'UI Design'],
     'desired': ['Design Systems', 'UX Research']},
    {'title': 'Desenvolvedor Front-End React', 'company': 'demo.edu',
     'description': 'Evoluir a plataforma de cursos: player de vídeo, quizzes e dashboard do aluno.',
     'requirements': 'React, TypeScript, testes. Experiência com players de mídia é diferencial.',
     'category': 'technology', 'location': 'Remoto', 'work_mode': 'remote',
     'job_type': 'full_time', 'seniority': 'pleno', 'contract_type': 'CLT',
     'salary_min': '6000.00', 'salary_max': '9000.00',
     'essential': ['React', 'JavaScript', 'TypeScript', 'HTML', 'CSS'],
     'desired': ['Git', 'SQL']},
    # LojaPrime
    {'title': 'Analista de Marketing Performance', 'company': 'demo.shop',
     'description': 'Gerenciar campanhas de mídia paga e otimizar CAC nas principais plataformas.',
     'requirements': 'Google Ads, Meta Ads, Google Analytics. Cases de e-commerce são diferenciais.',
     'category': 'marketing', 'location': 'Curitiba', 'work_mode': 'hybrid',
     'job_type': 'full_time', 'seniority': 'pleno', 'contract_type': 'CLT',
     'salary_min': '4500.00', 'salary_max': '7000.00',
     'essential': ['Marketing Digital', 'Google Ads', 'Meta Ads', 'Analytics'],
     'desired': ['SEO', 'Copywriting']},
    {'title': 'Desenvolvedor Full Stack Jr.', 'company': 'demo.shop',
     'description': 'Primeiro emprego em tecnologia? Venha construir features do e-commerce.',
     'requirements': 'HTML, CSS, JavaScript e noções de React. Estudante ou recém-formado.',
     'category': 'technology', 'location': 'Curitiba', 'work_mode': 'onsite',
     'job_type': 'full_time', 'seniority': 'junior', 'contract_type': 'CLT',
     'salary_min': '3000.00', 'salary_max': '4500.00',
     'essential': ['JavaScript', 'React', 'HTML', 'CSS'],
     'desired': ['Git', 'Figma']},
    {'title': 'UX/UI Designer Pleno', 'company': 'demo.shop',
     'description': 'Liderar redesigns da jornada de compra e checkout do app.',
     'requirements': 'Portfólio de produto, Figma, design systems e pesquisa com usuários.',
     'category': 'design', 'location': 'Curitiba', 'work_mode': 'hybrid',
     'job_type': 'full_time', 'seniority': 'pleno', 'contract_type': 'CLT',
     'salary_min': '6500.00', 'salary_max': '9500.00',
     'essential': ['Figma', 'UI Design', 'UX Research', 'Design Systems'],
     'desired': ['Prototipação', 'HTML', 'CSS']},
]

POSTS = [
    ('demo.dev', 'Finalizei hoje um refactor numa API legada que estava levando 8s para responder. Agora está em 200ms. Persistência e testes fazem diferença — recomendo fortemente escrever testes antes de mexer em código crítico.'),
    ('demo.dev', 'Alguém mais usando Django + DRF + PostgreSQL em produção? Adoraria trocar experiências sobre paginação e caching.'),
    ('demo.data', 'Acabei de concluir o curso de Machine Learning da Coursera. Próximo passo: aplicar em um projeto real de segmentação de clientes.'),
    ('demo.data', 'Dica para quem está começando em dados: domine SQL antes de qualquer ferramenta de BI. 80% do trabalho é conseguir extrair a resposta certa.'),
    ('demo.design', 'Publiquei meu case de redesign do app de delivery que trabalhamos no estúdio. O foco foi reduzir o tempo de checkout em 40%. Link no portfólio!'),
    ('demo.design', 'Pesquisa com usuários não é burocracia — é o que separa um design bonito de um design que funciona. Semana que vem rola um workshop interno sobre isso.'),
    ('demo.sec', 'Alerta de segurança: nunca compartilhe tokens de API em repositórios públicos, mesmo privados depois. Já vi muita conta comprometida por isso. Use variáveis de ambiente.'),
    ('demo.sec', 'Fiz um CTF (capture the flag) no fim de semana e fiquei em 3º lugar no ranking da faculdade. Segurança ofensiva é viciante.'),
    ('demo.mkt', 'Case: campanha de Black Friday gerou R$ 2,3M em receita com CAC 32% menor que o ano anterior. Principal aprendizado: segmentação por LTV, não por idade.'),
    ('demo.mkt', 'SEO técnico ainda é a melhor fonte de tráfego orgânico de longo prazo para e-commerce. Conteúdo + autoridade de domínio = resultado composto.'),
    ('demo.company', 'A TechNova está com 3 vagas abertas para devs front-end e dados. Venha construir o futuro dos produtos digitais com a gente!'),
    ('demo.fin', 'O Banco Meridiano está contratando! Abrimos vagas para devs backend Python e analistas de dados. Candidate-se pelo feed do Appliety.'),
    ('demo.health', 'A VitaCare busca um(a) analista de segurança da informação para fortalecer nosso SOC. Ambiente híbrido em Campinas.'),
    ('demo.edu', 'Nova turma do curso de React avançado começa em janeiro na EducaTech. Vagas para monitores e desenvolvedores front-end abertas.'),
    ('demo.shop', 'Black Friday se prepara! A LojaPrime está contratando devs full stack júnior e designers UX/UI. Primeiro emprego em tecnologia? Candidate-se!'),
]

# Accepted connections among demo candidates (pairs of usernames).
CONNECTIONS = [
    ('demo.dev', 'demo.data'),
    ('demo.dev', 'demo.design'),
    ('demo.data', 'demo.mkt'),
    ('demo.design', 'demo.sec'),
    ('demo.mkt', 'demo.sec'),
    ('demo.candidate', 'demo.dev'),
]
PENDING_CONNECTIONS = [('demo.data', 'demo.design')]

MESSAGES = [
    ('demo.dev', 'demo.data', 'Oi Mariana! Vi seu post sobre o curso de ML. Como foi a experiência?'),
    ('demo.data', 'demo.dev', 'Oi João! Foi ótimo, recomendo muito. Você já aplicou nas vagas do Banco Meridiano? O match para mim foi 91%.'),
    ('demo.dev', 'demo.data', 'Ainda não, mas está na minha lista. O matching do Appliety ajudou bastante a priorizar.'),
]


def _user(username, email, first, last, role, password):
    user, created = User.objects.update_or_create(
        username=username,
        defaults={
            'email': email, 'first_name': first, 'last_name': last,
            'role': role, 'is_active': True,
            'is_staff': False, 'is_superuser': False,
        },
    )
    user.set_password(password)
    user.save()
    return user, created


def _candidate(data, password):
    user, created = _user(
        data['username'], data['email'], data['first_name'], data['last_name'],
        User.Role.CANDIDATE, password,
    )
    profile, _ = CandidateProfile.objects.update_or_create(
        user=user,
        defaults={
            'headline': data['headline'], 'bio': data['bio'],
            'education': data['education'],
            'experience_years': data['experience_years'],
            'preferred_category': data['preferred_category'],
            'preferred_work_modes': data['preferred_work_modes'],
            'preferred_location': data['preferred_location'],
            'certifications': data.get('certifications', ''),
        },
    )
    user.city = data['city']
    user.save(update_fields=['city'])
    skills = [Skill.objects.get_or_create(name=s)[0] for s in data['skills']]
    profile.skills.set(skills)
    for exp in data.get('experiences', []):
        ExperienceEntry.objects.update_or_create(
            profile=profile, role=exp['role'], company=exp['company'],
            defaults={
                'start': exp.get('start', ''), 'end': exp.get('end', ''),
                'is_current': exp.get('is_current', False),
                'description': exp.get('description', ''),
            },
        )
    for edu in data.get('educations', []):
        EducationEntry.objects.update_or_create(
            profile=profile, course=edu['course'], institution=edu['institution'],
            defaults={'status': edu.get('status', 'completed'), 'year': edu.get('year')},
        )
    return user, profile, created


def _company(data, password):
    user, created = _user(
        data['username'], data['email'], data['first_name'], data['last_name'],
        User.Role.COMPANY, password,
    )
    profile, _ = CompanyProfile.objects.update_or_create(
        user=user,
        defaults={
            'company_name': data['company_name'],
            'legal_name': data.get('legal_name', ''),
            'trade_name': data.get('trade_name', ''),
            'cnpj': data.get('cnpj', ''),
            'sector': data.get('sector', ''),
            'size': data.get('size', ''),
            'state': data.get('state', ''),
            'description': data['description'],
            'website': data.get('website', ''),
        },
    )
    user.city = data['city']
    user.save(update_fields=['city'])
    return user, profile, created


class Command(BaseCommand):
    help = 'Seed demo candidates, companies, jobs, posts, connections and messages.'

    @transaction.atomic
    def handle(self, *args, **options):
        # --- Candidates ---------------------------------------------------
        candidates = {}
        for data in CANDIDATES:
            user, profile, created = _candidate(data, DEMO_PASSWORD)
            candidates[data['username']] = user
            self.stdout.write(f"Candidate {user.username} ({'new' if created else 'updated'})")

        # --- Companies -----------------------------------------------------
        companies = {}
        for data in COMPANIES:
            user, profile, created = _company(data, DEMO_PASSWORD)
            companies[data['username']] = profile
            self.stdout.write(f"Company  {user.username} / {profile.company_name} ({'new' if created else 'updated'})")

        # demo.company may not exist yet — ensure it does via setup_demo_accounts
        # style minimal record only if missing.
        demo_company = CompanyProfile.objects.filter(
            user__username='demo.company'
        ).first()
        if demo_company is None:
            user = User.objects.filter(username='demo.company').first()
            if user is None:
                user = User.objects.create_user(
                    username='demo.company', email='empresa@appliety.demo',
                    password=DEMO_PASSWORD, role=User.Role.COMPANY,
                    first_name='Carlos', last_name='Mendes',
                )
                user.city = 'São Paulo'
                user.save(update_fields=['city'])
            demo_company, _ = CompanyProfile.objects.get_or_create(
                user=user,
                defaults={'company_name': 'TechNova Soluções', 'sector': 'Tecnologia'},
            )
        companies['demo.company'] = demo_company

        # demo.candidate for connections/posts
        demo_candidate = User.objects.filter(username='demo.candidate').first()
        if demo_candidate is None:
            demo_candidate = User.objects.create_user(
                username='demo.candidate', email='candidato@appliety.demo',
                password=DEMO_PASSWORD, role=User.Role.CANDIDATE,
                first_name='Ana', last_name='Souza',
            )
            CandidateProfile.objects.get_or_create(
                user=demo_candidate,
                defaults={'headline': 'Desenvolvedora Front-End Jr.'},
            )
        candidates['demo.candidate'] = demo_candidate

        # --- Jobs ------------------------------------------------------------
        job_count = 0
        for job_data in JOBS:
            company_profile = companies[job_data['company']]
            job, created = Job.objects.update_or_create(
                title=job_data['title'], company=company_profile,
                defaults={
                    'description': job_data['description'],
                    'requirements': job_data['requirements'],
                    'category': job_data['category'],
                    'location': job_data['location'],
                    'work_mode': job_data['work_mode'],
                    'job_type': job_data['job_type'],
                    'seniority': job_data['seniority'],
                    'contract_type': job_data.get('contract_type', ''),
                    'salary_min': job_data.get('salary_min'),
                    'salary_max': job_data.get('salary_max'),
                    'status': Job.Status.PUBLISHED,
                },
            )
            job.essential_skills.set(
                [Skill.objects.get_or_create(name=s)[0] for s in job_data['essential']]
            )
            job.desired_skills.set(
                [Skill.objects.get_or_create(name=s)[0] for s in job_data['desired']]
            )
            job_count += 1 if created else 0
        self.stdout.write(f'Jobs: {job_count} new, {len(JOBS) - job_count} existing')

        # --- Posts -------------------------------------------------------------
        now = timezone.now()
        post_count = 0
        for i, (username, text) in enumerate(POSTS):
            author = candidates.get(username) or User.objects.filter(username=username).first()
            if author is None:
                continue
            post, created = Post.objects.get_or_create(author=author, text=text)
            if created:
                # auto_now_add overrides the default; stagger manually.
                Post.objects.filter(pk=post.pk).update(
                    created_at=now - timedelta(days=len(POSTS) - i, hours=i % 5)
                )
                post_count += 1
        self.stdout.write(f'Posts: {post_count} new, {len(POSTS) - post_count} existing')

        # --- Connections -------------------------------------------------------
        conn_count = 0
        for a, b in CONNECTIONS:
            ua, ub = candidates.get(a), candidates.get(b)
            if not ua or not ub:
                continue
            _, created = Connection.objects.get_or_create(
                requester=ua, addressee=ub,
                defaults={'status': Connection.Status.ACCEPTED},
            )
            conn_count += int(created)
        for a, b in PENDING_CONNECTIONS:
            ua, ub = candidates.get(a), candidates.get(b)
            if not ua or not ub:
                continue
            Connection.objects.get_or_create(
                requester=ua, addressee=ub,
                defaults={'status': Connection.Status.PENDING},
            )
        self.stdout.write(f'Connections ensured: {conn_count} new accepted')

        # --- Messages ----------------------------------------------------------
        msg_count = 0
        for sender_name, recipient_name, text in MESSAGES:
            sender = candidates.get(sender_name)
            recipient = candidates.get(recipient_name)
            if not sender or not recipient:
                continue
            conv = Conversation.objects.filter(participants=sender).filter(
                participants=recipient
            ).first()
            if conv is None:
                conv = Conversation.objects.create()
                conv.participants.add(sender, recipient)
            _, created = Message.objects.get_or_create(
                conversation=conv, sender=sender, text=text,
            )
            msg_count += int(created)
        self.stdout.write(f'Messages: {msg_count} new')

        # --- A couple of historical notifications ------------------------------
        ana = candidates.get('demo.candidate')
        dev = candidates.get('demo.dev')
        if (
            ana and dev
            and not Notification.objects.filter(
                recipient=ana, actor=dev,
                type=Notification.Type.POST_CREATED,
            ).exists()
        ):
            notify(
                ana, dev, Notification.Type.POST_CREATED,
                f'{dev.get_full_name() or dev.username} publicou uma nova atualização.',
                link='/home',
            )

        self.stdout.write(self.style.SUCCESS('Demo data ready.'))
        self.stdout.write('  Password for all demo.* accounts: DEMO_SEED_PASSWORD env')
        self.stdout.write('  (default documented demo password if unset)')
