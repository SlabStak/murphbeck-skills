# Pre-commit Hooks Template

## Overview
Comprehensive pre-commit setup with pre-commit framework, custom hooks, security scanning, and automated code quality checks.

## Quick Start
```bash
# Python pre-commit
pip install pre-commit
pre-commit install

# Node.js (Husky + lint-staged)
npm install husky lint-staged --save-dev
npx husky init
```

## Pre-commit Configuration (Python)

### .pre-commit-config.yaml
```yaml
# .pre-commit-config.yaml
repos:
  # General hooks
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
        args: ['--unsafe']
      - id: check-json
      - id: check-toml
      - id: check-xml
      - id: check-added-large-files
        args: ['--maxkb=500']
      - id: check-merge-conflict
      - id: check-case-conflict
      - id: check-symlinks
      - id: detect-private-key
      - id: detect-aws-credentials
        args: ['--allow-missing-credentials']
      - id: no-commit-to-branch
        args: ['--branch', 'main', '--branch', 'master']
      - id: mixed-line-ending
        args: ['--fix=lf']

  # Python - Ruff (fast linter + formatter)
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.2.0
    hooks:
      - id: ruff
        args: ['--fix']
      - id: ruff-format

  # Python - Type checking
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.8.0
    hooks:
      - id: mypy
        additional_dependencies:
          - types-requests
          - pydantic

  # Security scanning
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
        exclude: 'package-lock\.json|pnpm-lock\.yaml'

  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.7
    hooks:
      - id: bandit
        args: ['-c', 'pyproject.toml']
        additional_dependencies: ['bandit[toml]']

  # JavaScript/TypeScript
  - repo: local
    hooks:
      - id: eslint
        name: ESLint
        entry: npx eslint --fix
        language: system
        files: \.(js|jsx|ts|tsx)$
        types: [file]

      - id: prettier
        name: Prettier
        entry: npx prettier --write
        language: system
        files: \.(js|jsx|ts|tsx|json|md|css|scss|yaml|yml)$
        types: [file]

      - id: typecheck
        name: TypeScript Type Check
        entry: npx tsc --noEmit
        language: system
        files: \.(ts|tsx)$
        pass_filenames: false
        types: [file]

  # Commit message
  - repo: https://github.com/commitizen-tools/commitizen
    rev: v3.13.0
    hooks:
      - id: commitizen
        stages: [commit-msg]

  # Docker
  - repo: https://github.com/hadolint/hadolint
    rev: v2.12.0
    hooks:
      - id: hadolint
        args: ['--ignore', 'DL3008', '--ignore', 'DL3013']

  # Terraform
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.86.0
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_tflint
      - id: terraform_docs
        args:
          - '--args=--config=.terraform-docs.yml'

  # Shell scripts
  - repo: https://github.com/shellcheck-py/shellcheck-py
    rev: v0.9.0.6
    hooks:
      - id: shellcheck
        args: ['-x']

  # Markdown
  - repo: https://github.com/igorshubovych/markdownlint-cli
    rev: v0.39.0
    hooks:
      - id: markdownlint
        args: ['--fix']

  # Spell checking
  - repo: https://github.com/codespell-project/codespell
    rev: v2.2.6
    hooks:
      - id: codespell
        args: ['--skip', '*.lock,*.lockb,node_modules']

# Default settings
default_install_hook_types:
  - pre-commit
  - commit-msg
  - pre-push

default_stages: [commit]

fail_fast: false

ci:
  autofix_commit_msg: 'style: auto-fix by pre-commit hooks'
  autoupdate_commit_msg: 'chore: update pre-commit hooks'
  skip: [eslint, prettier, typecheck]  # These need node_modules
```

## Husky + lint-staged (Node.js)

### package.json
```json
{
  "scripts": {
    "prepare": "husky",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "validate": "npm run lint && npm run typecheck && npm run test"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ],
    "*.{css,scss}": [
      "stylelint --fix",
      "prettier --write"
    ],
    "*.py": [
      "ruff check --fix",
      "ruff format"
    ]
  }
}
```

### .husky/pre-commit
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run lint-staged
npx lint-staged

