# Code Review Template

## Overview
Comprehensive code review setup with GitHub PR templates, review guidelines, automated checks, and review workflow tools.

## Quick Start
```bash
mkdir -p .github
touch .github/pull_request_template.md
touch .github/CODEOWNERS
```

## Pull Request Template

### .github/pull_request_template.md
```markdown
## Summary
<!-- Brief description of changes -->


## Type of Change
<!-- Check all that apply -->
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that causes existing functionality to change)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring
- [ ] Test coverage improvement
- [ ] CI/CD changes

## Related Issues
<!-- Link to related issues -->
Fixes #
Relates to #

## Changes Made
<!-- Detailed list of changes -->
-
-
-

## Screenshots/Recordings
<!-- If applicable, add screenshots or recordings -->


## Testing
<!-- Describe how this was tested -->
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed
- [ ] E2E tests added/updated

### Test Instructions
<!-- Steps to test this PR -->
1.
2.
3.

## Checklist
<!-- Verify all items before requesting review -->
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] New and existing tests pass locally
- [ ] Any dependent changes have been merged and published

## Deployment Notes
<!-- Any special deployment considerations -->


## Additional Notes
<!-- Any other information reviewers should know -->

```

## CODEOWNERS

### .github/CODEOWNERS
```
# Default owners for everything
* @org/engineering-team

# Frontend
/apps/web/ @org/frontend-team
/packages/ui/ @org/frontend-team
*.tsx @org/frontend-team
*.css @org/frontend-team

# Backend
/apps/api/ @org/backend-team
/packages/database/ @org/backend-team

# Infrastructure
/infra/ @org/devops-team
/.github/ @org/devops-team
Dockerfile* @org/devops-team
docker-compose* @org/devops-team

# Security sensitive files
.env* @org/security-team
**/auth/** @org/security-team
**/security/** @org/security-team

# Documentation
/docs/ @org/docs-team
*.md @org/docs-team

# Specific file owners
package.json @lead-developer
tsconfig.json @lead-developer
```

## Review Workflow

### .github/workflows/review.yml
```yaml
name: Code Review

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

jobs:
  # Automated checks
  lint-and-test:
    name: Lint & Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm typecheck

      - name: Test
        run: pnpm test --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  # Bundle size check
  bundle-analysis:
    name: Bundle Analysis
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Analyze bundle
        uses: hashicorp/nextjs-bundle-analysis@v1
        with:
          build-directory: .next

  # Security scan
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'CRITICAL,HIGH'

      - name: Check for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.pull_request.base.sha }}
          head: ${{ github.event.pull_request.head.sha }}

  # Auto-assign reviewers
  assign-reviewers:
    name: Assign Reviewers
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Auto assign reviewers
        uses: kentaro-m/auto-assign-action@v1
        with:
          configuration-path: '.github/auto-assign.yml'

  # Label PR
  label:
    name: Label PR
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/labeler@v5
        with:
          repo-token: "${{ secrets.GITHUB_TOKEN }}"

  # PR Size check
  size-check:
    name: PR Size
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check PR size
        uses: codelytv/pr-size-labeler@v1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          xs_label: 'size/XS'
          xs_max_size: 10
          s_label: 'size/S'
          s_max_size: 100
          m_label: 'size/M'
          m_max_size: 500
          l_label: 'size/L'
          l_max_size: 1000
          xl_label: 'size/XL'
          fail_if_xl: false
          message_if_xl: |
            This PR is quite large. Consider breaking it into smaller PRs for easier review.
```

### .github/auto-assign.yml
```yaml
# Auto-assign configuration
addReviewers: true
addAssignees: true

# Reviewers to assign
reviewers:
  - reviewer1
  - reviewer2
  - reviewer3

# Assignees
assignees:
  - author

# Number of reviewers to assign
numberOfReviewers: 2

# Skip keywords in title
skipKeywords:
  - wip
  - draft
  - DO NOT MERGE

# Review groups
reviewGroups:
  frontend:
    - frontend-dev1
    - frontend-dev2
  backend:
    - backend-dev1
    - backend-dev2

# Use review groups based on file paths
useReviewGroups: true
filterLabels:
  include: []
  exclude:
    - dependencies
    - automated
```

