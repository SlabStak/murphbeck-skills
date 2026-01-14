# Git Hooks Template

## Overview
Comprehensive Git hooks setup with Husky, lint-staged, and custom validation scripts for automated code quality checks.

## Quick Start
```bash
npm install husky lint-staged --save-dev
npx husky init
```

## Husky Configuration

### package.json Setup
```json
{
  "scripts": {
    "prepare": "husky",
    "lint": "eslint . --fix",
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
    ]
  }
}
```

### Pre-commit Hook
```bash
#!/bin/sh
# .husky/pre-commit

# Run lint-staged
npx lint-staged

# Check for console.log statements
if git diff --cached --name-only | xargs grep -l 'console\.log' 2>/dev/null; then
  echo "❌ Error: console.log statements found. Remove them before committing."
  echo "Files with console.log:"
  git diff --cached --name-only | xargs grep -l 'console\.log'
  exit 1
fi

# Check for debugging statements
if git diff --cached --name-only | xargs grep -l 'debugger' 2>/dev/null; then
  echo "❌ Error: debugger statements found. Remove them before committing."
  exit 1
fi

# Prevent commits to main/master
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  echo "❌ Error: Direct commits to $BRANCH are not allowed."
  echo "Please create a feature branch and submit a PR."
  exit 1
fi

echo "✅ Pre-commit checks passed!"
```

### Commit Message Hook
```bash
#!/bin/sh
# .husky/commit-msg

# Validate conventional commit format
npx --no -- commitlint --edit "$1"

# Or use custom validation
COMMIT_MSG=$(cat "$1")
PATTERN="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9-]+\))?: .{1,100}$"

if ! echo "$COMMIT_MSG" | grep -qE "$PATTERN"; then
  echo "❌ Invalid commit message format!"
  echo ""
  echo "Expected format: type(scope): description"
  echo ""
  echo "Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert"
  echo ""
  echo "Examples:"
  echo "  feat(auth): add OAuth2 login"
  echo "  fix(api): resolve null pointer exception"
  echo "  docs: update README installation steps"
  echo ""
  exit 1
fi

# Check commit message length
if [ ${#COMMIT_MSG} -gt 100 ]; then
  echo "❌ Commit message too long (max 100 characters)"
  exit 1
fi

echo "✅ Commit message valid!"
```

### Pre-push Hook
```bash
#!/bin/sh
# .husky/pre-push

echo "🔍 Running pre-push checks..."

# Run type checking
echo "📝 Type checking..."
npm run typecheck
if [ $? -ne 0 ]; then
  echo "❌ Type check failed!"
  exit 1
fi

# Run tests
echo "🧪 Running tests..."
npm run test
if [ $? -ne 0 ]; then
  echo "❌ Tests failed!"
  exit 1
fi

# Check for secrets
echo "🔐 Scanning for secrets..."
if command -v gitleaks &> /dev/null; then
  gitleaks detect --source . --verbose
  if [ $? -ne 0 ]; then
    echo "❌ Potential secrets detected!"
    exit 1
  fi
fi

# Build check
echo "🏗️ Build check..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo "✅ All pre-push checks passed!"
```

### Post-merge Hook
```bash
#!/bin/sh
# .husky/post-merge

echo "🔄 Running post-merge tasks..."

# Check if package.json changed
CHANGED_FILES=$(git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD)

if echo "$CHANGED_FILES" | grep -q "package.json\|package-lock.json\|yarn.lock\|pnpm-lock.yaml"; then
  echo "📦 Dependencies changed, running install..."
  npm install
fi

# Check if migrations changed
if echo "$CHANGED_FILES" | grep -q "prisma/migrations\|migrations/"; then
  echo "🗃️ Migrations detected, running database migrations..."
  npm run db:migrate
fi

# Check if environment example changed
if echo "$CHANGED_FILES" | grep -q ".env.example"; then
  echo "⚠️ .env.example has changed. Please update your local .env file."
fi

echo "✅ Post-merge tasks completed!"
```

