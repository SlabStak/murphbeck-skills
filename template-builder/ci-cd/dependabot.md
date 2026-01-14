# Dependabot Configuration Template

> Production-ready Dependabot configurations for automated dependency updates

## Overview

This template provides Dependabot configurations with:
- Multi-ecosystem support
- Custom scheduling and grouping
- Security-focused updates
- Auto-merge policies
- Monorepo support

## Quick Start

```bash
# Create .github/dependabot.yml
mkdir -p .github
touch .github/dependabot.yml

# Dependabot will automatically:
# 1. Check for updates on schedule
# 2. Create PRs for updates
# 3. Include changelog and compatibility info

# View Dependabot logs
# GitHub → Insights → Dependency graph → Dependabot
```

## Complete Configuration

```yaml
# .github/dependabot.yml
version: 2

registries:
  # npm registry with auth
  npm-registry:
    type: npm-registry
    url: https://registry.npmjs.org
    token: ${{ secrets.NPM_TOKEN }}

  # Private npm registry
  npm-private:
    type: npm-registry
    url: https://npm.example.com
    token: ${{ secrets.PRIVATE_NPM_TOKEN }}

  # GitHub Package Registry
  github-npm:
    type: npm-registry
    url: https://npm.pkg.github.com
    token: ${{ secrets.GITHUB_TOKEN }}

  # Docker registry
  docker-registry:
    type: docker-registry
    url: https://ghcr.io
    username: ${{ secrets.DOCKER_USERNAME }}
    password: ${{ secrets.DOCKER_PASSWORD }}

  # Python registry
  pypi:
    type: python-index
    url: https://pypi.org/simple
    token: ${{ secrets.PYPI_TOKEN }}

  # Maven registry
  maven-central:
    type: maven-repository
    url: https://repo.maven.apache.org/maven2

updates:
  # ===========================================================================
  # npm dependencies
  # ===========================================================================
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
      day: monday
      time: "06:00"
      timezone: America/New_York
    open-pull-requests-limit: 10
    versioning-strategy: increase
    commit-message:
      prefix: "deps"
      prefix-development: "deps(dev)"
      include: scope
    labels:
      - dependencies
      - npm
    reviewers:
      - myorg/platform-team
    assignees:
      - lead-maintainer
    milestone: 1
    registries:
      - npm-registry
      - npm-private

    # Grouping configuration
    groups:
      # Production dependencies
      production-dependencies:
        applies-to: version-updates
        patterns:
          - "*"
        exclude-patterns:
          - "@types/*"
          - "eslint*"
          - "prettier*"
          - "jest*"
          - "vitest*"
        update-types:
          - minor
          - patch

      # TypeScript type definitions
      typescript-types:
        patterns:
          - "@types/*"
        update-types:
          - minor
          - patch

      # Testing libraries
      testing:
        patterns:
          - "jest*"
          - "@jest/*"
          - "vitest*"
          - "@testing-library/*"
          - "playwright*"
          - "cypress"

      # Linting and formatting
      linting:
        patterns:
          - "eslint*"
          - "@typescript-eslint/*"
          - "prettier*"
          - "stylelint*"

      # Build tools
      build-tools:
        patterns:
          - "vite*"
          - "webpack*"
          - "esbuild*"
          - "rollup*"
          - "swc*"
          - "turbo*"

      # React ecosystem
      react:
        patterns:
          - "react"
          - "react-dom"
          - "@react/*"
          - "react-router*"

      # AWS SDK
      aws-sdk:
        patterns:
          - "@aws-sdk/*"

    # Allow/Ignore rules
    allow:
      - dependency-type: direct
      - dependency-type: production

    ignore:
      # Ignore major updates for specific packages
      - dependency-name: "lodash"
        update-types:
          - version-update:semver-major
      # Ignore specific versions
      - dependency-name: "node"
        versions:
          - ">=21.0.0"
      # Ignore all updates for legacy packages
      - dependency-name: "legacy-package"

  # ===========================================================================
  # GitHub Actions
  # ===========================================================================
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
      day: monday
      time: "06:00"
    open-pull-requests-limit: 5
    commit-message:
      prefix: "ci"
    labels:
      - dependencies
      - github-actions
    groups:
      actions:
        patterns:
          - "*"

  # ===========================================================================
  # Docker dependencies
  # ===========================================================================
  - package-ecosystem: docker
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
    commit-message:
      prefix: "docker"
    labels:
      - dependencies
      - docker
    registries:
      - docker-registry
    groups:
      docker-images:
        patterns:
          - "*"

  # ===========================================================================
  # Python dependencies
  # ===========================================================================
  - package-ecosystem: pip
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 10
    commit-message:
      prefix: "deps(python)"
    labels:
      - dependencies
      - python
    registries:
      - pypi
    groups:
      python-deps:
        patterns:
          - "*"
        update-types:
          - minor
          - patch

  # ===========================================================================
  # Go modules
  # ===========================================================================
  - package-ecosystem: gomod
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 10
    commit-message:
      prefix: "deps(go)"
    labels:
      - dependencies
      - go
    groups:
      go-modules:
        patterns:
          - "*"

  # ===========================================================================
  # Terraform providers
  # ===========================================================================
  - package-ecosystem: terraform
    directory: /infrastructure
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
    commit-message:
      prefix: "infra"
    labels:
      - dependencies
      - terraform
    groups:
      terraform-providers:
        patterns:
          - "*"
```

## Monorepo Configuration