# Check for debug statements
if git diff --cached --name-only | xargs grep -l 'console\.log\|debugger' 2>/dev/null; then
  echo "❌ Found console.log or debugger statements"
  echo "Please remove them before committing:"
  git diff --cached --name-only | xargs grep -n 'console\.log\|debugger' 2>/dev/null
  exit 1
fi

# Check for forbidden patterns
FORBIDDEN_PATTERNS="TODO|FIXME|XXX|HACK"
if git diff --cached --name-only | xargs grep -l -E "$FORBIDDEN_PATTERNS" 2>/dev/null; then
  echo "⚠️ Warning: Found TODO/FIXME comments"
  git diff --cached --name-only | xargs grep -n -E "$FORBIDDEN_PATTERNS" 2>/dev/null
  # Don't fail, just warn
fi

echo "✅ Pre-commit checks passed"
```

### .husky/commit-msg
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Validate commit message format
npx --no -- commitlint --edit "$1"
```

### .husky/pre-push
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Running pre-push checks..."

# Type checking
echo "📝 Type checking..."
npm run typecheck || exit 1

# Tests
echo "🧪 Running tests..."
npm run test || exit 1

# Build check
echo "🏗️ Build check..."
npm run build || exit 1

echo "✅ Pre-push checks passed"
```

## Custom Hook Scripts

### scripts/hooks/check-secrets.sh
```bash
#!/usr/bin/env bash
# scripts/hooks/check-secrets.sh - Scan for secrets

set -e

echo "🔐 Scanning for secrets..."

# Patterns to detect
PATTERNS=(
  'password\s*=\s*["\047][^"\047]+'
  'api[_-]?key\s*=\s*["\047][^"\047]+'
  'secret\s*=\s*["\047][^"\047]+'
  'token\s*=\s*["\047][^"\047]+'
  'AKIA[A-Z0-9]{16}'  # AWS Access Key
  '-----BEGIN.*PRIVATE KEY-----'
  'ghp_[a-zA-Z0-9]{36}'  # GitHub PAT
  'sk-[a-zA-Z0-9]{48}'  # OpenAI API Key
  'xox[baprs]-[a-zA-Z0-9-]+'  # Slack Token
)

FOUND=0

for pattern in "${PATTERNS[@]}"; do
  if git diff --cached --name-only | xargs grep -l -E "$pattern" 2>/dev/null; then
    echo "❌ Potential secret found matching: $pattern"
    git diff --cached --name-only | xargs grep -n -E "$pattern" 2>/dev/null
    FOUND=1
  fi
done

if [ $FOUND -eq 1 ]; then
  echo ""
  echo "⚠️ Secrets detected in staged files!"
  echo "Please remove them and use environment variables instead."
  exit 1
fi

echo "✅ No secrets found"
```

### scripts/hooks/check-file-size.sh
```bash
#!/usr/bin/env bash
# scripts/hooks/check-file-size.sh - Check for large files

MAX_SIZE_KB=500

echo "📦 Checking file sizes..."

LARGE_FILES=$(git diff --cached --name-only | while read file; do
  if [ -f "$file" ]; then
    size=$(wc -c < "$file" | tr -d ' ')
    size_kb=$((size / 1024))
    if [ $size_kb -gt $MAX_SIZE_KB ]; then
      echo "$file ($size_kb KB)"
    fi
  fi
done)

if [ -n "$LARGE_FILES" ]; then
  echo "❌ Large files detected (> ${MAX_SIZE_KB}KB):"
  echo "$LARGE_FILES"
  echo ""
  echo "Consider:"
  echo "  - Using Git LFS for large files"
  echo "  - Compressing images"
  echo "  - Removing unnecessary files"
  exit 1
fi

echo "✅ File sizes OK"
```

### scripts/hooks/check-branch-name.sh
```bash
#!/usr/bin/env bash
# scripts/hooks/check-branch-name.sh - Validate branch naming

BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Skip for main branches
if [[ "$BRANCH" =~ ^(main|master|develop)$ ]]; then
  exit 0
fi

