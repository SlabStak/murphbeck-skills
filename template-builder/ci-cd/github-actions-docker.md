# GitHub Actions Docker Template

> Production-ready GitHub Actions workflows for Docker image building, scanning, and multi-registry publishing

## Overview

This template provides GitHub Actions workflows with:
- Multi-platform Docker builds (amd64/arm64)
- Multi-registry publishing (GHCR, Docker Hub, ECR)
- Image scanning and SBOM generation
- Build caching optimization
- Automated tagging strategies

## Quick Start

```bash
# Create workflows directory
mkdir -p .github/workflows

# Copy workflow files
cp docker-build.yml .github/workflows/
cp docker-release.yml .github/workflows/

# Push to trigger workflow
git push origin main
```

## Docker Build Workflow

```yaml
# .github/workflows/docker-build.yml
name: Docker Build

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  workflow_dispatch:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    name: Build Image
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      security-events: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
        with:
          install: true
          driver-opts: |
            image=moby/buildkit:latest
            network=host

      - name: Login to GitHub Container Registry
        if: github.event_name != 'pull_request'
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix=
            type=raw,value=latest,enable=${{ github.ref == format('refs/heads/{0}', 'main') }}

      - name: Build and push
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile
          platforms: linux/amd64,linux/arm64
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            BUILD_DATE=${{ github.event.repository.updated_at }}
            VCS_REF=${{ github.sha }}
            VERSION=${{ github.ref_name }}
          provenance: true
          sbom: true

      - name: Export digest
        if: github.event_name != 'pull_request'
        run: |
          mkdir -p /tmp/digests
          digest="${{ steps.build.outputs.digest }}"
          touch "/tmp/digests/${digest#sha256:}"

      - name: Upload digest
        if: github.event_name != 'pull_request'
        uses: actions/upload-artifact@v4
        with:
          name: digests
          path: /tmp/digests/*
          if-no-files-found: error
          retention-days: 1

  scan:
    name: Scan Image
    runs-on: ubuntu-latest
    needs: [build]
    if: github.event_name != 'pull_request'
    permissions:
      contents: read
      security-events: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Run Trivy in table format
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          format: 'table'
          exit-code: '1'
          ignore-unfixed: true
          severity: 'CRITICAL'

  test:
    name: Test Image
    runs-on: ubuntu-latest
    needs: [build]
    if: github.event_name != 'pull_request'

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Run container structure tests
        run: |
          docker run --rm \
            -v /var/run/docker.sock:/var/run/docker.sock \
            -v $(pwd)/tests:/tests \
            gcr.io/gcp-runtimes/container-structure-test:latest \
            test --image ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            --config /tests/container-structure-test.yaml

      - name: Run smoke tests
        run: |
          docker run -d --name test-container \
            -p 8080:8080 \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          sleep 10
          curl -f http://localhost:8080/health || exit 1
          docker logs test-container
          docker stop test-container
```

## Docker Release Workflow