```yaml
# .github/dependabot.yml (Monorepo)
version: 2

updates:
  # Root package.json
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    labels:
      - dependencies
      - root
    groups:
      root-deps:
        patterns:
          - "*"

  # API package
  - package-ecosystem: npm
    directory: /packages/api
    schedule:
      interval: weekly
    labels:
      - dependencies
      - api
    groups:
      api-deps:
        patterns:
          - "*"

  # Web package
  - package-ecosystem: npm
    directory: /packages/web
    schedule:
      interval: weekly
    labels:
      - dependencies
      - web
    groups:
      web-deps:
        patterns:
          - "*"

  # Shared package
  - package-ecosystem: npm
    directory: /packages/shared
    schedule:
      interval: weekly
    labels:
      - dependencies
      - shared
    groups:
      shared-deps:
        patterns:
          - "*"

  # GitHub Actions (once for the whole repo)
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
    labels:
      - dependencies
      - ci
```

## Auto-merge Configuration

```yaml
# .github/workflows/dependabot-auto-merge.yml
name: Dependabot Auto-merge

on: pull_request

permissions:
  contents: write
  pull-requests: write

jobs:
  auto-merge:
    runs-on: ubuntu-latest
    if: github.actor == 'dependabot[bot]'
    steps:
      - name: Dependabot metadata
        id: metadata
        uses: dependabot/fetch-metadata@v2
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}

      - name: Auto-merge patch updates
        if: steps.metadata.outputs.update-type == 'version-update:semver-patch'
        run: gh pr merge --auto --squash "$PR_URL"
        env:
          PR_URL: ${{ github.event.pull_request.html_url }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Auto-merge minor updates for dev dependencies
        if: |
          steps.metadata.outputs.update-type == 'version-update:semver-minor' &&
          steps.metadata.outputs.dependency-type == 'direct:development'
        run: gh pr merge --auto --squash "$PR_URL"
        env:
          PR_URL: ${{ github.event.pull_request.html_url }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Approve PR
        if: |
          steps.metadata.outputs.update-type == 'version-update:semver-patch' ||
          (steps.metadata.outputs.update-type == 'version-update:semver-minor' &&
           steps.metadata.outputs.dependency-type == 'direct:development')
        run: gh pr review --approve "$PR_URL"
        env:
          PR_URL: ${{ github.event.pull_request.html_url }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Security-Only Updates

```yaml
# .github/dependabot.yml (Security-only)
version: 2

updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: daily
    open-pull-requests-limit: 20
    labels:
      - dependencies
      - security
    # Only security updates
    allow:
      - dependency-type: direct
        update-type: security
    commit-message:
      prefix: "security"
```

## Custom Reviewers and Assignees

```yaml
# .github/dependabot.yml (Team configuration)
version: 2

updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    reviewers:
      - myorg/frontend-team
      - myorg/security-team
    assignees:
      - tech-lead
      - security-champion
    labels:
      - dependencies
      - needs-review

  - package-ecosystem: pip
    directory: /
    schedule:
      interval: weekly
    reviewers:
      - myorg/backend-team
    assignees:
      - backend-lead
```

## Versioning Strategies

```yaml
# .github/dependabot.yml (Versioning strategies)
version: 2

updates:
  # Increase constraint (default for npm)
  # ^1.0.0 → ^1.1.0
  - package-ecosystem: npm
    directory: /
    versioning-strategy: increase

  # Increase if necessary (for apps)
  # Only change if current version doesn't satisfy new range
  - package-ecosystem: npm
    directory: /apps/web
    versioning-strategy: increase-if-necessary

  # Lockfile only (no manifest changes)
  # Updates lock file but not package.json
  - package-ecosystem: npm
    directory: /apps/api
    versioning-strategy: lockfile-only

  # Widen ranges (for libraries)
  # >=1.0.0 <2.0.0 → >=1.0.0 <3.0.0
  - package-ecosystem: npm
    directory: /packages/lib
    versioning-strategy: widen

  # Auto (let Dependabot decide)
  - package-ecosystem: pip
    directory: /
    versioning-strategy: auto
```

## Rebase Strategy

```yaml
# .github/workflows/dependabot-rebase.yml
name: Dependabot Rebase

on:
  issue_comment:
    types: [created]

permissions:
  pull-requests: write
  contents: write

jobs:
  rebase:
    runs-on: ubuntu-latest
    if: |
      github.event.issue.pull_request &&
      github.event.comment.body == '@dependabot rebase'
    steps:
      - name: Rebase
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: '@dependabot rebase'
            });
```

## CLAUDE.md Integration

```markdown
# Dependabot

## Configuration
- `.github/dependabot.yml` - Main configuration
- Per-ecosystem configuration
- Custom scheduling and grouping

## Package Ecosystems
- `npm` - Node.js/JavaScript
- `pip` - Python
- `gomod` - Go modules
- `docker` - Dockerfiles
- `github-actions` - GitHub Actions
- `terraform` - Terraform providers
- `maven` - Java/Maven
- `gradle` - Gradle
- `cargo` - Rust

## Commands (PR comments)
- `@dependabot rebase` - Rebase PR
- `@dependabot recreate` - Recreate PR
- `@dependabot merge` - Merge when CI passes
- `@dependabot squash and merge` - Squash merge
- `@dependabot cancel merge` - Cancel auto-merge
- `@dependabot ignore this major version` - Ignore major
- `@dependabot ignore this minor version` - Ignore minor
- `@dependabot ignore this dependency` - Ignore forever
```

## AI Suggestions

1. **Configure grouping** - Reduce PR noise with groups
2. **Implement auto-merge** - Patch/minor auto-merge
3. **Add security-only mode** - Focus on security updates
4. **Configure registries** - Private registry auth
5. **Set versioning strategy** - Match project type
6. **Add team reviewers** - Appropriate review assignment
7. **Configure scheduling** - Non-disruptive timing
8. **Implement ignore rules** - Skip problematic packages
9. **Add milestone tracking** - Link to release planning
10. **Configure monorepo** - Per-package updates
