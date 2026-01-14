# Renovate Configuration Template

> Production-ready Renovate configurations for automated dependency updates with fine-grained control

## Overview

This template provides Renovate configurations with:
- Automatic dependency updates
- Custom scheduling and grouping
- Security-focused updates
- Monorepo support
- Auto-merge policies

## Quick Start

```bash
# Install Renovate GitHub App
# Visit: https://github.com/apps/renovate

# Or self-hosted CLI
npm install -g renovate

# Run locally
renovate --token=$GITHUB_TOKEN myorg/myrepo

# Validate config
npx renovate-config-validator
```

## Basic Configuration

```json
// renovate.json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "config:recommended",
    ":dependencyDashboard",
    ":semanticCommits",
    ":timezone(America/New_York)",
    "security:openssf-scorecard"
  ],

  "labels": ["dependencies", "automated"],
  "prConcurrentLimit": 10,
  "prHourlyLimit": 5,

  "schedule": ["before 7am on Monday"],

  "packageRules": [
    {
      "matchUpdateTypes": ["major"],
      "labels": ["major"],
      "stabilityDays": 7
    },
    {
      "matchUpdateTypes": ["minor", "patch"],
      "automerge": true,
      "automergeType": "pr"
    }
  ]
}
```

## Advanced Configuration

```json5
// renovate.json5
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",

  // Extend presets
  "extends": [
    "config:recommended",
    ":dependencyDashboard",
    ":semanticCommits",
    ":separateMajorMinorPatch",
    ":maintainLockFilesMonthly",
    "schedule:nonOfficeHours",
    "group:allNonMajor",
    "helpers:pinGitHubActionDigests"
  ],

  // Repository settings
  "baseBranches": ["main", "develop"],
  "labels": ["dependencies", "renovate"],
  "assignees": ["platform-team"],
  "reviewers": ["@myorg/platform"],

  // PR limits
  "prConcurrentLimit": 20,
  "prHourlyLimit": 5,
  "branchConcurrentLimit": 30,

  // Commit settings
  "commitMessagePrefix": "deps:",
  "commitMessageTopic": "{{depName}}",
  "commitMessageExtra": "to {{newVersion}}",
  "commitMessageSuffix": "",

  // Scheduling
  "schedule": ["after 10pm and before 5am every weekday", "every weekend"],
  "timezone": "America/New_York",

  // Platform settings
  "platform": "github",
  "onboarding": true,
  "onboardingConfig": {
    "extends": ["config:recommended"]
  },

  // Security
  "vulnerabilityAlerts": {
    "enabled": true,
    "labels": ["security"],
    "stabilityDays": 0
  },

  // Package rules
  "packageRules": [
    // Major updates - require manual review
    {
      "matchUpdateTypes": ["major"],
      "labels": ["major-update"],
      "stabilityDays": 7,
      "prPriority": -1,
      "assignees": ["@myorg/architects"]
    },

    // Security updates - immediate
    {
      "matchDepTypes": ["devDependencies", "dependencies"],
      "matchUpdateTypes": ["patch", "minor"],
      "matchCategories": ["security"],
      "labels": ["security"],
      "automerge": true,
      "prPriority": 10
    },

    // Auto-merge non-major updates
    {
      "matchUpdateTypes": ["minor", "patch"],
      "automerge": true,
      "automergeType": "pr",
      "automergeStrategy": "squash",
      "platformAutomerge": true
    },

    // TypeScript ecosystem
    {
      "matchPackagePatterns": ["^@types/"],
      "groupName": "type definitions",
      "automerge": true
    },

    // Testing libraries
    {
      "matchPackagePatterns": [
        "jest",
        "vitest",
        "@testing-library",
        "playwright",
        "cypress"
      ],
      "groupName": "testing libraries",
      "automerge": true
    },

    // Linting and formatting
    {
      "matchPackagePatterns": [
        "eslint",
        "prettier",
        "stylelint",
        "@typescript-eslint"
      ],
      "groupName": "linting tools",
      "automerge": true
    },

    // Build tools
    {
      "matchPackagePatterns": [
        "vite",
        "webpack",
        "rollup",
        "esbuild",
        "swc"
      ],
      "groupName": "build tools"
    },

    // React ecosystem
    {
      "matchPackagePatterns": ["^react", "^@react"],
      "groupName": "React packages"
    },

    // AWS SDK
    {
      "matchPackagePatterns": ["^@aws-sdk/"],
      "groupName": "AWS SDK",
      "schedule": ["before 5am on Monday"]
    },

    // Docker images
    {
      "matchDatasources": ["docker"],
      "labels": ["docker"],
      "stabilityDays": 3
    },

    // GitHub Actions
    {
      "matchManagers": ["github-actions"],
      "groupName": "GitHub Actions",
      "automerge": true
    },

    // Pin specific packages
    {
      "matchPackageNames": ["node"],
      "allowedVersions": "20.x"
    },

    // Disable updates for specific packages
    {
      "matchPackageNames": ["legacy-package"],
      "enabled": false
    },

    // Custom schedule for specific packages
    {
      "matchPackageNames": ["prisma"],
      "schedule": ["before 5am on the first day of the month"]
    }
  ],

  // Post-upgrade commands
  "postUpgradeTasks": {
    "commands": [
      "npm run build",
      "npm run test"
    ],
    "fileFilters": ["**/*"],
    "executionMode": "update"
  },

  // Custom managers
  "customManagers": [
    {
      "customType": "regex",
      "fileMatch": ["^Dockerfile$"],
      "matchStrings": [
        "ARG NODE_VERSION=(?<currentValue>.*?)\\n"
      ],
      "depNameTemplate": "node",
      "datasourceTemplate": "docker"
    }
  ],

  // Ignore paths
  "ignorePaths": [
    "**/node_modules/**",
    "**/vendor/**",
    "**/examples/**"
  ],

  // Ignore dependencies
  "ignoreDeps": [
    "internal-package"
  ]
}
```

