# CSRF Protection

Comprehensive Cross-Site Request Forgery protection for Next.js applications using multiple defense strategies.

## Overview

CSRF protection strategies:
- Synchronizer Token Pattern
- Double Submit Cookie
- SameSite Cookie Attribute
- Origin/Referer Validation
- Custom Header Verification

## Installation

```bash
npm install nanoid iron-session
```

## Environment Variables

```env
# .env.local
CSRF_SECRET=your-32-character-secret-key-here
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## CSRF Token Generation

```typescript
// lib/csrf/token.ts
import { nanoid } from 'nanoid'
import crypto from 'crypto'
import { cookies } from 'next/headers'

const CSRF_SECRET = process.env.CSRF_SECRET!
const CSRF_COOKIE_NAME = '__csrf_token'
const CSRF_TOKEN_LENGTH = 32
const TOKEN_EXPIRY = 60 * 60 * 1000 // 1 hour

interface CSRFToken {
  value: string
  expires: number
}

// Generate HMAC signature for token
function signToken(token: string): string {
  return crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(token)
    .digest('hex')
}

// Verify token signature
function verifySignature(token: string, signature: string): boolean {
  const expectedSignature = signToken(token)
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  )
}

// Generate a new CSRF token
export function generateCSRFToken(): string {
  const token = nanoid(CSRF_TOKEN_LENGTH)
  const expires = Date.now() + TOKEN_EXPIRY
  const data = `${token}.${expires}`
  const signature = signToken(data)
  return `${data}.${signature}`
}

// Parse and validate a CSRF token
export function parseCSRFToken(fullToken: string): CSRFToken | null {
  try {
    const [token, expiresStr, signature] = fullToken.split('.')

    if (!token || !expiresStr || !signature) {
      return null
    }

    const expires = parseInt(expiresStr, 10)
    const data = `${token}.${expiresStr}`

    // Verify signature
    if (!verifySignature(data, signature)) {
      return null
    }

    // Check expiration
    if (Date.now() > expires) {
      return null
    }

    return { value: token, expires }
  } catch {
    return null
  }
}

// Server-side: Get or create CSRF token
export async function getCSRFToken(): Promise<string> {
  const cookieStore = cookies()
  const existingToken = cookieStore.get(CSRF_COOKIE_NAME)?.value

  if (existingToken) {
    const parsed = parseCSRFToken(existingToken)
    if (parsed) {
      return existingToken
    }
  }

  // Generate new token
  const newToken = generateCSRFToken()

  return newToken
}

// Set CSRF cookie
export function setCSRFCookie(token: string): void {
  const cookieStore = cookies()

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: TOKEN_EXPIRY / 1000,
  })
}
```

## CSRF Middleware

```typescript
// middleware/csrf.ts
import { NextRequest, NextResponse } from 'next/server'
import { parseCSRFToken, generateCSRFToken } from '@/lib/csrf/token'

const CSRF_COOKIE_NAME = '__csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const CSRF_FORM_FIELD = '_csrf'

// Methods that require CSRF protection
const PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

// Paths exempt from CSRF (webhooks, public APIs)
const EXEMPT_PATHS = [
  '/api/webhooks/',
  '/api/public/',
]

interface CSRFValidationResult {
  valid: boolean
  error?: string
}

export function validateCSRF(request: NextRequest): CSRFValidationResult {
  // Skip non-protected methods
  if (!PROTECTED_METHODS.includes(request.method)) {
    return { valid: true }
  }

  // Skip exempt paths
  if (EXEMPT_PATHS.some(path => request.nextUrl.pathname.startsWith(path))) {
    return { valid: true }
  }

  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
  if (!cookieToken) {
    return { valid: false, error: 'Missing CSRF cookie' }
  }

  // Validate cookie token
  const parsedCookie = parseCSRFToken(cookieToken)
  if (!parsedCookie) {
    return { valid: false, error: 'Invalid or expired CSRF cookie' }
  }

  // Get token from request (header or body)
  const headerToken = request.headers.get(CSRF_HEADER_NAME)

  // For form submissions, check the body
  // Note: We can't read body in middleware, so rely on header for API calls
  if (!headerToken) {
    return { valid: false, error: 'Missing CSRF token in request' }
  }

  // Parse and validate request token
  const parsedHeader = parseCSRFToken(headerToken)
  if (!parsedHeader) {
    return { valid: false, error: 'Invalid CSRF token in request' }
  }

  // Compare tokens
  if (parsedCookie.value !== parsedHeader.value) {
    return { valid: false, error: 'CSRF token mismatch' }
  }

  return { valid: true }
}

