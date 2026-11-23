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

    def test_login_with_email(self):
        resp = self.client.post('/api/auth/login/', {
            'email': 'cand@test.com', 'password': 'testpass123',
        })
        self.assertEqual(resp.status_code, 200)
        self.assertIn('token', resp.data)

    def test_password_reset_request_and_confirm(self):
        resp = self.client.post('/api/auth/password/reset/', {'email': 'cand@test.com'})
        self.assertEqual(resp.status_code, 200)
        # Unknown e-mails get the same response (no enumeration).
        resp = self.client.post('/api/auth/password/reset/', {'email': 'nobody@x.com'})
        self.assertEqual(resp.status_code, 200)

        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        uid = urlsafe_base64_encode(force_bytes(self.candidate.pk))
        token = default_token_generator.make_token(self.candidate)
        resp = self.client.post('/api/auth/password/reset/confirm/', {
            'uid': uid, 'token': token, 'new_password': 'newpass999',
        })
        self.assertEqual(resp.status_code, 200)
        self.candidate.refresh_from_db()
        self.assertTrue(self.candidate.check_password('newpass999'))

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
        resp = self.client.patch(f'/api/applications/{app.id}/', {'status': 'under_review'})
        self.assertEqual(resp.status_code, 200)
        app.refresh_from_db()
        self.assertEqual(app.status, 'under_review')
        self.assertTrue(
            ApplicationStatusHistory.objects.filter(
                application=app, to_status='under_review', changed_by=self.company_user
            ).exists()
        )
        # Status history is exposed for the candidate timeline.
        detail = self.client.get(f'/api/applications/{app.id}/')
        self.assertIn('status_history', detail.data)

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
        self.job.essential_skills.set([python, django])
        self.job.desired_skills.set([Skill.objects.create(name='PostgreSQL')])

    def test_score_pair_high_for_relevant(self):
        from matching.engine import score_pair

        score = score_pair(self.candidate.candidate_profile, self.job)
        self.assertGreater(score['score'], 50)
        self.assertIn('essential', score['criteria'])
        self.assertIn('Python', score['matched_skills'])

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

    def test_recommend_candidates_filters(self):
        client = APIClient()
        resp = client.post('/api/auth/login/', {
            'username': 'co', 'password': 'testpass123',
        })
        client.credentials(HTTP_AUTHORIZATION=f"Token {resp.data['token']}")
        # min_score above the actual score returns nobody
        resp = client.get(f'/api/matching/candidates/?job={self.job.id}&min_score=99')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 0)
        # text search excludes non-matching candidates
        resp = client.get(f'/api/matching/candidates/?job={self.job.id}&q=zzzznomatch')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 0)
        resp = client.get(f'/api/matching/candidates/?job={self.job.id}&q=python')
        self.assertEqual(len(resp.data), 1)


class CandidateEntryTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.candidate = make_user(User.Role.CANDIDATE, 'cand')
        self.company_user = make_user(User.Role.COMPANY, 'co')
        resp = self.client.post('/api/auth/login/', {
            'username': 'cand', 'password': 'testpass123',
        })
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {resp.data['token']}")

    def test_experience_crud(self):
        resp = self.client.post('/api/experiences/', {
            'role': 'Dev Jr', 'company': 'Startup X', 'start': '2024-01',
            'is_current': True, 'description': 'Built React pages',
        })
        self.assertEqual(resp.status_code, 201)
        exp_id = resp.data['id']
        resp = self.client.patch(f'/api/experiences/{exp_id}/', {'role': 'Dev Pleno'})
        self.assertEqual(resp.status_code, 200)
        resp = self.client.get('/api/experiences/')
        self.assertEqual(resp.data['count'], 1)
        self.assertEqual(resp.data['results'][0]['role'], 'Dev Pleno')

    def test_education_crud(self):
        resp = self.client.post('/api/education/', {
            'course': 'Análise de Sistemas', 'institution': 'Faculdade Y',
            'status': 'in_progress', 'year': 2027,
        })
        self.assertEqual(resp.status_code, 201)
        resp = self.client.get('/api/education/')
        self.assertEqual(resp.data['results'][0]['course'], 'Análise de Sistemas')

    def test_company_cannot_access_entries(self):
        client = APIClient()
        resp = client.post('/api/auth/login/', {
            'username': 'co', 'password': 'testpass123',
        })
        client.credentials(HTTP_AUTHORIZATION=f"Token {resp.data['token']}")
        self.assertEqual(client.get('/api/experiences/').status_code, 403)

    def test_entries_isolated_per_candidate(self):
        other = make_user(User.Role.CANDIDATE, 'cand2')
        other.candidate_profile.experiences.create(role='Other', company='Z')
        resp = self.client.get('/api/experiences/')
        self.assertEqual(resp.data['count'], 0)


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


