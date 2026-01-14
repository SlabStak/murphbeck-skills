# Django REST API Template

## Overview
Production-ready REST API using Django 5 with Django REST Framework, featuring PostgreSQL database, JWT authentication, comprehensive serializers, and async support.

## Quick Start
```bash
# Create project
mkdir my-django-api && cd my-django-api
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install django djangorestframework djangorestframework-simplejwt
pip install psycopg2-binary django-cors-headers django-filter
pip install drf-spectacular python-decouple celery redis
pip install gunicorn whitenoise

# Create project and app
django-admin startproject config .
python manage.py startapp api

# Run migrations and server
python manage.py migrate
python manage.py runserver
```

## Project Structure
```
my-django-api/
├── config/
│   ├── __init__.py
│   ├── asgi.py
│   ├── celery.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   └── wsgi.py
├── api/
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── item.py
│   ├── serializers/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── user.py
│   │   └── item.py
│   ├── views/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── user.py
│   │   └── item.py
│   ├── permissions.py
│   ├── pagination.py
│   ├── filters.py
│   ├── urls.py
│   ├── tasks.py
│   └── tests/
│       ├── __init__.py
│       ├── test_auth.py
│       └── test_items.py
├── core/
│   ├── __init__.py
│   ├── exceptions.py
│   ├── middleware.py
│   └── utils.py
├── manage.py
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Configuration

### requirements.txt
```
Django>=5.0
djangorestframework>=3.14
djangorestframework-simplejwt>=5.3
psycopg2-binary>=2.9
django-cors-headers>=4.3
django-filter>=23.5
drf-spectacular>=0.27
python-decouple>=3.8
celery>=5.3
redis>=5.0
gunicorn>=21.2
whitenoise>=6.6
django-redis>=5.4
sentry-sdk>=1.39
```

### .env.example
```env
# Django
DEBUG=True
SECRET_KEY=your-secret-key-change-in-production
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/djangoapi

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=10080

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=

# Sentry
SENTRY_DSN=
```

### config/settings/base.py
```python
import os
from datetime import timedelta
from pathlib import Path
from decouple import config, Csv

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config('SECRET_KEY', default='change-me-in-production')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=Csv())

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    # Local apps
    'api',
    'core',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'core.middleware.RequestLoggingMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database
import dj_database_url
DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL', default='postgres://postgres:postgres@localhost:5432/djangoapi')
    )
}

# Cache
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://localhost:6379/0'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Custom user model
AUTH_USER_MODEL = 'api.User'

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Default primary key
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'api.pagination.StandardResultsSetPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
    },
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=config('JWT_ACCESS_TOKEN_LIFETIME', default=60, cast=int)),
    'REFRESH_TOKEN_LIFETIME': timedelta(minutes=config('JWT_REFRESH_TOKEN_LIFETIME', default=10080, cast=int)),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'TOKEN_OBTAIN_SERIALIZER': 'api.serializers.auth.CustomTokenObtainPairSerializer',
}

# CORS
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000,http://localhost:5173',
    cast=Csv()
) if not DEBUG else []

# Spectacular (OpenAPI)
SPECTACULAR_SETTINGS = {
    'TITLE': 'Django API',
    'DESCRIPTION': 'Production-ready Django REST API',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
}

# Celery
CELERY_BROKER_URL = config('REDIS_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('REDIS_URL', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'json': {
            'format': '{"level": "%(levelname)s", "time": "%(asctime)s", "module": "%(module)s", "message": "%(message)s"}',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'json',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'api': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}
```

## Core Implementation

### api/models/user.py
```python
import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        USER = 'user', 'User'
        ADMIN = 'admin', 'Admin'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.USER)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return self.email

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN
```

### api/models/item.py
```python
import uuid
from django.db import models
from django.conf import settings


class Item(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        PUBLISHED = 'published', 'Published'
        ARCHIVED = 'archived', 'Archived'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='items'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'items'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def soft_delete(self):
        from django.utils import timezone
        self.deleted_at = timezone.now()
        self.save()


class ItemManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


# Add manager for active items
Item.active_objects = ItemManager()
```

### api/serializers/auth.py
```python
from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'password_confirm', 'name']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'role', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'email', 'role', 'created_at', 'updated_at']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['name'] = user.name
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)

    def validate_current_password(self, value):
        if not self.context['request'].user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect')
        return value