// Origin validation
export function validateOrigin(request: NextRequest): CSRFValidationResult {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')

  // Skip GET requests
  if (request.method === 'GET') {
    return { valid: true }
  }

  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    `https://${host}`,
    `http://${host}`,
  ].filter(Boolean)

  // Check origin header
  if (origin) {
    if (allowedOrigins.some(allowed => origin === allowed)) {
      return { valid: true }
    }
    return { valid: false, error: 'Invalid origin' }
  }

  // Fall back to referer
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      const refererOrigin = refererUrl.origin
      if (allowedOrigins.some(allowed => refererOrigin === allowed)) {
        return { valid: true }
      }
    } catch {
      return { valid: false, error: 'Invalid referer' }
    }
  }

  // No origin or referer - allow only for same-site requests
  return { valid: false, error: 'Missing origin header' }
}

// Combined CSRF middleware
export function csrfMiddleware(
  request: NextRequest
): NextResponse | CSRFValidationResult {
  // Validate origin
  const originResult = validateOrigin(request)
  if (!originResult.valid) {
    return NextResponse.json(
      { error: originResult.error },
      { status: 403, headers: { 'X-CSRF-Error': originResult.error || '' } }
    )
  }

  // Validate CSRF token
  const csrfResult = validateCSRF(request)
  if (!csrfResult.valid) {
    return NextResponse.json(
      { error: csrfResult.error },
      { status: 403, headers: { 'X-CSRF-Error': csrfResult.error || '' } }
    )
  }

  return { valid: true }
}
```

## Main Middleware Integration

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { csrfMiddleware } from '@/middleware/csrf'
import { generateCSRFToken } from '@/lib/csrf/token'

const CSRF_COOKIE_NAME = '__csrf_token'

export async function middleware(request: NextRequest) {
  // Handle CSRF for mutating requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const csrfResult = csrfMiddleware(request)

    if (csrfResult instanceof NextResponse) {
      return csrfResult
    }
  }

  const response = NextResponse.next()

  // Set CSRF cookie if not present
  if (!request.cookies.has(CSRF_COOKIE_NAME)) {
    const token = generateCSRFToken()
    response.cookies.set(CSRF_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    })
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
}
```

## React Hook

```typescript
// hooks/use-csrf.ts
'use client'

import { useState, useEffect, useCallback } from 'react'

const CSRF_COOKIE_NAME = '__csrf_token'

export function useCSRF() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Extract token from cookie
  const getTokenFromCookie = useCallback(() => {
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === CSRF_COOKIE_NAME) {
        return decodeURIComponent(value)
      }
    }
    return null
  }, [])

  // Refresh token from server
  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch('/api/csrf/token', {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setToken(data.token)
        return data.token
      }
    } catch (error) {
      console.error('Failed to refresh CSRF token:', error)
    }
    return null
  }, [])

  useEffect(() => {
    const cookieToken = getTokenFromCookie()
    if (cookieToken) {
      setToken(cookieToken)
      setLoading(false)
    } else {
      refreshToken().finally(() => setLoading(false))
    }
  }, [getTokenFromCookie, refreshToken])

  // Fetch wrapper with CSRF token
  const csrfFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const currentToken = token || await refreshToken()

      if (!currentToken) {
        throw new Error('No CSRF token available')
      }

      const headers = new Headers(options.headers)
      headers.set('x-csrf-token', currentToken)

      return fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      })
    },
    [token, refreshToken]
  )

  return {
    token,
    loading,
    refreshToken,
    csrfFetch,
  }
}
```

## CSRF Token API Endpoint

```typescript
// app/api/csrf/token/route.ts
import { NextResponse } from 'next/server'
import { generateCSRFToken, setCSRFCookie } from '@/lib/csrf/token'

export async function GET() {
  const token = generateCSRFToken()

  const response = NextResponse.json({ token })

  response.cookies.set('__csrf_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  })

  return response
}
```

## React Components

