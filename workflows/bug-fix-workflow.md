# Bug Fix Workflow

A systematic workflow for investigating, fixing, and verifying bug fixes in production applications.

---

## WORKFLOW OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                      BUG FIX WORKFLOW                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐        │
│  │ REPRODUCE│ → │ DIAGNOSE │ → │   FIX    │ → │  VERIFY  │        │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘        │
│       ↓              ↓              ↓              ↓               │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐        │
│  │ /debug   │   │ /explain │   │ /refactor│   │ /test-gen│        │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## PHASE 1: REPRODUCE

### Skills Used
- `/debug` - Debug investigation
- `/codebase-onboard` - Understand context

### Steps

```bash
# 1. Gather bug information
# - Error messages
# - Stack traces
# - Steps to reproduce
# - Expected vs actual behavior

# 2. Set up reproduction environment
npm install
npm run dev

# 3. Reproduce the issue
# Document exact steps and conditions
```

### Bug Report Template

```markdown
## Bug Description
[Clear description of the issue]

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- Browser: [e.g., Chrome 120]
- OS: [e.g., macOS 14.2]
- Node: [e.g., 20.10.0]

## Screenshots/Logs
[Attach relevant screenshots or error logs]
```

### Deliverables
- [ ] Bug reproduced locally
- [ ] Reproduction steps documented
- [ ] Environment details captured

---

## PHASE 2: DIAGNOSE

### Skills Used
- `/explain` - Understand code flow
- `/debug` - Identify root cause

### Steps

```bash
# 1. Trace the code path
/explain "Trace the data flow from user input to error"

# 2. Add diagnostic logging
console.log('[DEBUG] Input:', input);
console.log('[DEBUG] State:', state);

# 3. Check recent changes
git log --oneline -20
git bisect start
```

### Diagnostic Checklist

```typescript
// Common bug sources to check:

// 1. Input validation
function handleInput(data: unknown) {
  // Is the input being validated?
  // Are edge cases handled?
}

// 2. State management
// Is state being mutated correctly?
// Are there race conditions?

// 3. Async operations
// Are promises being awaited?
// Is error handling present?

// 4. Type mismatches
// Are types correct at boundaries?
// Is data being transformed correctly?

// 5. External dependencies
// Is the API responding correctly?
// Are timeouts handled?
```

### Root Cause Analysis

```markdown
## Root Cause Analysis

### What Happened
[Description of the failure]

### Why It Happened
[Technical explanation]

### Contributing Factors
- [ ] Missing validation
- [ ] Race condition
- [ ] Type mismatch
- [ ] API change
- [ ] Edge case not handled

### Impact Assessment
- Affected users: [estimate]
- Severity: [critical/high/medium/low]
- Duration: [how long has this existed]
```

### Deliverables
- [ ] Root cause identified
- [ ] Code path traced
- [ ] Impact assessed

---

## PHASE 3: FIX

### Skills Used
- `/refactor` - Safe code changes
- `/code-review` - Self-review fix

### Steps

```bash
# 1. Create fix branch
git checkout -b fix/issue-123-description

# 2. Implement minimal fix
/refactor "Fix the specific issue without over-engineering"

# 3. Self-review the change
/code-review "Review this fix for correctness and side effects"
```

### Fix Implementation

```typescript
// BAD: Over-engineered fix
function handleData(data: any) {
  // Adding 50 lines of defensive code
  // Refactoring unrelated parts
  // Adding new features
}

// GOOD: Minimal targeted fix
function handleData(data: unknown) {
  // Add specific validation for the bug
  if (!isValid(data)) {
    return handleInvalidData(data);
  }
  // Rest of existing code unchanged
}
```

### Fix Checklist

