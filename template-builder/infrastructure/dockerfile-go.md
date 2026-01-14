# Dockerfile Go Template

> Production-optimized Go Dockerfile with multi-stage builds, static binaries, and minimal runtime

## Overview

This template provides a production-ready Go Dockerfile with:
- Multi-stage build for minimal image size
- Static binary compilation
- Scratch or distroless base image
- CGO disabled for portability
- Security hardening
- Cross-compilation support

## Quick Start

```bash
# Build image
docker build -t my-go-app .

# Run container
docker run -p 8080:8080 my-go-app

# Build for specific platform
docker build --platform linux/amd64 -t my-go-app .
```

## Dockerfile (Scratch - Minimal)

```dockerfile
# ============================================
# Stage 1: Builder
# ============================================
FROM golang:1.22-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata

# Create non-root user for final image
RUN adduser -D -g '' -u 10001 appuser

WORKDIR /app

# Download dependencies first (better caching)
COPY go.mod go.sum ./
RUN go mod download && go mod verify

# Copy source code
COPY . .

# Build static binary
ARG VERSION=dev
ARG COMMIT=unknown
ARG BUILD_TIME

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s -X main.version=${VERSION} -X main.commit=${COMMIT} -X main.buildTime=${BUILD_TIME}" \
    -a -installsuffix cgo \
    -o /app/server \
    ./cmd/server

# ============================================
# Stage 2: Production (Scratch)
# ============================================
FROM scratch AS production

# Import from builder
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /etc/group /etc/group

# Copy binary
COPY --from=builder /app/server /server

# Copy static files if needed
# COPY --from=builder /app/static /static
# COPY --from=builder /app/templates /templates

# Use non-root user
USER appuser:appuser

# Expose port
EXPOSE 8080

# Health check (requires curl in image, not available in scratch)
# Use Kubernetes/Docker health probes instead

# Run binary
ENTRYPOINT ["/server"]
```

## Dockerfile (Distroless - Recommended)

```dockerfile
# ============================================
# Stage 1: Builder
# ============================================
FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git ca-certificates

WORKDIR /app

# Download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy and build
COPY . .

ARG VERSION=dev
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-w -s -X main.version=${VERSION}" \
    -o /app/server \
    ./cmd/server

# ============================================
# Stage 2: Production (Distroless)
# ============================================
FROM gcr.io/distroless/static-debian12:nonroot AS production

# Copy binary from builder
COPY --from=builder /app/server /server

# Copy config files if needed
# COPY --from=builder /app/config /config

# Expose port
EXPOSE 8080

# User is already nonroot in distroless:nonroot
USER nonroot:nonroot

# Run binary
ENTRYPOINT ["/server"]
```

## Dockerfile (Alpine - With Shell)

```dockerfile
# ============================================
# Stage 1: Builder
# ============================================
FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git make

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 go build -ldflags="-w -s" -o /app/server ./cmd/server

# ============================================
# Stage 2: Production (Alpine)
# ============================================
FROM alpine:3.19 AS production

# Install ca-certificates and create user
RUN apk add --no-cache ca-certificates tzdata curl && \
    addgroup -g 1000 app && \
    adduser -u 1000 -G app -s /bin/sh -D app

WORKDIR /app

# Copy binary
COPY --from=builder /app/server ./server

# Copy migrations and configs
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/config ./config

# Change ownership
RUN chown -R app:app /app

USER app

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["./server"]
```

## Multi-Architecture Build

```dockerfile
# Dockerfile.multiarch
FROM --platform=$BUILDPLATFORM golang:1.22-alpine AS builder

ARG TARGETPLATFORM
ARG BUILDPLATFORM
ARG TARGETOS
ARG TARGETARCH

RUN apk add --no-cache git ca-certificates

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build for target platform
RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build \
    -ldflags="-w -s" \
    -o /app/server \
    ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=builder /app/server /server

EXPOSE 8080

ENTRYPOINT ["/server"]
```

```bash
# Build multi-arch images
docker buildx create --name multiarch --use
docker buildx build --platform linux/amd64,linux/arm64 \
    -t myregistry/myapp:latest \
    --push .
```

## Docker Compose

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        VERSION: ${VERSION:-dev}
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/mydb?sslmode=disable
      - REDIS_URL=redis://redis:6379
      - LOG_LEVEL=info
      - ENV=production
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 128M
        reservations:
          cpus: '0.1'
          memory: 32M

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
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  migrate:
    build:
      context: .
      target: builder
    command: ["go", "run", "./cmd/migrate", "up"]
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/mydb?sslmode=disable
    depends_on:
      db:
        condition: service_healthy

volumes:
  postgres_data:
  redis_data:
```

## .dockerignore

```
# Binaries
*.exe
*.exe~
*.dll
*.so
*.dylib
/server
/bin

# Test files
*_test.go
coverage.out
coverage.html

# Vendor (if not using)
# vendor/

# IDE
.idea
.vscode
*.swp

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

# CI/CD
.github
.gitlab-ci.yml
Makefile

# Development
.env
.env.*
tmp
```

## Makefile

```makefile
.PHONY: build docker docker-push clean

VERSION ?= $(shell git describe --tags --always --dirty)
COMMIT ?= $(shell git rev-parse --short HEAD)
BUILD_TIME ?= $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
IMAGE ?= myregistry/myapp

build:
	CGO_ENABLED=0 go build -ldflags="-w -s -X main.version=$(VERSION)" -o bin/server ./cmd/server

docker:
	docker build \
		--build-arg VERSION=$(VERSION) \
		--build-arg COMMIT=$(COMMIT) \
		--build-arg BUILD_TIME=$(BUILD_TIME) \
		-t $(IMAGE):$(VERSION) \
		-t $(IMAGE):latest \
		.

docker-push: docker
	docker push $(IMAGE):$(VERSION)
	docker push $(IMAGE):latest

docker-multiarch:
	docker buildx build \
		--platform linux/amd64,linux/arm64 \
		--build-arg VERSION=$(VERSION) \
		-t $(IMAGE):$(VERSION) \
		--push .

clean:
	rm -rf bin/
```

## CLAUDE.md Integration

```markdown
# Docker Go

## Build Commands
- `docker build -t app .` - Build production image
- `docker build --build-arg VERSION=1.0.0 -t app:1.0.0 .` - Build with version
- `docker-compose up --build` - Build and run stack
- `make docker` - Build using Makefile

## Image Sizes
- **scratch**: ~5-15MB (smallest, no shell)
- **distroless**: ~10-20MB (recommended, secure)
- **alpine**: ~15-30MB (has shell for debugging)

## Build Optimizations
- CGO_ENABLED=0 for static binary
- -ldflags="-w -s" strips debug info (30% smaller)
- go mod download for layer caching
- Multi-arch with buildx

## Debugging
- Use alpine variant for shell access
- `docker run -it app:alpine sh` - Shell access
- Connect debugger on port 2345 in dev
```

## AI Suggestions

1. **Add goreleaser integration** - Use goreleaser for cross-platform builds and releases
2. **Implement ko for Kubernetes** - Use ko for fast Go container builds without Dockerfile
3. **Add binary compression** - Use UPX to compress binary (50% smaller)
4. **Configure race detection** - Build with -race flag for development testing
5. **Add profiling endpoints** - Include pprof endpoints for production profiling
6. **Implement graceful shutdown** - Handle SIGTERM with configurable shutdown timeout
7. **Add version endpoint** - Expose build info via /version endpoint
8. **Configure SBOM** - Generate SBOM with syft during build
9. **Add cosign signing** - Sign images and verify in deployment
10. **Implement init containers** - Use init containers for migrations and setup
