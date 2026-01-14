# Changesets Configuration Template

> Production-ready Changesets configurations for monorepo versioning and changelog management

## Overview

This template provides Changesets configurations with:
- Monorepo version management
- Automated changelog generation
- GitHub Actions integration
- npm publishing automation
- Snapshot releases

## Quick Start

```bash
# Install changesets
npm install -D @changesets/cli

# Initialize changesets
npx changeset init

# Add a changeset
npx changeset

# Version packages
npx changeset version

# Publish packages
npx changeset publish

# Check status
npx changeset status
```

## Configuration

```json
// .changeset/config.json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": [
    "@changesets/changelog-github",
    {
      "repo": "myorg/myrepo"
    }
  ],
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [],
  "privatePackages": {
    "version": true,
    "tag": true
  },
  "snapshot": {
    "useCalculatedVersion": true,
    "prereleaseTemplate": "{tag}-{datetime}"
  }
}
```

## Advanced Configuration

```json
// .changeset/config.json (Advanced)
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",

  // Changelog format
  "changelog": [
    "@changesets/changelog-github",
    {
      "repo": "myorg/myrepo"
    }
  ],

  // Auto-commit changesets
  "commit": true,

  // Fixed versioning groups (all bump together)
  "fixed": [
    ["@myorg/core", "@myorg/utils"]
  ],

  // Linked versioning groups (bump together when one changes)
  "linked": [
    ["@myorg/react-*"],
    ["@myorg/vue-*"]
  ],

  // npm access level
  "access": "public",

  // Base branch for PRs
  "baseBranch": "main",

  // How to update internal deps
  "updateInternalDependencies": "patch",

  // Packages to ignore
  "ignore": [
    "@myorg/internal-tools",
    "@myorg/e2e-tests"
  ],

  // Private package handling
  "privatePackages": {
    "version": true,
    "tag": false
  },

  // Snapshot release settings
  "snapshot": {
    "useCalculatedVersion": true,
    "prereleaseTemplate": "{tag}-{commit}"
  },

  // Prerelease convergence
  "___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH": {
    "onlyUpdatePeerDependentsWhenOutOfRange": true,
    "updateInternalDependents": "always"
  }
}
```

## GitHub Actions Integration

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches:
      - main

concurrency: ${{ github.workflow }}-${{ github.ref }}

permissions:
  contents: write
  pull-requests: write
  packages: write

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Build packages
        run: npm run build

      - name: Create Release Pull Request or Publish
        id: changesets
        uses: changesets/action@v1
        with:
          publish: npm run release
          version: npm run version
          title: 'chore: release packages'
          commit: 'chore: release packages'
          createGithubReleases: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Send Slack notification
        if: steps.changesets.outputs.published == 'true'
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "New packages published!",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "Published packages:\n${{ steps.changesets.outputs.publishedPackages }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

## Snapshot Releases

```yaml
# .github/workflows/snapshot.yml
name: Snapshot Release

on:
  issue_comment:
    types: [created]

jobs:
  snapshot:
    name: Snapshot Release
    if: |
      github.event.issue.pull_request &&
      github.event.comment.body == '/snapshot'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          ref: refs/pull/${{ github.event.issue.number }}/head

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Build packages
        run: npm run build

      - name: Create snapshot version
        run: |
          npx changeset version --snapshot pr-${{ github.event.issue.number }}

      - name: Publish snapshot
        run: |
          npx changeset publish --tag pr-${{ github.event.issue.number }}
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Comment on PR
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const packages = JSON.parse(fs.readFileSync('./packages.json', 'utf8'));
            const versions = packages.map(p => `- ${p.name}@${p.version}`).join('\n');

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `Snapshot published!\n\n${versions}\n\nInstall with:\n\`\`\`bash\nnpm install @myorg/package@pr-${context.issue.number}\n\`\`\``
            });
```

## Prerelease Workflow

```yaml
# .github/workflows/prerelease.yml
name: Prerelease

on:
  push:
    branches:
      - next
      - beta
      - alpha

jobs:
  prerelease:
    name: Prerelease
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

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

      - name: Enter prerelease mode
        run: npx changeset pre enter ${{ github.ref_name }}
        continue-on-error: true

      - name: Version packages
        run: npx changeset version

      - name: Publish
        run: npx changeset publish --tag ${{ github.ref_name }}
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Push changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add -A
          git commit -m "chore: prerelease version packages" || exit 0
          git push
