from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import CandidateProfile, CompanyProfile, Skill
from jobs.models import Application, ApplicationStatusHistory, Job

User = get_user_model()


def make_user(role, username, password='testpass123'):
    user = User.objects.create_user(
        username=username, email=f'{username}@test.com', password=password, role=role
    )
    if role == User.Role.CANDIDATE:
        CandidateProfile.objects.create(user=user, headline='Dev', bio='Python dev')
    elif role == User.Role.COMPANY:
        CompanyProfile.objects.create(user=user, company_name=f'{username} Inc')
    return user


class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.candidate = make_user(User.Role.CANDIDATE, 'cand')

    def test_register_candidate(self):
        resp = self.client.post('/api/auth/register/', {
            'username': 'newcand', 'email': 'n@t.com', 'password': 'Xk9#mQ2vL8pR',
            'password_confirm': 'Xk9#mQ2vL8pR', 'role': 'candidate',
        })
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['user']['role'], 'candidate')
        self.assertTrue(User.objects.filter(username='newcand').exists())
        self.assertTrue(
            CandidateProfile.objects.filter(user__username='newcand').exists()
        )

    def test_register_company(self):
        resp = self.client.post('/api/auth/register/', {
            'username': 'newco', 'email': 'c@t.com', 'password': 'Xk9#mQ2vL8pR',
            'password_confirm': 'Xk9#mQ2vL8pR', 'role': 'company',
            'company_name': 'NewCo',
        })
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(
            CompanyProfile.objects.filter(user__username='newco', company_name='NewCo').exists()
        )

    def test_register_admin_forbidden(self):
        resp = self.client.post('/api/auth/register/', {
            'username': 'hacker', 'email': 'h@t.com', 'password': 'Xk9#mQ2vL8pR',
            'password_confirm': 'Xk9#mQ2vL8pR', 'role': 'admin',
        })
        self.assertEqual(resp.status_code, 400)
        self.assertFalse(User.objects.filter(username='hacker').exists())

    def test_register_password_mismatch(self):
        resp = self.client.post('/api/auth/register/', {
            'username': 'x', 'email': 'x@t.com', 'password': 'Xk9#mQ2vL8pR',
            'password_confirm': 'different', 'role': 'candidate',
        })
        self.assertEqual(resp.status_code, 400)

    def test_login_and_me(self):
        resp = self.client.post('/api/auth/login/', {
            'username': 'cand', 'password': 'testpass123',
        })
        self.assertEqual(resp.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {resp.data['token']}")
        me = self.client.get('/api/auth/me/')
        self.assertEqual(me.data['username'], 'cand')
        self.assertIn('candidate_profile', me.data)

    def test_login_wrong_password(self):
        resp = self.client.post('/api/auth/login/', {
            'username': 'cand', 'password': 'wrong',
        })
        self.assertEqual(resp.status_code, 401)

    def test_logout(self):
        resp = self.client.post('/api/auth/login/', {
            'username': 'cand', 'password': 'testpass123',
        })
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {resp.data['token']}")
        self.assertEqual(self.client.post('/api/auth/logout/').status_code, 204)
        self.assertEqual(self.client.get('/api/auth/me/').status_code, 401)

    def test_password_change(self):
        resp = self.client.post('/api/auth/login/', {
            'username': 'cand', 'password': 'testpass123',
        })
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {resp.data['token']}")
        resp = self.client.post('/api/auth/password/change/', {
            'current_password': 'testpass123', 'new_password': 'newpass456',
        })
        self.assertEqual(resp.status_code, 200)
        self.candidate.refresh_from_db()
        self.assertTrue(self.candidate.check_password('newpass456'))


class JobTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.candidate = make_user(User.Role.CANDIDATE, 'cand')
        self.company_user = make_user(User.Role.COMPANY, 'co')
        self.admin = make_user(User.Role.ADMIN, 'adm')
        self.company = self.company_user.company_profile
        self.job = Job.objects.create(
            company=self.company, title='Python Dev', description='Build APIs',
            requirements='Python, DRF', location='SP', status=Job.Status.PUBLISHED,
        )
        self.draft = Job.objects.create(
            company=self.company, title='Draft Job', description='x',
            requirements='', location='SP', status=Job.Status.DRAFT,
        )

    def auth(self, user):
        resp = self.client.post('/api/auth/login/', {
            'username': user.username, 'password': 'testpass123',
        })
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {resp.data['token']}")

    def test_public_sees_only_published(self):
        resp = self.client.get('/api/jobs/')
        titles = [j['title'] for j in resp.data['results']]
        self.assertIn('Python Dev', titles)
        self.assertNotIn('Draft Job', titles)

    def test_company_sees_own_drafts(self):
        self.auth(self.company_user)
        resp = self.client.get('/api/jobs/')
        titles = [j['title'] for j in resp.data['results']]
        self.assertIn('Draft Job', titles)

    def test_company_creates_job(self):
        self.auth(self.company_user)
        resp = self.client.post('/api/jobs/', {
            'title': 'New Job', 'description': 'desc', 'requirements': 'reqs',
            'location': 'RJ', 'status': 'published',
        })
        self.assertEqual(resp.status_code, 201)
        job = Job.objects.get(title='New Job')
        self.assertEqual(job.company, self.company)

    def test_candidate_cannot_create_job(self):
        self.auth(self.candidate)
        resp = self.client.post('/api/jobs/', {
            'title': 'Nope', 'description': 'd', 'requirements': '',
            'location': 'X',
        })
        self.assertIn(resp.status_code, (403, 400))

    def test_company_cannot_edit_other_company_job(self):
        other = make_user(User.Role.COMPANY, 'co2')
        foreign = Job.objects.create(
            company=other.company_profile, title='Foreign', description='d',
            requirements='', location='X', status=Job.Status.PUBLISHED,
        )
        self.auth(self.company_user)
        resp = self.client.patch(f'/api/jobs/{foreign.id}/', {'title': 'Hijacked'})
        self.assertEqual(resp.status_code, 404)

    def test_candidate_cannot_edit_published_job(self):
        self.auth(self.candidate)
        resp = self.client.patch(f'/api/jobs/{self.job.id}/', {'title': 'Hijacked'})
        self.assertEqual(resp.status_code, 403)
        resp = self.client.delete(f'/api/jobs/{self.job.id}/')
        self.assertEqual(resp.status_code, 403)

    def test_job_filter_search(self):
        resp = self.client.get('/api/jobs/?q=python')
        self.assertEqual(resp.data['count'], 1)
        resp = self.client.get('/api/jobs/?category=technology')
        self.assertEqual(resp.data['count'], 0)  # default category 'other'


class ApplicationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.candidate = make_user(User.Role.CANDIDATE, 'cand')
        self.candidate_profile = self.candidate.candidate_profile
        self.company_user = make_user(User.Role.COMPANY, 'co')
        self.company = self.company_user.company_profile
        self.job = Job.objects.create(
            company=self.company, title='Job', description='d',
            requirements='', location='SP', status=Job.Status.PUBLISHED,
        )

    def auth(self, user, password='testpass123'):
        resp = self.client.post('/api/auth/login/', {
            'username': user.username, 'password': password,
        })
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {resp.data['token']}")

    def test_candidate_applies(self):
        self.auth(self.candidate)
        resp = self.client.post('/api/applications/', {
            'job': self.job.id, 'cover_letter': 'Hello',
        })
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['candidate'], self.candidate_profile.id)

    def test_duplicate_application_rejected(self):
        Application.objects.create(job=self.job, candidate=self.candidate_profile)
        self.auth(self.candidate)
        resp = self.client.post('/api/applications/', {'job': self.job.id})
        self.assertEqual(resp.status_code, 400)

    def test_company_updates_status_with_history(self):
        app = Application.objects.create(job=self.job, candidate=self.candidate_profile)
        self.auth(self.company_user)
        resp = self.client.patch(f'/api/applications/{app.id}/', {'status': 'shortlisted'})
        self.assertEqual(resp.status_code, 200)
        app.refresh_from_db()
        self.assertEqual(app.status, 'shortlisted')
        self.assertTrue(
            ApplicationStatusHistory.objects.filter(
                application=app, to_status='shortlisted', changed_by=self.company_user
            ).exists()
        )

    def test_candidate_cannot_change_status(self):
        app = Application.objects.create(job=self.job, candidate=self.candidate_profile)
        self.auth(self.candidate)
        resp = self.client.patch(f'/api/applications/{app.id}/', {'status': 'hired'})
        self.assertEqual(resp.status_code, 403)
        app.refresh_from_db()
        self.assertEqual(app.status, 'applied')

    def test_candidate_sees_only_own_applications(self):
        other = make_user(User.Role.CANDIDATE, 'cand2')
        Application.objects.create(
            job=self.job, candidate=other.candidate_profile
        )
        mine = Application.objects.create(job=self.job, candidate=self.candidate_profile)
        self.auth(self.candidate)
        resp = self.client.get('/api/applications/')
        ids = [a['id'] for a in resp.data['results']]
        self.assertEqual(ids, [mine.id])

    def test_company_sees_applications_for_own_jobs(self):
        app = Application.objects.create(job=self.job, candidate=self.candidate_profile)
        self.auth(self.company_user)
        resp = self.client.get('/api/applications/')
        self.assertEqual(resp.data['count'], 1)
        self.assertEqual(resp.data['results'][0]['candidate_name'], 'cand')


