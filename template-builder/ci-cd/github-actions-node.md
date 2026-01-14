# GitHub Actions Node.js Template

> Production-ready GitHub Actions workflows for Node.js applications with testing, building, and deployment

## Overview

This template provides GitHub Actions workflows with:
- Multi-version Node.js testing
- Caching for faster builds
- Security scanning and auditing
- Docker build and push
- Automated releases and deployments

## Quick Start

```bash
# Create workflows directory
mkdir -p .github/workflows

# Copy workflow files
cp ci.yml .github/workflows/
cp release.yml .github/workflows/

# Push to trigger workflow
git push origin main
```

## CI Workflow

```yaml
# .github/workflows/ci.yml
name: CI

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
  NODE_VERSION: '20'
  PNPM_VERSION: '8'

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run ESLint
        run: pnpm lint

      - name: Run Prettier
        run: pnpm format:check

      - name: Run TypeScript
        run: pnpm typecheck

  test:
    name: Test
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        node-version: [18, 20, 22]
        os: [ubuntu-latest]
        include:
          - node-version: 20
            os: windows-latest
          - node-version: 20
            os: macos-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test:coverage

      - name: Upload coverage
        if: matrix.node-version == 20 && matrix.os == 'ubuntu-latest'
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true
          token: ${{ secrets.CODECOV_TOKEN }}

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/
          retention-days: 7

  security:
    name: Security
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      actions: read
      contents: read
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run npm audit
        run: pnpm audit --audit-level=high
        continue-on-error: true

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: javascript-typescript

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2

  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: [build]
    services:
      postgres:
        image: postgres:16
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

      redis:
        image: redis:7
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build
          path: dist/

      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379

      - name: Upload E2E test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-results
          path: test-results/
          retention-days: 7
```

## Release Workflow

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      release_type:
        description: 'Release type'
        required: true
        default: 'patch'
        type: choice
        options:
          - patch
          - minor
          - major

permissions:
  contents: write
  packages: write
  id-token: write

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '8'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    outputs:
      new_release_published: ${{ steps.semantic.outputs.new_release_published }}
      new_release_version: ${{ steps.semantic.outputs.new_release_version }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Semantic Release
        id: semantic
        uses: cycjimmy/semantic-release-action@v4
        with:
          extra_plugins: |
            @semantic-release/changelog
            @semantic-release/git
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

  docker:
    name: Build Docker
    runs-on: ubuntu-latest
    needs: [release]
    if: needs.release.outputs.new_release_published == 'true'
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Container Registry
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
            type=semver,pattern={{version}},value=${{ needs.release.outputs.new_release_version }}
            type=semver,pattern={{major}}.{{minor}},value=${{ needs.release.outputs.new_release_version }}
            type=semver,pattern={{major}},value=${{ needs.release.outputs.new_release_version }}
            type=sha

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            VERSION=${{ needs.release.outputs.new_release_version }}

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [release, docker]
    if: needs.release.outputs.new_release_published == 'true'
    environment:
      name: staging
      url: https://staging.example.com
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy to staging
        uses: azure/k8s-deploy@v4
        with:
          namespace: staging
          manifests: |
            k8s/staging/
          images: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ needs.release.outputs.new_release_version }}

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [release, docker, deploy-staging]
    if: needs.release.outputs.new_release_published == 'true'
    environment:
      name: production
      url: https://example.com
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy to production
        uses: azure/k8s-deploy@v4
        with:
          namespace: production
          manifests: |
            k8s/production/
          images: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ needs.release.outputs.new_release_version }}
          strategy: canary
          percentage: 20
```

## Pull Request Workflow

```yaml
# .github/workflows/pr.yml
name: Pull Request

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

