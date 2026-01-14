# API Key Authentication

Production-ready API key management system for securing APIs, webhooks, and service-to-service communication.

## Overview

API keys provide:
- Simple authentication for APIs
- Rate limiting per key
- Scope-based permissions
- Usage tracking and analytics
- Key rotation without downtime
- Prefix-based key identification

## Installation

```bash
npm install nanoid argon2 @upstash/redis
```

## Environment Variables

```env
# .env.local
API_KEY_SECRET=your-32-byte-secret-for-hashing
DATABASE_URL=postgresql://localhost:5432/myapp
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Key Configuration
API_KEY_PREFIX=sk_live_
API_KEY_LENGTH=32
```

## Database Schema (Prisma)

```prisma
// prisma/schema.prisma
model ApiKey {
  id          String    @id @default(cuid())
  name        String
  keyHash     String    @unique @map("key_hash")
  keyPrefix   String    @map("key_prefix") // First 8 chars for identification
  userId      String    @map("user_id")
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Permissions
  scopes      String[]  @default([])

  // Rate Limiting
  rateLimit   Int       @default(1000) @map("rate_limit") // requests per hour

  // Metadata
  lastUsedAt  DateTime? @map("last_used_at")
  expiresAt   DateTime? @map("expires_at")
  revokedAt   DateTime? @map("revoked_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  // Usage tracking
  usageLogs   ApiKeyUsage[]

  @@index([userId])
  @@index([keyPrefix])
  @@map("api_keys")
}

model ApiKeyUsage {
  id        String   @id @default(cuid())
  apiKeyId  String   @map("api_key_id")
  apiKey    ApiKey   @relation(fields: [apiKeyId], references: [id], onDelete: Cascade)

  endpoint  String
  method    String
  status    Int
  duration  Int      // ms
  ip        String?
  userAgent String?  @map("user_agent")

  createdAt DateTime @default(now()) @map("created_at")

  @@index([apiKeyId])
  @@index([createdAt])
  @@map("api_key_usage")
}

model User {
  id       String   @id @default(cuid())
  email    String   @unique
  apiKeys  ApiKey[]
}
```

## Database Schema (Drizzle)

```typescript
// db/schema.ts
import { pgTable, text, timestamp, integer, index, varchar } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
})

export const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  keyPrefix: varchar('key_prefix', { length: 12 }).notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  scopes: text('scopes').array().default([]),
  rateLimit: integer('rate_limit').default(1000),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('api_keys_user_id_idx').on(table.userId),
  keyPrefixIdx: index('api_keys_key_prefix_idx').on(table.keyPrefix),
}))

export const apiKeyUsage = pgTable('api_key_usage', {
  id: text('id').primaryKey(),
  apiKeyId: text('api_key_id').notNull().references(() => apiKeys.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  method: text('method').notNull(),
  status: integer('status').notNull(),
  duration: integer('duration').notNull(),
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  apiKeyIdIdx: index('api_key_usage_api_key_id_idx').on(table.apiKeyId),
  createdAtIdx: index('api_key_usage_created_at_idx').on(table.createdAt),
}))

export const usersRelations = relations(users, ({ many }) => ({
  apiKeys: many(apiKeys),
}))

export const apiKeysRelations = relations(apiKeys, ({ one, many }) => ({
  user: one(users, { fields: [apiKeys.userId], references: [users.id] }),
  usageLogs: many(apiKeyUsage),
}))
```

## API Key Generation & Validation

