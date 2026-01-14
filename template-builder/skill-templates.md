# Skill Templates

Skills are specialized capabilities that live in `.claude/skills/<name>/SKILL.md`.

## Skill Anatomy

```markdown
---
name: skill-name
description: One-line description for activation matching
version: 1.0.0
---

# Skill Title

Brief intro (1-2 sentences).

## When to Use
- Trigger condition 1
- Trigger condition 2

## Workflow
1. Step one
2. Step two

## Reference
See [detailed-docs.md](detailed-docs.md) for more.
```

## Template 1: Simple Instruction Skill

Single file with procedural knowledge.

```markdown
---
name: code-review
description: Review code for quality, security, and best practices
version: 1.0.0
---

# Code Review Skill

Provides expert code review guidance for pull requests and code changes.

## When to Use

Use this skill when:
- Reviewing a pull request
- Checking code for security issues
- Ensuring best practices are followed
- Preparing code for production

## Review Checklist

### Security
- [ ] No hardcoded secrets or credentials
- [ ] Input validation on user data
- [ ] Proper authentication checks
- [ ] No SQL injection vulnerabilities
- [ ] XSS prevention in place

### Performance
- [ ] No N+1 database queries
- [ ] Appropriate caching strategy
- [ ] Efficient algorithms used
- [ ] No memory leaks

### Code Quality
- [ ] Clear, descriptive naming
- [ ] Functions under 50 lines
- [ ] No code duplication
- [ ] Proper error handling
- [ ] Type safety maintained

### Tests
- [ ] Unit tests for new functions
- [ ] Edge cases covered
- [ ] Integration tests where needed

## Output Format

```markdown
## Code Review: [PR Title]

### Summary
[1-2 sentences]

### Issues Found

#### Critical (must fix)
- [issue]: [suggestion]

#### Suggestions
- [suggestion]

### Verdict: Approved / Changes Requested
```
```

## Template 2: Multi-File Skill

Main skill file with linked references.

### Main SKILL.md

```markdown
---
name: database-migrations
description: Create and manage database migrations safely
version: 1.0.0
---

# Database Migrations Skill

Expert guidance for creating, running, and rolling back database migrations.

## When to Use

- Creating new database tables
- Modifying existing schemas
- Running migrations in production
- Rolling back failed migrations

## Quick Start

### Create Migration
```bash
bunx prisma migrate dev --name <description>
```

### Apply Migration
```bash
bunx prisma migrate deploy
```

### Rollback
See [rollback-procedures.md](rollback-procedures.md)

## Navigation

- [create-migration.md](create-migration.md) - Creating new migrations
- [best-practices.md](best-practices.md) - Migration best practices
- [rollback-procedures.md](rollback-procedures.md) - How to rollback
- [troubleshooting.md](troubleshooting.md) - Common issues

## Safety Rules

1. **Never modify migrations after they're deployed**
2. **Always backup before production migrations**
3. **Test migrations on staging first**
4. **Have rollback plan ready**
```

### create-migration.md

```markdown
# Creating Migrations

## Step-by-Step Process

### 1. Make Schema Changes

Edit `prisma/schema.prisma`:

```prisma
model User {
  id    String @id @default(cuid())
  email String @unique
  // Add new field
  name  String?  // <- New field
}
```

### 2. Generate Migration

```bash
bunx prisma migrate dev --name add_user_name
```

This will:
- Generate SQL migration file
- Apply to development database
- Regenerate Prisma client

### 3. Review Migration

Check `prisma/migrations/<timestamp>_add_user_name/migration.sql`:

```sql
ALTER TABLE "User" ADD COLUMN "name" TEXT;
```

### 4. Commit Migration

```bash
git add prisma/
git commit -m "feat: add name field to users"
```

## Migration Types

### Adding Fields
- Nullable fields: No data migration needed
- Required fields: Provide default or migrate data first

### Removing Fields
- Remove from schema
- Data stays in DB until manually cleaned

### Renaming Fields
- Create new field → migrate data → remove old field
- Never rename directly (data loss risk)
```

## Template 3: Code Tool Skill

Skill with executable scripts.

### SKILL.md

