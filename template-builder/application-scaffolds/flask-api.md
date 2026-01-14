# Flask REST API Template

## Overview
Lightweight, flexible REST API using Flask with SQLAlchemy ORM, Marshmallow serialization, JWT authentication, and production-ready configuration patterns.

## Quick Start
```bash
# Create project
mkdir my-flask-api && cd my-flask-api
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install flask flask-sqlalchemy flask-migrate flask-marshmallow
pip install flask-jwt-extended flask-cors flask-limiter
pip install marshmallow-sqlalchemy python-dotenv gunicorn
pip install psycopg2-binary redis celery flasgger

# Run the server
flask run
```

## Project Structure
```
my-flask-api/
├── app/
│   ├── __init__.py
│   ├── config.py
│   ├── extensions.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── item.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── item.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── users.py
│   │   └── items.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── user.py
│   │   └── item.py
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── decorators.py
│   │   └── responses.py
│   └── tasks/
│       ├── __init__.py
│       └── email.py
├── migrations/
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_auth.py
│   └── test_items.py
├── .env.example
├── .flaskenv
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── gunicorn.conf.py
└── wsgi.py
```

## Configuration

### requirements.txt
```
Flask>=3.0
Flask-SQLAlchemy>=3.1
Flask-Migrate>=4.0
Flask-Marshmallow>=1.2
Flask-JWT-Extended>=4.6
Flask-CORS>=4.0
Flask-Limiter>=3.5
marshmallow-sqlalchemy>=0.31
python-dotenv>=1.0
gunicorn>=21.2
psycopg2-binary>=2.9
redis>=5.0
celery>=5.3
flasgger>=0.9
Werkzeug>=3.0
bcrypt>=4.1
```

### .env.example
```env
# Flask
FLASK_APP=wsgi.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-change-in-production

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/flaskapi

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRES=3600
JWT_REFRESH_TOKEN_EXPIRES=604800

# Rate Limiting
RATELIMIT_STORAGE_URL=redis://localhost:6379/1
RATELIMIT_DEFAULT=100/hour
```

### .flaskenv
```
FLASK_APP=wsgi.py
FLASK_DEBUG=1
```

### app/config.py
```python
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration."""
    SECRET_KEY = os.getenv('SECRET_KEY', 'change-me-in-production')

    # SQLAlchemy
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        'postgresql://postgres:postgres@localhost:5432/flaskapi'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'pool_recycle': 3600,
        'pool_pre_ping': True,
    }

    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'change-me-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        seconds=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 3600))
    )
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        seconds=int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES', 604800))
    )
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'

    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')

    # Rate Limiting
    RATELIMIT_STORAGE_URL = os.getenv('REDIS_URL', 'memory://')
    RATELIMIT_DEFAULT = os.getenv('RATELIMIT_DEFAULT', '100/hour')
    RATELIMIT_HEADERS_ENABLED = True

    # Redis
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

    # Celery
    CELERY_BROKER_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    CELERY_RESULT_BACKEND = os.getenv('REDIS_URL', 'redis://localhost:6379/0')


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    SQLALCHEMY_ECHO = True


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False

    # Security headers
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'


class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=5)


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig,
}
```

## Core Implementation