### .github/labeler.yml
```yaml
# PR labeler configuration

# Feature
feature:
  - head-branch: ['^feature/', '^feat/']
  - changed-files:
    - any-glob-to-any-file: ['src/features/**/*']

# Bug fix
bug:
  - head-branch: ['^fix/', '^bug/', '^hotfix/']
  - changed-files:
    - any-glob-to-any-file: ['**/*.test.*']

# Documentation
documentation:
  - changed-files:
    - any-glob-to-any-file: ['docs/**/*', '**/*.md']

# Frontend
frontend:
  - changed-files:
    - any-glob-to-any-file:
      - 'apps/web/**/*'
      - 'packages/ui/**/*'
      - '**/*.tsx'
      - '**/*.css'

# Backend
backend:
  - changed-files:
    - any-glob-to-any-file:
      - 'apps/api/**/*'
      - 'packages/database/**/*'

# Infrastructure
infrastructure:
  - changed-files:
    - any-glob-to-any-file:
      - 'infra/**/*'
      - '.github/**/*'
      - 'Dockerfile*'
      - 'docker-compose*'

# Dependencies
dependencies:
  - changed-files:
    - any-glob-to-any-file:
      - 'package.json'
      - 'pnpm-lock.yaml'
      - 'yarn.lock'

# Tests
tests:
  - changed-files:
    - any-glob-to-any-file:
      - '**/*.test.*'
      - '**/*.spec.*'
      - '**/tests/**/*'

# Configuration
configuration:
  - changed-files:
    - any-glob-to-any-file:
      - '*.config.*'
      - '.env*'
      - 'tsconfig*.json'
```

## Review Checklist Component

### scripts/review-checklist.ts
```typescript
// scripts/review-checklist.ts

interface ChecklistItem {
  category: string;
  items: {
    label: string;
    description?: string;
    severity: 'required' | 'recommended' | 'optional';
  }[];
}

const reviewChecklist: ChecklistItem[] = [
  {
    category: 'Code Quality',
    items: [
      {
        label: 'Code follows project style guide',
        severity: 'required'
      },
      {
        label: 'No commented-out code',
        severity: 'required'
      },
      {
        label: 'No console.log statements',
        severity: 'required'
      },
      {
        label: 'Clear and meaningful variable names',
        severity: 'required'
      },
      {
        label: 'Functions are small and focused',
        description: 'Single responsibility principle',
        severity: 'recommended'
      },
      {
        label: 'No code duplication',
        severity: 'recommended'
      },
      {
        label: 'Complex logic is documented',
        severity: 'recommended'
      }
    ]
  },
  {
    category: 'Security',
    items: [
      {
        label: 'No hardcoded secrets or credentials',
        severity: 'required'
      },
      {
        label: 'User input is validated',
        severity: 'required'
      },
      {
        label: 'SQL injection prevention',
        severity: 'required'
      },
      {
        label: 'XSS prevention',
        severity: 'required'
      },
      {
        label: 'Proper authentication checks',
        severity: 'required'
      },
      {
        label: 'Sensitive data is encrypted',
        severity: 'recommended'
      }
    ]
  },
  {
    category: 'Testing',
    items: [
      {
        label: 'Unit tests for new functionality',
        severity: 'required'
      },
      {
        label: 'Edge cases are covered',
        severity: 'recommended'
      },
      {
        label: 'Integration tests where appropriate',
        severity: 'recommended'
      },
      {
        label: 'Tests are deterministic',
        severity: 'required'
      },
      {
        label: 'Test coverage meets threshold',
        severity: 'recommended'
      }
    ]
  },
  {
    category: 'Performance',
    items: [
      {
        label: 'No N+1 queries',
        severity: 'required'
      },
      {
        label: 'Appropriate caching',
        severity: 'recommended'
      },
      {
        label: 'No memory leaks',
        severity: 'required'
      },
      {
        label: 'Lazy loading where appropriate',
        severity: 'optional'
      },
      {
        label: 'Bundle size impact considered',
        severity: 'recommended'
      }
    ]
  },
  {
    category: 'Documentation',
    items: [
      {
        label: 'README updated if needed',
        severity: 'recommended'
      },
      {
        label: 'API documentation updated',
        severity: 'required'
      },
      {
        label: 'Inline comments for complex logic',
        severity: 'recommended'
      },
      {
        label: 'CHANGELOG updated',
        severity: 'optional'
      }
    ]
  },
  {
    category: 'Accessibility',
    items: [
      {
        label: 'Semantic HTML used',
        severity: 'required'
      },
      {
        label: 'ARIA labels where needed',
        severity: 'required'
      },
      {
        label: 'Keyboard navigation works',
        severity: 'required'
      },
      {
        label: 'Color contrast is sufficient',
        severity: 'recommended'
      },
      {
        label: 'Screen reader tested',
        severity: 'optional'
      }
    ]
  }
];

function generateChecklistMarkdown(): string {
  let md = '## Code Review Checklist\n\n';

  for (const category of reviewChecklist) {
    md += `### ${category.category}\n\n`;

    for (const item of category.items) {
      const emoji =
        item.severity === 'required' ? '🔴' :
        item.severity === 'recommended' ? '🟡' : '🟢';

      md += `- [ ] ${emoji} ${item.label}`;
      if (item.description) {
        md += ` - *${item.description}*`;
      }
      md += '\n';
    }
    md += '\n';
  }

  md += '\n**Legend:** 🔴 Required | 🟡 Recommended | 🟢 Optional\n';

  return md;
}