## Custom Hook Scripts

### Security Check Hook
```typescript
// scripts/hooks/security-check.ts
import { execSync } from 'child_process';
import * as fs from 'fs';

interface SecurityIssue {
  type: string;
  file: string;
  line: number;
  message: string;
}

const PATTERNS = [
  {
    pattern: /(?:api[_-]?key|apikey|secret[_-]?key|password|passwd|pwd)\s*[:=]\s*['"][^'"]+['"]/gi,
    type: 'hardcoded-secret',
    message: 'Potential hardcoded secret detected'
  },
  {
    pattern: /(?:AKIA|ABIA|ACCA|ASIA)[A-Z0-9]{16}/g,
    type: 'aws-key',
    message: 'Potential AWS access key detected'
  },
  {
    pattern: /-----BEGIN (?:RSA |DSA |EC )?PRIVATE KEY-----/g,
    type: 'private-key',
    message: 'Private key detected'
  },
  {
    pattern: /ghp_[a-zA-Z0-9]{36}/g,
    type: 'github-token',
    message: 'GitHub personal access token detected'
  },
  {
    pattern: /sk-[a-zA-Z0-9]{48}/g,
    type: 'openai-key',
    message: 'OpenAI API key detected'
  }
];

function getStagedFiles(): string[] {
  const output = execSync('git diff --cached --name-only --diff-filter=ACM')
    .toString()
    .trim();

  return output.split('\n').filter(f => f.length > 0);
}

function scanFile(filePath: string): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  // Skip binary files and node_modules
  if (filePath.includes('node_modules') ||
      filePath.match(/\.(png|jpg|gif|ico|woff|ttf|eot)$/)) {
    return issues;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      for (const { pattern, type, message } of PATTERNS) {
        if (pattern.test(line)) {
          issues.push({
            type,
            file: filePath,
            line: index + 1,
            message
          });
        }
        // Reset regex lastIndex
        pattern.lastIndex = 0;
      }
    });
  } catch (error) {
    // File might be binary or unreadable
  }

  return issues;
}

function main(): void {
  console.log('🔐 Running security scan...\n');

  const files = getStagedFiles();
  const allIssues: SecurityIssue[] = [];

  for (const file of files) {
    const issues = scanFile(file);
    allIssues.push(...issues);
  }

  if (allIssues.length > 0) {
    console.error('❌ Security issues found:\n');

    for (const issue of allIssues) {
      console.error(`  ${issue.file}:${issue.line}`);
      console.error(`    Type: ${issue.type}`);
      console.error(`    Message: ${issue.message}\n`);
    }

    console.error('Please remove sensitive data before committing.');
    console.error('Consider using environment variables instead.\n');
    process.exit(1);
  }

  console.log('✅ No security issues found!\n');
}

main();
```

### Branch Naming Hook
```bash
#!/bin/sh
# scripts/hooks/validate-branch-name.sh

BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Define valid branch patterns
VALID_PATTERNS="^(feature|bugfix|hotfix|release|chore)\/[a-z0-9._-]+$"

# Skip validation for main branches
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ] || [ "$BRANCH" = "develop" ]; then
  exit 0
fi

if ! echo "$BRANCH" | grep -qE "$VALID_PATTERNS"; then
  echo "❌ Invalid branch name: $BRANCH"
  echo ""
  echo "Branch names must follow the pattern: type/description"
  echo ""
  echo "Valid types:"
  echo "  feature/  - New features"
  echo "  bugfix/   - Bug fixes"
  echo "  hotfix/   - Production hotfixes"
  echo "  release/  - Release branches"
  echo "  chore/    - Maintenance tasks"
  echo ""
  echo "Examples:"
  echo "  feature/user-authentication"
  echo "  bugfix/fix-login-error"
  echo "  release/v2.0.0"
  echo ""
  exit 1
fi

echo "✅ Branch name is valid!"
```

