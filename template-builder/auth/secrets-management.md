# Secrets Management

Production-ready secrets management for Next.js applications using multiple providers with secure rotation and access patterns.

## Overview

Secrets management provides:
- Centralized secret storage
- Automatic rotation
- Access auditing
- Environment-specific secrets
- Version control for secrets
- Zero-trust access patterns

## Installation

```bash
# AWS Secrets Manager
npm install @aws-sdk/client-secrets-manager

# HashiCorp Vault
npm install node-vault

# Google Secret Manager
npm install @google-cloud/secret-manager

# Azure Key Vault
npm install @azure/keyvault-secrets @azure/identity

# Infisical (open source)
npm install @infisical/sdk
```

## Environment Variables

```env
# .env.local

# AWS Secrets Manager
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# HashiCorp Vault
VAULT_ADDR=https://vault.example.com
VAULT_TOKEN=your-vault-token
# Or AppRole auth
VAULT_ROLE_ID=your-role-id
VAULT_SECRET_ID=your-secret-id

# Google Secret Manager
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Azure Key Vault
AZURE_KEY_VAULT_NAME=your-vault-name
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# Infisical
INFISICAL_CLIENT_ID=your-client-id
INFISICAL_CLIENT_SECRET=your-client-secret
INFISICAL_PROJECT_ID=your-project-id
```

## AWS Secrets Manager

```typescript
// lib/secrets/aws.ts
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  CreateSecretCommand,
  UpdateSecretCommand,
  DeleteSecretCommand,
  ListSecretsCommand,
  RotateSecretCommand,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager'

const client = new SecretsManagerClient({
  region: process.env.AWS_REGION,
})

// Cache for secrets
const secretsCache = new Map<string, { value: string; expires: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export interface SecretValue {
  [key: string]: string
}

// Get secret value
export async function getSecret(
  secretName: string,
  options: { useCache?: boolean; parseJson?: boolean } = {}
): Promise<string | SecretValue> {
  const { useCache = true, parseJson = true } = options

  // Check cache
  if (useCache) {
    const cached = secretsCache.get(secretName)
    if (cached && Date.now() < cached.expires) {
      return parseJson ? JSON.parse(cached.value) : cached.value
    }
  }

  const command = new GetSecretValueCommand({ SecretId: secretName })
  const response = await client.send(command)

  const secretValue = response.SecretString || ''

  // Cache the value
  if (useCache) {
    secretsCache.set(secretName, {
      value: secretValue,
      expires: Date.now() + CACHE_TTL,
    })
  }

  return parseJson ? JSON.parse(secretValue) : secretValue
}

// Create a new secret
export async function createSecret(
  secretName: string,
  secretValue: string | SecretValue,
  description?: string
): Promise<string> {
  const command = new CreateSecretCommand({
    Name: secretName,
    SecretString: typeof secretValue === 'string'
      ? secretValue
      : JSON.stringify(secretValue),
    Description: description,
    Tags: [
      { Key: 'ManagedBy', Value: 'Application' },
      { Key: 'Environment', Value: process.env.NODE_ENV || 'development' },
    ],
  })

  const response = await client.send(command)
  return response.ARN!
}

// Update an existing secret
export async function updateSecret(
  secretName: string,
  secretValue: string | SecretValue
): Promise<void> {
  const command = new UpdateSecretCommand({
    SecretId: secretName,
    SecretString: typeof secretValue === 'string'
      ? secretValue
      : JSON.stringify(secretValue),
  })

  await client.send(command)

  // Invalidate cache
  secretsCache.delete(secretName)
}

// Delete a secret
export async function deleteSecret(
  secretName: string,
  forceDelete = false
): Promise<void> {
  const command = new DeleteSecretCommand({
    SecretId: secretName,
    ForceDeleteWithoutRecovery: forceDelete,
    RecoveryWindowInDays: forceDelete ? undefined : 7,
  })

  await client.send(command)
  secretsCache.delete(secretName)
}

// List all secrets
export async function listSecrets(prefix?: string): Promise<string[]> {
  const secrets: string[] = []
  let nextToken: string | undefined

  do {
    const command = new ListSecretsCommand({
      NextToken: nextToken,
      Filters: prefix
        ? [{ Key: 'name', Values: [prefix] }]
        : undefined,
    })

    const response = await client.send(command)
    secrets.push(...(response.SecretList?.map(s => s.Name!) || []))
    nextToken = response.NextToken
  } while (nextToken)

  return secrets
}

// Trigger secret rotation
export async function rotateSecret(secretName: string): Promise<void> {
  const command = new RotateSecretCommand({
    SecretId: secretName,
  })

  await client.send(command)
  secretsCache.delete(secretName)
}

// Get secret metadata
export async function describeSecret(secretName: string) {
  const command = new DescribeSecretCommand({ SecretId: secretName })
  return client.send(command)
}

// Clear cache for a secret
export function clearSecretCache(secretName?: string): void {
  if (secretName) {
    secretsCache.delete(secretName)
  } else {
    secretsCache.clear()
  }
}
```

