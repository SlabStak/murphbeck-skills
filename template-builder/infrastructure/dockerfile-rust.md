# Dockerfile Rust Template

> Production-optimized Rust Dockerfile with multi-stage builds, static linking, and minimal runtime

## Overview

This template provides a production-ready Rust Dockerfile with:
- Multi-stage build for minimal image size
- Static binary with musl for scratch images
- Cargo Chef for dependency caching
- Cross-compilation support
- Security hardening

## Quick Start

```bash
# Build image
docker build -t my-rust-app .

# Run container
docker run -p 8080:8080 my-rust-app

# Build release with optimizations
docker build --build-arg PROFILE=release -t my-rust-app .
```

## Dockerfile (With Cargo Chef - Optimized Caching)

```dockerfile
# ============================================
# Stage 1: Chef (Prepare Recipe)
# ============================================
FROM rust:1.76-alpine AS chef

RUN apk add --no-cache musl-dev pkgconfig openssl-dev

RUN cargo install cargo-chef

WORKDIR /app

# ============================================
# Stage 2: Planner (Generate Recipe)
# ============================================
FROM chef AS planner

COPY . .
RUN cargo chef prepare --recipe-path recipe.json

# ============================================
# Stage 3: Builder
# ============================================
FROM chef AS builder

# Copy recipe and build dependencies first (cached layer)
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json

# Copy source and build application
COPY . .

ARG VERSION=dev
ENV RUSTFLAGS="-C target-feature=+crt-static"

RUN cargo build --release --bin server && \
    strip target/release/server

# ============================================
# Stage 4: Production (Scratch)
# ============================================
FROM scratch AS production

# Copy CA certificates
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy binary
COPY --from=builder /app/target/release/server /server

# Copy static files if needed
# COPY --from=builder /app/static /static

EXPOSE 8080

ENTRYPOINT ["/server"]
```

## Dockerfile (Musl Static - Smallest)

```dockerfile
# ============================================
# Stage 1: Builder
# ============================================
FROM rust:1.76-alpine AS builder

# Install build dependencies
RUN apk add --no-cache musl-dev pkgconfig openssl-dev openssl-libs-static

WORKDIR /app

# Copy manifests
COPY Cargo.toml Cargo.lock ./

# Create dummy src for dependency caching
RUN mkdir src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# Copy real source
COPY . .

# Build release with static linking
ENV RUSTFLAGS="-C target-feature=+crt-static -C link-self-contained=yes"
RUN touch src/main.rs && \
    cargo build --release && \
    strip target/release/server

# ============================================
# Stage 2: Production
# ============================================
FROM scratch

COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /app/target/release/server /server

EXPOSE 8080

ENTRYPOINT ["/server"]
```

## Dockerfile (Debian - With Dependencies)

```dockerfile
# ============================================
# Stage 1: Builder
# ============================================
FROM rust:1.76-slim-bookworm AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy manifests for dependency caching
COPY Cargo.toml Cargo.lock ./

# Build dependencies only
RUN mkdir src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# Copy source and build
COPY . .
RUN touch src/main.rs && cargo build --release

# ============================================
# Stage 2: Production
# ============================================
FROM debian:bookworm-slim AS production

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    curl \
    && apt-get upgrade -y \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r app && useradd -r -g app app

WORKDIR /app

COPY --from=builder /app/target/release/server ./server

RUN chown -R app:app /app
USER app

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["./server"]
```

## Dockerfile (Cross-Compilation)

```dockerfile
# Cross-compile from x86_64 to ARM64
FROM --platform=$BUILDPLATFORM rust:1.76-alpine AS builder

ARG TARGETPLATFORM
ARG BUILDPLATFORM

# Install cross-compilation tools
RUN apk add --no-cache musl-dev

# Add target
RUN case "$TARGETPLATFORM" in \
    "linux/amd64") TARGET="x86_64-unknown-linux-musl" ;; \
    "linux/arm64") TARGET="aarch64-unknown-linux-musl" ;; \
    *) echo "Unsupported platform: $TARGETPLATFORM" && exit 1 ;; \
    esac && \
    rustup target add $TARGET && \
    echo $TARGET > /target.txt

WORKDIR /app

COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs

RUN TARGET=$(cat /target.txt) && \
    cargo build --release --target $TARGET && \
    rm -rf src

COPY . .

RUN TARGET=$(cat /target.txt) && \
    touch src/main.rs && \
    cargo build --release --target $TARGET && \
    cp target/$TARGET/release/server /server

FROM scratch
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /server /server
EXPOSE 8080
ENTRYPOINT ["/server"]
```

## Docker Compose

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/mydb
      - REDIS_URL=redis://redis:6379
      - RUST_LOG=info
      - RUST_BACKTRACE=1
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
          memory: 64M

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## .dockerignore

```
# Build artifacts
target/
Cargo.lock.bak

# IDE
.idea
.vscode
*.swp

# OS
.DS_Store

# Git
.git
.gitignore

# Docker
Dockerfile*
docker-compose*

# Documentation
README.md
docs
*.md

# Development
.env
.env.*
```

## Cargo.toml Optimizations

```toml
[package]
name = "server"
version = "0.1.0"
edition = "2021"

[dependencies]
tokio = { version = "1", features = ["full"] }
axum = "0.7"
serde = { version = "1", features = ["derive"] }
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }

[profile.release]
opt-level = 3
lto = true
codegen-units = 1
panic = "abort"
strip = true

[profile.release-small]
inherits = "release"
opt-level = "z"
```

## CLAUDE.md Integration

```markdown
# Docker Rust

## Build Commands
- `docker build -t app .` - Build production image
- `docker build --target builder -t app:builder .` - Build builder image
- `cargo chef prepare` - Generate dependency recipe
- `make docker` - Build using Makefile

## Image Sizes
- **scratch + musl**: ~5-10MB (smallest)
- **distroless**: ~10-15MB (secure)
- **alpine**: ~15-25MB (has shell)
- **debian-slim**: ~30-50MB (full glibc)

## Build Optimizations
- cargo-chef for dependency caching (5-10x faster rebuilds)
- LTO enabled for smaller binaries
- codegen-units=1 for better optimization
- strip=true removes debug symbols

## Debugging
- Use debian variant for debugging tools
- RUST_BACKTRACE=1 for stack traces
- RUST_LOG=debug for detailed logging
```

## AI Suggestions

1. **Add sccache** - Use sccache for distributed build caching across CI runs
2. **Implement cargo-audit** - Add security vulnerability scanning in CI
3. **Add cargo-deny** - Check licenses and duplicate dependencies
4. **Configure flamegraph** - Include profiling tools for performance analysis
5. **Add MIRI testing** - Run undefined behavior checks in CI
6. **Implement cargo-llvm-cov** - Add code coverage with LLVM instrumentation
7. **Add fuzz testing** - Include cargo-fuzz targets in CI
8. **Configure cross-rs** - Use cross for easier cross-compilation
9. **Add binary signing** - Sign releases with cosign
10. **Implement incremental builds** - Configure sccache with S3/GCS backend
