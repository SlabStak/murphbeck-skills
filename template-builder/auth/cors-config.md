# CORS Configuration

Production-ready Cross-Origin Resource Sharing configuration for Next.js APIs with fine-grained control.

## Overview

CORS configuration handles:
- Allowed origins (whitelist or patterns)
- Allowed HTTP methods
- Allowed and exposed headers
- Credentials support
- Preflight caching
- Per-route customization

## Installation

```bash
# No additional packages required for basic CORS
# For advanced patterns:
npm install cors
```

## Environment Variables

```env
# .env.local
# Comma-separated list of allowed origins
CORS_ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com

# Or use wildcard (not recommended for production with credentials)
# CORS_ALLOWED_ORIGINS=*

# Production domain
NEXT_PUBLIC_APP_URL=https://example.com
```

## Core CORS Utility

```typescript
// lib/cors/index.ts
import { NextRequest, NextResponse } from 'next/server'

export interface CORSOptions {
  // Allowed origins - can be string, array, regex, or function
  allowedOrigins?: string | string[] | RegExp | ((origin: string) => boolean)

  // Allowed HTTP methods
  allowedMethods?: string[]

  // Allowed request headers
  allowedHeaders?: string[]

  // Headers exposed to the browser
  exposedHeaders?: string[]

  // Allow credentials (cookies, auth headers)
  credentials?: boolean

  // Preflight cache duration in seconds
  maxAge?: number

  // Allow requests without origin header
  allowNoOrigin?: boolean
}

const defaultOptions: CORSOptions = {
  allowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(',') || [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-API-Key',
    'X-Request-ID',
    'X-CSRF-Token',
  ],
  exposedHeaders: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
  allowNoOrigin: false,
}

// Check if origin is allowed
export function isOriginAllowed(
  origin: string | null,
  allowedOrigins: CORSOptions['allowedOrigins'],
  allowNoOrigin: boolean = false
): boolean {
  // Handle missing origin
  if (!origin) {
    return allowNoOrigin
  }

  // Wildcard
  if (allowedOrigins === '*') {
    return true
  }

  // String match
  if (typeof allowedOrigins === 'string') {
    return origin === allowedOrigins
  }

  // Array of strings
  if (Array.isArray(allowedOrigins)) {
    return allowedOrigins.includes(origin)
  }

  // RegExp
  if (allowedOrigins instanceof RegExp) {
    return allowedOrigins.test(origin)
  }

  // Function
  if (typeof allowedOrigins === 'function') {
    return allowedOrigins(origin)
  }

  return false
}

// Build CORS headers
export function buildCORSHeaders(
  origin: string | null,
  options: CORSOptions = {}
): Record<string, string> {
  const config = { ...defaultOptions, ...options }
  const headers: Record<string, string> = {}

  // Check if origin is allowed
  const originAllowed = isOriginAllowed(
    origin,
    config.allowedOrigins,
    config.allowNoOrigin
  )

  if (!originAllowed) {
    return headers
  }

  // Set Access-Control-Allow-Origin
  if (origin) {
    // Always use specific origin when credentials are enabled
    headers['Access-Control-Allow-Origin'] = config.credentials
      ? origin
      : (config.allowedOrigins === '*' ? '*' : origin)
  }

  // Set Access-Control-Allow-Methods
  if (config.allowedMethods?.length) {
    headers['Access-Control-Allow-Methods'] = config.allowedMethods.join(', ')
  }

  // Set Access-Control-Allow-Headers
  if (config.allowedHeaders?.length) {
    headers['Access-Control-Allow-Headers'] = config.allowedHeaders.join(', ')
  }

  // Set Access-Control-Expose-Headers
  if (config.exposedHeaders?.length) {
    headers['Access-Control-Expose-Headers'] = config.exposedHeaders.join(', ')
  }

  // Set Access-Control-Allow-Credentials
  if (config.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true'
  }

  // Set Access-Control-Max-Age for preflight caching
  if (config.maxAge) {
    headers['Access-Control-Max-Age'] = config.maxAge.toString()
  }

  return headers
}

// Handle preflight OPTIONS request
export function handlePreflight(
  request: NextRequest,
  options: CORSOptions = {}
): NextResponse | null {
  if (request.method !== 'OPTIONS') {
    return null
  }

  const origin = request.headers.get('origin')
  const headers = buildCORSHeaders(origin, options)

  // Check if origin is allowed
  if (!headers['Access-Control-Allow-Origin']) {
    return new NextResponse(null, {
      status: 403,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  return new NextResponse(null, {
    status: 204,
    headers,
  })
}

// Apply CORS headers to response
export function applyCORS(
  request: NextRequest,
  response: NextResponse,
  options: CORSOptions = {}
): NextResponse {
  const origin = request.headers.get('origin')
  const headers = buildCORSHeaders(origin, options)

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value)
  }

  return response
}

// CORS middleware wrapper
export function withCORS(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: CORSOptions = {}
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    // Handle preflight
    const preflight = handlePreflight(request, options)
    if (preflight) {
      return preflight
    }

    // Execute handler
    const response = await handler(request)

    // Apply CORS headers
    return applyCORS(request, response, options)
  }
}
```

