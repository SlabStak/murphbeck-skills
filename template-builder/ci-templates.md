# CI/CD Templates

GitHub Actions, GitLab CI, and other CI/CD pipeline configurations for Claude Code projects.

## GitHub Actions

### Template 1: Basic CI (TypeScript/Bun)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    name: CI
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Typecheck
        run: bun run typecheck

      - name: Lint
        run: bun run lint

      - name: Test
        run: bun run test

      - name: Build
        run: bun run build
```

### Template 2: Full CI/CD with Deployment

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_ENV: production

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}

jobs:
  # ============================================
  # QUALITY CHECKS
  # ============================================
  quality:
    name: Quality Checks
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Cache dependencies
        uses: actions/cache@v4
        with:
          path: ~/.bun/install/cache
          key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb') }}
          restore-keys: ${{ runner.os }}-bun-

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Typecheck
        run: bun run typecheck

      - name: Lint
        run: bun run lint

      - name: Check formatting
        run: bunx prettier --check .

  # ============================================
  # TESTS
  # ============================================
  test:
    name: Tests
    runs-on: ubuntu-latest
    needs: quality

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Setup database
        run: bunx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test

      - name: Run tests
        run: bun run test --coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info

  # ============================================
  # BUILD
  # ============================================
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [quality, test]

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Build
        run: bun run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: |
            .next/
            dist/
          retention-days: 7

  # ============================================
  # DEPLOY (only on main)
  # ============================================
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: production
      url: ${{ steps.deploy.outputs.url }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build

      - name: Deploy to Vercel
        id: deploy
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Template 3: Monorepo CI (Turborepo)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    name: CI
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Cache turbo
        uses: actions/cache@v4
        with:
          path: .turbo
          key: ${{ runner.os }}-turbo-${{ github.sha }}
          restore-keys: |
            ${{ runner.os }}-turbo-

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Build
        run: bun run build

      - name: Lint
        run: bun run lint

      - name: Test
        run: bun run test

  # Deploy individual apps
  deploy-web:
    name: Deploy Web
    runs-on: ubuntu-latest
    needs: ci
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_WEB_PROJECT_ID }}
          working-directory: apps/web

  deploy-api:
    name: Deploy API
    runs-on: ubuntu-latest
    needs: ci
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: api
```

### Template 4: Mobile App CI (Expo)

```yaml
# .github/workflows/mobile.yml
name: Mobile CI

on:
  push:
    branches: [main]
    paths:
      - 'apps/mobile/**'
      - '.github/workflows/mobile.yml'
  pull_request:
    branches: [main]
    paths:
      - 'apps/mobile/**'

jobs:
  lint-test:
    name: Lint & Test
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Typecheck
        run: bun run typecheck
        working-directory: apps/mobile

      - name: Lint
        run: bun run lint
        working-directory: apps/mobile

      - name: Test
        run: bun run test
        working-directory: apps/mobile

  build-preview:
    name: Build Preview
    runs-on: ubuntu-latest
    needs: lint-test
    if: github.event_name == 'pull_request'

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Build preview
        run: eas build --platform all --profile preview --non-interactive
        working-directory: apps/mobile

  build-production:
    name: Build Production
    runs-on: ubuntu-latest
    needs: lint-test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Build production
        run: eas build --platform all --profile production --non-interactive --auto-submit
        working-directory: apps/mobile
```

### Template 5: Docker Build & Push

```yaml
# .github/workflows/docker.yml
name: Docker

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    name: Build & Push
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
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
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### Template 6: Release Workflow

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags: ['v*']

permissions:
  contents: write

jobs:
  release:
    name: Create Release
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Build
        run: bun run build

      - name: Generate changelog
        id: changelog
        uses: orhun/git-cliff-action@v3
        with:
          config: cliff.toml
          args: --latest --strip header

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          body: ${{ steps.changelog.outputs.content }}
          draft: false
          prerelease: ${{ contains(github.ref, 'alpha') || contains(github.ref, 'beta') }}
          files: |
            dist/*
```

### Template 7: Scheduled Security Scan

```yaml
# .github/workflows/security.yml
name: Security

on:
  schedule:
    - cron: '0 0 * * 1'  # Every Monday at midnight
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  audit:
    name: Dependency Audit
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Audit dependencies
        run: bunx audit-ci --config audit-ci.json
        continue-on-error: true

      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  codeql:
    name: CodeQL Analysis
    runs-on: ubuntu-latest
    permissions:
      security-events: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript-typescript

      - name: Autobuild
        uses: github/codeql-action/autobuild@v3

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3

  secrets:
    name: Secret Scanning
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: TruffleHog Scan
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          extra_args: --only-verified
```

## GitLab CI

### Template 1: Basic GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - quality
  - test
  - build
  - deploy

variables:
  BUN_INSTALL: $CI_PROJECT_DIR/.bun
  PATH: $BUN_INSTALL/bin:$PATH

.bun-cache:
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - .bun/install/cache
      - node_modules/

before_script:
  - curl -fsSL https://bun.sh/install | bash
  - bun install --frozen-lockfile

# Quality checks
typecheck:
  stage: quality
  extends: .bun-cache
  script:
    - bun run typecheck

lint:
  stage: quality
  extends: .bun-cache
  script:
    - bun run lint

