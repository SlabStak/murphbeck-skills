# Python FastAPI Scaffold

Production-ready FastAPI application with async SQLAlchemy, Pydantic v2, authentication, and full observability.

## Directory Structure

```
my-api/
├── .claude/
│   ├── agents/
│   │   ├── build-validator.md
│   │   └── api-tester.md
│   └── settings.json
├── src/
│   └── app/
│       ├── api/
│       │   ├── v1/
│       │   │   ├── __init__.py
│       │   │   ├── auth.py
│       │   │   ├── users.py
│       │   │   └── health.py
│       │   └── deps.py
│       ├── core/
│       │   ├── __init__.py
│       │   ├── config.py
│       │   ├── security.py
│       │   └── exceptions.py
│       ├── db/
│       │   ├── __init__.py
│       │   ├── base.py
│       │   ├── session.py
│       │   └── init_db.py
│       ├── models/
│       │   ├── __init__.py
│       │   ├── user.py
│       │   └── base.py
│       ├── schemas/
│       │   ├── __init__.py
│       │   ├── user.py
│       │   ├── auth.py
│       │   └── common.py
│       ├── services/
│       │   ├── __init__.py
│       │   ├── auth.py
│       │   └── user.py
│       ├── __init__.py
│       └── main.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_auth.py
│   └── test_users.py
├── alembic/
│   ├── versions/
│   ├── env.py
│   └── script.py.mako
├── scripts/
│   ├── start.sh
│   └── seed.py
├── .env.example
├── .gitignore
├── .python-version
├── alembic.ini
├── CLAUDE.md
├── docker-compose.yml
├── Dockerfile
├── pyproject.toml
├── uv.lock
└── README.md
```

## Key Files

### CLAUDE.md

```markdown
# Python API Development Workflow

**Always use `uv`, not `pip` directly.**

## Commands
uv run fastapi dev         # Start dev server with hot reload
uv run pytest              # Run tests
uv run pytest -x           # Stop on first failure
uv run ruff check .        # Lint code
uv run ruff format .       # Format code
uv run mypy src/           # Type check

## Database
uv run alembic upgrade head      # Run migrations
uv run alembic revision --autogenerate -m "description"  # Create migration
uv run python scripts/seed.py   # Seed database

## Code Style
- Use Pydantic v2 for all schemas
- Async functions for all I/O operations
- Type hints on all function signatures
- Keep endpoints thin, services thick

## API Conventions
- Routes: /api/v1/{resource}
- Responses: Always use response models
- Errors: HTTPException with detail dict
- Auth: Bearer token in Authorization header

## Testing
- Run tests before every commit
- Use pytest fixtures for setup
- Test happy path + edge cases
```

### pyproject.toml

```toml
[project]
name = "my-api"
version = "0.1.0"
description = "FastAPI Application"
readme = "README.md"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.109.0",
    "uvicorn[standard]>=0.27.0",
    "pydantic>=2.5.0",
    "pydantic-settings>=2.1.0",
    "sqlalchemy[asyncio]>=2.0.25",
    "asyncpg>=0.29.0",
    "alembic>=1.13.0",
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",
    "python-multipart>=0.0.6",
    "httpx>=0.26.0",
    "redis>=5.0.0",
    "structlog>=24.1.0",
    "sentry-sdk[fastapi]>=1.39.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.23.0",
    "pytest-cov>=4.1.0",
    "ruff>=0.1.0",
    "mypy>=1.8.0",
    "pre-commit>=3.6.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.ruff]
target-version = "py312"
line-length = 100
select = [
    "E",   # pycodestyle errors
    "W",   # pycodestyle warnings
    "F",   # pyflakes
    "I",   # isort
    "B",   # flake8-bugbear
    "C4",  # flake8-comprehensions
    "UP",  # pyupgrade
    "ARG", # flake8-unused-arguments
    "SIM", # flake8-simplify
]
ignore = ["E501"]  # line length handled by formatter

[tool.ruff.format]
quote-style = "double"

[tool.mypy]
python_version = "3.12"
strict = true
plugins = ["pydantic.mypy"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

### src/app/main.py

```python
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import structlog
import sentry_sdk

from app.api.v1 import auth, users, health
from app.core.config import settings
from app.core.exceptions import setup_exception_handlers
from app.db.session import async_engine


# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
)

