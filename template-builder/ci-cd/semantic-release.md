# Semantic Release Template

> Production-ready semantic-release configurations for automated versioning and changelog generation

## Overview

This template provides semantic-release configurations with:
- Conventional commit analysis
- Automatic version bumping
- Changelog generation
- Multi-platform publishing
- Monorepo support

## Quick Start

```bash
# Install semantic-release
npm install --save-dev semantic-release

# Install plugins
npm install --save-dev @semantic-release/changelog @semantic-release/git @semantic-release/github

# Create configuration
cp .releaserc.json ./

# Run release (CI)
npx semantic-release

# Dry run
npx semantic-release --dry-run
```

## Configuration File

```json
// .releaserc.json
{
  "branches": [
    "main",
    { "name": "beta", "prerelease": true },
    { "name": "alpha", "prerelease": true },
    { "name": "next", "prerelease": true }
  ],
  "plugins": [
    ["@semantic-release/commit-analyzer", {
      "preset": "conventionalcommits",
      "releaseRules": [
        { "type": "feat", "release": "minor" },
        { "type": "fix", "release": "patch" },
        { "type": "perf", "release": "patch" },
        { "type": "refactor", "release": "patch" },
        { "type": "docs", "scope": "README", "release": "patch" },
        { "type": "build", "scope": "deps", "release": "patch" },
        { "breaking": true, "release": "major" },
        { "revert": true, "release": "patch" }
      ],
      "parserOpts": {
        "noteKeywords": ["BREAKING CHANGE", "BREAKING CHANGES", "BREAKING"]
      }
    }],
    ["@semantic-release/release-notes-generator", {
      "preset": "conventionalcommits",
      "presetConfig": {
        "types": [
          { "type": "feat", "section": "Features" },
          { "type": "fix", "section": "Bug Fixes" },
          { "type": "perf", "section": "Performance Improvements" },
          { "type": "refactor", "section": "Code Refactoring" },
          { "type": "docs", "section": "Documentation" },
          { "type": "test", "section": "Tests", "hidden": true },
          { "type": "build", "section": "Build System" },
          { "type": "ci", "section": "CI/CD", "hidden": true },
          { "type": "chore", "hidden": true }
        ]
      }
    }],
    ["@semantic-release/changelog", {
      "changelogFile": "CHANGELOG.md",
      "changelogTitle": "# Changelog\n\nAll notable changes to this project will be documented in this file."
    }],
    ["@semantic-release/npm", {
      "npmPublish": true,
      "tarballDir": "dist"
    }],
    ["@semantic-release/github", {
      "assets": [
        { "path": "dist/*.tgz", "label": "Distribution" },
        { "path": "dist/*.zip", "label": "Binaries" }
      ],
      "successComment": "This ${issue.pull_request ? 'PR is included' : 'issue has been resolved'} in version ${nextRelease.version}",
      "failComment": false,
      "releasedLabels": ["released", "released-in-${nextRelease.version}"]
    }],
    ["@semantic-release/git", {
      "assets": ["CHANGELOG.md", "package.json", "package-lock.json"],
      "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
    }]
  ]
}
```

## JavaScript Configuration

```javascript
// release.config.js
module.exports = {
  branches: [
    'main',
    { name: 'beta', prerelease: true },
    { name: 'alpha', prerelease: true },
    { name: 'next', prerelease: true },
    { name: 'develop', prerelease: 'dev' }
  ],

  plugins: [
    // Analyze commits
    ['@semantic-release/commit-analyzer', {
      preset: 'conventionalcommits',
      releaseRules: [
        { type: 'feat', release: 'minor' },
        { type: 'fix', release: 'patch' },
        { type: 'perf', release: 'patch' },
        { type: 'refactor', release: 'patch' },
        { breaking: true, release: 'major' }
      ]
    }],

    // Generate release notes
    ['@semantic-release/release-notes-generator', {
      preset: 'conventionalcommits',
      presetConfig: {
        types: [
          { type: 'feat', section: 'Features' },
          { type: 'fix', section: 'Bug Fixes' },
          { type: 'perf', section: 'Performance' },
          { type: 'refactor', section: 'Refactoring' },
          { type: 'docs', section: 'Documentation' },
          { type: 'build', section: 'Build System' }
        ]
      },
      writerOpts: {
        commitsSort: ['subject', 'scope']
      }
    }],

    // Update changelog
    ['@semantic-release/changelog', {
      changelogFile: 'CHANGELOG.md'
    }],

    // Publish to npm
    ['@semantic-release/npm', {
      npmPublish: true
    }],

    // Create GitHub release
    ['@semantic-release/github', {
      assets: [
        { path: 'dist/**/*.js', label: 'JavaScript files' },
        { path: 'dist/**/*.d.ts', label: 'TypeScript definitions' }
      ]
    }],

    // Commit changes
    ['@semantic-release/git', {
      assets: ['CHANGELOG.md', 'package.json', 'package-lock.json'],
      message: 'chore(release): ${nextRelease.version}\n\n${nextRelease.notes}'
    }]
  ]
};
```

