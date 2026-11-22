from django.conf import settings
from django.db import models

User = settings.AUTH_USER_MODEL


class Connection(models.Model):
    """Professional connection request between two candidate accounts."""

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        ACCEPTED = 'accepted', 'Accepted'
        REJECTED = 'rejected', 'Rejected'

    requester = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='connection_requests_sent'
    )
    addressee = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='connection_requests_received'
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['requester', 'addressee'],
                name='unique_connection_request_pair',
            )
        ]
        verbose_name = 'connection'
        verbose_name_plural = 'connections'

    def __str__(self):
        return f'{self.requester} -> {self.addressee} ({self.status})'


class Conversation(models.Model):
    """A private 1:1 conversation between two connected candidates."""

    participants = models.ManyToManyField(
        User, related_name='conversations', blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        verbose_name = 'conversation'
        verbose_name_plural = 'conversations'

    def other_participant(self, user):
        return self.participants.exclude(pk=user.pk).first()


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name='messages'
    )
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='messages_sent'
    )
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = 'message'
        verbose_name_plural = 'messages'

    def __str__(self):
        return f'{self.sender} in #{self.conversation_id}: {self.text[:40]}'


class Notification(models.Model):
    """A persisted notification delivered to a single user."""

    class Type(models.TextChoices):
        POST_CREATED = 'post_created', 'New post'
        CONNECTION_REQUEST = 'connection_request', 'Connection request'
        CONNECTION_ACCEPTED = 'connection_accepted', 'Connection accepted'
        MESSAGE_RECEIVED = 'message_received', 'New message'
        APPLICATION_RECEIVED = 'application_received', 'New application'
        APPLICATION_STATUS = 'application_status', 'Application update'

    recipient = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='notifications'
    )
    actor = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='notifications_triggered',
    )
    type = models.CharField(max_length=40, choices=Type.choices, db_index=True)
    text = models.CharField(max_length=300)
    link = models.CharField(max_length=300, blank=True)
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'notification'
        verbose_name_plural = 'notifications'

    def __str__(self):
        return f'{self.recipient}: {self.text}'
