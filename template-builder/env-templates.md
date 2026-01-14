# Environment Variable Templates

Patterns for managing environment variables, secrets, and configuration across environments.

## .env File Structure

### Template 1: Standard Web Application

```bash
# .env.example
# ============================================
# APPLICATION
# ============================================
NODE_ENV=development
APP_NAME=my-app
APP_URL=http://localhost:3000
PORT=3000

# ============================================
# DATABASE
# ============================================
# PostgreSQL connection string
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myapp"

# Connection pool settings (optional)
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# ============================================
# AUTHENTICATION
# ============================================
# JWT secrets (generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET="your-access-secret-here-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-here-min-32-chars"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Session secret
SESSION_SECRET="your-session-secret-here"

# ============================================
# THIRD-PARTY SERVICES
# ============================================

# Clerk (Authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# OR Auth.js
AUTH_SECRET="your-auth-secret"
AUTH_GITHUB_ID=your-github-oauth-id
AUTH_GITHUB_SECRET=your-github-oauth-secret

# Stripe (Payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ============================================
# STORAGE
# ============================================

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=my-bucket

# OR Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET=my-bucket

# OR Uploadthing
UPLOADTHING_SECRET=sk_live_...
UPLOADTHING_APP_ID=your-app-id

# ============================================
# EMAIL
# ============================================

# Resend
RESEND_API_KEY=re_...
EMAIL_FROM="noreply@example.com"

# OR SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password

# ============================================
# CACHING
# ============================================
REDIS_URL="redis://localhost:6379"
# OR with password
REDIS_URL="redis://:password@localhost:6379"

# ============================================
# MONITORING
# ============================================

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=sntrys_...

# PostHog (Analytics)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# ============================================
# AI SERVICES
# ============================================

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# OpenAI
OPENAI_API_KEY=sk-...

# ============================================
# FEATURE FLAGS
# ============================================
FEATURE_NEW_DASHBOARD=false
FEATURE_BETA_FEATURES=false

# ============================================
# RATE LIMITING
# ============================================
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
```

### Template 2: Environment-Specific Files

```bash
# .env.development
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myapp_dev"
NEXT_PUBLIC_APP_URL=http://localhost:3000
LOG_LEVEL=debug
```

```bash
# .env.test
NODE_ENV=test
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myapp_test"
NEXT_PUBLIC_APP_URL=http://localhost:3000
LOG_LEVEL=error
```

```bash
# .env.staging
NODE_ENV=staging
DATABASE_URL="${DATABASE_URL}"  # Set in CI/deployment
NEXT_PUBLIC_APP_URL=https://staging.myapp.com
LOG_LEVEL=info
```

```bash
# .env.production
NODE_ENV=production
DATABASE_URL="${DATABASE_URL}"  # Set in deployment platform
NEXT_PUBLIC_APP_URL=https://myapp.com
LOG_LEVEL=warn
```

## Environment Loading Patterns

### Pattern 1: Type-Safe Environment (Zod)

```typescript
// src/env.ts
import { z } from 'zod'

const envSchema = z.object({
  // Node
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),

  // App
  PORT: z.coerce.number().default(3000),
  APP_URL: z.string().url(),

  // Database
  DATABASE_URL: z.string().min(1),

  // Auth
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  // Optional services
  REDIS_URL: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
})

// Validate and export
const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  throw new Error('Invalid environment variables')
}

export const env = parsed.data

// Type export for use elsewhere
export type Env = z.infer<typeof envSchema>
```

### Pattern 2: T3 Env (Next.js)

```typescript
// src/env.mjs
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  /**
   * Server-side environment variables schema
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    // Auth
    CLERK_SECRET_KEY: z.string().min(1),

    // Payments
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),

    // AI
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
  },

  /**
   * Client-side environment variables schema
   * Must be prefixed with NEXT_PUBLIC_
   */
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },

  /**
   * Runtime environment variables
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  /**
   * Skip validation in certain environments
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Treat empty strings as undefined
   */
  emptyStringAsUndefined: true,
})
```

### Pattern 3: Python (Pydantic Settings)

```python
# src/config.py
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, PostgresDsn, RedisDsn


class Settings(BaseSettings):
    """Application settings with validation."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "My App"
    debug: bool = False
    environment: str = Field(default="development", pattern="^(development|staging|production)$")

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Database
    database_url: PostgresDsn
    database_pool_size: int = 5
    database_max_overflow: int = 10

    # Redis
    redis_url: RedisDsn | None = None

    # Auth
    jwt_secret: str = Field(min_length=32)
    jwt_algorithm: str = "HS256"
    jwt_expiry_minutes: int = 15

    # External Services
    anthropic_api_key: str | None = None
    stripe_secret_key: str | None = None


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
```

## Secrets Management

### Pattern 1: Docker Secrets

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    image: myapp:latest
    secrets:
      - db_password
      - jwt_secret
    environment:
      - DATABASE_PASSWORD_FILE=/run/secrets/db_password
      - JWT_SECRET_FILE=/run/secrets/jwt_secret