```

### api/serializers/item.py
```python
from rest_framework import serializers
from api.models.item import Item


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = [
            'id', 'title', 'description', 'status', 'price',
            'metadata', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ['title', 'description', 'status', 'price', 'metadata']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ItemUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ['title', 'description', 'status', 'price', 'metadata']


class ItemListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ['id', 'title', 'status', 'price', 'created_at']
```

### api/views/auth.py
```python
from django.contrib.auth import get_user_model
from rest_framework import status, generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema, OpenApiResponse

from api.serializers.auth import (
    RegisterSerializer,
    UserSerializer,
    CustomTokenObtainPairSerializer,
    ChangePasswordSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    @extend_schema(
        summary="Register a new user",
        responses={
            201: OpenApiResponse(description="User created successfully"),
            400: OpenApiResponse(description="Validation error"),
        }
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer

    @extend_schema(summary="Login and get tokens")
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class RefreshTokenView(TokenRefreshView):
    permission_classes = [AllowAny]

    @extend_schema(summary="Refresh access token")
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Logout and blacklist refresh token")
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    @extend_schema(summary="Get current user")
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(summary="Update current user")
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @extend_schema(summary="Partial update current user")
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Change password")
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()

        return Response({'message': 'Password changed successfully'}, status=status.HTTP_200_OK)


class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Delete current user account")
    def delete(self, request):
        request.user.is_active = False
        request.user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
```

### api/views/item.py
```python
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters import rest_framework as filters
from drf_spectacular.utils import extend_schema, extend_schema_view

from api.models.item import Item
from api.serializers.item import (
    ItemSerializer,
    ItemCreateSerializer,
    ItemUpdateSerializer,
    ItemListSerializer,
)
from api.filters import ItemFilter
from api.permissions import IsOwnerOrAdmin


@extend_schema_view(
    list=extend_schema(summary="List user's items"),
    create=extend_schema(summary="Create a new item"),
    retrieve=extend_schema(summary="Get item by ID"),
    update=extend_schema(summary="Update item"),
    partial_update=extend_schema(summary="Partial update item"),
    destroy=extend_schema(summary="Delete item"),
)
class ItemViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    filterset_class = ItemFilter
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'price', 'title']
    ordering = ['-created_at']

    def get_queryset(self):
        return Item.objects.filter(
            user=self.request.user,
            deleted_at__isnull=True
        )

    def get_serializer_class(self):
        if self.action == 'list':
            return ItemListSerializer
        elif self.action == 'create':
            return ItemCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ItemUpdateSerializer
        return ItemSerializer

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        item = self.get_object()
        item.status = Item.Status.PUBLISHED
        item.save()
        return Response(ItemSerializer(item).data)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        item = self.get_object()
        item.status = Item.Status.ARCHIVED
        item.save()
        return Response(ItemSerializer(item).data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        queryset = self.get_queryset()
        return Response({
            'total': queryset.count(),
            'draft': queryset.filter(status=Item.Status.DRAFT).count(),
            'published': queryset.filter(status=Item.Status.PUBLISHED).count(),
            'archived': queryset.filter(status=Item.Status.ARCHIVED).count(),
        })
```

### api/permissions.py
```python
from rest_framework import permissions


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or admins to edit it.
    """

    def has_object_permission(self, request, view, obj):
        # Admins have full access
        if request.user.is_admin:
            return True

        # Check if the object has a user attribute
        if hasattr(obj, 'user'):
            return obj.user == request.user

        # For user objects, check if it's the same user
        return obj == request.user


class IsAdminUser(permissions.BasePermission):
    """
    Permission check for admin users.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)
```

### api/filters.py
```python
from django_filters import rest_framework as filters
from api.models.item import Item


class ItemFilter(filters.FilterSet):
    status = filters.ChoiceFilter(choices=Item.Status.choices)
    min_price = filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = filters.NumberFilter(field_name='price', lookup_expr='lte')
    created_after = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = Item
        fields = ['status', 'min_price', 'max_price', 'created_after', 'created_before']
```

### api/pagination.py
```python
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'page_size': self.get_page_size(self.request),
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data
        })
```

### api/urls.py
```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from api.views.auth import (
    RegisterView,
    LoginView,
    RefreshTokenView,
    LogoutView,
    CurrentUserView,
    ChangePasswordView,
    DeleteAccountView,
)
from api.views.item import ItemViewSet

router = DefaultRouter()
router.register(r'items', ItemViewSet, basename='item')

urlpatterns = [
    # Auth routes
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/refresh/', RefreshTokenView.as_view(), name='token_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),

    # User routes
    path('users/me/', CurrentUserView.as_view(), name='current_user'),
    path('users/me/password/', ChangePasswordView.as_view(), name='change_password'),
    path('users/me/delete/', DeleteAccountView.as_view(), name='delete_account'),

    # Resource routes
    path('', include(router.urls)),
]
```

### config/urls.py
```python
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # API
    path('api/v1/', include('api.urls')),

    # Health check
    path('health/', include('core.health_urls')),

    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
