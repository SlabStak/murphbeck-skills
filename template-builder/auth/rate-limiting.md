# Rate Limiting Template

Complete rate limiting implementation for API protection.

## Overview

Rate limiting provides:
- Protection against abuse
- DDoS mitigation
- Fair resource allocation
- Cost control
- API quota management

## Installation

```bash
# Upstash Redis (recommended for serverless)
bun add @upstash/ratelimit @upstash/redis

# OR local/self-hosted Redis
bun add ioredis

# OR in-memory (development only)
# No package needed
```

## Environment Variables

```env
# .env.local

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...

# OR standard Redis
REDIS_URL=redis://localhost:6379

# Rate limit configuration
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60  # seconds
```

## Upstash Rate Limiter (Serverless)

### Basic Setup

```typescript
// lib/rate-limit/upstash.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Global rate limiter
export const globalLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
  prefix: 'ratelimit:global',
})

// Auth rate limiter (stricter for login/signup)
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 attempts per minute
  analytics: true,
  prefix: 'ratelimit:auth',
})

// API rate limiter (per user)
export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.tokenBucket(50, '1 h', 10), // 50 tokens/hour, 10 refill rate
  analytics: true,
  prefix: 'ratelimit:api',
})

// Heavy operation limiter
export const heavyLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(10, '1 d'), // 10 per day
  analytics: true,
  prefix: 'ratelimit:heavy',
})
```

### Algorithm Options

```typescript
// Sliding Window - Most accurate, recommended
Ratelimit.slidingWindow(10, '10 s') // 10 requests per 10 seconds

// Fixed Window - Simple, less accurate at boundaries
Ratelimit.fixedWindow(100, '1 h') // 100 requests per hour

// Token Bucket - Allows bursts, good for APIs
Ratelimit.tokenBucket(
  100,   // max tokens
  '1 h', // refill interval
  10     // tokens added per interval
)

// Cached Fixed Window - Fast, uses local cache
Ratelimit.cachedFixedWindow(100, '1 h')
```

### Rate Limit Middleware

```typescript
// lib/rate-limit/middleware.ts
import { Ratelimit } from '@upstash/ratelimit'
import { NextResponse } from 'next/server'
import { globalLimiter, authLimiter } from './upstash'

export type RateLimitConfig = {
  limiter: Ratelimit
  identifier: (request: Request) => string | Promise<string>
}

export function withRateLimit(config: RateLimitConfig) {
  return async function (
    request: Request,
    handler: (request: Request) => Promise<Response>
  ): Promise<Response> {
    const identifier = await config.identifier(request)
    const { success, limit, remaining, reset } = await config.limiter.limit(identifier)

    if (!success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    const response = await handler(request)

    // Add rate limit headers to successful response
    const newResponse = new Response(response.body, response)
    newResponse.headers.set('X-RateLimit-Limit', limit.toString())
    newResponse.headers.set('X-RateLimit-Remaining', remaining.toString())
    newResponse.headers.set('X-RateLimit-Reset', reset.toString())

    return newResponse
  }
}

// IP-based identifier
export function getIP(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ??
    request.headers.get('x-real-ip') ??
    'anonymous'
  )
}

// User-based identifier
export async function getUserId(request: Request): Promise<string> {
  // Get from session/JWT
  const session = await auth()
  return session?.user?.id ?? getIP(request)
}
```

### Usage in API Routes

```typescript
// app/api/posts/route.ts
import { withRateLimit, getIP } from '@/lib/rate-limit/middleware'
import { globalLimiter } from '@/lib/rate-limit/upstash'

export async function GET(request: Request) {
  return withRateLimit({
    limiter: globalLimiter,
    identifier: getIP,
  })(request, async (req) => {
    const posts = await getPosts()
    return NextResponse.json(posts)
  })
}

// app/api/auth/login/route.ts
import { authLimiter } from '@/lib/rate-limit/upstash'

export async function POST(request: Request) {
  return withRateLimit({
    limiter: authLimiter,
    identifier: getIP,
  })(request, async (req) => {
    // Login logic
  })
}
```

## Next.js Middleware Rate Limiting

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
})

// Routes to rate limit
const rateLimitedRoutes = ['/api/']
// Routes with stricter limits
const strictRoutes = ['/api/auth/login', '/api/auth/signup', '/api/auth/forgot-password']

const strictRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
})

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if route should be rate limited
  const shouldRateLimit = rateLimitedRoutes.some(route =>
    pathname.startsWith(route)
  )

  if (!shouldRateLimit) {
    return NextResponse.next()
  }

  // Get identifier
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ??
    request.headers.get('x-real-ip') ??
    'anonymous'

  // Use strict limiter for auth routes
  const isStrictRoute = strictRoutes.some(route => pathname.startsWith(route))
  const limiter = isStrictRoute ? strictRatelimit : ratelimit
  const identifier = isStrictRoute ? `strict:${ip}` : ip

  const { success, limit, remaining, reset } = await limiter.limit(identifier)

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', reset.toString())

  return response
}

