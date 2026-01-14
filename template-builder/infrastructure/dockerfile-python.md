# Dockerfile Python Template

> Production-optimized Python Dockerfile with multi-stage builds, virtual environments, and security best practices

## Overview

This template provides a production-ready Python Dockerfile with:
- Multi-stage build for minimal image size
- Virtual environment isolation
- Non-root user for security
- UV/pip for fast dependency installation
- Support for Django, FastAPI, Flask
- Poetry, pipenv, and pip support

## Quick Start

```bash
# Build image
docker build -t my-python-app .

# Run container
docker run -p 8000:8000 my-python-app

# Run with environment variables
docker run -p 8000:8000 -e ENV=production my-python-app
```

## Dockerfile (FastAPI/Modern Python)

```dockerfile
# ============================================
# Stage 1: Builder
# ============================================
FROM python:3.12-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast package management
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.cargo/bin:$PATH"

WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock* requirements*.txt ./

# Create virtual environment and install dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install dependencies using uv (fast) or pip (fallback)
RUN if [ -f uv.lock ]; then \
      uv pip install --system -r pyproject.toml; \
    elif [ -f requirements.txt ]; then \
      pip install --no-cache-dir -r requirements.txt; \
    elif [ -f pyproject.toml ]; then \
      pip install --no-cache-dir .; \
    fi

# ============================================
# Stage 2: Production
# ============================================
FROM python:3.12-slim AS production

# Install runtime dependencies and security updates
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && apt-get upgrade -y \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user
RUN groupadd --gid 1000 python && \
    useradd --uid 1000 --gid python --shell /bin/bash --create-home python

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Copy application code
COPY --chown=python:python . .

# Switch to non-root user
USER python

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Dockerfile (Django)

```dockerfile
# ============================================
# Stage 1: Builder
# ============================================
FROM python:3.12-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements*.txt ./

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ============================================
# Stage 2: Production
# ============================================
FROM python:3.12-slim AS production

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && apt-get upgrade -y \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --gid 1000 django && \
    useradd --uid 1000 --gid django --shell /bin/bash --create-home django

WORKDIR /app

# Copy virtual environment
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=config.settings.production

# Copy application
COPY --chown=django:django . .

# Collect static files
RUN python manage.py collectstatic --noinput

# Switch to non-root user
USER django

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health/ || exit 1

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4", "--threads", "2"]
```

## Dockerfile (Poetry)

```dockerfile
# ============================================
# Stage 1: Dependencies
# ============================================
FROM python:3.12-slim AS deps

ENV POETRY_VERSION=1.8.2
ENV POETRY_HOME=/opt/poetry
ENV POETRY_VENV=/opt/poetry-venv
ENV POETRY_CACHE_DIR=/opt/.cache

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN python -m venv $POETRY_VENV && \
    $POETRY_VENV/bin/pip install -U pip setuptools && \
    $POETRY_VENV/bin/pip install poetry==$POETRY_VERSION

ENV PATH="${POETRY_VENV}/bin:${PATH}"

WORKDIR /app

# Copy Poetry files
COPY pyproject.toml poetry.lock ./

# Install dependencies
RUN poetry config virtualenvs.in-project true && \
    poetry install --only=main --no-interaction --no-ansi

# ============================================
# Stage 2: Production
# ============================================
FROM python:3.12-slim AS production

RUN apt-get update && apt-get upgrade -y && \
    rm -rf /var/lib/apt/lists/*

RUN groupadd --gid 1000 app && \
    useradd --uid 1000 --gid app --shell /bin/bash --create-home app

WORKDIR /app

# Copy virtual environment from deps
COPY --from=deps /app/.venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Copy application
COPY --chown=app:app . .

USER app

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Docker Compose

```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/mydb
      - REDIS_URL=redis://redis:6379
      - SECRET_KEY=${SECRET_KEY}
      - DEBUG=false
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - static_files:/app/staticfiles
      - media_files:/app/media
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  worker:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    command: celery -A config worker -l info
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/mydb
      - REDIS_URL=redis://redis:6379
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - db
      - redis

  beat:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    command: celery -A config beat -l info
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/mydb
      - REDIS_URL=redis://redis:6379
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - redis

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d mydb"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - static_files:/app/staticfiles:ro
      - media_files:/app/media:ro
    depends_on:
      - web

volumes:
  postgres_data:
  redis_data:
  static_files:
  media_files:
```

## .dockerignore

```
# Python
__pycache__
*.py[cod]
*$py.class
*.so
.Python
*.egg-info
.eggs
*.egg

# Virtual environments
.venv
venv
ENV
env

# Testing
.pytest_cache
.coverage
htmlcov
.tox
.nox

# IDE
.idea
.vscode
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Git
.git
.gitignore

# Docker
Dockerfile*
docker-compose*
.docker

# Documentation
README.md
docs
*.md

# Local settings
.env
.env.*
!.env.example
*.local

# Build artifacts
dist
build
*.whl
```

## CLAUDE.md Integration

```markdown
# Docker Python

## Build Commands
- `docker build -t app .` - Build production image
- `docker-compose up --build` - Build and run stack
- `docker-compose exec web python manage.py migrate` - Run migrations
- `docker-compose exec web python manage.py createsuperuser` - Create admin

## Image Details
- Base: python:3.12-slim (Debian-based, smaller than full)
- Multi-stage build reduces size by 60%+
- Virtual environment isolated in /opt/venv
- Non-root user for security

## Framework-Specific
- **FastAPI**: Uses uvicorn with --reload in dev
- **Django**: Runs gunicorn with collectstatic
- **Flask**: Runs with gunicorn or waitress

## Debugging
- `docker-compose logs -f web` - View logs
- `docker-compose exec web python` - Python shell
- `docker-compose exec web bash` - Shell access
```

## AI Suggestions

1. **Add uv for faster installs** - Replace pip with uv for 10-100x faster dependency resolution
2. **Implement pip-tools** - Use pip-compile for reproducible builds with hashed requirements
3. **Add security scanning** - Integrate Bandit and Safety for Python security checks
4. **Configure Gunicorn tuning** - Auto-calculate workers based on CPU cores
5. **Add startup probes** - Configure Kubernetes-style startup probes for slow-starting apps
6. **Implement connection pooling** - Add pgbouncer for PostgreSQL connection management
7. **Add async workers** - Use uvloop for improved async performance
8. **Configure log aggregation** - Structure logs for ELK/Loki ingestion
9. **Add profiling support** - Include py-spy for production profiling
10. **Implement graceful shutdown** - Handle SIGTERM for zero-downtime deployments
