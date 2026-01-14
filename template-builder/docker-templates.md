# Docker Templates

Dockerfile, docker-compose, and container orchestration configurations for Claude Code projects.

## Dockerfiles

### Template 1: Bun Application (Multi-stage)

```dockerfile
# Dockerfile
# ============================================
# BASE
# ============================================
FROM oven/bun:1-alpine AS base
WORKDIR /app

# ============================================
# DEPENDENCIES
# ============================================
FROM base AS deps

# Install dependencies only (for caching)
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production=false

# ============================================
# BUILD
# ============================================
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client if using Prisma
RUN bunx prisma generate 2>/dev/null || true

# Build the application
RUN bun run build

# ============================================
# PRODUCTION
# ============================================
FROM base AS runner

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy built application
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/package.json ./

# Switch to non-root user
USER appuser

EXPOSE 3000

CMD ["bun", "run", "dist/server.js"]
```

### Template 2: Next.js Application

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# ============================================
# DEPENDENCIES
# ============================================
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json bun.lockb* package-lock.json* yarn.lock* pnpm-lock.yaml* ./

RUN \
  if [ -f bun.lockb ]; then \
    npm install -g bun && bun install --frozen-lockfile; \
  elif [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "No lockfile found." && exit 1; \
  fi

# ============================================
# BUILD
# ============================================
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1

RUN \
  if [ -f bun.lockb ]; then \
    npm install -g bun && bun run build; \
  elif [ -f yarn.lock ]; then yarn build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm build; \
  fi

# ============================================
# PRODUCTION
# ============================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Leverage output file tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Template 3: Python FastAPI

```dockerfile
# Dockerfile
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# ============================================
# DEPENDENCIES
# ============================================
FROM base AS deps

# Install uv for fast dependency resolution
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# ============================================
# PRODUCTION
# ============================================
FROM base AS runner

# Create non-root user
RUN groupadd --gid 1001 appgroup && \
    useradd --uid 1001 --gid appgroup appuser

# Copy virtual environment
COPY --from=deps /app/.venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"

# Copy application
COPY --chown=appuser:appgroup . .

USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Template 4: Go Application

```dockerfile
# Dockerfile
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/server ./cmd/server

# ============================================
# PRODUCTION
# ============================================
FROM scratch

# Copy CA certificates for HTTPS
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy binary
COPY --from=builder /app/server /server

EXPOSE 8080

ENTRYPOINT ["/server"]
```

### Template 5: Rust Application

```dockerfile
# Dockerfile
FROM rust:1.75-alpine AS builder

RUN apk add --no-cache musl-dev

WORKDIR /app

# Cache dependencies
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release && rm -rf src

# Build actual application
COPY . .
RUN touch src/main.rs && cargo build --release

# ============================================
# PRODUCTION
# ============================================
FROM alpine:3.19

RUN apk add --no-cache ca-certificates

COPY --from=builder /app/target/release/myapp /usr/local/bin/

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 8080

CMD ["myapp"]
```

## Docker Compose

### Template 1: Full Development Stack

```yaml
# docker-compose.yml
version: '3.8'

services:
  # ============================================
  # APPLICATION
  # ============================================
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: deps  # Use deps stage for dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: bun run dev

  # ============================================
  # DATABASE
  # ============================================
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
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  # ============================================
  # CACHE
  # ============================================
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5
    command: redis-server --appendonly yes

  # ============================================
  # EMAIL (Development)
  # ============================================
  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI

  # ============================================
  # STORAGE (S3-compatible)
  # ============================================
  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### Template 2: Production Stack with Traefik

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # ============================================
  # REVERSE PROXY
  # ============================================
  traefik:
    image: traefik:v3.0
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=${ACME_EMAIL}"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--entrypoints.web.http.redirections.entryPoint.to=websecure"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - letsencrypt:/letsencrypt
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.dashboard.rule=Host(`traefik.${DOMAIN}`)"
      - "traefik.http.routers.dashboard.service=api@internal"
      - "traefik.http.routers.dashboard.middlewares=auth"
      - "traefik.http.middlewares.auth.basicauth.users=${TRAEFIK_AUTH}"

  # ============================================
  # APPLICATION
  # ============================================
  app:
    image: ${REGISTRY}/${IMAGE_NAME}:${TAG:-latest}
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app.rule=Host(`${DOMAIN}`)"
      - "traefik.http.routers.app.entrypoints=websecure"
      - "traefik.http.routers.app.tls.certresolver=letsencrypt"
      - "traefik.http.services.app.loadbalancer.server.port=3000"
      - "traefik.http.services.app.loadbalancer.healthcheck.path=/health"

  # ============================================
  # DATABASE
  # ============================================
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    deploy:
      placement:
        constraints:
          - node.role == manager

  # ============================================
  # CACHE
  # ============================================
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}