```markdown
---
name: test-generator
description: Generate unit tests from source code
version: 1.0.0
---

# Test Generator Skill

Automatically generate unit test scaffolds from source code.

## When to Use

- Creating tests for existing code
- Bootstrapping test files
- Ensuring consistent test structure

## Usage

### Generate Tests

```bash
python scripts/generate_tests.py --source src/utils.ts --output src/utils.test.ts
```

### Options

| Flag | Description |
|------|-------------|
| `--source` | Source file to analyze |
| `--output` | Output test file path |
| `--framework` | Test framework (vitest, jest) |
| `--coverage` | Generate coverage targets |

## Example

Input (`src/utils.ts`):
```typescript
export function add(a: number, b: number): number {
  return a + b
}

export function multiply(a: number, b: number): number {
  return a * b
}
```

Output (`src/utils.test.ts`):
```typescript
import { describe, it, expect } from 'vitest'
import { add, multiply } from './utils'

describe('add', () => {
  it('should add two numbers', () => {
    expect(add(1, 2)).toBe(3)
  })

  it('should handle negative numbers', () => {
    expect(add(-1, 1)).toBe(0)
  })

  it('should handle zero', () => {
    expect(add(0, 0)).toBe(0)
  })
})

describe('multiply', () => {
  it('should multiply two numbers', () => {
    expect(multiply(2, 3)).toBe(6)
  })

  // Additional test cases...
})
```
```

### scripts/generate_tests.py

```python
#!/usr/bin/env python3
"""
Generate unit test scaffolds from TypeScript source files.
"""

import argparse
import re
import sys

def parse_functions(source_code: str) -> list[dict]:
    """Extract function signatures from TypeScript code."""
    pattern = r'export\s+function\s+(\w+)\s*\(([^)]*)\)\s*:\s*(\w+)'
    matches = re.findall(pattern, source_code)
    return [
        {'name': m[0], 'params': m[1], 'return_type': m[2]}
        for m in matches
    ]

def generate_test(func: dict, framework: str = 'vitest') -> str:
    """Generate test code for a function."""
    return f'''
describe('{func["name"]}', () => {{
  it('should work correctly', () => {{
    // TODO: Add test implementation
    expect({func["name"]}()).toBeDefined()
  }})

  it('should handle edge cases', () => {{
    // TODO: Add edge case tests
  }})
}})
'''

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--framework', default='vitest')
    args = parser.parse_args()

    with open(args.source) as f:
        source = f.read()

    functions = parse_functions(source)

    # Generate imports
    module_name = args.source.replace('.ts', '').split('/')[-1]
    func_names = ', '.join(f['name'] for f in functions)

    output = f"import {{ describe, it, expect }} from '{args.framework}'\n"
    output += f"import {{ {func_names} }} from './{module_name}'\n\n"

    for func in functions:
        output += generate_test(func, args.framework)

    with open(args.output, 'w') as f:
        f.write(output)

    print(f"Generated tests: {args.output}")

if __name__ == '__main__':
    main()
```

## Template 4: Domain Expert Skill

Deep expertise in a specific domain.

```markdown
---
name: react-performance
description: Expert guidance for optimizing React application performance
version: 1.0.0
---

# React Performance Expert

Deep expertise in React performance optimization.

## When to Use

- Diagnosing slow renders
- Optimizing bundle size
- Reducing memory usage
- Improving Time to Interactive

## Quick Diagnosis

### Check for Re-render Issues

```tsx
// Add to component
import { useEffect, useRef } from 'react'

function useRenderCount(name: string) {
  const count = useRef(0)
  useEffect(() => {
    count.current++
    console.log(`${name} rendered ${count.current} times`)
  })
}
```

### Profile with React DevTools

1. Open React DevTools Profiler
2. Click Record
3. Interact with your app
4. Stop recording
5. Analyze flame graph

## Common Issues & Fixes

### Issue: Unnecessary Re-renders

**Symptoms:**
- Slow interactions
- High CPU usage
- Profiler shows many renders

**Fixes:**

1. **Memoize expensive components**
```tsx
const ExpensiveComponent = memo(({ data }) => {
  // ...
})
```

2. **Use useMemo for calculations**
```tsx
const sorted = useMemo(
  () => items.sort((a, b) => a.name.localeCompare(b.name)),
  [items]
)
```

3. **Use useCallback for handlers**
```tsx
const handleClick = useCallback(() => {
  setCount(c => c + 1)
}, [])
```

### Issue: Large Bundle Size

**Symptoms:**
- Slow initial load
- Large JavaScript files

**Fixes:**

1. **Dynamic imports**
```tsx
const HeavyComponent = lazy(() => import('./HeavyComponent'))
```

2. **Tree shaking**
```tsx
// Bad - imports entire library
import _ from 'lodash'