## CORS Configuration Presets

```typescript
// lib/cors/presets.ts
import { CORSOptions } from './index'

// Strict CORS - only same origin
export const strictCORS: CORSOptions = {
  allowedOrigins: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  allowedMethods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 600, // 10 minutes
}

// Public API - allow any origin, no credentials
export const publicAPICORS: CORSOptions = {
  allowedOrigins: '*',
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-API-Key'],
  credentials: false,
  maxAge: 86400,
}

// Partner API - specific domains
export const partnerAPICORS: CORSOptions = {
  allowedOrigins: [
    'https://partner1.com',
    'https://partner2.com',
    /^https:\/\/.*\.partner\.com$/,
  ],
  allowedMethods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Partner-Key'],
  credentials: false,
  maxAge: 3600,
}

// Internal microservices
export const internalCORS: CORSOptions = {
  allowedOrigins: (origin) => {
    // Allow internal services
    return origin?.endsWith('.internal.example.com') ||
           origin?.startsWith('http://localhost:')
  },
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Service-Key', 'X-Trace-ID'],
  credentials: true,
  maxAge: 86400,
}

// Development - permissive
export const developmentCORS: CORSOptions = {
  allowedOrigins: /^http:\/\/localhost:\d+$/,
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: '*' as any,
  credentials: true,
  maxAge: 0, // No caching in dev
}

// Choose preset based on environment
export function getCORSPreset(type: 'strict' | 'public' | 'partner' | 'internal'): CORSOptions {
  if (process.env.NODE_ENV === 'development') {
    return developmentCORS
  }

  switch (type) {
    case 'strict':
      return strictCORS
    case 'public':
      return publicAPICORS
    case 'partner':
      return partnerAPICORS
    case 'internal':
      return internalCORS
    default:
      return strictCORS
  }
}
```

## Middleware Integration

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { handlePreflight, applyCORS, CORSOptions } from '@/lib/cors'

// Route-specific CORS configurations
const corsConfigs: Record<string, CORSOptions> = {
  '/api/public': {
    allowedOrigins: '*',
    credentials: false,
  },
  '/api/webhooks': {
    allowedOrigins: '*',
    allowedMethods: ['POST'],
    credentials: false,
  },
  '/api/v1': {
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(',') || [],
    credentials: true,
  },
}

