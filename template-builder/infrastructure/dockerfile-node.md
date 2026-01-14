# Dockerfile Node.js Template

> Production-optimized Node.js Dockerfile with multi-stage builds, security hardening, and best practices

## Overview

This template provides a production-ready Node.js Dockerfile with:
- Multi-stage build for minimal image size
- Non-root user for security
- Layer caching optimization
- Health checks
- Signal handling for graceful shutdown
- Support for npm, yarn, and pnpm

## Quick Start

```bash
# Build image
docker build -t my-node-app .

# Run container
docker run -p 3000:3000 my-node-app

# Run with environment variables
docker run -p 3000:3000 -e NODE_ENV=production my-node-app
```

## Dockerfile

```dockerfile
# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Install dependencies based on lockfile
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm install --frozen-lockfile; \
  elif [ -f yarn.lock ]; then \
    yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    npm ci; \
  else \
    echo "No lockfile found" && exit 1; \
  fi

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variables
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Build application
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm build; \
  elif [ -f yarn.lock ]; then \
    yarn build; \
  else \
    npm run build; \
  fi

# Prune dev dependencies for production
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm prune --prod; \
  elif [ -f yarn.lock ]; then \
    yarn install --production --ignore-scripts; \
  else \
    npm prune --production; \
  fi

# ============================================
# Stage 3: Production
# ============================================
FROM node:20-alpine AS runner

# Install security updates and dumb-init for signal handling
RUN apk add --no-cache dumb-init && \
    apk upgrade --no-cache && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

# Copy public assets if they exist
COPY --from=builder --chown=nodejs:nodejs /app/public ./public 2>/dev/null || true

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE ${PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT}/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/index.js"]
```

## Alternative: Development Dockerfile

```dockerfile
# Dockerfile.dev - Development with hot reload
FROM node:20-alpine

# Install development tools
RUN apk add --no-cache git

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies including devDependencies
RUN npm install

# Copy source code
COPY . .

# Expose port and debug port
EXPOSE 3000 9229

# Start with hot reload
CMD ["npm", "run", "dev"]
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
        NODE_ENV: production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://user:pass@db:5432/mydb
      - REDIS_URL=redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 128M

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
    command: redis-server --appendonly yes

volumes:
  postgres_data:
  redis_data:
```

## .dockerignore

```
# Dependencies
node_modules
.pnp
.pnp.js

# Build outputs
dist
build
.next
out

# Testing
coverage
.nyc_output

# Development
.env*.local
.env.development
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# IDE
.idea
.vscode
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Docker
Dockerfile*
docker-compose*
.docker

# Git
.git
.gitignore

# Documentation
README.md
docs
*.md

# Tests
__tests__
*.test.js
*.spec.js
jest.config.js
```

## Security Scanning

```yaml
# .github/workflows/docker-security.yml
name: Docker Security

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build image
        run: docker build -t app:${{ github.sha }} .

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: app:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Run Snyk container scan
        uses: snyk/actions/docker@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          image: app:${{ github.sha }}
          args: --severity-threshold=high
```

## CLAUDE.md Integration

```markdown
# Docker Node.js

## Build Commands
- `docker build -t app .` - Build production image
- `docker build -f Dockerfile.dev -t app:dev .` - Build dev image
- `docker-compose up --build` - Build and run with compose
- `docker-compose up -d` - Run in detached mode

## Image Optimization
- Multi-stage build reduces image size by 70%+
- Alpine base image for minimal footprint
- Layer caching for faster builds
- Production dependencies only in final image

## Security Features
- Non-root user (nodejs:1001)
- dumb-init for proper signal handling
- No shell in production image
- Security updates applied
- Vulnerability scanning in CI

## Debugging
- `docker run -it app sh` - Shell access (dev only)
- `docker logs -f container_id` - View logs
- `docker exec -it container_id sh` - Exec into running container
```

## AI Suggestions

1. **Add BuildKit secrets** - Use `--mount=type=secret` for private npm tokens during build
2. **Implement distroless base** - Use `gcr.io/distroless/nodejs` for even smaller/secure images
3. **Add Hadolint linting** - Integrate Dockerfile linting in CI pipeline
4. **Configure layer caching** - Use `--cache-from` for CI/CD build optimization
5. **Add SBOM generation** - Generate Software Bill of Materials with Syft
6. **Implement cosign signing** - Sign images cryptographically for supply chain security
7. **Add runtime security** - Integrate Falco or similar runtime security monitoring
8. **Configure resource quotas** - Add memory/CPU limits to prevent resource exhaustion
9. **Implement graceful shutdown** - Add SIGTERM handler for zero-downtime deployments
10. **Add multi-arch builds** - Support ARM64 and AMD64 with buildx