# Tests
test:
  stage: test
  extends: .bun-cache
  services:
    - postgres:16-alpine
  variables:
    POSTGRES_DB: test
    POSTGRES_USER: test
    POSTGRES_PASSWORD: test
    DATABASE_URL: postgresql://test:test@postgres:5432/test
  script:
    - bunx prisma migrate deploy
    - bun run test --coverage
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

# Build
build:
  stage: build
  extends: .bun-cache
  script:
    - bun run build
  artifacts:
    paths:
      - dist/
      - .next/
    expire_in: 1 week

# Deploy
deploy:production:
  stage: deploy
  extends: .bun-cache
  script:
    - bunx vercel --prod --token=$VERCEL_TOKEN
  environment:
    name: production
    url: https://your-app.vercel.app
  only:
    - main
  when: manual
```

## Bitbucket Pipelines

### Template 1: Basic Bitbucket Pipeline

```yaml
# bitbucket-pipelines.yml
image: oven/bun:1

definitions:
  caches:
    bun: ~/.bun/install/cache

  steps:
    - step: &quality
        name: Quality Checks
        caches:
          - bun
        script:
          - bun install --frozen-lockfile
          - bun run typecheck
          - bun run lint

    - step: &test
        name: Tests
        caches:
          - bun
        services:
          - postgres
        script:
          - bun install --frozen-lockfile
          - bunx prisma migrate deploy
          - bun run test

    - step: &build
        name: Build
        caches:
          - bun
        script:
          - bun install --frozen-lockfile
          - bun run build
        artifacts:
          - dist/**
          - .next/**

pipelines:
  default:
    - step: *quality
    - step: *test
    - step: *build

  branches:
    main:
      - step: *quality
      - step: *test
      - step: *build
      - step:
          name: Deploy Production
          deployment: production
          script:
            - pipe: atlassian/vercel-deploy:1.0.0
              variables:
                VERCEL_TOKEN: $VERCEL_TOKEN

  pull-requests:
    '**':
      - step: *quality
      - step: *test

definitions:
  services:
    postgres:
      image: postgres:16-alpine
      variables:
        POSTGRES_DB: test
        POSTGRES_USER: test
        POSTGRES_PASSWORD: test
```

## Reusable Workflow Components

### Composite Action: Setup Bun Project

```yaml
# .github/actions/setup-bun-project/action.yml
name: Setup Bun Project
description: Setup Bun and install dependencies with caching

inputs:
  bun-version:
    description: Bun version to install
    required: false
    default: 'latest'
  working-directory:
    description: Working directory
    required: false
    default: '.'

runs:
  using: composite
  steps:
    - name: Setup Bun
      uses: oven-sh/setup-bun@v1
      with:
        bun-version: ${{ inputs.bun-version }}

    - name: Cache dependencies
      uses: actions/cache@v4
      with:
        path: ~/.bun/install/cache
        key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb') }}
        restore-keys: ${{ runner.os }}-bun-

    - name: Install dependencies
      shell: bash
      working-directory: ${{ inputs.working-directory }}
      run: bun install --frozen-lockfile
```

### Reusable Workflow: Quality Checks

```yaml
# .github/workflows/reusable-quality.yml
name: Quality Checks

on:
  workflow_call:
    inputs:
      working-directory:
        type: string
        default: '.'

jobs:
  quality:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ${{ inputs.working-directory }}

    steps:
      - uses: actions/checkout@v4

      - uses: ./.github/actions/setup-bun-project
        with:
          working-directory: ${{ inputs.working-directory }}

      - name: Typecheck
        run: bun run typecheck

      - name: Lint
        run: bun run lint

      - name: Format check
        run: bunx prettier --check .
```

## CI Configuration Best Practices

### 1. Caching Strategy

```yaml
# Optimal cache configuration
- name: Cache dependencies
  uses: actions/cache@v4
  with:
    path: |
      ~/.bun/install/cache
      node_modules
      .turbo
    key: ${{ runner.os }}-${{ hashFiles('**/bun.lockb') }}-${{ hashFiles('**/*.ts', '**/*.tsx') }}
    restore-keys: |
      ${{ runner.os }}-${{ hashFiles('**/bun.lockb') }}-
      ${{ runner.os }}-
```

### 2. Parallel Jobs

```yaml
jobs:
  # Run these in parallel
  typecheck:
    runs-on: ubuntu-latest
    steps: [...]

  lint:
    runs-on: ubuntu-latest
    steps: [...]

  test:
    runs-on: ubuntu-latest
    steps: [...]

  # This depends on all above
  build:
    needs: [typecheck, lint, test]
    runs-on: ubuntu-latest
    steps: [...]
```

### 3. Matrix Builds

```yaml
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        bun-version: ['1.0', '1.1', 'latest']
        exclude:
          - os: windows-latest
            bun-version: '1.0'

    runs-on: ${{ matrix.os }}
    steps:
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: ${{ matrix.bun-version }}
```

### 4. Environment Protection

```yaml
jobs:
  deploy:
    environment:
      name: production
      url: https://myapp.com

    # Requires approval from team-leads
    # Set in repo Settings > Environments
```

### 5. Secrets Management

```yaml
# Use OIDC for cloud providers (no long-lived secrets)
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::123456789:role/github-actions
    aws-region: us-east-1

# Reference secrets securely
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  # Never echo secrets
  # Never use secrets in job names or URLs
```