```

### core/exceptions.py
```python
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        custom_response = {
            'success': False,
            'error': {
                'code': response.status_code,
                'message': get_error_message(response),
                'details': response.data if isinstance(response.data, dict) else {'detail': response.data}
            }
        }
        response.data = custom_response
    else:
        # Log unhandled exceptions
        logger.exception('Unhandled exception', exc_info=exc)
        response = Response({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Internal server error',
                'details': {}
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response


def get_error_message(response):
    status_messages = {
        400: 'Bad request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not found',
        405: 'Method not allowed',
        429: 'Too many requests',
        500: 'Internal server error',
    }
    return status_messages.get(response.status_code, 'An error occurred')
```

### core/middleware.py
```python
import time
import logging
import uuid

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = str(uuid.uuid4())
        request.request_id = request_id

        start_time = time.time()

        response = self.get_response(request)

        duration = time.time() - start_time

        logger.info(
            'Request completed',
            extra={
                'request_id': request_id,
                'method': request.method,
                'path': request.path,
                'status_code': response.status_code,
                'duration_ms': round(duration * 1000, 2),
                'user_id': str(request.user.id) if request.user.is_authenticated else None,
            }
        )

        response['X-Request-ID'] = request_id
        return response
```

### core/health_urls.py
```python
from django.urls import path
from core.views import health_check, readiness, liveness

urlpatterns = [
    path('', health_check, name='health_check'),
    path('ready/', readiness, name='readiness'),
    path('live/', liveness, name='liveness'),
]
```

### core/views.py
```python
from django.db import connection
from django.http import JsonResponse
from django.core.cache import cache


def health_check(request):
    return JsonResponse({
        'status': 'healthy',
        'version': '1.0.0'
    })


def readiness(request):
    # Check database
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
        db_status = 'connected'
    except Exception:
        db_status = 'disconnected'

    # Check cache
    try:
        cache.set('health_check', 'ok', 1)
        cache.get('health_check')
        cache_status = 'connected'
    except Exception:
        cache_status = 'disconnected'

    status_code = 200 if db_status == 'connected' else 503

    return JsonResponse({
        'status': 'ready' if status_code == 200 else 'not ready',
        'database': db_status,
        'cache': cache_status,
    }, status=status_code)


def liveness(request):
    return JsonResponse({'status': 'alive'})
```

### config/celery.py
```python
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')

app = Celery('config')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
```

### api/tasks.py
```python
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


@shared_task
def send_welcome_email(user_email, user_name):
    """Send welcome email to new users."""
    try:
        send_mail(
            subject='Welcome to Our Platform',
            message=f'Hello {user_name},\n\nWelcome to our platform!',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
        )
        logger.info(f'Welcome email sent to {user_email}')
    except Exception as e:
        logger.error(f'Failed to send welcome email to {user_email}: {e}')
        raise


@shared_task
def cleanup_expired_tokens():
    """Clean up expired refresh tokens."""
    from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
    from django.utils import timezone

    expired = OutstandingToken.objects.filter(expires_at__lt=timezone.now())
    count = expired.count()
    expired.delete()
    logger.info(f'Cleaned up {count} expired tokens')
```

## Docker Configuration

### Dockerfile
```dockerfile
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

RUN adduser --disabled-password --gecos '' appuser
USER appuser

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "config.wsgi:application"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DEBUG=False
      - DATABASE_URL=postgres://postgres:postgres@postgres:5432/djangoapi
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  celery:
    build: .
    command: celery -A config worker -l info
    environment:
      - DATABASE_URL=postgres://postgres:postgres@postgres:5432/djangoapi
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - api
      - redis

  celery-beat:
    build: .
    command: celery -A config beat -l info
    environment:
      - DATABASE_URL=postgres://postgres:postgres@postgres:5432/djangoapi
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - api
      - redis

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: djangoapi
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

## Testing

### api/tests/test_auth.py
```python
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

User = get_user_model()


class AuthenticationTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.user_data = {
            'email': 'test@example.com',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
            'name': 'Test User'
        }

    def test_register_user(self):
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)

    def test_register_duplicate_email(self):
        User.objects.create_user(email='test@example.com', password='testpass', name='Test')
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_user(self):
        User.objects.create_user(email='test@example.com', password='testpass123', name='Test')
        response = self.client.post(self.login_url, {
            'email': 'test@example.com',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_login_invalid_credentials(self):
        response = self.client.post(self.login_url, {
            'email': 'wrong@example.com',
            'password': 'wrongpass'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
```

## CLAUDE.md Integration

```markdown
# Django REST API

## Build Commands
- `python manage.py runserver` - Start development server
- `python manage.py test` - Run all tests
- `python manage.py migrate` - Run database migrations
- `python manage.py createsuperuser` - Create admin user
- `celery -A config worker -l info` - Start Celery worker

## Architecture
- Django REST Framework for API layer
- JWT authentication via SimpleJWT
- Celery for background tasks
- PostgreSQL with Django ORM

## Key Patterns
- ViewSets for CRUD operations
- Serializers for validation and transformation
- Custom permissions for access control
- Filters for queryable endpoints

## Database
- Migrations in each app's migrations/ folder
- Use `makemigrations` then `migrate`
- Custom User model in api.models.user
```

## AI Suggestions

1. **Add async views** - Use Django 5's async views for I/O-bound operations
2. **Implement API versioning** - Add URL-based or header-based versioning
3. **Add request throttling profiles** - Different rates for different endpoints
4. **Implement webhook dispatching** - Send events to registered webhooks
5. **Add audit logging** - Track all data changes with django-auditlog
6. **Implement soft delete manager** - Global soft delete filtering
7. **Add GraphQL endpoint** - Use graphene-django alongside REST
8. **Implement caching decorators** - Cache expensive queries with Redis
9. **Add OpenTelemetry** - Distributed tracing with django-opentelemetry
10. **Implement rate limiting per user tier** - Different limits for different subscription levels