```typescript
// lib/api-keys/core.ts
import { nanoid } from 'nanoid'
import * as argon2 from 'argon2'
import { prisma } from '@/lib/prisma'

// Configuration
const KEY_PREFIX = process.env.API_KEY_PREFIX || 'sk_live_'
const KEY_LENGTH = parseInt(process.env.API_KEY_LENGTH || '32')

// Available scopes
export const API_SCOPES = [
  'read:users',
  'write:users',
  'read:orders',
  'write:orders',
  'read:products',
  'write:products',
  'read:analytics',
  'admin',
] as const

export type ApiScope = typeof API_SCOPES[number]

export interface ApiKeyData {
  id: string
  name: string
  keyPrefix: string
  userId: string
  scopes: string[]
  rateLimit: number
  lastUsedAt: Date | null
  expiresAt: Date | null
  createdAt: Date
}

// Generate a new API key
export async function generateApiKey(options: {
  userId: string
  name: string
  scopes?: ApiScope[]
  rateLimit?: number
  expiresAt?: Date
}): Promise<{ key: string; keyData: ApiKeyData }> {
  // Generate the raw key
  const rawKey = nanoid(KEY_LENGTH)
  const fullKey = `${KEY_PREFIX}${rawKey}`
  const keyPrefix = fullKey.substring(0, 12) // Store prefix for identification

  // Hash the key for storage
  const keyHash = await argon2.hash(fullKey, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  })

  // Store in database
  const apiKey = await prisma.apiKey.create({
    data: {
      name: options.name,
      keyHash,
      keyPrefix,
      userId: options.userId,
      scopes: options.scopes || [],
      rateLimit: options.rateLimit || 1000,
      expiresAt: options.expiresAt,
    },
  })

  return {
    key: fullKey, // Only returned once, never stored
    keyData: {
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      userId: apiKey.userId,
      scopes: apiKey.scopes,
      rateLimit: apiKey.rateLimit,
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    },
  }
}

// Validate an API key
export async function validateApiKey(key: string): Promise<{
  valid: boolean
  keyData?: ApiKeyData
  error?: string
}> {
  // Check prefix
  if (!key.startsWith(KEY_PREFIX)) {
    return { valid: false, error: 'Invalid key format' }
  }

  const keyPrefix = key.substring(0, 12)

  // Find potential matches by prefix (optimization)
  const candidates = await prisma.apiKey.findMany({
    where: {
      keyPrefix,
      revokedAt: null,
    },
  })

  if (candidates.length === 0) {
    return { valid: false, error: 'Invalid API key' }
  }

  // Verify the full key against stored hashes
  for (const candidate of candidates) {
    try {
      const isValid = await argon2.verify(candidate.keyHash, key)

      if (isValid) {
        // Check expiration
        if (candidate.expiresAt && candidate.expiresAt < new Date()) {
          return { valid: false, error: 'API key expired' }
        }

        // Update last used timestamp (non-blocking)
        prisma.apiKey.update({
          where: { id: candidate.id },
          data: { lastUsedAt: new Date() },
        }).catch(console.error)

        return {
          valid: true,
          keyData: {
            id: candidate.id,
            name: candidate.name,
            keyPrefix: candidate.keyPrefix,
            userId: candidate.userId,
            scopes: candidate.scopes,
            rateLimit: candidate.rateLimit,
            lastUsedAt: candidate.lastUsedAt,
            expiresAt: candidate.expiresAt,
            createdAt: candidate.createdAt,
          },
        }
      }
    } catch {
      continue
    }
  }

  return { valid: false, error: 'Invalid API key' }
}

// Check if key has required scope
export function hasScope(keyData: ApiKeyData, requiredScope: ApiScope): boolean {
  // Admin scope has access to everything
  if (keyData.scopes.includes('admin')) return true

  // Check for exact scope
  if (keyData.scopes.includes(requiredScope)) return true

  // Check for wildcard scopes (e.g., 'write:users' includes 'read:users')
  const [action, resource] = requiredScope.split(':')
  if (action === 'read') {
    return keyData.scopes.includes(`write:${resource}`)
  }

  return false
}

// Revoke an API key
export async function revokeApiKey(keyId: string, userId: string): Promise<boolean> {
  const result = await prisma.apiKey.updateMany({
    where: {
      id: keyId,
      userId, // Ensure user owns the key
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  })

  return result.count > 0
}

// List user's API keys
export async function listApiKeys(userId: string): Promise<ApiKeyData[]> {
  const keys = await prisma.apiKey.findMany({
    where: {
      userId,
      revokedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  })

  return keys.map((key) => ({
    id: key.id,
    name: key.name,
    keyPrefix: key.keyPrefix,
    userId: key.userId,
    scopes: key.scopes,
    rateLimit: key.rateLimit,
    lastUsedAt: key.lastUsedAt,
    expiresAt: key.expiresAt,
    createdAt: key.createdAt,
  }))
}

// Rotate an API key (create new, revoke old)
export async function rotateApiKey(keyId: string, userId: string): Promise<{
  key: string
  keyData: ApiKeyData
} | null> {
  const oldKey = await prisma.apiKey.findFirst({
    where: { id: keyId, userId, revokedAt: null },
  })

  if (!oldKey) return null

  // Create new key with same settings
  const result = await generateApiKey({
    userId,
    name: `${oldKey.name} (rotated)`,
    scopes: oldKey.scopes as ApiScope[],
    rateLimit: oldKey.rateLimit,
    expiresAt: oldKey.expiresAt || undefined,
  })

  // Revoke old key
  await revokeApiKey(keyId, userId)

  return result
}
```

