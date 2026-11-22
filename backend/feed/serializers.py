from rest_framework import serializers

from feed.models import Post, PostComment


def _media_url(file_field):
    return file_field.url if file_field else None


def author_summary(user):
    """Compact public author card used across the feed and public profiles."""
    data = {
        'id': user.id,
        'username': user.username,
        'name': user.get_full_name() or user.username,
        'role': user.role,
        'role_display': user.get_role_display(),
        'headline': '',
        'subtitle': '',
        'avatar_url': None,
        'profile_url': f'/u/{user.username}',
    }
    if user.is_candidate and hasattr(user, 'candidate_profile'):
        profile = user.candidate_profile
        data['headline'] = profile.headline
        data['subtitle'] = user.city or ''
        data['avatar_url'] = _media_url(profile.photo)
    elif user.is_company and hasattr(user, 'company_profile'):
        profile = user.company_profile
        data['headline'] = profile.company_name
        data['subtitle'] = profile.sector or user.city or ''
        data['avatar_url'] = _media_url(profile.logo)
    return data


class PostCommentSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()

    class Meta:
        model = PostComment
        fields = ['id', 'post', 'author', 'text', 'created_at']
        read_only_fields = ['id', 'post', 'author', 'created_at']

    def get_author(self, obj):
        return author_summary(obj.author)


class PostSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    like_count = serializers.IntegerField(read_only=True)
    comment_count = serializers.IntegerField(read_only=True)
    has_liked = serializers.SerializerMethodField()
    is_own = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'author', 'text', 'image', 'image_url',
            'like_count', 'comment_count', 'has_liked', 'is_own',
            'created_at', 'updated_at',
        ]
        extra_kwargs = {'image': {'write_only': True, 'required': False}}

    def get_author(self, obj):
        return author_summary(obj.author)

    def get_image_url(self, obj):
        return _media_url(obj.image)

    def get_has_liked(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.likes.filter(user=request.user).exists()

    def get_is_own(self, obj):
        request = self.context.get('request')
        return bool(request and request.user.is_authenticated and obj.author_id == request.user.id)


class PostCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ['text', 'image']
        extra_kwargs = {'text': {'allow_blank': True}}

    def validate(self, attrs):
        if not attrs.get('text', '').strip() and not attrs.get('image'):
            raise serializers.ValidationError('Write some text or attach an image.')
        return attrs

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)