# Initialize Sentry
if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        traces_sample_rate=0.1,
    )


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler."""
    logger = structlog.get_logger()
    logger.info("Starting application", environment=settings.environment)

    yield

    # Cleanup
    await async_engine.dispose()
    logger.info("Application shutdown complete")


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    openapi_url="/api/openapi.json" if settings.environment != "production" else None,
    docs_url="/api/docs" if settings.environment != "production" else None,
    redoc_url="/api/redoc" if settings.environment != "production" else None,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
setup_exception_handlers(app)

# Routes
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
```

### src/app/core/config.py

```python
from functools import lru_cache

from pydantic import Field, PostgresDsn, RedisDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with validation."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "My API"
    environment: str = Field(default="development", pattern="^(development|staging|production)$")
    debug: bool = False

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Database
    database_url: PostgresDsn
    database_pool_size: int = 5
    database_max_overflow: int = 10

    # Redis (optional)
    redis_url: RedisDsn | None = None

    # Authentication
    jwt_secret: str = Field(min_length=32)
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    # External Services
    sentry_dsn: str | None = None


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
```

### src/app/core/security.py

```python
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )

    to_encode = {"sub": subject, "exp": expire, "type": "access"}
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_refresh_token(subject: str) -> str:
    """Create a JWT refresh token."""
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    to_encode = {"sub": subject, "exp": expire, "type": "refresh"}
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict | None:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        return None
```

### src/app/models/user.py

```python
from datetime import datetime

from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class User(Base):
    """User database model."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(50), default="user")
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
```

### src/app/schemas/user.py

```python
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):
    """Base user schema."""

    email: EmailStr
    name: str | None = None


class UserCreate(UserBase):
    """Schema for creating a user."""

    password: str = Field(min_length=8)


class UserUpdate(BaseModel):
    """Schema for updating a user."""

    email: EmailStr | None = None
    name: str | None = None
    password: str | None = Field(default=None, min_length=8)


class UserResponse(UserBase):
    """Schema for user response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class UserInDB(UserResponse):
    """Schema for user in database (includes hashed password)."""

    hashed_password: str
```

### src/app/schemas/auth.py

```python
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Schema for login request."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Schema for token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    """Schema for token refresh request."""

    refresh_token: str


class RegisterRequest(BaseModel):
    """Schema for user registration."""

    email: EmailStr
    password: str = Field(min_length=8)
    name: str | None = None
```

### src/app/api/deps.py

```python
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User
from app.services.user import UserService

security = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Get the current authenticated user."""
    token = credentials.credentials
    payload = decode_token(token)

    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    user_service = UserService(db)
    user = await user_service.get_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
DbSession = Annotated[AsyncSession, Depends(get_db)]
```

### src/app/api/v1/auth.py

```python
from fastapi import APIRouter, HTTPException, status

from app.api.deps import DbSession
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, RefreshRequest
from app.services.auth import AuthService

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: DbSession) -> TokenResponse:
    """Register a new user."""
    auth_service = AuthService(db)

    try:
        tokens = await auth_service.register(
            email=request.email,
            password=request.password,
            name=request.name,
        )
        return tokens
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: DbSession) -> TokenResponse:
    """Login with email and password."""
    auth_service = AuthService(db)

    tokens = await auth_service.login(
        email=request.email,
        password=request.password,
    )

    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return tokens


@router.post("/refresh", response_model=TokenResponse)
async def refresh(request: RefreshRequest, db: DbSession) -> TokenResponse:
    """Refresh access token."""
    auth_service = AuthService(db)

    tokens = await auth_service.refresh_tokens(request.refresh_token)

    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    return tokens
```

### src/app/api/v1/users.py

```python
from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.user import UserResponse, UserUpdate
from app.services.user import UserService

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user(current_user: CurrentUser) -> UserResponse:
    """Get the current authenticated user."""
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_current_user(
    update_data: UserUpdate,
    current_user: CurrentUser,
    db: DbSession,
) -> UserResponse:
    """Update the current authenticated user."""
    user_service = UserService(db)
    updated_user = await user_service.update(current_user.id, update_data)

    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return updated_user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, db: DbSession, current_user: CurrentUser) -> UserResponse:
    """Get a user by ID (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    user_service = UserService(db)
    user = await user_service.get_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user
```

### src/app/services/auth.py

```python
from sqlalchemy.ext.asyncio import AsyncSession
from ulid import ULID

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.schemas.auth import TokenResponse
from app.services.user import UserService


class AuthService:
    """Authentication service."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.user_service = UserService(db)

    async def register(
        self,
        email: str,
        password: str,
        name: str | None = None,
    ) -> TokenResponse:
        """Register a new user and return tokens."""
        # Check if user exists
        existing = await self.user_service.get_by_email(email)
        if existing:
            raise ValueError("Email already registered")

        # Create user
        user = await self.user_service.create(
            id=str(ULID()),
            email=email,
            hashed_password=hash_password(password),
            name=name,
        )

        # Generate tokens
        return TokenResponse(
            access_token=create_access_token(user.id),
            refresh_token=create_refresh_token(user.id),
        )

    async def login(self, email: str, password: str) -> TokenResponse | None:
        """Authenticate user and return tokens."""
        user = await self.user_service.get_by_email(email)

        if not user or not verify_password(password, user.hashed_password):
            return None

        return TokenResponse(
            access_token=create_access_token(user.id),
            refresh_token=create_refresh_token(user.id),
        )

    async def refresh_tokens(self, refresh_token: str) -> TokenResponse | None:
        """Refresh access token using refresh token."""
        payload = decode_token(refresh_token)

        if not payload or payload.get("type") != "refresh":
            return None

        user_id = payload.get("sub")
        if not user_id:
            return None

        user = await self.user_service.get_by_id(user_id)
        if not user or not user.is_active:
            return None

        return TokenResponse(
            access_token=create_access_token(user.id),
            refresh_token=create_refresh_token(user.id),
        )