## Monorepo Configuration

```json5
// renovate.json5 (Monorepo)
{
  "extends": ["config:recommended"],

  // Enable package grouping
  "separateMajorMinor": true,
  "separateMultipleMajor": true,

  // Group updates by workspace
  "packageRules": [
    // Root dependencies
    {
      "matchPaths": ["package.json"],
      "groupName": "root dependencies"
    },

    // API package
    {
      "matchPaths": ["packages/api/**"],
      "groupName": "api dependencies",
      "commitMessageSuffix": " (api)"
    },

    // Web package
    {
      "matchPaths": ["packages/web/**"],
      "groupName": "web dependencies",
      "commitMessageSuffix": " (web)"
    },

    // Shared packages
    {
      "matchPaths": ["packages/shared/**"],
      "groupName": "shared dependencies",
      "commitMessageSuffix": " (shared)"
    },

    // Internal packages - group together
    {
      "matchPackagePatterns": ["^@myorg/"],
      "groupName": "internal packages",
      "automerge": true
    }
  ],

  // Workspace-specific settings
  "workspaces": {
    "packages/api": {
      "rangeStrategy": "bump"
    },
    "packages/web": {
      "rangeStrategy": "replace"
    }
  }
}
```

## Python Configuration

```json5
// renovate.json5 (Python)
{
  "extends": ["config:recommended"],

  "pip_requirements": {
    "fileMatch": ["requirements.*\\.txt$"]
  },

  "packageRules": [
    {
      "matchManagers": ["pip_requirements", "poetry", "pipenv"],
      "groupName": "Python dependencies"
    },
    {
      "matchPackagePatterns": ["django"],
      "groupName": "Django packages"
    },
    {
      "matchPackagePatterns": ["^boto3", "^botocore"],
      "groupName": "AWS SDK (Python)"
    }
  ],

  "poetry": {
    "enabled": true
  }
}
```

## Docker Configuration