```yaml
# .github/workflows/docker-release.yml
name: Docker Release

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to release'
        required: true

permissions:
  contents: write
  packages: write
  id-token: write
  attestations: write

env:
  GHCR_REGISTRY: ghcr.io
  DOCKERHUB_REGISTRY: docker.io
  ECR_REGISTRY: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    name: Build Multi-Platform
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        platform:
          - linux/amd64
          - linux/arm64
          - linux/arm/v7

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Prepare platform
        run: |
          platform=${{ matrix.platform }}
          echo "PLATFORM_PAIR=${platform//\//-}" >> $GITHUB_ENV

      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.GHCR_REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          registry: ${{ env.DOCKERHUB_REGISTRY }}
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions
          aws-region: us-east-1

      - name: Login to Amazon ECR
        uses: aws-actions/amazon-ecr-login@v2

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: |
            ${{ env.GHCR_REGISTRY }}/${{ env.IMAGE_NAME }}
            ${{ env.DOCKERHUB_REGISTRY }}/${{ env.IMAGE_NAME }}
            ${{ env.ECR_REGISTRY }}/${{ github.event.repository.name }}

      - name: Build and push by digest
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: ${{ matrix.platform }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          outputs: type=image,name=${{ env.GHCR_REGISTRY }}/${{ env.IMAGE_NAME }},push-by-digest=true,name-canonical=true,push=true

      - name: Export digest
        run: |
          mkdir -p /tmp/digests
          digest="${{ steps.build.outputs.digest }}"
          touch "/tmp/digests/${digest#sha256:}"

      - name: Upload digest
        uses: actions/upload-artifact@v4
        with:
          name: digests-${{ env.PLATFORM_PAIR }}
          path: /tmp/digests/*
          if-no-files-found: error
          retention-days: 1

  merge:
    name: Create Multi-Platform Manifest
    runs-on: ubuntu-latest
    needs: [build]
    steps:
      - name: Download digests
        uses: actions/download-artifact@v4
        with:
          path: /tmp/digests
          pattern: digests-*
          merge-multiple: true

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.GHCR_REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          registry: ${{ env.DOCKERHUB_REGISTRY }}
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions
          aws-region: us-east-1

      - name: Login to Amazon ECR
        uses: aws-actions/amazon-ecr-login@v2

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: |
            ${{ env.GHCR_REGISTRY }}/${{ env.IMAGE_NAME }}
            ${{ env.DOCKERHUB_REGISTRY }}/${{ env.IMAGE_NAME }}
            ${{ env.ECR_REGISTRY }}/${{ github.event.repository.name }}
          tags: |
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=semver,pattern={{major}}
            type=sha

      - name: Create manifest list and push
        working-directory: /tmp/digests
        run: |
          docker buildx imagetools create $(jq -cr '.tags | map("-t " + .) | join(" ")' <<< "$DOCKER_METADATA_OUTPUT_JSON") \
            $(printf '${{ env.GHCR_REGISTRY }}/${{ env.IMAGE_NAME }}@sha256:%s ' *)

      - name: Inspect image
        run: |
          docker buildx imagetools inspect ${{ env.GHCR_REGISTRY }}/${{ env.IMAGE_NAME }}:${{ steps.meta.outputs.version }}

  attest:
    name: Generate Attestations
    runs-on: ubuntu-latest
    needs: [merge]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.GHCR_REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.GHCR_REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: type=semver,pattern={{version}}

      - name: Generate SBOM
        uses: anchore/sbom-action@v0
        with:
          image: ${{ env.GHCR_REGISTRY }}/${{ env.IMAGE_NAME }}:${{ steps.meta.outputs.version }}
          format: spdx-json
          output-file: sbom.spdx.json

      - name: Attest SBOM
        uses: actions/attest-sbom@v1
        with:
          subject-name: ${{ env.GHCR_REGISTRY }}/${{ env.IMAGE_NAME }}
          subject-digest: ${{ needs.merge.outputs.digest }}
          sbom-path: sbom.spdx.json
          push-to-registry: true

      - name: Upload SBOM
        uses: actions/upload-artifact@v4
        with:
          name: sbom
          path: sbom.spdx.json

  sign:
    name: Sign Image
    runs-on: ubuntu-latest
    needs: [merge]
    steps:
      - name: Install cosign
        uses: sigstore/cosign-installer@v3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.GHCR_REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.GHCR_REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: type=semver,pattern={{version}}

      - name: Sign image with cosign
        env:
          COSIGN_EXPERIMENTAL: 1
        run: |
          cosign sign --yes ${{ env.GHCR_REGISTRY }}/${{ env.IMAGE_NAME }}@${{ needs.merge.outputs.digest }}

      - name: Verify signature
        run: |
          cosign verify \
            --certificate-identity-regexp "https://github.com/${{ github.repository }}/*" \
            --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
            ${{ env.GHCR_REGISTRY }}/${{ env.IMAGE_NAME }}:${{ steps.meta.outputs.version }}
```