export const config = {
  matcher: '/api/:path*',
}
```

## Redis Rate Limiter (Self-Hosted)

```typescript
// lib/rate-limit/redis.ts
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!)

type RateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// Sliding window rate limiter using Redis sorted sets
export async function slidingWindowRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now()
  const windowStart = now - windowMs
  const key = `ratelimit:${identifier}`

  // Use Redis transaction
  const pipeline = redis.pipeline()

  // Remove old entries
  pipeline.zremrangebyscore(key, 0, windowStart)

  // Count current entries
  pipeline.zcard(key)

  // Add new entry
  pipeline.zadd(key, now, `${now}:${Math.random()}`)

  // Set expiry
  pipeline.expire(key, Math.ceil(windowMs / 1000))

  const results = await pipeline.exec()
  const currentCount = (results?.[1]?.[1] as number) ?? 0

  const success = currentCount < limit
  const remaining = Math.max(0, limit - currentCount - 1)
  const reset = now + windowMs

  return { success, limit, remaining, reset }
}

// Token bucket rate limiter
export async function tokenBucketRateLimit(
  identifier: string,
  maxTokens: number,
  refillRate: number, // tokens per second
): Promise<RateLimitResult> {
  const key = `ratelimit:bucket:${identifier}`
  const now = Date.now()

  // Lua script for atomic operation
  const script = `
    local key = KEYS[1]
    local maxTokens = tonumber(ARGV[1])
    local refillRate = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])

    local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
    local tokens = tonumber(bucket[1]) or maxTokens
    local lastRefill = tonumber(bucket[2]) or now

    -- Refill tokens
    local elapsed = (now - lastRefill) / 1000
    tokens = math.min(maxTokens, tokens + (elapsed * refillRate))

    -- Try to consume a token
    if tokens >= 1 then
      tokens = tokens - 1
      redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
      redis.call('EXPIRE', key, 3600)
      return {1, tokens, maxTokens}
    else
      return {0, tokens, maxTokens}
    end
  `

  const result = await redis.eval(
    script,
    1,
    key,
    maxTokens,
    refillRate,
    now
  ) as [number, number, number]

  return {
    success: result[0] === 1,
    remaining: Math.floor(result[1]),
    limit: result[2],
    reset: now + Math.ceil((1 - result[1]) / refillRate) * 1000,
  }
}

// Fixed window rate limiter (simple)
export async function fixedWindowRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const window = Math.floor(Date.now() / 1000 / windowSeconds)
  const key = `ratelimit:fixed:${identifier}:${window}`

  const pipeline = redis.pipeline()
  pipeline.incr(key)
  pipeline.expire(key, windowSeconds)

  const results = await pipeline.exec()
  const count = (results?.[0]?.[1] as number) ?? 1

  const success = count <= limit
  const remaining = Math.max(0, limit - count)
  const reset = (window + 1) * windowSeconds * 1000

  return { success, limit, remaining, reset }
}
```

## In-Memory Rate Limiter (Development)

```typescript
// lib/rate-limit/memory.ts

type RateLimitEntry = {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key)
    }
  }
}, 60000)

export function memoryRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now()
  const key = identifier

  let entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + windowMs }
    store.set(key, entry)
  }

  entry.count++

  const success = entry.count <= limit
  const remaining = Math.max(0, limit - entry.count)

  return {
    success,
    limit,
    remaining,
    reset: entry.resetAt,
  }
}
```

## Tiered Rate Limits

```typescript
// lib/rate-limit/tiered.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

type Plan = 'free' | 'pro' | 'enterprise'

const RATE_LIMITS: Record<Plan, { requests: number; window: string }> = {
  free: { requests: 100, window: '1 h' },
  pro: { requests: 1000, window: '1 h' },
  enterprise: { requests: 10000, window: '1 h' },
}

// Create limiter for each plan
const limiters: Record<Plan, Ratelimit> = {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 h'),
    prefix: 'ratelimit:free',
  }),
  pro: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, '1 h'),
    prefix: 'ratelimit:pro',
  }),
  enterprise: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10000, '1 h'),
    prefix: 'ratelimit:enterprise',
  }),
}

export async function tieredRateLimit(userId: string, plan: Plan) {
  const limiter = limiters[plan]
  return limiter.limit(userId)
}

// Middleware usage
export async function withTieredRateLimit(
  request: Request,
  handler: (request: Request) => Promise<Response>
) {
  const session = await auth()

  if (!session?.user) {
    // Use IP-based limit for unauthenticated users
    const ip = getIP(request)
    const result = await limiters.free.limit(ip)

    if (!result.success) {
      return rateLimitResponse(result)
    }

    return handler(request)
  }

  const plan = (session.user.plan as Plan) ?? 'free'
  const result = await tieredRateLimit(session.user.id, plan)

  if (!result.success) {
    return rateLimitResponse(result)
  }

  return handler(request)
}