### app/__init__.py
```python
import os
from flask import Flask
from app.config import config
from app.extensions import db, migrate, ma, jwt, cors, limiter


def create_app(config_name=None):
    """Application factory."""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    register_extensions(app)

    # Register blueprints
    register_blueprints(app)

    # Register error handlers
    register_error_handlers(app)

    # Register CLI commands
    register_commands(app)

    return app


def register_extensions(app):
    """Register Flask extensions."""
    db.init_app(app)
    migrate.init_app(app, db)
    ma.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}})
    limiter.init_app(app)

    # JWT callbacks
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        from app.models.user import TokenBlocklist
        jti = jwt_payload['jti']
        token = db.session.query(TokenBlocklist).filter_by(jti=jti).first()
        return token is not None

    @jwt.user_identity_loader
    def user_identity_lookup(user):
        return str(user.id) if hasattr(user, 'id') else str(user)

    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        from app.models.user import User
        identity = jwt_data['sub']
        return User.query.get(identity)


def register_blueprints(app):
    """Register Flask blueprints."""
    from app.api import api_bp
    from app.api.health import health_bp

    app.register_blueprint(api_bp, url_prefix='/api/v1')
    app.register_blueprint(health_bp, url_prefix='/health')


def register_error_handlers(app):
    """Register error handlers."""
    from app.utils.responses import error_response

    @app.errorhandler(400)
    def bad_request(error):
        return error_response(400, 'Bad request')

    @app.errorhandler(401)
    def unauthorized(error):
        return error_response(401, 'Unauthorized')

    @app.errorhandler(403)
    def forbidden(error):
        return error_response(403, 'Forbidden')

    @app.errorhandler(404)
    def not_found(error):
        return error_response(404, 'Not found')

    @app.errorhandler(429)
    def ratelimit_handler(error):
        return error_response(429, 'Rate limit exceeded')

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return error_response(500, 'Internal server error')


def register_commands(app):
    """Register CLI commands."""
    @app.cli.command('create-admin')
    def create_admin():
        """Create admin user."""
        from app.models.user import User
        from getpass import getpass

        email = input('Email: ')
        name = input('Name: ')
        password = getpass('Password: ')

        user = User(email=email, name=name, role='admin')
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        print(f'Admin user {email} created.')
```

### app/extensions.py
```python
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_marshmallow import Marshmallow
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

db = SQLAlchemy()
migrate = Migrate()
ma = Marshmallow()
jwt = JWTManager()
cors = CORS()
limiter = Limiter(key_func=get_remote_address)
```

### app/models/user.py
```python
import uuid
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    items = db.relationship('Item', backref='user', lazy='dynamic', cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @property
    def is_admin(self):
        return self.role == 'admin'

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }

    def __repr__(self):
        return f'<User {self.email}>'


class TokenBlocklist(db.Model):
    __tablename__ = 'token_blocklist'

    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

### app/models/item.py
```python
import uuid
from datetime import datetime
from app.extensions import db


class Item(db.Model):
    __tablename__ = 'items'

    class Status:
        DRAFT = 'draft'
        PUBLISHED = 'published'
        ARCHIVED = 'archived'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default=Status.DRAFT)
    price = db.Column(db.Numeric(10, 2), default=0)
    metadata = db.Column(db.JSON, default=dict)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = db.Column(db.DateTime, nullable=True)

    @classmethod
    def active(cls):
        return cls.query.filter(cls.deleted_at.is_(None))

    def soft_delete(self):
        self.deleted_at = datetime.utcnow()
        db.session.commit()

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'price': float(self.price) if self.price else 0,
            'metadata': self.metadata,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }

    def __repr__(self):
        return f'<Item {self.title}>'
```

### app/schemas/user.py
```python
from marshmallow import fields, validate, validates, ValidationError
from app.extensions import ma
from app.models.user import User


class UserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = User
        load_instance = True
        exclude = ('password_hash',)

    email = fields.Email(required=True)
    name = fields.String(required=True, validate=validate.Length(min=2, max=255))
    role = fields.String(dump_only=True)
    is_active = fields.Boolean(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class RegisterSchema(ma.Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True, load_only=True, validate=validate.Length(min=8))
    password_confirm = fields.String(required=True, load_only=True)
    name = fields.String(required=True, validate=validate.Length(min=2, max=255))

    @validates('email')
    def validate_email(self, value):
        if User.query.filter_by(email=value).first():
            raise ValidationError('Email already registered')

    def validate(self, data, **kwargs):
        if data.get('password') != data.get('password_confirm'):
            raise ValidationError({'password_confirm': ['Passwords do not match']})
        return data


class LoginSchema(ma.Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True, load_only=True)


class ChangePasswordSchema(ma.Schema):
    current_password = fields.String(required=True, load_only=True)
    new_password = fields.String(required=True, load_only=True, validate=validate.Length(min=8))


class UpdateUserSchema(ma.Schema):
    name = fields.String(validate=validate.Length(min=2, max=255))


user_schema = UserSchema()
users_schema = UserSchema(many=True)
register_schema = RegisterSchema()
login_schema = LoginSchema()
change_password_schema = ChangePasswordSchema()
update_user_schema = UpdateUserSchema()
```

### app/schemas/item.py
```python
from marshmallow import fields, validate
from app.extensions import ma
from app.models.item import Item


class ItemSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Item
        load_instance = True
        exclude = ('deleted_at', 'user')

    title = fields.String(required=True, validate=validate.Length(min=1, max=255))
    description = fields.String()
    status = fields.String(
        validate=validate.OneOf([Item.Status.DRAFT, Item.Status.PUBLISHED, Item.Status.ARCHIVED])
    )
    price = fields.Decimal(places=2, as_string=True)
    metadata = fields.Dict()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class ItemListSchema(ma.Schema):
    id = fields.String()
    title = fields.String()
    status = fields.String()
    price = fields.Decimal(places=2, as_string=True)
    created_at = fields.DateTime()


class ItemFilterSchema(ma.Schema):
    status = fields.String(validate=validate.OneOf(['draft', 'published', 'archived']))
    min_price = fields.Decimal()
    max_price = fields.Decimal()
    search = fields.String()
    page = fields.Integer(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Integer(load_default=20, validate=validate.Range(min=1, max=100))
    sort_by = fields.String(load_default='created_at')
    sort_dir = fields.String(load_default='desc', validate=validate.OneOf(['asc', 'desc']))


item_schema = ItemSchema()
items_schema = ItemSchema(many=True)
item_list_schema = ItemListSchema(many=True)
item_filter_schema = ItemFilterSchema()
```

### app/services/auth.py
```python
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt,
)
from app.extensions import db
from app.models.user import User, TokenBlocklist


class AuthService:
    @staticmethod
    def register(email, password, name):
        user = User(email=email, name=name)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return user

    @staticmethod
    def authenticate(email, password):
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password) and user.is_active:
            return user
        return None

    @staticmethod
    def generate_tokens(user):
        access_token = create_access_token(
            identity=user,
            additional_claims={'role': user.role, 'email': user.email}
        )
        refresh_token = create_refresh_token(identity=user)
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'Bearer',
        }

    @staticmethod
    def revoke_token():
        jti = get_jwt()['jti']
        token = TokenBlocklist(jti=jti)
        db.session.add(token)
        db.session.commit()

    @staticmethod
    def change_password(user, current_password, new_password):
        if not user.check_password(current_password):
            return False
        user.set_password(new_password)
        db.session.commit()
        return True
```

### app/services/item.py
```python
from sqlalchemy import or_
from app.extensions import db
from app.models.item import Item


class ItemService:
    @staticmethod
    def create(user_id, data):
        item = Item(user_id=user_id, **data)
        db.session.add(item)
        db.session.commit()
        return item

    @staticmethod
    def get_by_id(item_id, user_id):
        return Item.active().filter_by(id=item_id, user_id=user_id).first()

    @staticmethod
    def get_by_id_any_user(item_id):
        return Item.active().filter_by(id=item_id).first()

    @staticmethod
    def update(item, data):
        for key, value in data.items():
            if hasattr(item, key) and value is not None:
                setattr(item, key, value)
        db.session.commit()
        return item

    @staticmethod
    def delete(item):
        item.soft_delete()

    @staticmethod
    def list(user_id, filters):
        query = Item.active().filter_by(user_id=user_id)

        # Apply filters
        if filters.get('status'):
            query = query.filter(Item.status == filters['status'])

        if filters.get('min_price'):
            query = query.filter(Item.price >= filters['min_price'])

        if filters.get('max_price'):
            query = query.filter(Item.price <= filters['max_price'])

        if filters.get('search'):
            search = f"%{filters['search']}%"
            query = query.filter(
                or_(
                    Item.title.ilike(search),
                    Item.description.ilike(search)
                )
            )

        # Apply sorting
        sort_column = getattr(Item, filters.get('sort_by', 'created_at'), Item.created_at)
        if filters.get('sort_dir', 'desc') == 'desc':
            sort_column = sort_column.desc()

        query = query.order_by(sort_column)

        # Paginate
        page = filters.get('page', 1)
        per_page = filters.get('per_page', 20)
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)

        return {
            'items': pagination.items,
            'total': pagination.total,
            'page': pagination.page,
            'per_page': pagination.per_page,
            'total_pages': pagination.pages,
        }