```typescript
// components/csrf/csrf-form.tsx
'use client'

import { useCSRF } from '@/hooks/use-csrf'
import { FormHTMLAttributes, ReactNode } from 'react'

interface CSRFFormProps extends FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode
}

export function CSRFForm({ children, onSubmit, ...props }: CSRFFormProps) {
  const { token, loading } = useCSRF()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (onSubmit) {
      onSubmit(e)
    }
  }

  if (loading) {
    return null
  }

  return (
    <form {...props} onSubmit={handleSubmit}>
      <input type="hidden" name="_csrf" value={token || ''} />
      {children}
    </form>
  )
}
```

```typescript
// components/csrf/csrf-provider.tsx
'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useCSRF } from '@/hooks/use-csrf'

interface CSRFContextType {
  token: string | null
  loading: boolean
  refreshToken: () => Promise<string | null>
  csrfFetch: (url: string, options?: RequestInit) => Promise<Response>
}

const CSRFContext = createContext<CSRFContextType | null>(null)

export function CSRFProvider({ children }: { children: ReactNode }) {
  const csrf = useCSRF()

  return (
    <CSRFContext.Provider value={csrf}>
      {children}
    </CSRFContext.Provider>
  )
}

export function useCSRFContext() {
  const context = useContext(CSRFContext)
  if (!context) {
    throw new Error('useCSRFContext must be used within CSRFProvider')
  }
  return context
}
```

## Form Submission Example

```typescript
// components/example-form.tsx
'use client'

import { useState } from 'react'
import { useCSRF } from '@/hooks/use-csrf'

export function ExampleForm() {
  const { csrfFetch, loading: csrfLoading } = useCSRF()
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      const response = await csrfFetch('/api/example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (response.ok) {
        setMessage('Success!')
        setName('')
      } else {
        const data = await response.json()
        setMessage(data.error || 'Failed to submit')
      }
    } catch (error) {
      setMessage('An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  if (csrfLoading) {
    return <div>Loading...</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded border px-3 py-2"
          required
        />
      </div>

      {message && (
        <p className={`text-sm ${message === 'Success!' ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  )
}
```

## Server Action with CSRF

```typescript
// app/actions/example.ts
'use server'

import { cookies, headers } from 'next/headers'
import { parseCSRFToken } from '@/lib/csrf/token'

const CSRF_COOKIE_NAME = '__csrf_token'

export async function submitForm(formData: FormData) {
  // Get CSRF token from form
  const csrfToken = formData.get('_csrf') as string

  // Get CSRF token from cookie
  const cookieStore = cookies()
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value

  if (!csrfToken || !cookieToken) {
    return { error: 'Missing CSRF token' }
  }

  // Validate both tokens
  const parsedForm = parseCSRFToken(csrfToken)
  const parsedCookie = parseCSRFToken(cookieToken)

  if (!parsedForm || !parsedCookie) {
    return { error: 'Invalid CSRF token' }
  }

  if (parsedForm.value !== parsedCookie.value) {
    return { error: 'CSRF token mismatch' }
  }

  // Proceed with form processing
  const name = formData.get('name') as string

  // Your business logic here...

  return { success: true, data: { name } }
}
```

## Double Submit Cookie Pattern

```typescript
// lib/csrf/double-submit.ts
import { nanoid } from 'nanoid'
import { NextRequest, NextResponse } from 'next/server'

const CSRF_COOKIE = '__csrf_ds'
const CSRF_HEADER = 'x-csrf-token'

// Generate a simple token (no signature needed for double-submit)
export function generateDoubleSubmitToken(): string {
  return nanoid(32)
}

// Middleware for double-submit pattern
export function doubleSubmitMiddleware(request: NextRequest): NextResponse | null {
  // Skip safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return null
  }

  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value
  const headerToken = request.headers.get(CSRF_HEADER)

  // Both must be present and match
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return NextResponse.json(
      { error: 'CSRF validation failed' },
      { status: 403 }
    )
  }

  return null
}

// Set double-submit cookie
export function setDoubleSubmitCookie(response: NextResponse): NextResponse {
  const token = generateDoubleSubmitToken()

  response.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false, // Must be readable by JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  })

  return response
}
```

## Testing

```typescript
// __tests__/csrf.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { generateCSRFToken, parseCSRFToken } from '@/lib/csrf/token'
import { validateCSRF, validateOrigin } from '@/middleware/csrf'