## HashiCorp Vault

```typescript
// lib/secrets/vault.ts
import Vault from 'node-vault'

let vaultClient: ReturnType<typeof Vault> | null = null

async function getVaultClient() {
  if (vaultClient) return vaultClient

  vaultClient = Vault({
    apiVersion: 'v1',
    endpoint: process.env.VAULT_ADDR,
  })

  // Authenticate
  if (process.env.VAULT_TOKEN) {
    vaultClient.token = process.env.VAULT_TOKEN
  } else if (process.env.VAULT_ROLE_ID && process.env.VAULT_SECRET_ID) {
    const result = await vaultClient.approleLogin({
      role_id: process.env.VAULT_ROLE_ID,
      secret_id: process.env.VAULT_SECRET_ID,
    })
    vaultClient.token = result.auth.client_token
  }

  return vaultClient
}

// Read secret from KV v2 engine
export async function readVaultSecret(
  path: string,
  mount = 'secret'
): Promise<Record<string, string>> {
  const client = await getVaultClient()
  const result = await client.read(`${mount}/data/${path}`)
  return result.data.data
}

// Write secret to KV v2 engine
export async function writeVaultSecret(
  path: string,
  data: Record<string, string>,
  mount = 'secret'
): Promise<void> {
  const client = await getVaultClient()
  await client.write(`${mount}/data/${path}`, { data })
}

// Delete secret
export async function deleteVaultSecret(
  path: string,
  mount = 'secret'
): Promise<void> {
  const client = await getVaultClient()
  await client.delete(`${mount}/data/${path}`)
}

// List secrets
export async function listVaultSecrets(
  path: string,
  mount = 'secret'
): Promise<string[]> {
  const client = await getVaultClient()
  const result = await client.list(`${mount}/metadata/${path}`)
  return result.data.keys || []
}

// Generate dynamic database credentials
export async function getDatabaseCredentials(
  role: string,
  mount = 'database'
): Promise<{ username: string; password: string; ttl: number }> {
  const client = await getVaultClient()
  const result = await client.read(`${mount}/creds/${role}`)

  return {
    username: result.data.username,
    password: result.data.password,
    ttl: result.lease_duration,
  }
}

// Generate AWS credentials
export async function getAWSCredentials(
  role: string,
  mount = 'aws'
): Promise<{ accessKey: string; secretKey: string; token?: string; ttl: number }> {
  const client = await getVaultClient()
  const result = await client.read(`${mount}/creds/${role}`)

  return {
    accessKey: result.data.access_key,
    secretKey: result.data.secret_key,
    token: result.data.security_token,
    ttl: result.lease_duration,
  }
}

// Encrypt data with transit engine
export async function encryptWithTransit(
  keyName: string,
  plaintext: string,
  mount = 'transit'
): Promise<string> {
  const client = await getVaultClient()
  const result = await client.write(`${mount}/encrypt/${keyName}`, {
    plaintext: Buffer.from(plaintext).toString('base64'),
  })
  return result.data.ciphertext
}

// Decrypt data with transit engine
export async function decryptWithTransit(
  keyName: string,
  ciphertext: string,
  mount = 'transit'
): Promise<string> {
  const client = await getVaultClient()
  const result = await client.write(`${mount}/decrypt/${keyName}`, {
    ciphertext,
  })
  return Buffer.from(result.data.plaintext, 'base64').toString('utf8')
}
```