```

### src/app/db/session.py

```python
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

async_engine = create_async_engine(
    str(settings.database_url).replace("postgresql://", "postgresql+asyncpg://"),
    pool_size=settings.database_pool_size,
    max_overflow=settings.database_max_overflow,
    echo=settings.debug,
)

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting database sessions."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
```

### tests/conftest.py

```python
from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.main import app
from app.db.session import get_db
from app.models.base import Base

TEST_DATABASE_URL = "postgresql+asyncpg://test:test@localhost:5432/test"

test_engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session")
async def setup_database() -> AsyncGenerator[None, None]:
    """Create test database tables."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session(setup_database: None) -> AsyncGenerator[AsyncSession, None]:
    """Get a test database session."""
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Get a test client with overridden dependencies."""

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        yield client

    app.dependency_overrides.clear()
```

### Dockerfile

```dockerfile
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_SYSTEM_PYTHON=1

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Dependencies
FROM base AS deps
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Production
FROM base AS runner

RUN groupadd --gid 1001 appgroup && \
    useradd --uid 1001 --gid appgroup appuser

COPY --from=deps /app/.venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"

COPY --chown=appuser:appgroup src/ ./src/
COPY --chown=appuser:appgroup alembic/ ./alembic/
COPY --chown=appuser:appgroup alembic.ini ./

USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
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
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/myapp
      - JWT_SECRET=${JWT_SECRET:-development-secret-change-in-production}
      - ENVIRONMENT=development
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./src:/app/src

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### .claude/settings.json

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "uv run ruff format . || true"
          }
        ]
      }
    ]
  }
}
```

### .claude/agents/build-validator.md

```markdown
---
name: build-validator
description: Validates Python FastAPI builds
tools:
  - Bash
  - Read
  - Glob
---

# Build Validator Agent

## Role
Ensure Python API builds successfully with all tests passing.

## Workflow

1. **Type Check**
   ```bash
   uv run mypy src/
   ```

2. **Lint**
   ```bash
   uv run ruff check .
   ```

3. **Format Check**
   ```bash
   uv run ruff format --check .
   ```

4. **Test**
   ```bash
   uv run pytest --cov=app --cov-report=term-missing
   ```

5. **Docker Build**
   ```bash
   docker build -t my-api:test .
   ```

## Constraints
- Never skip type checking
- Ensure all tests pass
- Coverage must be > 80%
```

## Setup Commands

```bash
# Create project
mkdir my-api && cd my-api

# Initialize with uv
uv init
uv add fastapi uvicorn[standard] pydantic pydantic-settings sqlalchemy[asyncio] asyncpg alembic python-jose[cryptography] passlib[bcrypt] python-multipart httpx structlog

# Add dev dependencies
uv add --dev pytest pytest-asyncio pytest-cov ruff mypy pre-commit

# Initialize alembic
uv run alembic init alembic

# Create directories
mkdir -p src/app/{api/v1,core,db,models,schemas,services}
mkdir -p tests .claude/agents

# Start development
docker-compose up -d db
uv run alembic upgrade head
uv run fastapi dev src/app/main.py
```

## Features Included

- **FastAPI** - Modern async Python web framework
- **SQLAlchemy 2.0** - Async ORM with type hints
- **Pydantic v2** - Data validation and settings
- **Alembic** - Database migrations
- **JWT Auth** - Access + refresh tokens
- **Structured Logging** - JSON logs with structlog
- **Sentry** - Error monitoring
- **Docker** - Container-ready deployment
- **uv** - Fast Python package manager

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/v1/auth/register | Register new user |
| POST | /api/v1/auth/login | Login |
| POST | /api/v1/auth/refresh | Refresh tokens |
| GET | /api/v1/users/me | Get current user |
| PATCH | /api/v1/users/me | Update current user |
| GET | /api/v1/users/{id} | Get user (admin) |
