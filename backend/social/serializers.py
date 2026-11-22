from rest_framework import serializers

from feed.serializers import author_summary
from social.models import Connection, Conversation, Message, Notification


class ConnectionSerializer(serializers.ModelSerializer):
    requester = serializers.SerializerMethodField()
    addressee = serializers.SerializerMethodField()

    class Meta:
        model = Connection
        fields = [
            'id', 'requester', 'addressee', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = fields

    def get_requester(self, obj):
        return author_summary(obj.requester)

    def get_addressee(self, obj):
        return author_summary(obj.addressee)


class NotificationSerializer(serializers.ModelSerializer):
    actor = serializers.SerializerMethodField()
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'type_display', 'text', 'link', 'is_read',
            'actor', 'created_at',
        ]
        read_only_fields = fields

    def get_actor(self, obj):
        return author_summary(obj.actor) if obj.actor else None


class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'sender', 'text', 'created_at', 'read_at']
        read_only_fields = ['id', 'sender', 'created_at', 'read_at']

    def get_sender(self, obj):
        return author_summary(obj.sender)


class ConversationSerializer(serializers.ModelSerializer):
    other_user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'other_user', 'last_message', 'unread_count', 'updated_at']
        read_only_fields = fields

    def get_other_user(self, obj):
        other = obj.other_participant(self.context['request'].user)
        return author_summary(other) if other else None

    def get_last_message(self, obj):
        msg = obj.messages.order_by('-created_at').first()
        if msg is None:
            return None
        return {
            'id': msg.id,
            'text': msg.text[:80],
            'sender_id': msg.sender_id,
            'created_at': msg.created_at,
        }

    def get_unread_count(self, obj):
        user = self.context['request'].user
        return obj.messages.filter(read_at__isnull=True).exclude(sender=user).count()
