from django.contrib.auth import get_user_model
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from social.models import Connection, Conversation, Message, Notification
from social.serializers import (
    ConnectionSerializer,
    ConversationSerializer,
    MessageSerializer,
    NotificationSerializer,
)
from social.services import connection_state, notify

User = get_user_model()


def _candidate_or_404(username):
    return get_object_or_404(
        User, username=username, is_active=True, role=User.Role.CANDIDATE
    )


# ---------------------------------------------------------------------------
# Connections (candidate <-> candidate)
# ---------------------------------------------------------------------------
class ConnectionViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        user = request.user
        accepted = Connection.objects.filter(status=Connection.Status.ACCEPTED).filter(
            Q(requester=user) | Q(addressee=user)
        ).select_related('requester', 'addressee')
        incoming = Connection.objects.filter(
            addressee=user, status=Connection.Status.PENDING
        ).select_related('requester')
        outgoing = Connection.objects.filter(
            requester=user, status=Connection.Status.PENDING
        ).select_related('addressee')
        return Response({
            'accepted': ConnectionSerializer(accepted, many=True, context={'request': request}).data,
            'incoming': ConnectionSerializer(incoming, many=True, context={'request': request}).data,
            'outgoing': ConnectionSerializer(outgoing, many=True, context={'request': request}).data,
        })

    def create(self, request):
        """Send a connection request: {username} or {user_id}."""
        user = request.user
        if not user.is_candidate:
            return Response({'detail': 'Only candidates can connect.'}, status=403)
        target = self._resolve_target(request.data)
        if target is None:
            return Response({'detail': 'User not found.'}, status=404)
        if target.pk == user.pk:
            return Response({'detail': 'You cannot connect to yourself.'}, status=400)
        if not target.is_candidate:
            return Response({'detail': 'Only candidate accounts can connect.'}, status=400)
        existing = Connection.objects.filter(
            Q(requester=user, addressee=target) | Q(requester=target, addressee=user)
        ).first()
        if existing:
            if existing.status == Connection.Status.ACCEPTED:
                return Response({'detail': 'Already connected.'}, status=400)
            if existing.status == Connection.Status.PENDING:
                return Response({'detail': 'A connection request already exists.'}, status=400)
            # Rejected -> allow a fresh request by resetting the pair.
            existing.requester, existing.addressee = user, target
            existing.status = Connection.Status.PENDING
            existing.save()
            conn = existing
        else:
            conn = Connection.objects.create(requester=user, addressee=target)
        name = user.get_full_name() or user.username
        notify(
            target, user, Notification.Type.CONNECTION_REQUEST,
            f'{name} enviou uma solicitação de conexão.',
            link=f'/u/{user.username}',
        )
        return Response(
            ConnectionSerializer(conn, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    @staticmethod
    def _resolve_target(data):
        username = (data.get('username') or '').strip()
        if username:
            return User.objects.filter(username=username, is_active=True).first()
        user_id = data.get('user_id')
        if user_id:
            return User.objects.filter(pk=user_id, is_active=True).first()
        return None

    def _get_connection(self, request, pk):
        return get_object_or_404(
            Connection.objects.select_related('requester', 'addressee'), pk=pk
        )

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        conn = self._get_connection(request, pk)
        if conn.addressee_id != request.user.id:
            return Response({'detail': 'Only the recipient can accept.'}, status=403)
        if conn.status != Connection.Status.PENDING:
            return Response({'detail': 'Request is not pending.'}, status=400)
        conn.status = Connection.Status.ACCEPTED
        conn.save(update_fields=['status', 'updated_at'])
        name = request.user.get_full_name() or request.user.username
        notify(
            conn.requester, request.user, Notification.Type.CONNECTION_ACCEPTED,
            f'{name} aceitou sua solicitação de conexão.',
            link=f'/u/{request.user.username}',
        )
        return Response(ConnectionSerializer(conn, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        conn = self._get_connection(request, pk)
        if conn.addressee_id != request.user.id:
            return Response({'detail': 'Only the recipient can reject.'}, status=403)
        if conn.status != Connection.Status.PENDING:
            return Response({'detail': 'Request is not pending.'}, status=400)
        conn.status = Connection.Status.REJECTED
        conn.save(update_fields=['status', 'updated_at'])
        return Response(ConnectionSerializer(conn, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        conn = self._get_connection(request, pk)
        if conn.requester_id != request.user.id:
            return Response({'detail': 'Only the sender can cancel.'}, status=403)
        if conn.status != Connection.Status.PENDING:
            return Response({'detail': 'Only pending requests can be cancelled.'}, status=400)
        conn.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ConnectionStatusView(APIView):
    """Relationship state between the requester and ?username=<candidate>."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        username = request.query_params.get('username', '')
        other = User.objects.filter(username=username, is_active=True).first()
        if other is None:
            return Response({'detail': 'User not found.'}, status=404)
        state = connection_state(request.user, other)
        connection_id = None
        if state in ('incoming', 'outgoing'):
            conn = Connection.objects.filter(
                Q(requester=request.user, addressee=other)
                | Q(requester=other, addressee=request.user)
            ).first()
            connection_id = conn.id if conn else None
        return Response({'state': state, 'connection_id': connection_id})


class ConnectionSuggestionsView(APIView):
    """Candidate suggestions: other candidates without a pending/accepted link."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.is_candidate:
            return Response({'detail': 'Only candidates.'}, status=403)
        others = User.objects.filter(
            role=User.Role.CANDIDATE, is_active=True
        ).exclude(pk=user.pk).select_related('candidate_profile')[:50]
        linked_ids = set(
            Connection.objects.filter(
                Q(requester=user) | Q(addressee=user),
                status__in=[Connection.Status.PENDING, Connection.Status.ACCEPTED],
            ).values_list('requester_id', flat=True)
        ) | set(
            Connection.objects.filter(
                Q(requester=user) | Q(addressee=user),
                status__in=[Connection.Status.PENDING, Connection.Status.ACCEPTED],
            ).values_list('addressee_id', flat=True)
        )
        from feed.serializers import author_summary

        results = [
            author_summary(u) for u in others if u.pk not in linked_ids
        ][:12]
        return Response(results)


# ---------------------------------------------------------------------------
# Conversations & messages (connected candidates only)
# ---------------------------------------------------------------------------
class ConversationViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def _get_conversation(self, request, pk):
        return get_object_or_404(
            Conversation.objects.filter(participants=request.user)
            .prefetch_related('messages__sender'),
            pk=pk,
        )

    def _is_connected(self, user, other):
        return Connection.objects.filter(
            status=Connection.Status.ACCEPTED
        ).filter(Q(requester=user, addressee=other) | Q(requester=other, addressee=user)).exists()

    def list(self, request):
        qs = (
            Conversation.objects.filter(participants=request.user)
            .prefetch_related('messages__sender', 'participants')
            .order_by('-updated_at')
        )
        return Response(
            ConversationSerializer(qs, many=True, context={'request': request}).data
        )

    def create(self, request):
        """Start (or resume) a 1:1 conversation: {username}."""
        user = request.user
        if not user.is_candidate:
            return Response({'detail': 'Only candidates can message.'}, status=403)
        username = (request.data.get('username') or '').strip()
        other = User.objects.filter(
            username=username, is_active=True, role=User.Role.CANDIDATE
        ).first()
        if other is None or other.pk == user.pk:
            return Response({'detail': 'User not found.'}, status=404)
        if not self._is_connected(user, other):
            return Response(
                {'detail': 'You can only message accepted connections.'}, status=403
            )
        conv = Conversation.objects.filter(participants=user).filter(
            participants=other
        ).first()
        if conv is None:
            conv = Conversation.objects.create()
            conv.participants.add(user, other)
        return Response(
            ConversationSerializer(conv, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['get', 'post'], url_path='messages')
    def messages(self, request, pk=None):
        conv = self._get_conversation(request, pk)
        if request.method == 'GET':
            qs = conv.messages.select_related('sender').order_by('-created_at')[:100]
            return Response(
                MessageSerializer(list(reversed(qs)), many=True,
                                  context={'request': request}).data
            )
        text = (request.data.get('text') or '').strip()
        if not text:
            return Response({'text': ['This field is required.']}, status=400)
        if len(text) > 2000:
            return Response({'text': ['Message too long.']}, status=400)
        msg = Message.objects.create(conversation=conv, sender=request.user, text=text)
        conv.save(update_fields=['updated_at'])
        other = conv.other_participant(request.user)
        sender_name = request.user.get_full_name() or request.user.username
        notify(
            other, request.user, Notification.Type.MESSAGE_RECEIVED,
            f'{sender_name} enviou uma mensagem.',
            link='/messages',
        )
        return Response(
            MessageSerializer(msg, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        conv = self._get_conversation(request, pk)
        conv.messages.filter(read_at__isnull=True).exclude(
            sender=request.user
        ).update(read_at=timezone.now())
        return Response({'detail': 'Marked as read.'})


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------
class NotificationViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        qs = request.user.notifications.select_related('actor')
        unread_only = request.query_params.get('unread') == '1'
        if unread_only:
            qs = qs.filter(is_read=False)
        try:
            page = max(int(request.query_params.get('page', 1)), 1)
            page_size = min(int(request.query_params.get('page_size', 15)), 50)
        except (TypeError, ValueError):
            page, page_size = 1, 15
        total = qs.count()
        start = (page - 1) * page_size
        items = qs[start:start + page_size]
        return Response({
            'count': total,
            'unread_count': request.user.notifications.filter(is_read=False).count(),
            'results': NotificationSerializer(items, many=True, context={'request': request}).data,
        })

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        notif = get_object_or_404(Notification, pk=pk, recipient=request.user)
        notif.is_read = True
        notif.save(update_fields=['is_read'])
        return Response(NotificationSerializer(notif, context={'request': request}).data)

    @action(detail=False, methods=['post'], url_path='read-all')
    def read_all(self, request):
        request.user.notifications.filter(is_read=False).update(is_read=True)
        return Response({'detail': 'All notifications marked as read.'})