## Multi-Package (Monorepo) Configuration

```javascript
// release.config.js (Monorepo with semantic-release-monorepo)
module.exports = {
  extends: 'semantic-release-monorepo',
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    '@semantic-release/npm',
    '@semantic-release/github',
    ['@semantic-release/git', {
      assets: ['CHANGELOG.md', 'package.json']
    }]
  ]
};
```

```json
// Root package.json
{
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "release": "lerna exec --concurrency 1 -- npx --no-install semantic-release"
  },
  "release": {
    "extends": "semantic-release-monorepo"
  }
}
```

## Docker Image Release

```javascript
// release.config.js (Docker)
module.exports = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    ['@semantic-release/exec', {
      prepareCmd: `
        docker build -t ghcr.io/myorg/myapp:\${nextRelease.version} .
        docker tag ghcr.io/myorg/myapp:\${nextRelease.version} ghcr.io/myorg/myapp:latest
      `,
      publishCmd: `
        docker push ghcr.io/myorg/myapp:\${nextRelease.version}
        docker push ghcr.io/myorg/myapp:latest
      `
    }],
    '@semantic-release/github',
    ['@semantic-release/git', {
      assets: ['CHANGELOG.md', 'package.json']
    }]
  ]
};
```

## Python Package Release

```javascript
// release.config.js (Python)
module.exports = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    ['@semantic-release/exec', {
      prepareCmd: `
        sed -i 's/version = .*/version = "\${nextRelease.version}"/' pyproject.toml
        poetry build
      `,
      publishCmd: 'poetry publish'
    }],
    '@semantic-release/github',
    ['@semantic-release/git', {
      assets: ['CHANGELOG.md', 'pyproject.toml']
    }]
  ]
};
```

## GitHub Actions Integration

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main, beta, alpha]

permissions:
  contents: write
  packages: write
  issues: write
  pull-requests: write

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: npx semantic-release
```

## Commit Message Guidelines

```markdown
# Commit Message Format

<type>(<scope>): <subject>

<body>

<footer>

## Types
- feat: A new feature (minor version bump)
- fix: A bug fix (patch version bump)
- docs: Documentation changes
- style: Code style changes (formatting)
- refactor: Code refactoring
- perf: Performance improvements
- test: Adding or updating tests
- build: Build system changes
- ci: CI configuration changes
- chore: Other changes

## Breaking Changes
Add `BREAKING CHANGE:` in the footer or `!` after type/scope:

feat!: remove deprecated API
feat(api)!: change response format

## Examples

feat(auth): add OAuth2 authentication

Implement OAuth2 authentication flow with support for
Google and GitHub providers.

Closes #123

---

fix(api): handle null response correctly

BREAKING CHANGE: API now returns 204 instead of null body
```

## Commitlint Configuration

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert'
      ]
    ],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 100]
  }
};
```

## Husky Setup

```json
// package.json
{
  "scripts": {
    "prepare": "husky install"
  },
  "devDependencies": {
    "husky": "^8.0.0",
    "@commitlint/cli": "^18.0.0",
    "@commitlint/config-conventional": "^18.0.0"
  }
}
```

```bash
#!/bin/sh
# .husky/commit-msg
. "$(dirname "$0")/_/husky.sh"
npx --no -- commitlint --edit $1
```

## CLAUDE.md Integration

```markdown
# Semantic Release

## Commands
- `npx semantic-release --dry-run` - Preview release
- `npx semantic-release` - Create release
- `npx commitlint --from HEAD~1` - Lint last commit

## Commit Types
- `feat` - New feature (minor)
- `fix` - Bug fix (patch)
- `perf` - Performance (patch)
- `!` suffix - Breaking change (major)

## Release Branches
- `main` - Production releases
- `beta` - Beta prereleases
- `alpha` - Alpha prereleases

## Configuration
- `.releaserc.json` - JSON config
- `release.config.js` - JS config
- `package.json` - Inline config
```

## AI Suggestions

1. **Add commitlint** - Enforce commit message format
2. **Configure Husky** - Git hooks for validation
3. **Add changelog** - Automatic changelog generation
4. **Implement monorepo release** - semantic-release-monorepo
5. **Configure prerelease channels** - Beta/alpha releases
6. **Add asset uploads** - GitHub release assets
7. **Implement multi-package** - Lerna/Nx integration
8. **Configure branch protection** - Require CI pass
9. **Add release notifications** - Slack/Discord webhooks
10. **Implement dry-run in PR** - Preview releases
