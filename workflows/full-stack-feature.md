# Full-Stack Feature Development Workflow

A complete workflow for building production-ready features from specification to deployment.

---

## WORKFLOW OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                 FULL-STACK FEATURE WORKFLOW                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐        │
│  │   PLAN   │ → │  BUILD   │ → │   TEST   │ → │  DEPLOY  │        │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘        │
│       ↓              ↓              ↓              ↓               │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐        │
│  │ /mvp-    │   │ /api-    │   │ /test-   │   │ /deploy- │        │
│  │  scope   │   │  design  │   │  gen     │   │  vercel  │        │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## PHASE 1: PLANNING

### Skills Used
- `/mvp-scope` - Define feature scope
- `/api-design` - Design API endpoints
- `/ui-spec` - Create UI specifications

### Steps

```bash
# 1. Define the feature scope
/mvp-scope "User authentication with social login"

# 2. Design the API
/api-design "Auth endpoints for email, Google, GitHub login"

# 3. Create UI specifications
/ui-spec "Login page with social buttons and form"
```

### Deliverables
- [ ] Feature requirements document
- [ ] API endpoint specifications
- [ ] UI wireframes/specs

---

## PHASE 2: DATABASE & BACKEND

### Skills Used
- `/prisma-builder` or `/drizzle-builder` - Database schema
- `/api-design` - Implement endpoints
- `/blueprint` - Architecture design

### Steps

```bash
# 1. Design database schema
/prisma-builder schema

# 2. Generate migrations
/prisma-builder migrate init-auth

# 3. Implement API endpoints
/blueprint "Implement auth API with NextAuth"
```

### Code Example

```typescript
// Generated schema
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
}

// API route
export async function POST(req: Request) {
  const { email, password } = await req.json();
  // Implementation
}
```

### Deliverables
- [ ] Database schema
- [ ] Migrations
- [ ] API endpoints
- [ ] Type definitions

---

## PHASE 3: FRONTEND

### Skills Used
- `/new-component` - Create UI components
- `/new-page` - Create pages
- `/design-system` - Styling

### Steps

```bash
# 1. Create login page
/new-page /auth/login

# 2. Create auth components
/new-component AuthForm
/new-component SocialButtons
/new-component PasswordInput

# 3. Style components
/design-system "Auth components"
```

### Deliverables
- [ ] Page components
- [ ] Reusable UI components
- [ ] Form validation
- [ ] Loading/error states

---

## PHASE 4: TESTING

### Skills Used
- `/test-gen` - Generate tests
- `/playwright-builder` - E2E tests
- `/vitest-builder` - Unit tests

### Steps

```bash
# 1. Generate unit tests
/vitest-builder "Generate tests for auth utilities"

# 2. Create E2E tests
/playwright-builder test auth

# 3. Run all tests
npm run test
```

### Test Coverage

```bash
# Run with coverage
npm run test:coverage

# Expected coverage
# - Statements: 80%+
# - Branches: 80%+
# - Functions: 80%+
```

### Deliverables
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Coverage report

---

## PHASE 5: REVIEW & QUALITY

### Skills Used
- `/code-review` - Review code
- `/security` - Security audit
- `/refactor` - Clean up code

### Steps

```bash
# 1. Security review
/security "Audit auth implementation"

# 2. Code review
/code-review "Review auth feature"

# 3. Refactor if needed
/refactor "Clean up auth module"
```

### Checklist
- [ ] No security vulnerabilities
- [ ] Code follows patterns
- [ ] Types are correct
- [ ] Error handling complete

---

## PHASE 6: DOCUMENTATION

### Skills Used
- `/docs` - Generate documentation
- `/readme-gen` - Update README
- `/changelog-gen` - Update changelog

### Steps

```bash
# 1. Generate API docs
/docs "Document auth API endpoints"

# 2. Update README
/readme-gen "Add auth section"

# 3. Update changelog
/changelog-gen "Add auth feature entry"
```

---

## PHASE 7: DEPLOYMENT

### Skills Used
- `/deploy-vercel` - Deploy to Vercel
- `/ci-cd` - CI/CD pipeline
- `/env-manager` - Environment setup

### Steps

```bash
# 1. Set environment variables
/env-manager "Add auth secrets"

# 2. Deploy preview
vercel

# 3. Deploy production
/deploy-vercel production
```

### Checklist
- [ ] Environment variables set
- [ ] Preview deployment works
- [ ] Production deployment complete
- [ ] Monitoring enabled

---

## COMPLETE WORKFLOW COMMAND

Run the entire workflow:

```bash
# Full feature development
claude "Implement user authentication feature with:
1. Email/password login
2. Google OAuth
3. GitHub OAuth
4. Password reset flow
5. Email verification

Use Next.js App Router, Prisma, and NextAuth."
```

---

## ESTIMATED TIMELINE

| Phase | Duration |
|-------|----------|
| Planning | 1-2 hours |
| Database/Backend | 2-4 hours |
| Frontend | 3-5 hours |
| Testing | 2-3 hours |
| Review | 1-2 hours |
| Documentation | 1 hour |
| Deployment | 30 min |
| **Total** | **1-2 days** |

---

## SUCCESS CRITERIA

- [ ] All tests passing
- [ ] 80%+ code coverage
- [ ] No security vulnerabilities
- [ ] Documentation complete
- [ ] Deployed to production
- [ ] Monitoring enabled

$ARGUMENTS