## Google Secret Manager

```typescript
// lib/secrets/google.ts
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'

const client = new SecretManagerServiceClient()
const projectId = process.env.GOOGLE_PROJECT_ID

// Get secret value
export async function getGoogleSecret(
  secretName: string,
  version = 'latest'
): Promise<string> {
  const name = `projects/${projectId}/secrets/${secretName}/versions/${version}`

  const [response] = await client.accessSecretVersion({ name })
  return response.payload?.data?.toString() || ''
}

// Create a new secret
export async function createGoogleSecret(
  secretName: string,
  value: string
): Promise<string> {
  // Create the secret
  const [secret] = await client.createSecret({
    parent: `projects/${projectId}`,
    secretId: secretName,
    secret: {
      replication: {
        automatic: {},
      },
      labels: {
        managed_by: 'application',
        environment: process.env.NODE_ENV || 'development',
      },
    },
  })

  // Add the first version
  await client.addSecretVersion({
    parent: secret.name,
    payload: {
      data: Buffer.from(value),
    },
  })

  return secret.name!
}

// Add new version to secret
export async function updateGoogleSecret(
  secretName: string,
  value: string
): Promise<string> {
  const [version] = await client.addSecretVersion({
    parent: `projects/${projectId}/secrets/${secretName}`,
    payload: {
      data: Buffer.from(value),
    },
  })

  return version.name!
}

// Delete a secret
export async function deleteGoogleSecret(secretName: string): Promise<void> {
  await client.deleteSecret({
    name: `projects/${projectId}/secrets/${secretName}`,
  })
}

// List secrets
export async function listGoogleSecrets(prefix?: string): Promise<string[]> {
  const [secrets] = await client.listSecrets({
    parent: `projects/${projectId}`,
    filter: prefix ? `name:${prefix}` : undefined,
  })

  return secrets.map(s => s.name!.split('/').pop()!)
}

// Disable a secret version
export async function disableSecretVersion(
  secretName: string,
  version: string
): Promise<void> {
  await client.disableSecretVersion({
    name: `projects/${projectId}/secrets/${secretName}/versions/${version}`,
  })
}
```

## Unified Secrets Interface