## Rate Limiting

```typescript
// lib/api-keys/rate-limit.ts
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Create rate limiters with different windows
const rateLimiters = new Map<number, Ratelimit>()

function getRateLimiter(limit: number): Ratelimit {
  if (!rateLimiters.has(limit)) {
    rateLimiters.set(
      limit,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, '1 h'),
        analytics: true,
        prefix: `api_key_ratelimit:${limit}`,
      })
    )
  }
  return rateLimiters.get(limit)!
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // Unix timestamp
}

export async function checkRateLimit(
  keyId: string,
  rateLimit: number
): Promise<RateLimitResult> {
  const limiter = getRateLimiter(rateLimit)
  const result = await limiter.limit(keyId)

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  }
}

// Get current rate limit status without consuming
export async function getRateLimitStatus(
  keyId: string,
  rateLimit: number
): Promise<RateLimitResult> {
  const limiter = getRateLimiter(rateLimit)
  const result = await limiter.limit(keyId)

  // Immediately reset the counter since we're just checking
  await redis.del(`api_key_ratelimit:${rateLimit}:${keyId}`)

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  }
}
```

## Usage Tracking

```typescript
// lib/api-keys/usage.ts
import { prisma } from '@/lib/prisma'
import { createId } from '@paralleldrive/cuid2'

export interface UsageLog {
  apiKeyId: string
  endpoint: string
  method: string
  status: number
  duration: number
  ip?: string
  userAgent?: string
}

// Queue for batch inserting usage logs
let usageQueue: UsageLog[] = []
let flushTimeout: NodeJS.Timeout | null = null

export function logUsage(log: UsageLog): void {
  usageQueue.push(log)

  // Batch insert every 5 seconds or when queue reaches 100
  if (usageQueue.length >= 100) {
    flushUsageQueue()
  } else if (!flushTimeout) {
    flushTimeout = setTimeout(flushUsageQueue, 5000)
  }
}

async function flushUsageQueue(): Promise<void> {
  if (usageQueue.length === 0) return

  const logs = [...usageQueue]
  usageQueue = []

  if (flushTimeout) {
    clearTimeout(flushTimeout)
    flushTimeout = null
  }

  try {
    await prisma.apiKeyUsage.createMany({
      data: logs.map((log) => ({
        id: createId(),
        ...log,
      })),
    })
  } catch (error) {
    console.error('Failed to flush usage logs:', error)
    // Re-add failed logs to queue
    usageQueue.push(...logs)
  }
}

// Get usage analytics
export async function getUsageAnalytics(
  apiKeyId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalRequests: number
  successRate: number
  avgDuration: number
  byEndpoint: Record<string, number>
  byStatus: Record<number, number>
  byDay: { date: string; count: number }[]
}> {
  const logs = await prisma.apiKeyUsage.findMany({
    where: {
      apiKeyId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      endpoint: true,
      status: true,
      duration: true,
      createdAt: true,
    },
  })

  const totalRequests = logs.length
  const successRequests = logs.filter((l) => l.status < 400).length
  const successRate = totalRequests > 0 ? successRequests / totalRequests : 0
  const avgDuration =
    totalRequests > 0
      ? logs.reduce((sum, l) => sum + l.duration, 0) / totalRequests
      : 0

  const byEndpoint: Record<string, number> = {}
  const byStatus: Record<number, number> = {}
  const byDayMap: Record<string, number> = {}

  for (const log of logs) {
    byEndpoint[log.endpoint] = (byEndpoint[log.endpoint] || 0) + 1
    byStatus[log.status] = (byStatus[log.status] || 0) + 1

    const dateKey = log.createdAt.toISOString().split('T')[0]
    byDayMap[dateKey] = (byDayMap[dateKey] || 0) + 1
  }

  const byDay = Object.entries(byDayMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    totalRequests,
    successRate,
    avgDuration,
    byEndpoint,
    byStatus,
    byDay,
  }
}
```

## Middleware