## Multi-Stage Dockerfile

```dockerfile
# Dockerfile
# syntax=docker/dockerfile:1.6

# Build stage
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production

# Copy source
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Add labels
LABEL org.opencontainers.image.source="https://github.com/owner/repo"
LABEL org.opencontainers.image.description="Application description"
LABEL org.opencontainers.image.licenses="MIT"

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

# Copy built files
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Set user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start application
CMD ["node", "dist/main.js"]
```

## Container Structure Test

```yaml
# tests/container-structure-test.yaml
schemaVersion: 2.0.0

metadataTest:
  exposedPorts: ["3000"]
  user: "nodejs"
  workdir: "/app"
  labels:
    - key: "org.opencontainers.image.source"
      value: "https://github.com/owner/repo"

fileExistenceTests:
  - name: "App directory exists"
    path: "/app"
    shouldExist: true
  - name: "Node modules exist"
    path: "/app/node_modules"
    shouldExist: true
  - name: "Built files exist"
    path: "/app/dist"
    shouldExist: true

fileContentTests:
  - name: "Package.json has correct name"
    path: "/app/package.json"
    expectedContents: ["\"name\":"]

commandTests:
  - name: "Node is available"
    command: "node"
    args: ["--version"]
    expectedOutput: ["v20"]
  - name: "Health check works"
    setup: [["sh", "-c", "node dist/main.js &"]]
    teardown: [["sh", "-c", "pkill -f node"]]
    command: "wget"
    args: ["--spider", "-q", "http://localhost:3000/health"]
    exitCode: 0
```

## Docker Compose for Local Testing

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://test:test@db:5432/test
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 5

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: test
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test"]
      interval: 5s
      timeout: 5s
      retries: 5

  test:
    image: gcr.io/gcp-runtimes/container-structure-test:latest
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./tests:/tests:ro
    depends_on:
      app:
        condition: service_healthy
    command: >
      test
      --image ${IMAGE_NAME:-app}
      --config /tests/container-structure-test.yaml
```

## Hadolint Configuration

```yaml
# .hadolint.yaml
ignored:
  - DL3008  # Pin versions in apt-get install
  - DL3018  # Pin versions in apk add

trustedRegistries:
  - docker.io
  - gcr.io
  - ghcr.io

override:
  error:
    - DL3001  # Pipe curl/wget to interpreter
    - DL3002  # Setting WORKDIR to /
    - DL3003  # Using cd instead of WORKDIR
```

## CLAUDE.md Integration

```markdown
# GitHub Actions - Docker

## Commands
- Build locally: `docker build -t app .`
- Test image: `container-structure-test test --image app --config tests/container-structure-test.yaml`
- Scan image: `trivy image app`
- Sign image: `cosign sign --yes ghcr.io/owner/repo:latest`

## Key Workflows
- `docker-build.yml` - Build and scan on every push
- `docker-release.yml` - Multi-platform release with signing

## Multi-Platform Support
- linux/amd64 - x86_64 servers
- linux/arm64 - ARM servers (AWS Graviton, Apple Silicon)
- linux/arm/v7 - Raspberry Pi and similar

## Registry Targets
- GHCR (ghcr.io) - GitHub Container Registry
- Docker Hub (docker.io) - Public registry
- ECR - AWS Elastic Container Registry
```

## AI Suggestions

1. **Add multi-platform builds** - ARM64 for cost savings
2. **Implement image scanning** - Trivy, Snyk integration
3. **Configure SBOM generation** - Software bill of materials
4. **Add image signing** - cosign/sigstore
5. **Implement attestations** - Provenance and SBOM
6. **Configure build caching** - GitHub Actions cache
7. **Add container structure tests** - Validate image structure
8. **Implement multi-registry publishing** - GHCR, Docker Hub, ECR
9. **Configure Hadolint** - Dockerfile linting
10. **Add dependency updates** - Renovate for base images
