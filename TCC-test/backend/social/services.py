"""Helpers for the social graph: notifications and connection lookups."""

from django.contrib.auth import get_user_model

from social.models import Connection, Notification

User = get_user_model()


def notify(recipient, actor, ntype, text, link=''):
    """Create a notification unless the actor is notifying themselves."""
    if recipient is None or (actor is not None and recipient.pk == actor.pk):
        return None
    return Notification.objects.create(
        recipient=recipient, actor=actor, type=ntype, text=text, link=link
    )


def accepted_connection_ids(user):
    """User ids of people connected to `user` (both directions)."""
    sent = Connection.objects.filter(
        requester=user, status=Connection.Status.ACCEPTED
    ).values_list('addressee_id', flat=True)
    received = Connection.objects.filter(
        addressee=user, status=Connection.Status.ACCEPTED
    ).values_list('requester_id', flat=True)
    return set(sent) | set(received)


def connection_state(user, other):
    """Return the relationship state between `user` and `other` candidate."""
    if not other or other.pk == user.pk or not other.is_candidate:
        return 'none'
    # Fetch any pair between the two users regardless of direction.
    conn = Connection.objects.filter(
        requester__in=[user.pk, other.pk],
        addressee__in=[user.pk, other.pk],
    ).first()
    if conn is None:
        return 'none'
    if conn.status == Connection.Status.ACCEPTED:
        return 'connected'
    if conn.status == Connection.Status.REJECTED:
        return 'none'
    # pending
    if conn.requester_id == user.pk:
        return 'outgoing'
    return 'incoming'