class MatchingTests(TestCase):
    def setUp(self):
        self.candidate = make_user(User.Role.CANDIDATE, 'cand')
        profile = self.candidate.candidate_profile
        profile.bio = 'Expert Python developer with Django and REST APIs.'
        profile.education = 'Computer Science'
        profile.experience_years = 3
        profile.save()
        python = Skill.objects.create(name='Python')
        django = Skill.objects.create(name='Django')
        profile.skills.set([python, django])

        self.company_user = make_user(User.Role.COMPANY, 'co')
        self.company = self.company_user.company_profile
        self.job = Job.objects.create(
            company=self.company, title='Senior Python Developer',
            description='Build Django REST APIs with Python.',
            requirements='Python, Django, PostgreSQL', location='SP',
            status=Job.Status.PUBLISHED,
        )
        self.job.skills.set([python, django])

    def test_score_pair_high_for_relevant(self):
        from matching.engine import score_pair

        score = score_pair(self.candidate.candidate_profile, self.job)
        self.assertGreater(score, 30)

    def test_recommend_jobs_endpoint(self):
        client = APIClient()
        resp = client.post('/api/auth/login/', {
            'username': 'cand', 'password': 'testpass123',
        })
        client.credentials(HTTP_AUTHORIZATION=f"Token {resp.data['token']}")
        resp = client.get('/api/matching/jobs/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]['job']['title'], 'Senior Python Developer')
        self.assertIn('Python', resp.data[0]['matched_skills'])

    def test_recommend_candidates_requires_company(self):
        client = APIClient()
        resp = client.post('/api/auth/login/', {
            'username': 'cand', 'password': 'testpass123',
        })
        client.credentials(HTTP_AUTHORIZATION=f"Token {resp.data['token']}")
        resp = client.get(f'/api/matching/candidates/?job={self.job.id}')
        self.assertEqual(resp.status_code, 403)


class ReportsTests(TestCase):
    def setUp(self):
        self.candidate = make_user(User.Role.CANDIDATE, 'cand')
        self.company_user = make_user(User.Role.COMPANY, 'co')
        self.admin = make_user(User.Role.ADMIN, 'adm')
        self.job = Job.objects.create(
            company=self.company_user.company_profile, title='Job',
            description='d', requirements='', location='SP',
            status=Job.Status.PUBLISHED, category=Job.Category.TECHNOLOGY,
        )
        Application.objects.create(
            job=self.job, candidate=self.candidate.candidate_profile
        )

    def auth(self, user):
        client = APIClient()
        resp = client.post('/api/auth/login/', {
            'username': user.username, 'password': 'testpass123',
        })
        client.credentials(HTTP_AUTHORIZATION=f"Token {resp.data['token']}")
        return client

    def test_overview_admin_only(self):
        client = self.auth(self.admin)
        resp = client.get('/api/reports/overview/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['totals']['applications'], 1)
        self.assertEqual(resp.data['totals']['jobs'], 1)

        client = self.auth(self.candidate)
        resp = client.get('/api/reports/overview/')
        self.assertEqual(resp.status_code, 403)

    def test_company_stats(self):
        client = self.auth(self.company_user)
        resp = client.get('/api/reports/company/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['totals']['applications'], 1)

    def test_export_xlsx(self):
        client = self.auth(self.company_user)
        resp = client.get('/api/reports/export/?dataset=applications&export_format=xlsx')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('spreadsheetml', resp['Content-Type'])

    def test_export_pdf(self):
        client = self.auth(self.company_user)
        resp = client.get('/api/reports/export/?dataset=jobs&export_format=pdf')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp['Content-Type'], 'application/pdf')

    def test_candidate_cannot_export(self):
        client = self.auth(self.candidate)
        resp = client.get('/api/reports/export/?dataset=applications')
        self.assertEqual(resp.status_code, 403)
