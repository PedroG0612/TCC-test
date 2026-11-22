from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import CandidateProfile, CompanyProfile
from social.models import Connection, Conversation, Message, Notification

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


class SocialTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cand_a = make_user(User.Role.CANDIDATE, 'alice')
        self.cand_b = make_user(User.Role.CANDIDATE, 'bob')
        self.company = make_user(User.Role.COMPANY, 'co')

    def auth(self, user):
        self.client.force_authenticate(user)

    # ---------------- Connections -------------------------------------
    def test_connection_request_flow(self):
        self.auth(self.cand_a)
        resp = self.client.post('/api/connections/', {'username': 'bob'})
        self.assertEqual(resp.status_code, 201)
        conn_id = resp.data['id']
        # Notification created for bob
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.cand_b,
                type=Notification.Type.CONNECTION_REQUEST,
            ).exists()
        )
        # Duplicate request blocked
        resp = self.client.post('/api/connections/', {'username': 'bob'})
        self.assertEqual(resp.status_code, 400)
        # Status check
        resp = self.client.get('/api/connections/status/', {'username': 'bob'})
        self.assertEqual(resp.data['state'], 'outgoing')
        # Bob sees incoming
        self.auth(self.cand_b)
        resp = self.client.get('/api/connections/status/', {'username': 'alice'})
        self.assertEqual(resp.data['state'], 'incoming')
        # Accept
        resp = self.client.post(f'/api/connections/{conn_id}/accept/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['status'], 'accepted')
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.cand_a,
                type=Notification.Type.CONNECTION_ACCEPTED,
            ).exists()
        )

    def test_connection_reject_and_permissions(self):
        self.auth(self.cand_a)
        conn = Connection.objects.create(requester=self.cand_a, addressee=self.cand_b)
        # Requester cannot accept own request
        resp = self.client.post(f'/api/connections/{conn.id}/accept/')
        self.assertEqual(resp.status_code, 403)
        # Addressee rejects
        self.auth(self.cand_b)
        resp = self.client.post(f'/api/connections/{conn.id}/reject/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['status'], 'rejected')

    def test_company_cannot_connect(self):
        self.auth(self.company)
        resp = self.client.post('/api/connections/', {'username': 'alice'})
        self.assertEqual(resp.status_code, 403)

    def test_connection_list_states(self):
        Connection.objects.create(requester=self.cand_a, addressee=self.cand_b)
        self.auth(self.cand_b)
        resp = self.client.get('/api/connections/')
        self.assertEqual(len(resp.data['incoming']), 1)
        self.assertEqual(resp.data['incoming'][0]['requester']['username'], 'alice')

    # ---------------- Messaging ----------------------------------------
    def _connect(self):
        Connection.objects.create(
            requester=self.cand_a, addressee=self.cand_b,
            status=Connection.Status.ACCEPTED,
        )

    def test_message_requires_connection(self):
        self.auth(self.cand_a)
        resp = self.client.post('/api/conversations/', {'username': 'bob'})
        self.assertEqual(resp.status_code, 403)

    def test_message_flow_and_permissions(self):
        self._connect()
        self.auth(self.cand_a)
        resp = self.client.post('/api/conversations/', {'username': 'bob'})
        self.assertEqual(resp.status_code, 201)
        conv_id = resp.data['id']
        resp = self.client.post(
            f'/api/conversations/{conv_id}/messages/', {'text': 'Oi Bob!'}
        )
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.cand_b,
                type=Notification.Type.MESSAGE_RECEIVED,
            ).exists()
        )
        # Bob reads messages
        self.auth(self.cand_b)
        resp = self.client.get(f'/api/conversations/{conv_id}/messages/')
        self.assertEqual(len(resp.data), 1)
        # Third party cannot access
        self.auth(self.company)
        resp = self.client.get(f'/api/conversations/{conv_id}/messages/')
        self.assertEqual(resp.status_code, 404)
        # Unread count on conversation list
        self.auth(self.cand_b)
        resp = self.client.get('/api/conversations/')
        self.assertEqual(resp.data[0]['unread_count'], 1)
        # Mark read
        self.client.post(f'/api/conversations/{conv_id}/read/')
        resp = self.client.get('/api/conversations/')
        self.assertEqual(resp.data[0]['unread_count'], 0)

    # ---------------- Notifications --------------------------------------
    def test_notifications_list_and_read(self):
        Notification.objects.create(
            recipient=self.cand_a, actor=self.cand_b,
            type=Notification.Type.CONNECTION_REQUEST, text='req',
        )
        self.auth(self.cand_a)
        resp = self.client.get('/api/notifications/')
        self.assertEqual(resp.data['unread_count'], 1)
        nid = resp.data['results'][0]['id']
        self.client.post(f'/api/notifications/{nid}/read/')
        resp = self.client.get('/api/notifications/')
        self.assertEqual(resp.data['unread_count'], 0)
        # Other user cannot read it
        self.auth(self.cand_b)
        resp = self.client.post(f'/api/notifications/{nid}/read/')
        self.assertEqual(resp.status_code, 404)

    def test_post_notifies_connections(self):
        from feed.models import Post
        self._connect()
        self.auth(self.cand_a)
        self.client.post('/api/feed/posts/', {'text': 'Novo post'})
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.cand_b,
                type=Notification.Type.POST_CREATED,
            ).exists()
        )
