from django.db.models import Count, Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from feed.models import Post, PostComment, PostLike
from feed.serializers import (
    PostCommentSerializer,
    PostCreateSerializer,
    PostSerializer,
)


class PostViewSet(viewsets.ModelViewSet):
    """Social feed: list/create posts, like, comment, delete own."""

    serializer_class = PostSerializer
    http_method_names = ['get', 'post', 'delete', 'head', 'options']
    ordering_fields = ['created_at', 'like_count']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = (
            Post.objects.select_related('author')
            .annotate(
                like_count=Count('likes', distinct=True),
                comment_count=Count('comments', distinct=True),
            )
        )
        author = self.request.query_params.get('author')
        if author:
            qs = qs.filter(author__username=author)
        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return PostCreateSerializer
        return PostSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = serializer.save()
        return Response(
            PostSerializer(post, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    def get_permissions(self):
        # Read is public-ish (feed requires login on frontend, but API allows
        # read for flexibility); writes always require authentication.
        if self.action in {'create', 'like', 'comments'} or self.request.method == 'DELETE':
            return [IsAuthenticated()]
        return super().get_permissions()

    def destroy(self, request, *args, **kwargs):
        post = self.get_object()
        if post.author_id != request.user.id and not request.user.is_staff:
            return Response({'detail': 'You can only delete your own posts.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        post = self.get_object()
        like, created = PostLike.objects.get_or_create(post=post, user=request.user)
        if not created:
            like.delete()
        post.refresh_from_db()
        return Response({
            'liked': PostLike.objects.filter(post=post, user=request.user).exists(),
            'like_count': post.likes.count(),
        })

    @action(detail=True, methods=['get', 'post'], url_path='comments')
    def comments(self, request, pk=None):
        post = self.get_object()
        if request.method == 'POST':
            text = (request.data.get('text') or '').strip()
            if not text:
                return Response({'text': ['This field is required.']}, status=status.HTTP_400_BAD_REQUEST)
            comment = PostComment.objects.create(post=post, author=request.user, text=text)
            return Response(PostCommentSerializer(comment, context={'request': request}).data, status=status.HTTP_201_CREATED)
        comments = post.comments.select_related('author').all()
        return Response(PostCommentSerializer(comments, many=True, context={'request': request}).data)