class SavedJobTests(TestCase):
    def setUp(self):
        self.candidate = make_user(User.Role.CANDIDATE, 'saver')
        self.other = make_user(User.Role.CANDIDATE, 'other')
        company_user = make_user(User.Role.COMPANY, 'jobco')
        self.job = Job.objects.create(
            company=company_user.company_profile, title='Dev',
            description='desc', location='SP',
            status=Job.Status.PUBLISHED,
        )
        self.client = APIClient()
        resp = self.client.post('/api/auth/login/', {
            'username': 'saver', 'password': 'testpass123',
        })
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {resp.data['token']}")

    def test_save_and_unsave_toggle(self):
        resp = self.client.post('/api/saved-jobs/', {'job': self.job.id}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.data['saved'])

        resp = self.client.post('/api/saved-jobs/', {'job': self.job.id}, format='json')
        self.assertFalse(resp.data['saved'])

        resp = self.client.get('/api/saved-jobs/')
        self.assertEqual(resp.data, [])

    def test_list_saved_jobs(self):
        self.client.post('/api/saved-jobs/', {'job': self.job.id}, format='json')
        resp = self.client.get('/api/saved-jobs/')
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]['title'], 'Dev')
        self.assertTrue(resp.data[0]['is_saved'])

    def test_is_saved_flag_on_job_list(self):
        self.client.post('/api/saved-jobs/', {'job': self.job.id}, format='json')
        resp = self.client.get('/api/jobs/')
        self.assertTrue(resp.data['results'][0]['is_saved'])

    def test_saved_jobs_are_private(self):
        self.client.post('/api/saved-jobs/', {'job': self.job.id}, format='json')
        other = APIClient()
        resp = other.post('/api/auth/login/', {
            'username': 'other', 'password': 'testpass123',
        })
        other.credentials(HTTP_AUTHORIZATION=f"Token {resp.data['token']}")
        self.assertEqual(other.get('/api/saved-jobs/').data, [])


def make_test_image_bytes(fmt='PNG', size=(120, 120), color=(34, 139, 230)):
    import io
    from PIL import Image

    buf = io.BytesIO()
    mode = 'RGBA' if fmt in ('PNG', 'WEBP') else 'RGB'
    img = Image.new(mode, size, color)
    img.save(buf, format=fmt)
    return buf.getvalue()


