# Release Please Configuration Template

> Production-ready Release Please configurations for automated releases based on conventional commits

## Overview

This template provides Release Please configurations with:
- Conventional commit analysis
- Automatic version bumping
- Changelog generation
- Monorepo support
- Custom release strategies

## Quick Start

```bash
# Install Release Please CLI
npm install -g release-please

# Bootstrap repository
release-please bootstrap \
  --token=$GITHUB_TOKEN \
  --repo-url=https://github.com/myorg/myrepo \
  --release-type=node

# Create release PR
release-please release-pr \
  --token=$GITHUB_TOKEN \
  --repo-url=https://github.com/myorg/myrepo

# Create GitHub release
release-please github-release \
  --token=$GITHUB_TOKEN \
  --repo-url=https://github.com/myorg/myrepo
```

## GitHub Actions Integration

```yaml
# .github/workflows/release-please.yml
name: Release Please

on:
  push:
    branches:
      - main

permissions:
  contents: write
  pull-requests: write
  packages: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    outputs:
      release_created: ${{ steps.release.outputs.release_created }}
      tag_name: ${{ steps.release.outputs.tag_name }}
      version: ${{ steps.release.outputs.version }}
      sha: ${{ steps.release.outputs.sha }}
      # Monorepo outputs
      paths_released: ${{ steps.release.outputs.paths_released }}
      all: ${{ toJSON(steps.release.outputs) }}

    steps:
      - name: Release Please
        id: release
        uses: google-github-actions/release-please-action@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          # For single package
          release-type: node

      - name: Checkout
        if: ${{ steps.release.outputs.release_created }}
        uses: actions/checkout@v4

      - name: Setup Node.js
        if: ${{ steps.release.outputs.release_created }}
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        if: ${{ steps.release.outputs.release_created }}
        run: npm ci

      - name: Build
        if: ${{ steps.release.outputs.release_created }}
        run: npm run build

      - name: Publish to npm
        if: ${{ steps.release.outputs.release_created }}
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  # Build and push Docker image on release
  docker:
    needs: release-please
    if: ${{ needs.release-please.outputs.release_created }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          push: true
          tags: |
            ghcr.io/${{ github.repository }}:${{ needs.release-please.outputs.version }}
            ghcr.io/${{ github.repository }}:latest
```

## Configuration File

```json
// release-please-config.json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "release-type": "node",
  "bump-minor-pre-major": true,
  "bump-patch-for-minor-pre-major": true,
  "draft": false,
  "prerelease": false,
  "group-pull-request-title-pattern": "chore: release ${version}",
  "pull-request-title-pattern": "chore: release ${component} ${version}",
  "pull-request-header": ":robot: I have created a release",
  "pull-request-footer": "This PR was generated with [Release Please](https://github.com/googleapis/release-please).",
  "changelog-sections": [
    { "type": "feat", "section": "Features", "hidden": false },
    { "type": "fix", "section": "Bug Fixes", "hidden": false },
    { "type": "perf", "section": "Performance Improvements", "hidden": false },
    { "type": "revert", "section": "Reverts", "hidden": false },
    { "type": "docs", "section": "Documentation", "hidden": false },
    { "type": "style", "section": "Styles", "hidden": true },
    { "type": "chore", "section": "Miscellaneous Chores", "hidden": true },
    { "type": "refactor", "section": "Code Refactoring", "hidden": true },
    { "type": "test", "section": "Tests", "hidden": true },
    { "type": "build", "section": "Build System", "hidden": true },
    { "type": "ci", "section": "Continuous Integration", "hidden": true }
  ],
  "extra-files": [
    "src/version.ts",
    {
      "type": "json",
      "path": "manifest.json",
      "jsonpath": "$.version"
    }
  ],
  "packages": {
    ".": {}
  }
}
```

## Manifest File

```json
// .release-please-manifest.json
{
  ".": "1.0.0"
}
```

## Monorepo Configuration

```json
// release-please-config.json (Monorepo)
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "packages": {
    "packages/core": {
      "release-type": "node",
      "component": "core",
      "changelog-path": "CHANGELOG.md"
    },
    "packages/cli": {
      "release-type": "node",
      "component": "cli",
      "changelog-path": "CHANGELOG.md"
    },
    "packages/server": {
      "release-type": "node",
      "component": "server",
      "changelog-path": "CHANGELOG.md"
    }
  },
  "group-pull-request-title-pattern": "chore: release main",
  "separate-pull-requests": false,
  "changelog-sections": [
    { "type": "feat", "section": "Features" },
    { "type": "fix", "section": "Bug Fixes" },
    { "type": "perf", "section": "Performance Improvements" },
    { "type": "docs", "section": "Documentation" },
    { "type": "chore", "section": "Miscellaneous", "hidden": true }
  ],
  "plugins": [
    {
      "type": "node-workspace",
      "merge": true,
      "consider-all-artifacts": true
    },
    {
      "type": "linked-versions",
      "groupName": "myorg packages",
      "components": ["core", "cli", "server"]
    }
  ]
}
```

```json
// .release-please-manifest.json (Monorepo)
{
  "packages/core": "1.0.0",
  "packages/cli": "1.0.0",
  "packages/server": "1.0.0"
}
```

## Monorepo GitHub Actions