### Test Coverage Hook
```typescript
// scripts/hooks/check-coverage.ts
import { execSync } from 'child_process';

interface CoverageReport {
  total: {
    lines: { pct: number };
    statements: { pct: number };
    functions: { pct: number };
    branches: { pct: number };
  };
}

const THRESHOLDS = {
  lines: 80,
  statements: 80,
  functions: 75,
  branches: 70
};

function checkCoverage(): void {
  console.log('📊 Checking test coverage...\n');

  // Run tests with coverage
  try {
    execSync('npm run test -- --coverage --coverageReporters=json-summary', {
      stdio: 'inherit'
    });
  } catch {
    console.error('❌ Tests failed!');
    process.exit(1);
  }

  // Read coverage report
  const report: CoverageReport = require('./coverage/coverage-summary.json');
  const { total } = report;

  let failed = false;

  // Check thresholds
  for (const [metric, threshold] of Object.entries(THRESHOLDS)) {
    const actual = total[metric as keyof typeof total].pct;

    if (actual < threshold) {
      console.error(`❌ ${metric}: ${actual}% (required: ${threshold}%)`);
      failed = true;
    } else {
      console.log(`✅ ${metric}: ${actual}% (required: ${threshold}%)`);
    }
  }

  if (failed) {
    console.error('\n❌ Coverage thresholds not met!');
    process.exit(1);
  }

  console.log('\n✅ Coverage thresholds met!');
}

checkCoverage();
```

## Commitlint Configuration

### commitlint.config.js
```javascript
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
    'footer-leading-blank': [2, 'always']
  },
  prompt: {
    questions: {
      type: {
        description: 'Select the type of change',
        enum: {
          feat: { description: 'A new feature', title: 'Features', emoji: '✨' },
          fix: { description: 'A bug fix', title: 'Bug Fixes', emoji: '🐛' },
          docs: { description: 'Documentation changes', title: 'Docs', emoji: '📚' },
          style: { description: 'Formatting changes', title: 'Styles', emoji: '💎' },
          refactor: { description: 'Code refactoring', title: 'Refactoring', emoji: '📦' },
          perf: { description: 'Performance improvement', title: 'Performance', emoji: '🚀' },
          test: { description: 'Adding tests', title: 'Tests', emoji: '🚨' },
          build: { description: 'Build changes', title: 'Build', emoji: '🛠' },
          ci: { description: 'CI configuration', title: 'CI', emoji: '⚙️' },
          chore: { description: 'Maintenance', title: 'Chores', emoji: '♻️' },
          revert: { description: 'Revert commit', title: 'Reverts', emoji: '🗑' }
        }
      },
      scope: {
        description: 'Scope of the change (component, module, etc.)'
      },
      subject: {
        description: 'Short description of the change'
      },
      body: {
        description: 'Longer description of the change (optional)'
      },
      breaking: {
        description: 'Breaking changes description (optional)'
      },
      issues: {
        description: 'Issue references (e.g., #123)'
      }
    }
  }
};
```

## CLAUDE.md Integration

```markdown
## Git Hooks

### Hooks Available
- **pre-commit** - Lint, format, security scan
- **commit-msg** - Validate commit message format
- **pre-push** - Run tests, type check, build
- **post-merge** - Install deps, run migrations

### Commit Format
type(scope): description

Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert

### Commands
- `npm run prepare` - Install hooks
- `npx husky add .husky/hook-name` - Add new hook
- `git commit --no-verify` - Skip hooks (emergency only)
```

## AI Suggestions

1. **Auto-fix violations** - Fix common issues automatically
2. **Custom validations** - Build project-specific checks
3. **Skip patterns** - Configure files to skip
4. **Performance optimization** - Cache lint results
5. **Parallel execution** - Run checks in parallel
6. **Error reporting** - Better error messages
7. **Integration with CI** - Share configuration
8. **Hook templates** - Common hook patterns
9. **Debugging hooks** - Verbose mode for issues
10. **Hook versioning** - Keep hooks in sync with team
