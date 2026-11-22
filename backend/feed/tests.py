from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import CandidateProfile, CompanyProfile
from feed.models import Post, PostComment, PostLike

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


class FeedTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.candidate = make_user(User.Role.CANDIDATE, 'cand')
        self.company = make_user(User.Role.COMPANY, 'co')

    def auth(self, user):
        self.client.force_authenticate(user)

    def test_create_post_requires_auth(self):
        resp = self.client.post('/api/feed/posts/', {'text': 'oi'})
        self.assertEqual(resp.status_code, 401)
        self.assertEqual(Post.objects.count(), 0)

    def test_create_and_list_post(self):
        self.auth(self.candidate)
        resp = self.client.post('/api/feed/posts/', {'text': 'Primeira publicação!'})
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['author']['username'], 'cand')
        self.assertEqual(resp.data['author']['profile_url'], '/u/cand')
        self.assertFalse(resp.data['has_liked'])
        self.assertTrue(resp.data['is_own'])

        resp = self.client.get('/api/feed/posts/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data['results']), 1)
        self.assertEqual(resp.data['results'][0]['text'], 'Primeira publicação!')

    def test_create_post_rejects_empty(self):
        self.auth(self.candidate)
        resp = self.client.post('/api/feed/posts/', {'text': '   '})
        self.assertEqual(resp.status_code, 400)

    def test_like_toggle(self):
        self.auth(self.candidate)
        post = Post.objects.create(author=self.candidate, text='post')
        self.client.post(f'/api/feed/posts/{post.id}/like/')
        post.refresh_from_db()
        self.assertEqual(post.likes.count(), 1)
        # Unlike
        self.client.post(f'/api/feed/posts/{post.id}/like/')
        self.assertEqual(PostLike.objects.count(), 0)

    def test_comment_flow(self):
        self.auth(self.company)
        post = Post.objects.create(author=self.candidate, text='post')
        resp = self.client.post(f'/api/feed/posts/{post.id}/comments/', {'text': 'Ótimo!'})
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['author']['username'], 'co')
        resp = self.client.get(f'/api/feed/posts/{post.id}/comments/')
        self.assertEqual(len(resp.data), 1)

    def test_ordering_by_likes(self):
        self.auth(self.candidate)
        p1 = Post.objects.create(author=self.candidate, text='old')
        p2 = Post.objects.create(author=self.candidate, text='popular')
        PostLike.objects.create(post=p2, user=self.company)
        resp = self.client.get('/api/feed/posts/', {'ordering': '-like_count,-created_at'})
        texts = [r['text'] for r in resp.data['results']]
        self.assertEqual(texts[0], 'popular')
        self.assertIn('old', texts)

    def test_delete_own_post_only(self):
        self.auth(self.candidate)
        post = Post.objects.create(author=self.candidate, text='mine')
        other = Post.objects.create(author=self.company, text='theirs')

        self.auth(self.company)
        resp = self.client.delete(f'/api/feed/posts/{post.id}/')
        self.assertEqual(resp.status_code, 403)

        self.auth(self.candidate)
        resp = self.client.delete(f'/api/feed/posts/{post.id}/')
        self.assertEqual(resp.status_code, 204)
        self.assertTrue(Post.objects.filter(id=other.id).exists())

    def test_public_profile_endpoint(self):
        resp = self.client.get('/api/public-profiles/cand/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['role'], 'candidate')
        self.assertEqual(resp.data['profile']['headline'], 'Dev')
        self.assertNotIn('email', resp.data)

    def test_public_profile_company_includes_jobs(self):
        resp = self.client.get('/api/public-profiles/co/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['role'], 'company')
        self.assertIn('jobs', resp.data)