volumes:
  postgres_data:
  redis_data:
  letsencrypt:

networks:
  default:
    driver: overlay
```

### Template 3: Microservices Stack

```yaml
# docker-compose.microservices.yml
version: '3.8'

services:
  # ============================================
  # API GATEWAY
  # ============================================
  gateway:
    build:
      context: ./services/gateway
    ports:
      - "3000:3000"
    environment:
      - AUTH_SERVICE_URL=http://auth:3001
      - USER_SERVICE_URL=http://users:3002
      - PRODUCT_SERVICE_URL=http://products:3003
    depends_on:
      - auth
      - users
      - products

  # ============================================
  # AUTH SERVICE
  # ============================================
  auth:
    build:
      context: ./services/auth
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@auth-db:5432/auth
      - JWT_SECRET=${JWT_SECRET}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - auth-db
      - redis

  auth-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: auth
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - auth_db_data:/var/lib/postgresql/data

  # ============================================
  # USER SERVICE
  # ============================================
  users:
    build:
      context: ./services/users
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@users-db:5432/users
      - KAFKA_BROKERS=kafka:9092
    depends_on:
      - users-db
      - kafka

  users-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: users
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - users_db_data:/var/lib/postgresql/data

  # ============================================
  # PRODUCT SERVICE
  # ============================================
  products:
    build:
      context: ./services/products
    environment:
      - MONGODB_URI=mongodb://mongo:27017/products
      - ELASTICSEARCH_URL=http://elasticsearch:9200
    depends_on:
      - mongo
      - elasticsearch

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db

  # ============================================
  # SHARED INFRASTRUCTURE
  # ============================================
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    depends_on:
      - zookeeper

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

volumes:
  auth_db_data:
  users_db_data:
  mongo_data:
  redis_data:
  elasticsearch_data:
```

### Template 4: Development with Hot Reload

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
      - "9229:9229"  # Node debugger
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/myapp
    volumes:
      # Mount source code for hot reload
      - ./src:/app/src
      - ./public:/app/public
      # Persist node_modules in named volume
      - node_modules:/app/node_modules
    depends_on:
      - db
    command: bun run dev

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

  # Database admin UI
  adminer:
    image: adminer
    ports:
      - "8080:8080"
    depends_on:
      - db

volumes:
  node_modules:
  postgres_data:
```

## Development Dockerfile

```dockerfile
# Dockerfile.dev
FROM oven/bun:1

WORKDIR /app

# Install dependencies first (for caching)
COPY package.json bun.lockb ./
RUN bun install

# Copy source (will be overwritten by volume mount)
COPY . .

# Expose ports
EXPOSE 3000
EXPOSE 9229

CMD ["bun", "run", "dev"]
```

## Docker Ignore

```gitignore
# .dockerignore

# Dependencies
node_modules
.pnp
.pnp.js

# Build outputs
.next
out
dist
build

# Testing
coverage
.nyc_output

# IDE
.vscode
.idea
*.swp
*.swo

# Git
.git
.gitignore

# Docker
Dockerfile*
docker-compose*
.docker

# Environment
.env
.env.*
!.env.example

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# Misc
README.md
CHANGELOG.md
LICENSE
docs/
```

## Health Check Patterns

### HTTP Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

### TCP Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD nc -z localhost 3000 || exit 1
```

### Custom Health Check Script

```bash
#!/bin/sh
# healthcheck.sh

# Check if process is running
if ! pgrep -x "node" > /dev/null; then
  exit 1
fi

# Check HTTP endpoint
if ! curl -sf http://localhost:3000/health > /dev/null; then
  exit 1
fi

# Check database connection
if ! bunx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; then
  exit 1
fi

exit 0
```

## Resource Limits

```yaml
# docker-compose.yml with resource limits
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Multi-Architecture Builds

```bash
# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag myapp:latest \
  --push \
  .
```

```yaml
# GitHub Actions for multi-arch
- name: Build and push
  uses: docker/build-push-action@v5
  with:
    platforms: linux/amd64,linux/arm64
    push: true
    tags: ${{ steps.meta.outputs.tags }}
```