// Good - imports only what's needed
import debounce from 'lodash/debounce'
```

3. **Analyze bundle**
```bash
bunx @next/bundle-analyzer
```

### Issue: Memory Leaks

**Symptoms:**
- Memory grows over time
- App becomes slow after long usage

**Fixes:**

1. **Cleanup subscriptions**
```tsx
useEffect(() => {
  const sub = subscribe()
  return () => sub.unsubscribe() // Cleanup!
}, [])
```

2. **Cancel async operations**
```tsx
useEffect(() => {
  const controller = new AbortController()

  fetch(url, { signal: controller.signal })

  return () => controller.abort()
}, [url])
```

## Performance Checklist

- [ ] No unnecessary re-renders
- [ ] Large lists are virtualized
- [ ] Images are lazy loaded
- [ ] Bundle is code-split
- [ ] No memory leaks
- [ ] Key prop is stable and unique

## Reference

- [concepts.md](concepts.md) - React rendering concepts
- [patterns.md](patterns.md) - Performance patterns
- [tools.md](tools.md) - Profiling tools
```

## Template 5: Workflow Automation Skill

Automate repetitive development tasks.

```markdown
---
name: release-manager
description: Automate release process including versioning, changelog, and deployment
version: 1.0.0
---

# Release Manager Skill

Automate the release process from version bump to deployment.

## When to Use

- Preparing a new release
- Generating changelogs
- Creating release tags
- Deploying to production

## Release Workflow

### 1. Pre-release Checks

```bash
# Ensure clean working directory
git status

# Run all checks
bun run lint && bun run typecheck && bun run test

# Check for uncommitted changes
git diff --exit-code
```

### 2. Version Bump

```bash
# Patch release (1.0.0 -> 1.0.1)
bun version patch

# Minor release (1.0.0 -> 1.1.0)
bun version minor

# Major release (1.0.0 -> 2.0.0)
bun version major
```

### 3. Generate Changelog

```bash
# Using conventional commits
bunx conventional-changelog -p angular -i CHANGELOG.md -s

# Or manually from git log
git log --oneline v1.0.0..HEAD
```

### 4. Create Release

```bash
# Commit version bump
git add package.json CHANGELOG.md
git commit -m "chore: release v$(node -p "require('./package.json').version")"

# Create tag
git tag -a "v$(node -p "require('./package.json').version")" -m "Release"

# Push
git push origin main --tags
```

### 5. Deploy

```bash
# Vercel (auto-deploy on push)
# Or manual trigger
vercel --prod

# Railway
railway up --detach
```

## Automated Release Script

```bash
#!/bin/bash
# scripts/release.sh

set -e

VERSION_TYPE=${1:-patch}

echo "Running pre-release checks..."
bun run lint
bun run typecheck
bun run test

echo "Bumping version ($VERSION_TYPE)..."
bun version $VERSION_TYPE --no-git-tag-version

VERSION=$(node -p "require('./package.json').version")

echo "Generating changelog..."
bunx conventional-changelog -p angular -i CHANGELOG.md -s

echo "Committing..."
git add package.json CHANGELOG.md
git commit -m "chore: release v$VERSION"
git tag -a "v$VERSION" -m "Release v$VERSION"

echo "Pushing..."
git push origin main --tags

echo "Released v$VERSION!"
```

## Rollback

If release has issues:

```bash
# Revert to previous version
git revert HEAD

# Delete tag
git tag -d v1.2.3
git push origin :refs/tags/v1.2.3

# Re-deploy previous version
vercel rollback
```
```

## Creating Your Own Skill

1. **Create directory**: `.claude/skills/my-skill/`
2. **Add SKILL.md** with frontmatter
3. **Write "When to Use"** section
4. **Add workflow/instructions**
5. **Link additional files** if needed
6. **Test activation** with natural language

### Best Practices

- Keep SKILL.md under 500 lines
- Use progressive disclosure (link to details)
- Include concrete examples
- Test with real tasks
- Iterate based on usage