```typescript
// middleware/api-key.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, hasScope, type ApiScope, type ApiKeyData } from '@/lib/api-keys/core'
import { checkRateLimit } from '@/lib/api-keys/rate-limit'
import { logUsage } from '@/lib/api-keys/usage'

export interface ApiKeyContext {
  keyData: ApiKeyData
  requestStart: number
}

// Store context for the current request
const requestContext = new WeakMap<NextRequest, ApiKeyContext>()

export function getApiKeyContext(request: NextRequest): ApiKeyContext | undefined {
  return requestContext.get(request)
}

export function withApiKey(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    requiredScope?: ApiScope
    rateLimit?: boolean
  } = {}
): (request: NextRequest) => Promise<NextResponse> {
  const { requiredScope, rateLimit = true } = options

  return async (request: NextRequest): Promise<NextResponse> => {
    const requestStart = Date.now()

    // Extract API key from header or query
    const apiKey =
      request.headers.get('x-api-key') ||
      request.headers.get('authorization')?.replace('Bearer ', '') ||
      request.nextUrl.searchParams.get('api_key')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required' },
        { status: 401, headers: { 'X-Error-Code': 'MISSING_API_KEY' } }
      )
    }

    // Validate the key
    const validation = await validateApiKey(apiKey)

    if (!validation.valid || !validation.keyData) {
      return NextResponse.json(
        { error: validation.error || 'Invalid API key' },
        { status: 401, headers: { 'X-Error-Code': 'INVALID_API_KEY' } }
      )
    }

    const { keyData } = validation

    // Check required scope
    if (requiredScope && !hasScope(keyData, requiredScope)) {
      logUsageAsync(keyData.id, request, 403, requestStart)
      return NextResponse.json(
        { error: 'Insufficient permissions', required: requiredScope },
        { status: 403, headers: { 'X-Error-Code': 'INSUFFICIENT_SCOPE' } }
      )
    }

    // Check rate limit
    if (rateLimit) {
      const rateLimitResult = await checkRateLimit(keyData.id, keyData.rateLimit)

      if (!rateLimitResult.success) {
        logUsageAsync(keyData.id, request, 429, requestStart)
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': rateLimitResult.limit.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': rateLimitResult.reset.toString(),
              'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
            },
          }
        )
      }
    }

    // Store context for the handler
    requestContext.set(request, { keyData, requestStart })

    // Execute handler
    try {
      const response = await handler(request)

      // Log successful usage
      logUsageAsync(keyData.id, request, response.status, requestStart)

      return response
    } catch (error) {
      logUsageAsync(keyData.id, request, 500, requestStart)
      throw error
    }
  }
}

function logUsageAsync(
  apiKeyId: string,
  request: NextRequest,
  status: number,
  requestStart: number
): void {
  const duration = Date.now() - requestStart

  logUsage({
    apiKeyId,
    endpoint: request.nextUrl.pathname,
    method: request.method,
    status,
    duration,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    userAgent: request.headers.get('user-agent') || undefined,
  })
}

// Scope-specific middleware factories
export const requireReadUsers = (handler: (req: NextRequest) => Promise<NextResponse>) =>
  withApiKey(handler, { requiredScope: 'read:users' })

export const requireWriteUsers = (handler: (req: NextRequest) => Promise<NextResponse>) =>
  withApiKey(handler, { requiredScope: 'write:users' })

export const requireAdmin = (handler: (req: NextRequest) => Promise<NextResponse>) =>
  withApiKey(handler, { requiredScope: 'admin' })
```

## API Routes

```typescript
// app/api/v1/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withApiKey, getApiKeyContext } from '@/middleware/api-key'

async function getUsers(request: NextRequest) {
  const context = getApiKeyContext(request)

  // Access the authenticated key data
  console.log('Request from:', context?.keyData.name)

  // Your business logic here
  const users = [{ id: '1', name: 'John' }]

  return NextResponse.json({ users })
}

async function createUser(request: NextRequest) {
  const context = getApiKeyContext(request)
  const body = await request.json()

  // Your business logic here
  const user = { id: '2', ...body }

  return NextResponse.json({ user }, { status: 201 })
}

export const GET = withApiKey(getUsers, { requiredScope: 'read:users' })
export const POST = withApiKey(createUser, { requiredScope: 'write:users' })
```