```

### app/api/__init__.py
```python
from flask import Blueprint

api_bp = Blueprint('api', __name__)

from app.api import auth, users, items  # noqa
```

### app/api/auth.py
```python
from flask import request
from flask_jwt_extended import jwt_required, current_user, get_jwt_identity
from app.api import api_bp
from app.services.auth import AuthService
from app.schemas.user import (
    register_schema,
    login_schema,
    change_password_schema,
    user_schema,
)
from app.utils.responses import success_response, error_response
from app.extensions import limiter


@api_bp.route('/auth/register', methods=['POST'])
@limiter.limit('5/minute')
def register():
    """Register a new user."""
    data = request.get_json()
    errors = register_schema.validate(data)
    if errors:
        return error_response(400, 'Validation error', errors)

    user = AuthService.register(
        email=data['email'],
        password=data['password'],
        name=data['name']
    )
    tokens = AuthService.generate_tokens(user)

    return success_response({
        'user': user_schema.dump(user),
        **tokens
    }, 201)


@api_bp.route('/auth/login', methods=['POST'])
@limiter.limit('10/minute')
def login():
    """Login and get tokens."""
    data = request.get_json()
    errors = login_schema.validate(data)
    if errors:
        return error_response(400, 'Validation error', errors)

    user = AuthService.authenticate(data['email'], data['password'])
    if not user:
        return error_response(401, 'Invalid email or password')

    tokens = AuthService.generate_tokens(user)

    return success_response({
        'user': user_schema.dump(user),
        **tokens
    })