function rateLimitResponse(result: { limit: number; remaining: number; reset: number }) {
  return NextResponse.json(
    {
      error: 'Rate limit exceeded',
      limit: result.limit,
      remaining: result.remaining,
      resetAt: new Date(result.reset).toISOString(),
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
      },
    }
  )
}
```

## Cost-Based Rate Limiting

```typescript
// lib/rate-limit/cost-based.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Operation costs
const OPERATION_COSTS: Record<string, number> = {
  'read': 1,
  'write': 5,
  'upload': 10,
  'ai-generate': 50,
  'export': 20,
}

// Token bucket with cost-based consumption
const costLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.tokenBucket(1000, '1 h', 100), // 1000 tokens/hour
  prefix: 'ratelimit:cost',
})

export async function costBasedRateLimit(
  userId: string,
  operation: string
): Promise<{ success: boolean; cost: number; remaining: number }> {
  const cost = OPERATION_COSTS[operation] ?? 1

  // Check if user has enough tokens
  const key = `ratelimit:cost:${userId}`

  // Custom implementation for cost-based consumption
  const result = await redis.eval(
    `
    local key = KEYS[1]
    local cost = tonumber(ARGV[1])
    local maxTokens = tonumber(ARGV[2])
    local refillRate = tonumber(ARGV[3])
    local now = tonumber(ARGV[4])

    local data = redis.call('HMGET', key, 'tokens', 'lastRefill')
    local tokens = tonumber(data[1]) or maxTokens
    local lastRefill = tonumber(data[2]) or now

    -- Refill tokens
    local elapsed = (now - lastRefill) / 1000
    tokens = math.min(maxTokens, tokens + (elapsed * refillRate))

    -- Try to consume tokens
    if tokens >= cost then
      tokens = tokens - cost
      redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
      redis.call('EXPIRE', key, 3600)
      return {1, tokens}
    else
      return {0, tokens}
    end
    `,
    1,
    key,
    cost,
    1000, // maxTokens
    100,  // refillRate (tokens per hour / 3600)
    Date.now()
  ) as [number, number]

  return {
    success: result[0] === 1,
    cost,
    remaining: Math.floor(result[1]),
  }
}

// Usage
export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { success, cost, remaining } = await costBasedRateLimit(
    session.user.id,
    'ai-generate'
  )

  if (!success) {
    return NextResponse.json(
      {
        error: 'Insufficient quota',
        cost,
        remaining,
      },
      { status: 429 }
    )
  }

  // Perform AI generation...
}
```

## Rate Limit Analytics

```typescript
// lib/rate-limit/analytics.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function trackRateLimitEvent(
  identifier: string,
  endpoint: string,
  success: boolean
) {
  const now = new Date()
  const hour = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`

  const pipeline = redis.pipeline()

  // Track total requests
  pipeline.hincrby(`analytics:requests:${hour}`, endpoint, 1)

  // Track rate limited requests
  if (!success) {
    pipeline.hincrby(`analytics:limited:${hour}`, endpoint, 1)
    pipeline.hincrby(`analytics:limited:users:${hour}`, identifier, 1)
  }

  // Set expiry (keep for 30 days)
  pipeline.expire(`analytics:requests:${hour}`, 30 * 24 * 60 * 60)
  pipeline.expire(`analytics:limited:${hour}`, 30 * 24 * 60 * 60)
  pipeline.expire(`analytics:limited:users:${hour}`, 30 * 24 * 60 * 60)

  await pipeline.exec()
}

export async function getRateLimitAnalytics(hours: number = 24) {
  const now = new Date()
  const keys: string[] = []

  for (let i = 0; i < hours; i++) {
    const date = new Date(now.getTime() - i * 60 * 60 * 1000)
    const hour = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`
    keys.push(hour)
  }

  const analytics = await Promise.all(
    keys.map(async (hour) => {
      const [requests, limited] = await Promise.all([
        redis.hgetall(`analytics:requests:${hour}`),
        redis.hgetall(`analytics:limited:${hour}`),
      ])

      return { hour, requests, limited }
    })
  )

  return analytics
}
```

## CLAUDE.md Integration

```markdown
## Rate Limiting

Using Upstash Redis for rate limiting.

### Limits
- Global: 100 requests/minute
- Auth: 5 requests/minute
- API (authenticated): Based on plan

### Plan Limits
- Free: 100 requests/hour
- Pro: 1,000 requests/hour
- Enterprise: 10,000 requests/hour

### Response Headers
- `X-RateLimit-Limit` - Maximum requests
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Reset timestamp (ms)
- `Retry-After` - Seconds until reset

### Key Files
- `lib/rate-limit/upstash.ts` - Rate limiters
- `lib/rate-limit/middleware.ts` - Rate limit middleware
- `middleware.ts` - Global rate limiting
```

## AI Suggestions

### Best Practices
1. **Layer limits** - Global + per-user + per-endpoint
2. **Graceful degradation** - Serve cached data when limited
3. **User feedback** - Show remaining quota in UI
4. **Webhook alerts** - Notify on abuse detection

### Security
1. **IP + User** - Combine identifiers
2. **Distributed limits** - Same limits across regions
3. **Burst protection** - Use token bucket for API
4. **Auth rate limiting** - Strict limits on login