```typescript
// lib/secrets/index.ts
import * as aws from './aws'
import * as vault from './vault'
import * as google from './google'

export type SecretsProvider = 'aws' | 'vault' | 'google' | 'infisical'

interface SecretsConfig {
  provider: SecretsProvider
  prefix?: string
}

const config: SecretsConfig = {
  provider: (process.env.SECRETS_PROVIDER as SecretsProvider) || 'aws',
  prefix: process.env.SECRETS_PREFIX || '',
}

// Unified get secret
export async function getSecret(
  name: string,
  options?: { parseJson?: boolean }
): Promise<string | Record<string, string>> {
  const fullName = config.prefix ? `${config.prefix}/${name}` : name

  switch (config.provider) {
    case 'aws':
      return aws.getSecret(fullName, { parseJson: options?.parseJson ?? true })

    case 'vault':
      return vault.readVaultSecret(fullName)

    case 'google':
      const value = await google.getGoogleSecret(fullName)
      return options?.parseJson !== false ? JSON.parse(value) : value

    default:
      throw new Error(`Unknown secrets provider: ${config.provider}`)
  }
}

// Unified create secret
export async function createSecret(
  name: string,
  value: string | Record<string, string>
): Promise<void> {
  const fullName = config.prefix ? `${config.prefix}/${name}` : name
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value)

  switch (config.provider) {
    case 'aws':
      await aws.createSecret(fullName, stringValue)
      break

    case 'vault':
      const vaultValue = typeof value === 'string' ? { value } : value
      await vault.writeVaultSecret(fullName, vaultValue)
      break

    case 'google':
      await google.createGoogleSecret(fullName, stringValue)
      break

    default:
      throw new Error(`Unknown secrets provider: ${config.provider}`)
  }
}

// Unified update secret
export async function updateSecret(
  name: string,
  value: string | Record<string, string>
): Promise<void> {
  const fullName = config.prefix ? `${config.prefix}/${name}` : name
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value)

  switch (config.provider) {
    case 'aws':
      await aws.updateSecret(fullName, stringValue)
      break

    case 'vault':
      const vaultValue = typeof value === 'string' ? { value } : value
      await vault.writeVaultSecret(fullName, vaultValue)
      break

    case 'google':
      await google.updateGoogleSecret(fullName, stringValue)
      break

    default:
      throw new Error(`Unknown secrets provider: ${config.provider}`)
  }
}

// Unified delete secret
export async function deleteSecret(name: string): Promise<void> {
  const fullName = config.prefix ? `${config.prefix}/${name}` : name

  switch (config.provider) {
    case 'aws':
      await aws.deleteSecret(fullName)
      break

    case 'vault':
      await vault.deleteVaultSecret(fullName)
      break

    case 'google':
      await google.deleteGoogleSecret(fullName)
      break

    default:
      throw new Error(`Unknown secrets provider: ${config.provider}`)
  }
}

// Get multiple secrets at once
export async function getSecrets(
  names: string[]
): Promise<Record<string, string | Record<string, string>>> {
  const results: Record<string, string | Record<string, string>> = {}

  await Promise.all(
    names.map(async (name) => {
      try {
        results[name] = await getSecret(name)
      } catch (error) {
        console.error(`Failed to get secret ${name}:`, error)
      }
    })
  )

  return results
}
```

## Environment Loading

```typescript
// lib/secrets/env-loader.ts
import { getSecret } from './index'

interface SecretMapping {
  envVar: string
  secretName: string
  key?: string // For JSON secrets
}

const secretMappings: SecretMapping[] = [
  { envVar: 'DATABASE_URL', secretName: 'database/credentials', key: 'url' },
  { envVar: 'REDIS_URL', secretName: 'redis/credentials', key: 'url' },
  { envVar: 'API_SECRET', secretName: 'app/api-secret' },
  { envVar: 'JWT_SECRET', secretName: 'app/jwt-secret' },
  { envVar: 'STRIPE_SECRET_KEY', secretName: 'stripe/secret-key' },
]

// Load secrets into process.env
export async function loadSecrets(): Promise<void> {
  console.log('Loading secrets from secrets manager...')

  for (const mapping of secretMappings) {
    try {
      const secret = await getSecret(mapping.secretName)

      if (typeof secret === 'string') {
        process.env[mapping.envVar] = secret
      } else if (mapping.key && secret[mapping.key]) {
        process.env[mapping.envVar] = secret[mapping.key]
      } else {
        process.env[mapping.envVar] = JSON.stringify(secret)
      }

      console.log(`Loaded secret: ${mapping.envVar}`)
    } catch (error) {
      console.error(`Failed to load secret ${mapping.secretName}:`, error)
    }
  }

  console.log('Secrets loaded successfully')
}

// Call at app startup
// instrumentation.ts
export async function register() {
  if (process.env.LOAD_SECRETS === 'true') {
    const { loadSecrets } = await import('@/lib/secrets/env-loader')
    await loadSecrets()
  }
}
```

## Secret Rotation