```markdown
## Pre-Commit Checklist

### Code Quality
- [ ] Fix addresses root cause (not just symptoms)
- [ ] Minimal changes (no unrelated refactoring)
- [ ] No new warnings introduced
- [ ] Types are correct

### Testing
- [ ] Bug no longer reproduces
- [ ] Existing tests still pass
- [ ] New test added for this case

### Documentation
- [ ] Code comments added if non-obvious
- [ ] PR description explains the fix
```

### Deliverables
- [ ] Fix implemented
- [ ] Self-reviewed
- [ ] Commit message written

---

## PHASE 4: VERIFY

### Skills Used
- `/test-gen` - Generate tests
- `/vitest-builder` - Unit tests
- `/playwright-builder` - E2E tests

### Steps

```bash
# 1. Add regression test
/test-gen "Create test that would have caught this bug"

# 2. Run full test suite
npm run test

# 3. Manual verification
# Follow original reproduction steps
# Confirm bug is fixed
```

### Regression Test

```typescript
// tests/bugs/issue-123.test.ts
import { describe, it, expect } from 'vitest';
import { handleData } from '@/lib/data';

describe('Issue #123: Invalid data handling', () => {
  it('should handle null input gracefully', () => {
    // This test would have caught the original bug
    expect(() => handleData(null)).not.toThrow();
    expect(handleData(null)).toEqual({ error: 'Invalid input' });
  });

  it('should handle undefined fields', () => {
    const input = { name: 'Test' }; // missing required field
    const result = handleData(input);
    expect(result.error).toBeDefined();
  });

  it('should process valid data correctly', () => {
    const input = { name: 'Test', value: 42 };
    const result = handleData(input);
    expect(result.success).toBe(true);
  });
});
```

### Verification Checklist

```markdown
## Verification Checklist

### Functional
- [ ] Original bug no longer reproduces
- [ ] All original functionality still works
- [ ] Edge cases handled

### Technical
- [ ] All tests pass
- [ ] No new warnings
- [ ] Performance not degraded
- [ ] Memory usage stable

### Integration
- [ ] Works with related features
- [ ] API contracts maintained
- [ ] Database migrations (if any) work
```

---

## PHASE 5: DEPLOY & MONITOR

### Skills Used
- `/deploy-vercel` - Deploy fix
- `/observability` - Monitor for regressions

### Steps

```bash
# 1. Create PR with fix
gh pr create --title "fix: handle null input in data handler" \
  --body "Fixes #123. Adds validation for null input."

# 2. Deploy to staging
vercel

# 3. Verify in staging
# Run through reproduction steps

# 4. Deploy to production
vercel --prod

# 5. Monitor for issues
# Watch error tracking
# Check metrics
```

### PR Template

```markdown
## Fix: [Issue Title]

Fixes #123

### Problem
[Brief description of the bug]

### Root Cause
[What was causing the issue]

### Solution
[How this PR fixes it]

### Testing
- [x] Added regression test
- [x] All tests pass
- [x] Manually verified fix

### Checklist
- [x] Minimal changes
- [x] No side effects
- [x] Documentation updated (if needed)
```

### Post-Deploy Monitoring

```yaml
# Things to watch after deploying a fix:

Immediate (0-1 hour):
  - Error rates
  - Related API endpoint response times
  - User-reported issues

Short-term (1-24 hours):
  - Overall error trends
  - Related feature usage
  - Support ticket volume

Long-term (1 week):
  - Regression reports
  - Performance metrics
  - User feedback
```

---

## WORKFLOW COMMAND

```bash
# Full bug fix workflow
claude "Fix bug #123: Users can't submit forms with special characters
1. Reproduce the issue
2. Find the root cause
3. Implement minimal fix
4. Add regression test
5. Deploy and monitor"
```

---

## SUCCESS CRITERIA

- [ ] Bug reproduced and documented
- [ ] Root cause identified
- [ ] Minimal fix implemented
- [ ] Regression test added
- [ ] All tests passing
- [ ] Fix deployed
- [ ] No regressions observed

$ARGUMENTS