class ProfilePictureUploadTests(TestCase):
    def setUp(self):
        import tempfile

        self.tmp_media = tempfile.mkdtemp()
        self.override = self.settings(MEDIA_ROOT=self.tmp_media, SERVE_MEDIA=True)
        self.override.enable()

        self.candidate = make_user(User.Role.CANDIDATE, 'photocand')
        self.company = make_user(User.Role.COMPANY, 'photoco')
        self.other_candidate = make_user(User.Role.CANDIDATE, 'othercand')
        self.admin = make_user(User.Role.ADMIN, 'photoadmin')

        self.job = Job.objects.create(
            company=self.company.company_profile,
            title='Backend Engineer',
            description='Django',
            location='SP',
            status=Job.Status.PUBLISHED,
        )

    def tearDown(self):
        import shutil

        self.override.disable()
        shutil.rmtree(self.tmp_media, ignore_errors=True)

    def auth_client(self, username, password='testpass123'):
        client = APIClient()
        resp = client.post('/api/auth/login/', {'username': username, 'password': password})
        self.assertEqual(resp.status_code, 200)
        client.credentials(HTTP_AUTHORIZATION=f"Token {resp.data['token']}")
        return client

    def test_candidate_upload_update_preserve_and_relogin_persistence(self):
        from pathlib import Path
        from django.core.files.uploadedfile import SimpleUploadedFile

        client = self.auth_client('photocand')

        # 1. Upload candidate profile photo via multipart/form-data
        img1 = SimpleUploadedFile('avatar.png', make_test_image_bytes('PNG'), content_type='image/png')
        resp = client.patch('/api/auth/me/', {'photo': img1}, format='multipart')
        self.assertEqual(resp.status_code, 200)
        photo_url_1 = resp.data['candidate_profile']['photo_url']
        self.assertIsNotNone(photo_url_1)
        self.assertTrue(photo_url_1.startswith('/media/photos/'))
        self.assertNotIn('avatar.png', photo_url_1)  # randomized UUID filename

        self.candidate.candidate_profile.refresh_from_db()
        stored_name_1 = self.candidate.candidate_profile.photo.name
        self.assertTrue((Path(self.tmp_media) / stored_name_1).exists())

        # Verify served over HTTP /media/...
        media_resp = client.get(photo_url_1)
        self.assertEqual(media_resp.status_code, 200)

        # 2. Updating other fields without uploading a new photo preserves existing photo
        resp = client.patch('/api/auth/me/', {'headline': 'Senior Python Dev'}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['candidate_profile']['headline'], 'Senior Python Dev')
        self.assertEqual(resp.data['candidate_profile']['photo_url'], photo_url_1)

        # Passing photo=None explicitly also preserves existing photo
        resp = client.patch('/api/auth/me/', {'city': 'Campinas', 'photo': None}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['candidate_profile']['photo_url'], photo_url_1)

        # 3. Updating to a new photo replaces old file and updates URL
        img2 = SimpleUploadedFile('new_photo.jpg', make_test_image_bytes('JPEG'), content_type='image/jpeg')
        resp = client.patch('/api/auth/me/', {'photo': img2}, format='multipart')
        self.assertEqual(resp.status_code, 200)
        photo_url_2 = resp.data['candidate_profile']['photo_url']
        self.assertNotEqual(photo_url_1, photo_url_2)
        self.assertFalse((Path(self.tmp_media) / stored_name_1).exists())

        # 4. Persistence on simulated page refresh (/auth/me/) & logout -> login
        me_resp = client.get('/api/auth/me/')
        self.assertEqual(me_resp.status_code, 200)
        self.assertEqual(me_resp.data['candidate_profile']['photo_url'], photo_url_2)

        self.assertEqual(client.post('/api/auth/logout/').status_code, 204)
        relogin_client = self.auth_client('photocand')
        self.assertEqual(
            relogin_client.get('/api/auth/me/').data['candidate_profile']['photo_url'],
            photo_url_2,
        )

        # 5. Public profile, feed post, and comment display updated picture
        pub = relogin_client.get('/api/public-profiles/photocand/')
        self.assertEqual(pub.status_code, 200)
        self.assertEqual(pub.data['profile']['photo_url'], photo_url_2)

        post_resp = relogin_client.post('/api/feed/posts/', {'text': 'Hello feed!'}, format='multipart')
        self.assertEqual(post_resp.status_code, 201)
        self.assertEqual(post_resp.data['author']['avatar_url'], photo_url_2)

        comment_resp = relogin_client.post(
            f"/api/feed/posts/{post_resp.data['id']}/comments/",
            {'text': 'Nice post'},
            format='json',
        )
        self.assertEqual(comment_resp.status_code, 201)
        self.assertEqual(comment_resp.data['author']['avatar_url'], photo_url_2)

    def test_company_logo_upload_update_and_job_public_display(self):
        from pathlib import Path
        from django.core.files.uploadedfile import SimpleUploadedFile

        client = self.auth_client('photoco')
        logo1 = SimpleUploadedFile('brand.webp', make_test_image_bytes('WEBP'), content_type='image/webp')
        resp = client.patch('/api/auth/me/', {'logo': logo1}, format='multipart')
        self.assertEqual(resp.status_code, 200)
        logo_url_1 = resp.data['company_profile']['logo_url']
        self.assertIsNotNone(logo_url_1)
        self.assertTrue(logo_url_1.startswith('/media/logos/'))

        self.company.company_profile.refresh_from_db()
        stored_logo_1 = self.company.company_profile.logo.name
        self.assertTrue((Path(self.tmp_media) / stored_logo_1).exists())
        self.assertEqual(client.get(logo_url_1).status_code, 200)

        # Preserve logo when updating company text fields
        resp = client.patch('/api/auth/me/', {'sector': 'Tecnologia'}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['company_profile']['logo_url'], logo_url_1)

        # Public profile & job listing display company logo
        pub = client.get('/api/public-profiles/photoco/')
        self.assertEqual(pub.status_code, 200)
        self.assertEqual(pub.data['profile']['logo_url'], logo_url_1)

        jobs_resp = client.get('/api/jobs/')
        self.assertEqual(jobs_resp.status_code, 200)
        self.assertEqual(jobs_resp.data['results'][0]['company_logo'], logo_url_1)

        # Replace logo cleanly
        logo2 = SimpleUploadedFile('brand2.png', make_test_image_bytes('PNG'), content_type='image/png')
        resp = client.patch('/api/auth/me/', {'logo': logo2}, format='multipart')
        self.assertEqual(resp.status_code, 200)
        self.assertNotEqual(resp.data['company_profile']['logo_url'], logo_url_1)
        self.assertFalse((Path(self.tmp_media) / stored_logo_1).exists())

    def test_invalid_file_uploads_rejected(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        client = self.auth_client('photocand')

        # 1. Text/HTML disguised with .png extension
        fake_png = SimpleUploadedFile('evil.png', b'<html><script>alert(1)</script></html>', content_type='image/png')
        resp = client.patch('/api/auth/me/', {'photo': fake_png}, format='multipart')
        self.assertEqual(resp.status_code, 400)
        self.assertIn('photo', resp.data)

        # 2. SVG disguised as .png or .svg
        svg_bytes = b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
        fake_svg = SimpleUploadedFile('vector.png', svg_bytes, content_type='image/png')
        resp = client.patch('/api/auth/me/', {'photo': fake_svg}, format='multipart')
        self.assertEqual(resp.status_code, 400)

        # 3. Corrupt binary payload
        corrupt = SimpleUploadedFile('broken.jpg', b'\xff\xd8\xff\xe0not-a-valid-jpeg', content_type='image/jpeg')
        resp = client.patch('/api/auth/me/', {'photo': corrupt}, format='multipart')
        self.assertEqual(resp.status_code, 400)

        # 4. Oversized file (> 5 MB)
        oversized = SimpleUploadedFile('huge.png', b'\x89PNG\r\n\x1a\n' + b'0' * (5 * 1024 * 1024 + 100), content_type='image/png')
        resp = client.patch('/api/auth/me/', {'photo': oversized}, format='multipart')
        self.assertEqual(resp.status_code, 400)
        self.assertIn('photo', resp.data)

    def test_upload_authorization_and_storage_separation(self):
        from pathlib import Path
        from django.conf import settings
        from django.core.files.uploadedfile import SimpleUploadedFile

        # Unauthenticated cannot upload
        anon = APIClient()
        img = SimpleUploadedFile('a.png', make_test_image_bytes('PNG'), content_type='image/png')
        self.assertEqual(anon.patch('/api/auth/me/', {'photo': img}, format='multipart').status_code, 401)

        # Cross-role field upload rejected
        cand_client = self.auth_client('photocand')
        co_img = SimpleUploadedFile('co.png', make_test_image_bytes('PNG'), content_type='image/png')
        self.assertEqual(cand_client.patch('/api/auth/me/', {'logo': co_img}, format='multipart').status_code, 400)

        co_client = self.auth_client('photoco')
        cand_img = SimpleUploadedFile('c.png', make_test_image_bytes('PNG'), content_type='image/png')
        self.assertEqual(co_client.patch('/api/auth/me/', {'photo': cand_img}, format='multipart').status_code, 400)

        # User cannot mutate another user's profile via /auth/me/ or /users/<id>/
        target_img = SimpleUploadedFile('hijack.png', make_test_image_bytes('PNG'), content_type='image/png')
        cand_client.patch(
            '/api/auth/me/',
            {'photo': target_img, 'id': self.other_candidate.id, 'username': 'othercand'},
            format='multipart',
        )
        self.other_candidate.candidate_profile.refresh_from_db()
        self.assertFalse(bool(self.other_candidate.candidate_profile.photo))

        resp = cand_client.patch(
            f'/api/users/{self.other_candidate.id}/',
            {'first_name': 'Hacked'},
            format='json',
        )
        self.assertEqual(resp.status_code, 403)

        # Storage paths: MEDIA_ROOT is separate from STATIC_ROOT and outside frontend/
        media_root = Path(settings.MEDIA_ROOT).resolve()
        static_root = Path(settings.STATIC_ROOT).resolve()
        frontend_dir = (Path(settings.BASE_DIR).parent / 'frontend').resolve()
        self.assertNotEqual(media_root, static_root)
        self.assertNotIn(frontend_dir, [media_root, *media_root.parents])

        # Path traversal protection on /media/
        self.assertIn(anon.get('/media/../.env').status_code, (400, 404))