# Valid patterns
VALID_PATTERN="^(feature|bugfix|hotfix|release|chore|docs|refactor|test)\/[a-z0-9._-]+$"

if ! [[ "$BRANCH" =~ $VALID_PATTERN ]]; then
  echo "❌ Invalid branch name: $BRANCH"
  echo ""
  echo "Branch name must match: type/description"
  echo ""
  echo "Valid types:"
  echo "  feature/  - New features"
  echo "  bugfix/   - Bug fixes"
  echo "  hotfix/   - Production hotfixes"
  echo "  release/  - Release branches"
  echo "  chore/    - Maintenance"
  echo "  docs/     - Documentation"
  echo "  refactor/ - Code refactoring"
  echo "  test/     - Test changes"
  echo ""
  echo "Example: feature/user-authentication"
  exit 1
fi

echo "✅ Branch name valid: $BRANCH"
```

### scripts/hooks/check-tests.sh
```bash
#!/usr/bin/env bash
# scripts/hooks/check-tests.sh - Ensure tests exist for changed files

echo "🧪 Checking for tests..."

# Get changed source files
CHANGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$' | grep -v '\.test\.' | grep -v '\.spec\.')

MISSING_TESTS=()

for file in $CHANGED_FILES; do
  # Skip certain directories
  if [[ "$file" =~ ^(node_modules|dist|coverage)/ ]]; then
    continue
  fi

  # Check for corresponding test file
  base="${file%.*}"
  ext="${file##*.}"

  test_file_1="${base}.test.${ext}"
  test_file_2="${base}.spec.${ext}"

  if [ ! -f "$test_file_1" ] && [ ! -f "$test_file_2" ]; then
    MISSING_TESTS+=("$file")
  fi
done

if [ ${#MISSING_TESTS[@]} -gt 0 ]; then
  echo "⚠️ Warning: Missing tests for:"
  printf '  - %s\n' "${MISSING_TESTS[@]}"
  echo ""
  echo "Consider adding tests for these files."
  # Don't fail, just warn
fi

echo "✅ Test check complete"
```

## Commitlint Configuration

### commitlint.config.js
```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation
        'style',    // Formatting
        'refactor', // Code restructuring
        'perf',     // Performance
        'test',     // Tests
        'build',    // Build system
        'ci',       // CI configuration
        'chore',    // Maintenance
        'revert'    // Revert commit
      ]
    ],
    'type-case': [2, 'always', 'lower-case'],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
    'body-leading-blank': [2, 'always'],
    'body-max-line-length': [2, 'always', 100],
    'footer-leading-blank': [2, 'always'],
    'footer-max-line-length': [2, 'always', 100]
  }
};
```

## GitHub Actions Integration

### .github/workflows/pre-commit.yml
```yaml
name: Pre-commit

on:
  pull_request:
  push:
    branches: [main, develop]

jobs:
  pre-commit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: |
          npm ci
          pip install pre-commit

      - name: Run pre-commit
        run: pre-commit run --all-files

      - name: Commit fixes
        if: failure()
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: 'style: apply pre-commit fixes'
```

## CLAUDE.md Integration

```markdown
## Pre-commit Hooks

### Setup
```bash
# Python projects
pip install pre-commit
pre-commit install

# Node.js projects
npm install
npx husky install
```

### Hooks Run
- **pre-commit**: Lint, format, type check
- **commit-msg**: Validate commit message
- **pre-push**: Run tests and build

### Commit Message Format
```
type(scope): description

Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore
```

### Bypass (Emergency Only)
```bash
git commit --no-verify
```

### Update Hooks
```bash
pre-commit autoupdate
```
```

## AI Suggestions

1. **Smart staging** - Stage only relevant files
2. **Auto-fix** - Automatically fix issues
3. **Skip patterns** - Smart skip for WIP
4. **Performance** - Cache hook results
5. **Custom hooks** - Project-specific checks
6. **CI integration** - Run hooks in CI
7. **Hook analytics** - Track hook failures
8. **Team sync** - Share hook configs
9. **Gradual rollout** - Phase in new hooks
10. **Documentation** - Auto-document hooks