```json5
// renovate.json5 (Docker)
{
  "extends": ["config:recommended", "docker:enableMajor"],

  "packageRules": [
    // Docker images
    {
      "matchDatasources": ["docker"],
      "stabilityDays": 3,
      "labels": ["docker"]
    },

    // Pin specific images
    {
      "matchDatasources": ["docker"],
      "matchPackagePatterns": ["postgres", "redis", "nginx"],
      "versioning": "docker"
    },

    // Base images - require review
    {
      "matchDatasources": ["docker"],
      "matchPackagePatterns": ["^node", "^python", "^golang"],
      "labels": ["base-image"],
      "automerge": false
    }
  ],

  // Custom extraction
  "customManagers": [
    {
      "customType": "regex",
      "fileMatch": ["^docker-compose\\.ya?ml$"],
      "matchStrings": [
        "image:\\s*['\"]?(?<depName>[^:]+):(?<currentValue>[^\\s'\"]+)"
      ],
      "datasourceTemplate": "docker"
    }
  ]
}
```

## Terraform Configuration

```json5
// renovate.json5 (Terraform)
{
  "extends": ["config:recommended"],

  "terraform": {
    "enabled": true
  },

  "packageRules": [
    {
      "matchDatasources": ["terraform-provider"],
      "groupName": "Terraform providers"
    },
    {
      "matchDatasources": ["terraform-module"],
      "groupName": "Terraform modules"
    },
    {
      "matchPackagePatterns": ["^hashicorp/"],
      "groupName": "HashiCorp providers"
    }
  ]
}
```

## GitHub Actions Configuration

```json5
// renovate.json5 (GitHub Actions)
{
  "extends": [
    "config:recommended",
    "helpers:pinGitHubActionDigests"
  ],

  "packageRules": [
    {
      "matchManagers": ["github-actions"],
      "groupName": "GitHub Actions",
      "automerge": true
    },
    {
      "matchManagers": ["github-actions"],
      "matchPackagePatterns": ["actions/"],
      "groupName": "GitHub official actions"
    },
    {
      "matchManagers": ["github-actions"],
      "matchPackagePatterns": ["docker/"],
      "groupName": "Docker actions"
    }
  ]
}
```

## Auto-merge Configuration

```json5
// renovate.json5 (Auto-merge)
{
  "extends": ["config:recommended"],

  // Enable auto-merge
  "automerge": true,
  "automergeType": "pr",
  "automergeStrategy": "squash",
  "platformAutomerge": true,

  // Require passing checks
  "requiredStatusChecks": ["ci", "test"],

  "packageRules": [
    // Auto-merge patches
    {
      "matchUpdateTypes": ["patch"],
      "automerge": true,
      "automergeType": "pr"
    },

    // Auto-merge minor with delay
    {
      "matchUpdateTypes": ["minor"],
      "automerge": true,
      "automergeType": "pr",
      "stabilityDays": 3
    },

    // Never auto-merge major
    {
      "matchUpdateTypes": ["major"],
      "automerge": false,
      "labels": ["major-update", "needs-review"]
    },

    // Auto-merge dev dependencies
    {
      "matchDepTypes": ["devDependencies"],
      "automerge": true,
      "automergeType": "branch"
    }
  ]
}
```

## CLAUDE.md Integration

```markdown
# Renovate Configuration

## Commands
- `npx renovate-config-validator` - Validate config
- `renovate --dry-run` - Preview updates
- `renovate --force-cli` - Force update

## Key Presets
- `config:recommended` - Standard settings
- `schedule:nonOfficeHours` - Off-hours updates
- `group:allNonMajor` - Group non-major updates
- `helpers:pinGitHubActionDigests` - Pin actions

## Package Rules
- Match by name, pattern, manager, datasource
- Control automerge, schedule, labels
- Group related packages together

## Auto-merge
- `automerge: true` - Enable auto-merge
- `platformAutomerge: true` - Use platform feature
- `stabilityDays: N` - Wait before merge
```

## AI Suggestions

1. **Configure grouping** - Group related dependencies
2. **Add security alerts** - Immediate security updates
3. **Implement auto-merge** - Low-risk auto-merge
4. **Configure scheduling** - Non-disruptive timing
5. **Add monorepo support** - Package-specific rules
6. **Configure stability days** - Wait for issues
7. **Add custom managers** - Non-standard files
8. **Implement branch protection** - Require CI pass
9. **Configure commit messages** - Semantic commits
10. **Add dependency dashboard** - Overview issue