describe('CSRF Protection', () => {
  describe('Token Generation', () => {
    it('should generate valid token', () => {
      const token = generateCSRFToken()

      expect(token).toBeTruthy()
      expect(token.split('.').length).toBe(3) // token.expires.signature
    })

    it('should parse valid token', () => {
      const token = generateCSRFToken()
      const parsed = parseCSRFToken(token)

      expect(parsed).toBeTruthy()
      expect(parsed?.value).toBeTruthy()
      expect(parsed?.expires).toBeGreaterThan(Date.now())
    })

    it('should reject tampered token', () => {
      const token = generateCSRFToken()
      const tampered = token.replace(/.$/, 'x') // Change last character

      const parsed = parseCSRFToken(tampered)
      expect(parsed).toBeNull()
    })

    it('should reject expired token', () => {
      // Create a token with past expiry
      const expiredToken = 'abc.0.signature'

      const parsed = parseCSRFToken(expiredToken)
      expect(parsed).toBeNull()
    })
  })

  describe('Origin Validation', () => {
    it('should accept valid origin', () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          host: 'localhost:3000',
        },
      }) as any

      const result = validateOrigin(request)
      expect(result.valid).toBe(true)
    })

    it('should reject invalid origin', () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          origin: 'http://evil.com',
          host: 'localhost:3000',
        },
      }) as any

      const result = validateOrigin(request)
      expect(result.valid).toBe(false)
    })

    it('should skip GET requests', () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'GET',
      }) as any

      const result = validateOrigin(request)
      expect(result.valid).toBe(true)
    })
  })

  describe('CSRF Validation', () => {
    it('should skip GET requests', () => {
      const request = {
        method: 'GET',
        nextUrl: { pathname: '/api/test' },
        cookies: { get: vi.fn() },
        headers: { get: vi.fn() },
      } as any

      const result = validateCSRF(request)
      expect(result.valid).toBe(true)
    })

    it('should skip exempt paths', () => {
      const request = {
        method: 'POST',
        nextUrl: { pathname: '/api/webhooks/stripe' },
        cookies: { get: vi.fn() },
        headers: { get: vi.fn() },
      } as any

      const result = validateCSRF(request)
      expect(result.valid).toBe(true)
    })

    it('should reject missing cookie token', () => {
      const request = {
        method: 'POST',
        nextUrl: { pathname: '/api/test' },
        cookies: { get: vi.fn().mockReturnValue(undefined) },
        headers: { get: vi.fn() },
      } as any

      const result = validateCSRF(request)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('cookie')
    })
  })
})
```

## CLAUDE.md Integration

```markdown
## CSRF Protection

This project implements CSRF protection using the Synchronizer Token Pattern.

### Key Files
- `lib/csrf/token.ts` - Token generation and validation
- `middleware/csrf.ts` - CSRF middleware
- `hooks/use-csrf.ts` - React hook for CSRF tokens
- `components/csrf/` - CSRF-enabled form components

### Usage
```tsx
// Use the hook for API calls
const { csrfFetch } = useCSRF()
await csrfFetch('/api/action', { method: 'POST', body: data })

// Use CSRFForm for form submissions
<CSRFForm action="/api/submit">
  <input name="field" />
  <button type="submit">Submit</button>
</CSRFForm>
```

### Exempt Paths
These paths skip CSRF validation:
- `/api/webhooks/*` - External webhooks
- `/api/public/*` - Public APIs

### Token Format
`{random_token}.{expiry_timestamp}.{hmac_signature}`
```

## AI Suggestions

1. **Per-request tokens** - Generate unique tokens for each form to prevent replay attacks
2. **Token binding** - Bind tokens to user sessions for additional security
3. **Encrypted tokens** - Encrypt tokens to hide the expiration time
4. **Multi-tab support** - Handle multiple browser tabs with token synchronization
5. **Token rotation** - Rotate tokens after successful validation
6. **Audit logging** - Log CSRF failures for security monitoring
7. **Rate limiting** - Rate limit token refresh endpoints to prevent abuse
8. **Mobile app support** - Implement alternative CSRF protection for mobile apps (custom headers)