secrets:
  db_password:
    file: ./secrets/db_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
```

```typescript
// Read secret from file in app
import { readFileSync } from 'fs'

function getSecret(name: string): string {
  const filePath = process.env[`${name}_FILE`]
  if (filePath) {
    return readFileSync(filePath, 'utf-8').trim()
  }
  return process.env[name] || ''
}

const dbPassword = getSecret('DATABASE_PASSWORD')
```

### Pattern 2: Vault Integration

```typescript
// src/lib/vault.ts
import Vault from 'node-vault'

const vault = Vault({
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN,
})

export async function getSecret(path: string): Promise<Record<string, string>> {
  const result = await vault.read(`secret/data/${path}`)
  return result.data.data
}

// Usage
const dbSecrets = await getSecret('database/production')
const connectionString = `postgresql://${dbSecrets.username}:${dbSecrets.password}@${dbSecrets.host}:5432/${dbSecrets.database}`
```

### Pattern 3: AWS Secrets Manager

```typescript
// src/lib/secrets.ts
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'

const client = new SecretsManagerClient({ region: process.env.AWS_REGION })

const secretCache = new Map<string, { value: string; expiry: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function getSecret(secretId: string): Promise<string> {
  // Check cache
  const cached = secretCache.get(secretId)
  if (cached && cached.expiry > Date.now()) {
    return cached.value
  }

  // Fetch from AWS
  const command = new GetSecretValueCommand({ SecretId: secretId })
  const response = await client.send(command)
  const value = response.SecretString || ''

  // Cache result
  secretCache.set(secretId, {
    value,
    expiry: Date.now() + CACHE_TTL,
  })

  return value
}

// Usage
const dbPassword = await getSecret('prod/database/password')
```

## CI/CD Environment Patterns

### GitHub Actions Secrets

```yaml
# .github/workflows/deploy.yml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
        run: |
          # Secrets are masked in logs automatically
          echo "Deploying with secrets..."
```

### GitLab CI Variables

```yaml
# .gitlab-ci.yml
deploy:
  stage: deploy
  variables:
    DATABASE_URL: $DATABASE_URL  # From CI/CD settings
  script:
    - echo "Deploying..."
```

### Environment Validation in CI

```yaml
# .github/workflows/validate-env.yml
name: Validate Environment

on:
  pull_request:
    paths:
      - '.env.example'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check .env.example completeness
        run: |
          # Ensure all env vars used in code are documented
          grep -roh 'process\.env\.\w\+' src/ | \
            sed 's/process\.env\.//' | \
            sort -u > used_vars.txt

          grep -oh '^\w\+=' .env.example | \
            sed 's/=//' | \
            sort -u > documented_vars.txt

          # Find undocumented vars
          comm -23 used_vars.txt documented_vars.txt > missing.txt

          if [ -s missing.txt ]; then
            echo "Missing from .env.example:"
            cat missing.txt
            exit 1
          fi
```

## Security Best Practices

### 1. Never Commit Secrets

```gitignore
# .gitignore
.env
.env.local
.env.*.local
*.pem
*.key
secrets/
```

### 2. Validate Required Variables

```typescript
// src/lib/validateEnv.ts
const REQUIRED_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'STRIPE_SECRET_KEY',
] as const

export function validateEnv(): void {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    )
  }
}

// Call at app startup
validateEnv()
```

### 3. Rotate Secrets Regularly

```bash
# scripts/rotate-secrets.sh
#!/bin/bash
set -e

# Generate new JWT secret
NEW_JWT_SECRET=$(openssl rand -base64 32)

# Update in secrets manager
aws secretsmanager update-secret \
  --secret-id prod/jwt-secret \
  --secret-string "$NEW_JWT_SECRET"

# Trigger rolling restart of application
kubectl rollout restart deployment/api

echo "JWT secret rotated successfully"
```

### 4. Audit Secret Access

```typescript
// src/lib/auditSecrets.ts
import { env } from './env'

// Log when secrets are accessed (for audit)
const secretsAccessed = new Set<string>()

export function getSecretWithAudit(key: keyof typeof env): string {
  if (!secretsAccessed.has(key)) {
    secretsAccessed.add(key)
    console.log(`[AUDIT] Secret accessed: ${key}`)
  }
  return env[key]
}
```

## Environment Variable Checklist

```markdown
## Pre-Deployment Checklist

### Required for All Environments
- [ ] DATABASE_URL is set and valid
- [ ] JWT secrets are at least 32 characters
- [ ] App URL is correct for environment

### Production Only
- [ ] All secrets are stored in secrets manager (not .env file)
- [ ] HTTPS URLs are used
- [ ] Debug/verbose logging is disabled
- [ ] Rate limiting is enabled
- [ ] Error reporting (Sentry) is configured

### Security Review
- [ ] No secrets in version control
- [ ] .env.example is up to date
- [ ] All API keys are scoped appropriately
- [ ] Webhook secrets are configured
```