```typescript
// app/api/keys/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { generateApiKey, listApiKeys, revokeApiKey, rotateApiKey } from '@/lib/api-keys/core'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// List API keys
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const keys = await listApiKeys(session.user.id)
  return NextResponse.json({ keys })
}

// Create new API key
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, scopes, rateLimit, expiresAt } = body

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const result = await generateApiKey({
    userId: session.user.id,
    name,
    scopes,
    rateLimit,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
  })

  return NextResponse.json({
    key: result.key, // Only returned once!
    keyData: result.keyData,
    warning: 'Save this key securely. It will not be shown again.',
  }, { status: 201 })
}

// Revoke API key
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const keyId = searchParams.get('id')

  if (!keyId) {
    return NextResponse.json({ error: 'Key ID required' }, { status: 400 })
  }

  const revoked = await revokeApiKey(keyId, session.user.id)

  if (!revoked) {
    return NextResponse.json({ error: 'Key not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}

// Rotate API key
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { keyId } = body

  if (!keyId) {
    return NextResponse.json({ error: 'Key ID required' }, { status: 400 })
  }

  const result = await rotateApiKey(keyId, session.user.id)

  if (!result) {
    return NextResponse.json({ error: 'Key not found' }, { status: 404 })
  }

  return NextResponse.json({
    key: result.key,
    keyData: result.keyData,
    warning: 'Save this key securely. It will not be shown again.',
  })
}
```

## React Components

```typescript
// components/api-keys/api-key-manager.tsx
'use client'

import { useState, useEffect } from 'react'
import { API_SCOPES, type ApiScope } from '@/lib/api-keys/core'

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  scopes: string[]
  rateLimit: number
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
}

export function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)

  useEffect(() => {
    fetchKeys()
  }, [])

  const fetchKeys = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/keys')
      const data = await res.json()
      setKeys(data.keys)
    } catch (error) {
      console.error('Failed to fetch keys:', error)
    }
    setLoading(false)
  }

  const createKey = async (data: {
    name: string
    scopes: ApiScope[]
    rateLimit: number
    expiresAt?: string
  }) => {
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()

      if (res.ok) {
        setNewKey(result.key)
        await fetchKeys()
      }
    } catch (error) {
      console.error('Failed to create key:', error)
    }
  }

  const revokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return

    try {
      const res = await fetch(`/api/keys?id=${keyId}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchKeys()
      }
    } catch (error) {
      console.error('Failed to revoke key:', error)
    }
  }

  const rotateKey = async (keyId: string) => {
    if (!confirm('This will invalidate the current key. Continue?')) return

    try {
      const res = await fetch('/api/keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId }),
      })
      const result = await res.json()

      if (res.ok) {
        setNewKey(result.key)
        await fetchKeys()
      }
    } catch (error) {
      console.error('Failed to rotate key:', error)
    }
  }

  if (loading) {
    return <div>Loading API keys...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">API Keys</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create New Key
        </button>
      </div>

      {newKey && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="font-medium text-yellow-800">New API Key Created</p>
          <p className="text-sm text-yellow-600 mb-2">
            Copy this key now. It will not be shown again.
          </p>
          <code className="block p-2 bg-white border rounded text-sm break-all">
            {newKey}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(newKey)
              setNewKey(null)
            }}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Copy and dismiss
          </button>
        </div>
      )}

      <div className="space-y-4">
        {keys.map((key) => (
          <div key={key.id} className="p-4 border rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{key.name}</h3>
                <p className="text-sm text-gray-500 font-mono">{key.keyPrefix}...</p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => rotateKey(key.id)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Rotate
                </button>
                <button
                  onClick={() => revokeKey(key.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Revoke
                </button>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
              {key.scopes.map((scope) => (
                <span
                  key={scope}
                  className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                >
                  {scope}
                </span>
              ))}
            </div>

            <div className="mt-2 text-xs text-gray-500">
              Rate limit: {key.rateLimit}/hr
              {key.lastUsedAt && (
                <> · Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</>
              )}
              {key.expiresAt && (
                <> · Expires: {new Date(key.expiresAt).toLocaleDateString()}</>
              )}
            </div>
          </div>
        ))}

        {keys.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No API keys yet. Create one to get started.
          </p>
        )}
      </div>

      {showCreate && (
        <CreateKeyModal
          onClose={() => setShowCreate(false)}
          onCreate={createKey}
        />
      )}
    </div>
  )
}

function CreateKeyModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (data: any) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<ApiScope[]>([])
  const [rateLimit, setRateLimit] = useState(1000)
  const [expiresAt, setExpiresAt] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onCreate({
      name,
      scopes,
      rateLimit,
      expiresAt: expiresAt || undefined,
    })
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Create API Key</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Production API Key"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Scopes</label>
            <div className="grid grid-cols-2 gap-2">
              {API_SCOPES.map((scope) => (
                <label key={scope} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={scopes.includes(scope)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setScopes([...scopes, scope])
                      } else {
                        setScopes(scopes.filter((s) => s !== scope))
                      }
                    }}
                  />
                  <span className="text-sm">{scope}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Rate Limit (requests/hour)
            </label>
            <input
              type="number"
              value={rateLimit}
              onChange={(e) => setRateLimit(parseInt(e.target.value))}
              className="w-full border rounded px-3 py-2"
              min={1}
              max={100000}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Expiration (optional)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full border rounded px-3 py-2"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

## Testing

```typescript
// __tests__/api-keys.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateApiKey, validateApiKey, hasScope, revokeApiKey } from '@/lib/api-keys/core'

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    apiKey: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

describe('API Keys', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateApiKey', () => {
    it('should generate a new API key', async () => {
      vi.mocked(prisma.apiKey.create).mockResolvedValue({
        id: 'key-123',
        name: 'Test Key',
        keyHash: 'hashed',
        keyPrefix: 'sk_live_abc',
        userId: 'user-123',
        scopes: ['read:users'],
        rateLimit: 1000,
        lastUsedAt: null,
        expiresAt: null,
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await generateApiKey({
        userId: 'user-123',
        name: 'Test Key',
        scopes: ['read:users'],
      })

      expect(result.key).toMatch(/^sk_live_/)
      expect(result.keyData.name).toBe('Test Key')
      expect(result.keyData.scopes).toContain('read:users')
    })
  })

  describe('hasScope', () => {
    const keyData = {
      id: 'key-123',
      name: 'Test',
      keyPrefix: 'sk_live_',
      userId: 'user-123',
      scopes: ['read:users', 'write:orders'],
      rateLimit: 1000,
      lastUsedAt: null,
      expiresAt: null,
      createdAt: new Date(),
    }

    it('should return true for exact scope match', () => {
      expect(hasScope(keyData, 'read:users')).toBe(true)
    })

    it('should return true for write scope when read is required', () => {
      expect(hasScope({ ...keyData, scopes: ['write:users'] }, 'read:users')).toBe(true)
    })

    it('should return true for admin scope', () => {
      expect(hasScope({ ...keyData, scopes: ['admin'] }, 'write:users')).toBe(true)
    })

    it('should return false for missing scope', () => {
      expect(hasScope(keyData, 'read:products')).toBe(false)
    })
  })
})
```

## CLAUDE.md Integration

```markdown
## API Key Authentication

This project uses API keys for service authentication.

### Key Files
- `lib/api-keys/core.ts` - Key generation, validation, and management
- `lib/api-keys/rate-limit.ts` - Rate limiting with Upstash
- `lib/api-keys/usage.ts` - Usage tracking and analytics
- `middleware/api-key.ts` - Request middleware

### Key Format
- Prefix: `sk_live_` (production) or `sk_test_` (testing)
- Length: 32 characters
- Example: `sk_live_EXAMPLE_REPLACE_WITH_YOUR_KEY`

### Usage
```typescript
// Protect an API route
export const GET = withApiKey(handler, { requiredScope: 'read:users' })

// Use API key in requests
curl -H "x-api-key: sk_live_..." https://api.example.com/v1/users
```

### Scopes
- `read:users`, `write:users`
- `read:orders`, `write:orders`
- `read:products`, `write:products`
- `read:analytics`
- `admin` (full access)
```

## AI Suggestions

1. **Key prefix environments** - Use `sk_live_` for production and `sk_test_` for testing/staging
2. **IP allowlisting** - Add optional IP restrictions per API key
3. **Webhook signatures** - Use API keys to sign webhook payloads for verification
4. **Key hierarchy** - Support organization-level keys that can create user keys
5. **Audit logging** - Log all key management actions (create, rotate, revoke)
6. **Usage alerts** - Notify users when approaching rate limits or unusual patterns
7. **Key metadata** - Store custom metadata (environment, purpose, team) with each key
8. **Temporary keys** - Support short-lived keys for specific operations