@api_bp.route('/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token."""
    identity = get_jwt_identity()
    from app.models.user import User
    user = User.query.get(identity)

    if not user or not user.is_active:
        return error_response(401, 'User not found or inactive')

    tokens = AuthService.generate_tokens(user)
    return success_response(tokens)


@api_bp.route('/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout and revoke token."""
    AuthService.revoke_token()
    return success_response({'message': 'Logged out successfully'})


@api_bp.route('/users/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user."""
    return success_response(user_schema.dump(current_user))


@api_bp.route('/users/me', methods=['PUT'])
@jwt_required()
def update_current_user():
    """Update current user."""
    from app.schemas.user import update_user_schema
    from app.extensions import db

    data = request.get_json()
    errors = update_user_schema.validate(data)
    if errors:
        return error_response(400, 'Validation error', errors)

    for key, value in data.items():
        if hasattr(current_user, key):
            setattr(current_user, key, value)

    db.session.commit()
    return success_response(user_schema.dump(current_user))


@api_bp.route('/users/me', methods=['DELETE'])
@jwt_required()
def delete_current_user():
    """Delete current user."""
    current_user.is_active = False
    from app.extensions import db
    db.session.commit()
    return success_response({'message': 'Account deactivated'})


@api_bp.route('/users/me/password', methods=['PUT'])
@jwt_required()
def change_password():
    """Change password."""
    data = request.get_json()
    errors = change_password_schema.validate(data)
    if errors:
        return error_response(400, 'Validation error', errors)

    if not AuthService.change_password(
        current_user,
        data['current_password'],
        data['new_password']
    ):
        return error_response(400, 'Current password is incorrect')

    return success_response({'message': 'Password changed successfully'})
```

### app/api/items.py
```python
from flask import request
from flask_jwt_extended import jwt_required, current_user
from app.api import api_bp
from app.services.item import ItemService
from app.schemas.item import (
    item_schema,
    items_schema,
    item_list_schema,
    item_filter_schema,
)
from app.utils.responses import success_response, error_response
from app.utils.decorators import admin_required


@api_bp.route('/items', methods=['GET'])
@jwt_required()
def list_items():
    """List user's items."""
    filters = item_filter_schema.load(request.args)
    result = ItemService.list(current_user.id, filters)

    return success_response({
        'items': item_list_schema.dump(result['items']),
        'total': result['total'],
        'page': result['page'],
        'per_page': result['per_page'],
        'total_pages': result['total_pages'],
    })


@api_bp.route('/items', methods=['POST'])
@jwt_required()
def create_item():
    """Create a new item."""
    data = request.get_json()
    errors = item_schema.validate(data)
    if errors:
        return error_response(400, 'Validation error', errors)

    item = ItemService.create(current_user.id, data)
    return success_response(item_schema.dump(item), 201)


@api_bp.route('/items/<item_id>', methods=['GET'])
@jwt_required()
def get_item(item_id):
    """Get item by ID."""
    item = ItemService.get_by_id(item_id, current_user.id)
    if not item:
        return error_response(404, 'Item not found')

    return success_response(item_schema.dump(item))


@api_bp.route('/items/<item_id>', methods=['PUT'])
@jwt_required()
def update_item(item_id):
    """Update item."""
    item = ItemService.get_by_id(item_id, current_user.id)
    if not item:
        return error_response(404, 'Item not found')

    data = request.get_json()
    errors = item_schema.validate(data, partial=True)
    if errors:
        return error_response(400, 'Validation error', errors)

    item = ItemService.update(item, data)
    return success_response(item_schema.dump(item))


@api_bp.route('/items/<item_id>', methods=['DELETE'])
@jwt_required()
def delete_item(item_id):
    """Delete item."""
    item = ItemService.get_by_id(item_id, current_user.id)
    if not item:
        return error_response(404, 'Item not found')

    ItemService.delete(item)
    return success_response({'message': 'Item deleted successfully'})


@api_bp.route('/items/<item_id>/publish', methods=['POST'])
@jwt_required()
def publish_item(item_id):
    """Publish item."""
    from app.models.item import Item

    item = ItemService.get_by_id(item_id, current_user.id)
    if not item:
        return error_response(404, 'Item not found')

    item = ItemService.update(item, {'status': Item.Status.PUBLISHED})
    return success_response(item_schema.dump(item))


@api_bp.route('/items/<item_id>/archive', methods=['POST'])
@jwt_required()
def archive_item(item_id):
    """Archive item."""
    from app.models.item import Item

    item = ItemService.get_by_id(item_id, current_user.id)
    if not item:
        return error_response(404, 'Item not found')

    item = ItemService.update(item, {'status': Item.Status.ARCHIVED})
    return success_response(item_schema.dump(item))


@api_bp.route('/items/stats', methods=['GET'])
@jwt_required()
def item_stats():
    """Get item statistics."""
    from app.models.item import Item

    query = Item.active().filter_by(user_id=current_user.id)
    return success_response({
        'total': query.count(),
        'draft': query.filter_by(status=Item.Status.DRAFT).count(),
        'published': query.filter_by(status=Item.Status.PUBLISHED).count(),
        'archived': query.filter_by(status=Item.Status.ARCHIVED).count(),
    })
```

### app/api/health.py
```python
from flask import Blueprint
from app.extensions import db

health_bp = Blueprint('health', __name__)


@health_bp.route('', methods=['GET'])
def health_check():
    """Basic health check."""
    return {'status': 'healthy', 'version': '1.0.0'}


@health_bp.route('/ready', methods=['GET'])
def readiness():
    """Readiness probe."""
    try:
        db.session.execute(db.text('SELECT 1'))
        db_status = 'connected'
    except Exception:
        db_status = 'disconnected'

    status_code = 200 if db_status == 'connected' else 503

    return {
        'status': 'ready' if status_code == 200 else 'not ready',
        'database': db_status,
    }, status_code


@health_bp.route('/live', methods=['GET'])
def liveness():
    """Liveness probe."""
    return {'status': 'alive'}
```

### app/utils/responses.py
```python
from flask import jsonify


def success_response(data, status_code=200):
    """Return success response."""
    return jsonify({
        'success': True,
        'data': data
    }), status_code


def error_response(status_code, message, details=None):
    """Return error response."""
    response = {
        'success': False,
        'error': {
            'code': status_code,
            'message': message
        }
    }
    if details:
        response['error']['details'] = details

    return jsonify(response), status_code
```

### app/utils/decorators.py
```python
from functools import wraps
from flask_jwt_extended import current_user
from app.utils.responses import error_response


def admin_required(fn):
    """Decorator to require admin role."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not current_user.is_admin:
            return error_response(403, 'Admin access required')
        return fn(*args, **kwargs)
    return wrapper


def owner_or_admin_required(get_resource):
    """Decorator to require owner or admin."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            resource = get_resource(*args, **kwargs)
            if not resource:
                return error_response(404, 'Resource not found')

            if not current_user.is_admin and resource.user_id != current_user.id:
                return error_response(403, 'Access denied')

            return fn(*args, **kwargs)
        return wrapper
    return decorator
```

### wsgi.py
```python
from app import create_app

app = create_app()

if __name__ == '__main__':
    app.run()
```

### gunicorn.conf.py
```python
import os
import multiprocessing

# Server socket
bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"
backlog = 2048

# Worker processes
workers = int(os.getenv('GUNICORN_WORKERS', multiprocessing.cpu_count() * 2 + 1))
worker_class = 'sync'
worker_connections = 1000
timeout = 30
keepalive = 2

# Logging
accesslog = '-'
errorlog = '-'
loglevel = 'info'
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = 'flask-api'

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# SSL (if needed)
# keyfile = None
# certfile = None
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

RUN adduser --disabled-password --gecos '' appuser
USER appuser

EXPOSE 8000

CMD ["gunicorn", "-c", "gunicorn.conf.py", "wsgi:app"]
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
      - FLASK_ENV=production
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/flaskapi
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=${SECRET_KEY}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  celery:
    build: .
    command: celery -A app.tasks worker -l info
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/flaskapi
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
      POSTGRES_DB: flaskapi
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

### tests/conftest.py
```python
import pytest
from app import create_app
from app.extensions import db


@pytest.fixture(scope='session')
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def db_session(app):
    with app.app_context():
        yield db.session
        db.session.rollback()


@pytest.fixture
def auth_headers(client, db_session):
    from app.models.user import User

    user = User(email='test@example.com', name='Test User')
    user.set_password('testpass123')
    db_session.add(user)
    db_session.commit()

    response = client.post('/api/v1/auth/login', json={
        'email': 'test@example.com',
        'password': 'testpass123'
    })

    token = response.get_json()['data']['access_token']
    return {'Authorization': f'Bearer {token}'}
```

### tests/test_auth.py
```python
def test_register(client):
    response = client.post('/api/v1/auth/register', json={
        'email': 'new@example.com',
        'password': 'password123',
        'password_confirm': 'password123',
        'name': 'New User'
    })

    assert response.status_code == 201
    data = response.get_json()
    assert data['success'] is True
    assert 'access_token' in data['data']


def test_login(client, db_session):
    from app.models.user import User

    user = User(email='login@example.com', name='Login User')
    user.set_password('password123')
    db_session.add(user)
    db_session.commit()

    response = client.post('/api/v1/auth/login', json={
        'email': 'login@example.com',
        'password': 'password123'
    })

    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert 'access_token' in data['data']


def test_invalid_login(client):
    response = client.post('/api/v1/auth/login', json={
        'email': 'wrong@example.com',
        'password': 'wrongpass'
    })

    assert response.status_code == 401
```

## CLAUDE.md Integration

```markdown
# Flask REST API

## Build Commands
- `flask run` - Start development server
- `pytest` - Run all tests
- `flask db upgrade` - Run database migrations
- `flask create-admin` - Create admin user
- `celery -A app.tasks worker` - Start Celery worker

## Architecture
- Flask application factory pattern
- SQLAlchemy ORM with migrations
- Marshmallow for serialization/validation
- JWT authentication with token blacklisting

## Key Patterns
- Use Blueprints for route organization
- Services for business logic
- Schemas for request/response validation
- Decorators for common functionality

## Database
- Migrations via Flask-Migrate (Alembic)
- Use `flask db migrate` then `flask db upgrade`
- Soft deletes with deleted_at column
```

## AI Suggestions

1. **Add async support** - Use Quart for async Flask-compatible API
2. **Implement API versioning** - Add URL prefix versioning pattern
3. **Add OpenAPI generation** - Use flasgger or apispec for docs
4. **Implement request ID tracking** - Add correlation IDs across requests
5. **Add caching layer** - Use Flask-Caching with Redis backend
6. **Implement webhook system** - Add outbound webhooks for events
7. **Add GraphQL endpoint** - Use graphene-flask alongside REST
8. **Implement batch operations** - Support bulk create/update/delete
9. **Add audit logging** - Track all data modifications
10. **Implement rate limiting tiers** - Different limits per user tier