function getCORSConfig(pathname: string): CORSOptions {
  // Find matching config
  for (const [prefix, config] of Object.entries(corsConfigs)) {
    if (pathname.startsWith(prefix)) {
      return config
    }
  }

  // Default config
  return {
    allowedOrigins: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    credentials: true,
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only apply CORS to API routes
  if (!pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  const corsConfig = getCORSConfig(pathname)

  // Handle preflight
  if (request.method === 'OPTIONS') {
    const preflight = handlePreflight(request, corsConfig)
    if (preflight) return preflight
  }

  // Continue with request
  const response = NextResponse.next()

  // Apply CORS headers
  return applyCORS(request, response, corsConfig)
}

export const config = {
  matcher: '/api/:path*',
}
```

## API Route Handler

```typescript
// app/api/v1/data/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withCORS } from '@/lib/cors'

async function handler(request: NextRequest) {
  const data = { message: 'Hello from API' }
  return NextResponse.json(data)
}

// Apply CORS with custom options
export const GET = withCORS(handler, {
  allowedOrigins: ['https://app.example.com'],
  credentials: true,
})

export const OPTIONS = withCORS(
  async () => new NextResponse(null, { status: 204 }),
  { allowedOrigins: ['https://app.example.com'] }
)
```

## Dynamic Origin Validation

```typescript
// lib/cors/dynamic.ts
import { prisma } from '@/lib/prisma'

// Cache for allowed origins
let originsCache: Set<string> | null = null
let cacheExpiry = 0
const CACHE_TTL = 60 * 1000 // 1 minute

// Fetch allowed origins from database
async function fetchAllowedOrigins(): Promise<Set<string>> {
  const now = Date.now()

  if (originsCache && now < cacheExpiry) {
    return originsCache
  }

  // Fetch from database
  const apps = await prisma.allowedApp.findMany({
    where: { enabled: true },
    select: { origin: true },
  })

  originsCache = new Set(apps.map((app) => app.origin))
  cacheExpiry = now + CACHE_TTL

  return originsCache
}

// Dynamic origin checker
export async function isDynamicOriginAllowed(origin: string): Promise<boolean> {
  // Always allow same origin
  if (origin === process.env.NEXT_PUBLIC_APP_URL) {
    return true
  }

  // Check database
  const allowedOrigins = await fetchAllowedOrigins()
  return allowedOrigins.has(origin)
}

// Clear cache when origins change
export function clearOriginsCache(): void {
  originsCache = null
  cacheExpiry = 0
}
```

## Route Handler with Dynamic CORS

```typescript
// app/api/partner/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { isDynamicOriginAllowed } from '@/lib/cors/dynamic'
import { buildCORSHeaders } from '@/lib/cors'

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')

  // Validate origin dynamically
  if (origin && !(await isDynamicOriginAllowed(origin))) {
    return NextResponse.json(
      { error: 'Origin not allowed' },
      { status: 403 }
    )
  }

  // Your business logic
  const data = { partners: [] }

  const response = NextResponse.json(data)

  // Apply CORS headers
  const corsHeaders = buildCORSHeaders(origin, {
    allowedOrigins: origin || '',
    credentials: false,
  })

  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value)
  }

  return response
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')

  if (origin && !(await isDynamicOriginAllowed(origin))) {
    return new NextResponse(null, { status: 403 })
  }

  const corsHeaders = buildCORSHeaders(origin, {
    allowedOrigins: origin || '',
    credentials: false,
  })

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}
```

## Next.js Config CORS

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      // Public API routes
      {
        source: '/api/public/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, X-API-Key' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
      // Protected API routes
      {
        source: '/api/v1/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.CORS_ALLOWED_ORIGINS || 'https://app.example.com',
          },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-CSRF-Token',
          },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

## CORS Error Handler

```typescript
// lib/cors/errors.ts
import { NextResponse } from 'next/server'

export type CORSErrorCode =
  | 'ORIGIN_NOT_ALLOWED'
  | 'METHOD_NOT_ALLOWED'
  | 'CREDENTIALS_NOT_SUPPORTED'
  | 'HEADERS_NOT_ALLOWED'

interface CORSError {
  code: CORSErrorCode
  message: string
  details?: Record<string, string>
}

export function createCORSError(
  code: CORSErrorCode,
  details?: Record<string, string>
): NextResponse {
  const errors: Record<CORSErrorCode, string> = {
    ORIGIN_NOT_ALLOWED: 'The origin is not allowed to access this resource',
    METHOD_NOT_ALLOWED: 'The HTTP method is not allowed for this resource',
    CREDENTIALS_NOT_SUPPORTED: 'Credentials are not supported for this request',
    HEADERS_NOT_ALLOWED: 'One or more request headers are not allowed',
  }

  const error: CORSError = {
    code,
    message: errors[code],
    details,
  }

  return NextResponse.json(
    { error },
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'X-CORS-Error': code,
      },
    }
  )
}
```

## Testing

```typescript
// __tests__/cors.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import {
  isOriginAllowed,
  buildCORSHeaders,
  handlePreflight
} from '@/lib/cors'