```typescript
// lib/secrets/rotation.ts
import { updateSecret } from './index'
import crypto from 'crypto'

interface RotationConfig {
  secretName: string
  type: 'random' | 'api-key' | 'password' | 'custom'
  length?: number
  generator?: () => Promise<string>
}

// Generate random secret value
function generateRandomValue(type: string, length = 32): string {
  switch (type) {
    case 'random':
      return crypto.randomBytes(length).toString('hex')

    case 'api-key':
      return `sk_${crypto.randomBytes(24).toString('hex')}`

    case 'password':
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
      let password = ''
      for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return password

    default:
      return crypto.randomBytes(length).toString('hex')
  }
}

// Rotate a single secret
export async function rotateSecret(config: RotationConfig): Promise<string> {
  let newValue: string

  if (config.generator) {
    newValue = await config.generator()
  } else {
    newValue = generateRandomValue(config.type, config.length)
  }

  await updateSecret(config.secretName, newValue)

  console.log(`Rotated secret: ${config.secretName}`)

  return newValue
}

// Rotate multiple secrets
export async function rotateSecrets(
  configs: RotationConfig[]
): Promise<Record<string, string>> {
  const results: Record<string, string> = {}

  for (const config of configs) {
    try {
      results[config.secretName] = await rotateSecret(config)
    } catch (error) {
      console.error(`Failed to rotate ${config.secretName}:`, error)
    }
  }

  return results
}

// API route for secret rotation
// app/api/admin/rotate-secrets/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { rotateSecret } from '@/lib/secrets/rotation'

export async function POST(request: NextRequest) {
  // Verify admin access
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { secretName, type = 'random', length } = body

  if (!secretName) {
    return NextResponse.json({ error: 'secretName required' }, { status: 400 })
  }

  try {
    await rotateSecret({ secretName, type, length })
    return NextResponse.json({ success: true, rotated: secretName })
  } catch (error) {
    console.error('Rotation failed:', error)
    return NextResponse.json({ error: 'Rotation failed' }, { status: 500 })
  }
}
```

## Testing

```typescript
// __tests__/secrets.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock AWS SDK
vi.mock('@aws-sdk/client-secrets-manager', () => ({
  SecretsManagerClient: vi.fn().mockImplementation(() => ({
    send: vi.fn(),
  })),
  GetSecretValueCommand: vi.fn(),
  CreateSecretCommand: vi.fn(),
  UpdateSecretCommand: vi.fn(),
}))

import { getSecret, createSecret, updateSecret } from '@/lib/secrets/aws'

describe('Secrets Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AWS Secrets Manager', () => {
    it('should get a secret', async () => {
      // Test implementation...
    })

    it('should create a secret', async () => {
      // Test implementation...
    })

    it('should update a secret', async () => {
      // Test implementation...
    })

    it('should cache secrets', async () => {
      // Test implementation...
    })
  })
})
```

## CLAUDE.md Integration

```markdown
## Secrets Management

This project uses centralized secrets management.

### Key Files
- `lib/secrets/index.ts` - Unified secrets interface
- `lib/secrets/aws.ts` - AWS Secrets Manager
- `lib/secrets/vault.ts` - HashiCorp Vault
- `lib/secrets/rotation.ts` - Secret rotation utilities

### Configuration
Set `SECRETS_PROVIDER` to: `aws`, `vault`, or `google`

### Usage
```typescript
// Get a secret
const dbCreds = await getSecret('database/credentials')

// Update a secret
await updateSecret('api-key', newValue)
```

### Secret Rotation
Secrets can be rotated via admin API:
```bash
curl -X POST -H "Authorization: Bearer $ADMIN_KEY" \
  -d '{"secretName": "api-key", "type": "api-key"}' \
  /api/admin/rotate-secrets
```

### Environment Loading
Set `LOAD_SECRETS=true` to load secrets into process.env at startup.
```

## AI Suggestions

1. **Automatic rotation scheduling** - Use cron jobs to rotate secrets on a schedule
2. **Multi-region replication** - Replicate secrets across regions for disaster recovery
3. **Secret versioning** - Track and rollback to previous secret versions
4. **Access policies** - Implement fine-grained access control for secrets
5. **Audit logging** - Log all secret access for compliance
6. **Secret validation** - Validate secret format before storage
7. **Encryption at rest** - Ensure secrets are encrypted with KMS keys
8. **Secret dependencies** - Track which services use which secrets for rotation coordination