concurrency:
  group: pr-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  validate:
    name: Validate PR
    runs-on: ubuntu-latest
    if: github.event.pull_request.draft == false
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Validate PR title
        uses: amannn/action-semantic-pull-request@v5
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          types: |
            feat
            fix
            docs
            style
            refactor
            perf
            test
            build
            ci
            chore
            revert
          requireScope: false

      - name: Check for breaking changes
        if: contains(github.event.pull_request.title, '!')
        run: |
          echo "::warning::This PR contains breaking changes"

  size-check:
    name: Check PR Size
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Check PR size
        uses: codelytv/pr-size-labeler@v1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          xs_label: 'size/xs'
          xs_max_size: 10
          s_label: 'size/s'
          s_max_size: 100
          m_label: 'size/m'
          m_max_size: 500
          l_label: 'size/l'
          l_max_size: 1000
          xl_label: 'size/xl'
          fail_if_xl: true

  preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    needs: [validate]
    permissions:
      pull-requests: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy Preview
        id: vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          scope: ${{ secrets.VERCEL_ORG_ID }}

      - name: Comment Preview URL
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Preview deployed to: ${{ steps.vercel.outputs.preview-url }}'
            })
```

## Dependency Update Workflow

```yaml
# .github/workflows/dependencies.yml
name: Dependencies

on:
  schedule:
    - cron: '0 0 * * 1'  # Weekly on Monday
  workflow_dispatch:

jobs:
  update:
    name: Update Dependencies
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Update dependencies
        run: |
          pnpm update --interactive --latest
          pnpm install

      - name: Run tests
        run: pnpm test

      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v5
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: 'chore(deps): update dependencies'
          title: 'chore(deps): update dependencies'
          body: |
            ## Summary
            Automated dependency updates.

            ## Changes
            - Updated all dependencies to latest versions
            - All tests passing

            ## Checklist
            - [ ] Review updated packages
            - [ ] Check for breaking changes
          branch: deps/update
          labels: dependencies
```

## Reusable Workflows

```yaml
# .github/workflows/reusable-test.yml
name: Reusable Test Workflow

on:
  workflow_call:
    inputs:
      node-version:
        description: 'Node.js version'
        required: false
        default: '20'
        type: string
      working-directory:
        description: 'Working directory'
        required: false
        default: '.'
        type: string
    secrets:
      NPM_TOKEN:
        required: false

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ${{ inputs.working-directory }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Run tests
        run: pnpm test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          directory: ${{ inputs.working-directory }}
```

## Composite Action

```yaml
# .github/actions/setup-node-pnpm/action.yml
name: 'Setup Node.js with pnpm'
description: 'Sets up Node.js and pnpm with caching'

inputs:
  node-version:
    description: 'Node.js version'
    required: false
    default: '20'
  pnpm-version:
    description: 'pnpm version'
    required: false
    default: '8'
  install-dependencies:
    description: 'Install dependencies'
    required: false
    default: 'true'

runs:
  using: 'composite'
  steps:
    - name: Setup pnpm
      uses: pnpm/action-setup@v2
      with:
        version: ${{ inputs.pnpm-version }}

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: 'pnpm'

    - name: Install dependencies
      if: inputs.install-dependencies == 'true'
      shell: bash
      run: pnpm install --frozen-lockfile
```

## CLAUDE.md Integration

```markdown
# GitHub Actions - Node.js

## Commands
- Run workflows locally: `act -j test`
- Check workflow syntax: `actionlint`
- View secrets: `gh secret list`

## Key Workflows
- `ci.yml` - Lint, test, build on every PR
- `release.yml` - Semantic release on main
- `pr.yml` - PR validation and previews
- `dependencies.yml` - Weekly dependency updates

## Caching
- pnpm dependencies cached automatically
- Docker layers cached with `type=gha`
- Build artifacts cached between jobs

## Secrets Required
- `NPM_TOKEN` - npm publish token
- `CODECOV_TOKEN` - Code coverage uploads
- `VERCEL_TOKEN` - Preview deployments
```

## AI Suggestions

1. **Add matrix testing** - Test across Node.js versions
2. **Implement caching** - Cache dependencies and builds
3. **Add security scanning** - CodeQL and npm audit
4. **Configure preview deployments** - PR previews
5. **Implement semantic release** - Automated versioning
6. **Add E2E testing** - Playwright/Cypress in CI
7. **Configure branch protection** - Required status checks
8. **Add performance testing** - Lighthouse CI
9. **Implement monorepo support** - Turborepo/nx integration
10. **Add container scanning** - Trivy/Snyk for Docker images