```yaml
# .github/workflows/release-please.yml (Monorepo)
name: Release Please

on:
  push:
    branches:
      - main

permissions:
  contents: write
  pull-requests: write
  packages: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    outputs:
      releases_created: ${{ steps.release.outputs.releases_created }}
      # Package-specific outputs
      core--release_created: ${{ steps.release.outputs['packages/core--release_created'] }}
      core--tag_name: ${{ steps.release.outputs['packages/core--tag_name'] }}
      cli--release_created: ${{ steps.release.outputs['packages/cli--release_created'] }}
      cli--tag_name: ${{ steps.release.outputs['packages/cli--tag_name'] }}
      server--release_created: ${{ steps.release.outputs['packages/server--release_created'] }}
      server--tag_name: ${{ steps.release.outputs['packages/server--tag_name'] }}

    steps:
      - name: Release Please
        id: release
        uses: google-github-actions/release-please-action@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          config-file: release-please-config.json
          manifest-file: .release-please-manifest.json

  # Publish core package
  publish-core:
    needs: release-please
    if: ${{ needs.release-please.outputs.core--release_created }}
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: packages/core
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  # Publish CLI package
  publish-cli:
    needs: release-please
    if: ${{ needs.release-please.outputs.cli--release_created }}
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: packages/cli
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  # Build Docker image for server
  publish-server:
    needs: release-please
    if: ${{ needs.release-please.outputs.server--release_created }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: packages/server
          push: true
          tags: ghcr.io/${{ github.repository }}/server:${{ needs.release-please.outputs.server--tag_name }}
```

## Release Types

```yaml
# Different release types and their version files

# Node.js (package.json)
release-type: node

# Python (setup.py, pyproject.toml)
release-type: python

# Go (go.mod)
release-type: go
release-type: go-yoshi

# Rust (Cargo.toml)
release-type: rust

# Java/Maven (pom.xml)
release-type: maven

# PHP (composer.json)
release-type: php

# Ruby (version.rb)
release-type: ruby
release-type: ruby-yoshi

# Helm (Chart.yaml)
release-type: helm

# Terraform
release-type: terraform-module

# Simple version file
release-type: simple

# Custom
release-type: krm-blueprint
```

## Extra Files Configuration

```json
// release-please-config.json (Extra files)
{
  "release-type": "node",
  "extra-files": [
    // Plain text file with version
    "VERSION",

    // TypeScript/JavaScript constant
    {
      "type": "generic",
      "path": "src/version.ts",
      "glob": false
    },

    // JSON file
    {
      "type": "json",
      "path": "config.json",
      "jsonpath": "$.version"
    },

    // YAML file
    {
      "type": "yaml",
      "path": "config.yaml",
      "jsonpath": "$.version"
    },

    // XML file
    {
      "type": "xml",
      "path": "config.xml",
      "xpath": "//version"
    },

    // TOML file
    {
      "type": "toml",
      "path": "pyproject.toml",
      "jsonpath": "$.tool.poetry.version"
    }
  ]
}
```

```typescript
// src/version.ts (auto-updated)
// x-release-please-start-version
export const VERSION = '1.2.3';
// x-release-please-end
```

## Custom Changelog Sections

```json
// release-please-config.json (Custom sections)
{
  "release-type": "node",
  "changelog-sections": [
    {
      "type": "feat",
      "section": "🚀 Features",
      "hidden": false
    },
    {
      "type": "fix",
      "section": "🐛 Bug Fixes",
      "hidden": false
    },
    {
      "type": "perf",
      "section": "⚡ Performance",
      "hidden": false
    },
    {
      "type": "docs",
      "section": "📚 Documentation",
      "hidden": false
    },
    {
      "type": "deps",
      "section": "📦 Dependencies",
      "hidden": false
    },
    {
      "type": "breaking",
      "section": "⚠️ Breaking Changes",
      "hidden": false
    },
    {
      "type": "chore",
      "section": "🔧 Maintenance",
      "hidden": true
    },
    {
      "type": "refactor",
      "section": "♻️ Refactoring",
      "hidden": true
    },
    {
      "type": "test",
      "section": "✅ Tests",
      "hidden": true
    },
    {
      "type": "ci",
      "section": "👷 CI/CD",
      "hidden": true
    }
  ]
}
```

## Prerelease Configuration

```yaml
# .github/workflows/prerelease.yml
name: Prerelease

on:
  push:
    branches:
      - beta
      - alpha

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - name: Release Please
        uses: google-github-actions/release-please-action@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          release-type: node
          prerelease: true
          prerelease-type: ${{ github.ref_name }}
```

## CLAUDE.md Integration

```markdown
# Release Please

## Commands
- `release-please release-pr` - Create release PR
- `release-please github-release` - Create GitHub release
- `release-please bootstrap` - Initialize repository

## Configuration
- `release-please-config.json` - Main configuration
- `.release-please-manifest.json` - Version tracking

## Commit Types → Versions
- `feat:` → minor version bump
- `fix:` → patch version bump
- `feat!:` / `BREAKING CHANGE:` → major version bump

## Files Updated
- `package.json` (version)
- `CHANGELOG.md` (release notes)
- Extra files configured

## Monorepo
- Configure packages in config
- Manifest tracks each package version
- Linked versions for related packages
```

## AI Suggestions

1. **Configure changelog sections** - Customize section titles
2. **Add extra files** - Update version in multiple files
3. **Implement monorepo** - Multi-package releases
4. **Configure linked versions** - Related package versioning
5. **Add prerelease support** - Beta/alpha releases
6. **Configure plugins** - Node workspace, linked versions
7. **Add custom release types** - Language-specific versioning
8. **Implement automation** - Post-release npm/Docker publish
9. **Configure grouping** - Single PR for multiple packages
10. **Add release notes** - GitHub release creation