```

## Package.json Scripts

```json
// package.json
{
  "scripts": {
    "changeset": "changeset",
    "changeset:status": "changeset status",
    "changeset:add": "changeset add",
    "version": "changeset version && npm install --package-lock-only",
    "release": "npm run build && changeset publish",
    "release:snapshot": "changeset version --snapshot && changeset publish --tag snapshot",
    "prerelease:enter": "changeset pre enter",
    "prerelease:exit": "changeset pre exit"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0",
    "@changesets/changelog-github": "^0.5.0"
  }
}
```

## Custom Changelog Format

```javascript
// .changeset/changelog-custom.js
const getReleaseLine = async (changeset, type) => {
  const [firstLine, ...rest] = changeset.summary.split('\n');

  let returnVal = `- ${firstLine}`;

  if (changeset.commit) {
    returnVal += ` ([${changeset.commit.slice(0, 7)}](https://github.com/myorg/myrepo/commit/${changeset.commit}))`;
  }

  if (rest.length > 0) {
    returnVal += `\n${rest.map(l => `  ${l}`).join('\n')}`;
  }

  return returnVal;
};

const getDependencyReleaseLine = async (changesets, dependenciesUpdated) => {
  if (dependenciesUpdated.length === 0) return '';

  const updatedDepenenciesList = dependenciesUpdated.map(
    (dependency) => `  - ${dependency.name}@${dependency.newVersion}`
  );

  return ['- Updated dependencies', ...updatedDepenenciesList].join('\n');
};

module.exports = {
  getReleaseLine,
  getDependencyReleaseLine,
};
```

```json
// .changeset/config.json (with custom changelog)
{
  "changelog": "./.changeset/changelog-custom.js"
}
```

## Changeset File Examples

```markdown
---
"@myorg/core": major
"@myorg/utils": minor
---

Add new authentication system

This release introduces a new authentication system with support for:
- OAuth 2.0
- SAML
- API keys

BREAKING CHANGE: The `auth()` function signature has changed.

Before:
```js
auth(username, password)
```

After:
```js
auth({ method: 'password', username, password })
```
```

```markdown
---
"@myorg/react-components": patch
---

Fix button hover state in dark mode
```

## Monorepo Structure

```
my-monorepo/
├── .changeset/
│   ├── config.json
│   ├── README.md
│   └── <changeset-files>.md
├── packages/
│   ├── core/
│   │   ├── package.json
│   │   └── CHANGELOG.md
│   ├── utils/
│   │   ├── package.json
│   │   └── CHANGELOG.md
│   └── react-components/
│       ├── package.json
│       └── CHANGELOG.md
├── package.json
└── pnpm-workspace.yaml
```

## CLAUDE.md Integration

```markdown
# Changesets

## Commands
- `npx changeset` - Create a changeset
- `npx changeset status` - Check pending changesets
- `npx changeset version` - Apply changesets
- `npx changeset publish` - Publish packages
- `npx changeset pre enter beta` - Enter prerelease mode
- `npx changeset pre exit` - Exit prerelease mode

## Version Types
- `major` - Breaking changes (x.0.0)
- `minor` - New features (0.x.0)
- `patch` - Bug fixes (0.0.x)

## Workflow
1. Make changes to packages
2. Run `npx changeset` to describe changes
3. Commit changeset files
4. PR merged → Release PR created
5. Merge Release PR → Packages published

## Configuration
- `.changeset/config.json` - Main config
- `fixed` - Packages that version together
- `linked` - Packages with linked versions
```

## AI Suggestions

1. **Configure GitHub changelog** - Link PRs and commits
2. **Implement snapshot releases** - PR preview packages
3. **Add fixed/linked groups** - Related package versioning
4. **Configure prerelease mode** - Beta/alpha releases
5. **Add custom changelog** - Enhanced formatting
6. **Implement auto-commit** - Automated changeset commits
7. **Configure private packages** - Internal versioning
8. **Add Slack notifications** - Release alerts
9. **Implement GitHub releases** - Automated release notes
10. **Configure snapshot templates** - Custom snapshot names