// Generate and output
console.log(generateChecklistMarkdown());
```

## Review Comments Template

### scripts/review-comments.ts
```typescript
// scripts/review-comments.ts

interface ReviewComment {
  type: 'suggestion' | 'question' | 'issue' | 'praise' | 'nitpick';
  prefix: string;
  template: string;
}

const commentTemplates: ReviewComment[] = [
  {
    type: 'suggestion',
    prefix: '💡 Suggestion:',
    template: `💡 **Suggestion:** Consider {{suggestion}}

This would improve {{benefit}}.

\`\`\`{{language}}
{{code}}
\`\`\``
  },
  {
    type: 'question',
    prefix: '❓ Question:',
    template: `❓ **Question:** {{question}}

I'm curious about the reasoning behind this approach.`
  },
  {
    type: 'issue',
    prefix: '🐛 Issue:',
    template: `🐛 **Issue:** {{description}}

**Why this matters:** {{impact}}

**Suggested fix:**
\`\`\`{{language}}
{{fix}}
\`\`\``
  },
  {
    type: 'praise',
    prefix: '✨ Nice!',
    template: `✨ **Nice!** {{praise}}

Great use of {{technique}}.`
  },
  {
    type: 'nitpick',
    prefix: '🔍 Nitpick:',
    template: `🔍 **Nitpick (non-blocking):** {{nitpick}}

This is minor and doesn't block approval.`
  }
];

// Conventional comment prefixes
const conventionalComments = {
  'praise:': 'Highlight something positive',
  'nitpick:': 'Minor issues that don\'t block',
  'suggestion:': 'Propose an improvement',
  'issue:': 'Highlight a problem',
  'question:': 'Ask for clarification',
  'thought:': 'Share a consideration',
  'chore:': 'Request cleanup/refactoring',
  'note:': 'Provide context or information'
};

function generateCommentGuide(): string {
  let guide = '# Code Review Comment Guide\n\n';

  guide += '## Comment Types\n\n';
  for (const [prefix, description] of Object.entries(conventionalComments)) {
    guide += `- **${prefix}** ${description}\n`;
  }

  guide += '\n## Decorations\n\n';
  guide += '- `(blocking)` - Must be resolved before merge\n';
  guide += '- `(non-blocking)` - Optional improvement\n';
  guide += '- `(if-minor)` - Only if it\'s a small change\n';

  guide += '\n## Examples\n\n';
  guide += '```\n';
  guide += 'suggestion (non-blocking): Consider using a constant here.\n';
  guide += '\n';
  guide += 'issue (blocking): This will cause a memory leak.\n';
  guide += '\n';
  guide += 'question: What happens if this is null?\n';
  guide += '```\n';

  return guide;
}

console.log(generateCommentGuide());
```

## CLAUDE.md Integration

```markdown
## Code Review

### PR Guidelines
1. Keep PRs small (< 500 lines)
2. Write clear descriptions
3. Link related issues
4. Add tests for new code
5. Self-review before requesting

### Review Checklist
- [ ] Code follows style guide
- [ ] No security vulnerabilities
- [ ] Tests are included
- [ ] Documentation updated
- [ ] No performance issues

### Comment Prefixes
- `praise:` - Positive feedback
- `suggestion:` - Improvement idea
- `issue:` - Problem to fix
- `question:` - Clarification needed
- `nitpick:` - Minor, non-blocking

### Auto-labeling
PRs are automatically labeled based on:
- Files changed (frontend, backend, etc.)
- Branch name prefix
- PR size (XS, S, M, L, XL)
```

## AI Suggestions

1. **Auto-review** - AI-powered suggestions
2. **Diff analysis** - Highlight risky changes
3. **Test coverage** - Show coverage changes
4. **Security scan** - Detect vulnerabilities
5. **Performance impact** - Bundle size, queries
6. **Style enforcement** - Auto-format suggestions
7. **Documentation** - Missing doc detection
8. **Review assignment** - Smart reviewer selection
9. **Review analytics** - Track review metrics
10. **Learning** - Suggest based on history