describe('CORS', () => {
  describe('isOriginAllowed', () => {
    it('should allow wildcard', () => {
      expect(isOriginAllowed('https://example.com', '*')).toBe(true)
    })

    it('should match exact string', () => {
      expect(isOriginAllowed('https://example.com', 'https://example.com')).toBe(true)
      expect(isOriginAllowed('https://other.com', 'https://example.com')).toBe(false)
    })

    it('should match array of strings', () => {
      const allowed = ['https://a.com', 'https://b.com']
      expect(isOriginAllowed('https://a.com', allowed)).toBe(true)
      expect(isOriginAllowed('https://c.com', allowed)).toBe(false)
    })

    it('should match regex', () => {
      const pattern = /^https:\/\/.*\.example\.com$/
      expect(isOriginAllowed('https://app.example.com', pattern)).toBe(true)
      expect(isOriginAllowed('https://other.com', pattern)).toBe(false)
    })

    it('should use function matcher', () => {
      const matcher = (origin: string) => origin.includes('trusted')
      expect(isOriginAllowed('https://trusted.com', matcher)).toBe(true)
      expect(isOriginAllowed('https://untrusted.com', matcher)).toBe(false)
    })

    it('should handle null origin', () => {
      expect(isOriginAllowed(null, '*', false)).toBe(false)
      expect(isOriginAllowed(null, '*', true)).toBe(true)
    })
  })

  describe('buildCORSHeaders', () => {
    it('should build headers for allowed origin', () => {
      const headers = buildCORSHeaders('https://app.com', {
        allowedOrigins: 'https://app.com',
        allowedMethods: ['GET', 'POST'],
        credentials: true,
      })

      expect(headers['Access-Control-Allow-Origin']).toBe('https://app.com')
      expect(headers['Access-Control-Allow-Methods']).toBe('GET, POST')
      expect(headers['Access-Control-Allow-Credentials']).toBe('true')
    })

    it('should return empty headers for disallowed origin', () => {
      const headers = buildCORSHeaders('https://evil.com', {
        allowedOrigins: 'https://app.com',
      })

      expect(headers['Access-Control-Allow-Origin']).toBeUndefined()
    })

    it('should not use wildcard with credentials', () => {
      const headers = buildCORSHeaders('https://app.com', {
        allowedOrigins: '*',
        credentials: true,
      })

      // With credentials, should use specific origin, not wildcard
      expect(headers['Access-Control-Allow-Origin']).toBe('https://app.com')
    })
  })

  describe('handlePreflight', () => {
    it('should return null for non-OPTIONS requests', () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'GET',
      }) as any

      const result = handlePreflight(request)
      expect(result).toBeNull()
    })

    it('should return 204 for allowed preflight', () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'OPTIONS',
        headers: { origin: 'http://localhost:3000' },
      }) as any

      const result = handlePreflight(request, {
        allowedOrigins: 'http://localhost:3000',
      })

      expect(result?.status).toBe(204)
    })

    it('should return 403 for disallowed preflight', () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'OPTIONS',
        headers: { origin: 'https://evil.com' },
      }) as any

      const result = handlePreflight(request, {
        allowedOrigins: 'http://localhost:3000',
      })

      expect(result?.status).toBe(403)
    })
  })
})
```

## CLAUDE.md Integration

```markdown
## CORS Configuration

This project uses custom CORS handling for API routes.

### Key Files
- `lib/cors/index.ts` - Core CORS utilities
- `lib/cors/presets.ts` - Configuration presets
- `lib/cors/dynamic.ts` - Database-driven origins
- `middleware.ts` - CORS middleware

### Route Configurations
- `/api/public/*` - Open to all origins
- `/api/v1/*` - Restricted to allowed origins
- `/api/webhooks/*` - POST only, no credentials

### Environment Variables
```env
CORS_ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
```

### Testing CORS
```bash
# Test preflight
curl -X OPTIONS -H "Origin: https://test.com" http://localhost:3000/api/v1/data -v

# Test actual request
curl -H "Origin: https://app.example.com" http://localhost:3000/api/v1/data
```
```

## AI Suggestions

1. **Subdomain wildcards** - Support patterns like `*.example.com` for multi-tenant apps
2. **CORS metrics** - Track blocked origins to identify misconfigurations or attacks
3. **Origin allowlist API** - Admin API to manage allowed origins dynamically
4. **Preflight caching headers** - Optimize with appropriate Access-Control-Max-Age
5. **Vary header** - Always include `Vary: Origin` for proper caching
6. **Private network access** - Support new Private Network Access headers
7. **Error pages** - Custom error pages for CORS failures with debugging info
8. **Request signing** - Additional security layer for sensitive cross-origin requests
