# CI/CD Pipeline Setup Workflow

A complete workflow for setting up continuous integration and deployment pipelines for modern web applications.

---

## WORKFLOW OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CI/CD PIPELINE                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐            │
│  │  LINT   │ → │  TEST   │ → │  BUILD  │ → │ DEPLOY  │            │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘            │
│       │             │             │             │                   │
│       ↓             ↓             ↓             ↓                   │
│   ESLint        Vitest       Next.js       Preview                  │
│   TypeScript    Playwright   Docker        Production               │
│   Prettier      Coverage     Bundle                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## PHASE 1: LOCAL SETUP

### Skills Used
- `/ci-cd` - Pipeline configuration
- `/env-manager` - Environment setup

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "prepare": "husky install"
  }
}
```

### Pre-commit Hooks

```bash
# Install husky
npm install -D husky lint-staged
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"
```

```json
// package.json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

---

## PHASE 2: GITHUB ACTIONS

### Skills Used
- `/github-actions` - Workflow configuration
- `/ci-cd` - Pipeline design

### Main CI Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript
        run: npm run type-check

      - name: Check formatting
        run: npm run format:check

  test:
    name: Test
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/coverage-final.json

  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Build application
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [test, e2e]
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci

      - name: Build
        run: npm run build

      - name: Upload build
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: .next/
          retention-days: 7
```

---

## PHASE 3: DEPLOYMENT WORKFLOWS

### Preview Deployments (Vercel)

```yaml
# .github/workflows/preview.yml
name: Preview Deployment

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  deploy-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          github-comment: true
```

### Production Deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci
      - run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

      - name: Notify Slack
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "✅ Deployed to production",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "Deployment successful!\n*Commit:* ${{ github.sha }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## PHASE 4: DOCKER SETUP

### Skills Used
- `/docker-compose` - Container configuration

### Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      - db
      - redis

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

---

## PHASE 5: MONITORING & ALERTS

### Skills Used
- `/observability` - Monitoring setup

### Health Check Endpoint

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      redis: 'unknown'
    }
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.services.database = 'healthy';
  } catch {
    checks.services.database = 'unhealthy';
    checks.status = 'degraded';
  }

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  return NextResponse.json(checks, { status: statusCode });
}
```

### GitHub Action for Health Checks

```yaml
# .github/workflows/health-check.yml
name: Health Check

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - name: Check production health
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" https://your-app.com/api/health)
          if [ $response -ne 200 ]; then
            echo "Health check failed with status $response"
            exit 1
          fi

      - name: Alert on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: '{"text": "🚨 Production health check failed!"}'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## WORKFLOW COMMAND

```bash
# Set up complete CI/CD pipeline
claude "Set up CI/CD for a Next.js app with:
1. GitHub Actions for lint, test, build
2. Preview deployments on PRs
3. Production deployment on main
4. Docker containerization
5. Health monitoring"
```

---

## SUCCESS CRITERIA

- [ ] All CI checks passing
- [ ] Preview deployments working
- [ ] Production deploys automated
- [ ] Docker builds working
- [ ] Health checks configured
- [ ] Alerts set up

$ARGUMENTS
