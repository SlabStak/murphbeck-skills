# JWT Patterns & Best Practices Template

Complete JWT authentication patterns for API-first applications.

## Overview

JSON Web Tokens (JWT) provide:
- Stateless authentication
- Cross-service authentication
- API authorization
- Secure token refresh
- Custom claims for RBAC

## Installation

```bash
# Node.js / TypeScript
bun add jose  # Recommended - Edge runtime compatible
# OR
bun add jsonwebtoken
bun add -D @types/jsonwebtoken
```

## Environment Variables

```env
# .env.local

# JWT Configuration
JWT_SECRET=your-256-bit-secret-key-min-32-chars
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# For RS256 (asymmetric)
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"

# Optional
JWT_ISSUER=https://your-app.com
JWT_AUDIENCE=https://api.your-app.com
```

## Token Types & Strategy

### Access Token
- Short-lived (15 minutes)
- Sent in Authorization header
- Contains user claims
- Stateless validation

### Refresh Token
- Long-lived (7 days)
- Stored in httpOnly cookie OR database
- Used to get new access tokens
- Can be revoked

## Implementation with Jose (Recommended)

### Token Generation

```typescript
// lib/jwt/tokens.ts
import { SignJWT, jwtVerify, JWTPayload } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)
const JWT_ISSUER = process.env.JWT_ISSUER ?? 'your-app'
const JWT_AUDIENCE = process.env.JWT_AUDIENCE ?? 'your-api'

export type TokenPayload = {
  userId: string
  email: string
  role: string
  plan: string
}

export type AccessTokenPayload = JWTPayload & TokenPayload

export async function generateAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime('15m')
    .setSubject(payload.userId)
    .sign(JWT_SECRET)
}

export async function generateRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime('7d')
    .setSubject(userId)
    .setJti(crypto.randomUUID()) // Unique token ID for revocation
    .sign(JWT_SECRET)
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  })

  return payload as AccessTokenPayload
}

export async function verifyRefreshToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  })

  return payload
}
```

### RS256 (Asymmetric) Tokens

```typescript
// lib/jwt/asymmetric.ts
import { SignJWT, jwtVerify, importPKCS8, importSPKI } from 'jose'

const alg = 'RS256'

async function getPrivateKey() {
  const pkcs8 = process.env.JWT_PRIVATE_KEY!
  return importPKCS8(pkcs8, alg)
}

async function getPublicKey() {
  const spki = process.env.JWT_PUBLIC_KEY!
  return importSPKI(spki, alg)
}

export async function generateToken(payload: Record<string, unknown>): Promise<string> {
  const privateKey = await getPrivateKey()

  return new SignJWT(payload)
    .setProtectedHeader({ alg, typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(privateKey)
}

export async function verifyToken(token: string) {
  const publicKey = await getPublicKey()
  return jwtVerify(token, publicKey)
}

// Generate RSA key pair (run once)
// openssl genrsa -out private.pem 2048
// openssl rsa -in private.pem -pubout -out public.pem
```

## Token Refresh Flow

### Database Schema (for refresh token tracking)

```prisma
// prisma/schema.prisma

model RefreshToken {
  id        String   @id @default(cuid())
  tokenHash String   @unique
  userId    String
  deviceId  String?
  userAgent String?
  ip        String?
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([tokenHash])
}
```

### Refresh Token Storage

```typescript
// lib/jwt/refresh-tokens.ts
import { db } from '@/lib/db'
import { generateRefreshToken, verifyRefreshToken } from './tokens'
import { sha256 } from 'oslo/crypto'
import { encodeHex } from 'oslo/encoding'

export async function createRefreshToken(
  userId: string,
  metadata?: {
    deviceId?: string
    userAgent?: string
    ip?: string
  }
) {
  const token = await generateRefreshToken(userId)
  const tokenHash = encodeHex(await sha256(new TextEncoder().encode(token)))

  // Store hash in database (never store raw token)
  await db.refreshToken.create({
    data: {
      tokenHash,
      userId,
      deviceId: metadata?.deviceId,
      userAgent: metadata?.userAgent,
      ip: metadata?.ip,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  })

  return token
}

export async function validateRefreshToken(token: string) {
  try {
    // Verify JWT signature and expiry
    const payload = await verifyRefreshToken(token)

    // Check if token exists in database and not revoked
    const tokenHash = encodeHex(await sha256(new TextEncoder().encode(token)))

    const storedToken = await db.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    })

    if (!storedToken) {
      return { valid: false, error: 'Token not found' }
    }

    if (storedToken.revokedAt) {
      // Token was revoked - potential token theft
      // Revoke all user's tokens as security measure
      await db.refreshToken.updateMany({
        where: { userId: storedToken.userId },
        data: { revokedAt: new Date() },
      })
      return { valid: false, error: 'Token revoked' }
    }

    if (storedToken.expiresAt < new Date()) {
      return { valid: false, error: 'Token expired' }
    }

    return { valid: true, user: storedToken.user, tokenId: storedToken.id }
  } catch (error) {
    return { valid: false, error: 'Invalid token' }
  }
}

export async function rotateRefreshToken(oldToken: string, metadata?: {
  deviceId?: string
  userAgent?: string
  ip?: string
}) {
  const validation = await validateRefreshToken(oldToken)

  if (!validation.valid || !validation.user) {
    throw new Error(validation.error ?? 'Invalid token')
  }

  // Revoke old token
  const oldTokenHash = encodeHex(await sha256(new TextEncoder().encode(oldToken)))
  await db.refreshToken.update({
    where: { tokenHash: oldTokenHash },
    data: { revokedAt: new Date() },
  })

  // Create new token
  const newToken = await createRefreshToken(validation.user.id, metadata)

  return { newToken, user: validation.user }
}

export async function revokeRefreshToken(token: string) {
  const tokenHash = encodeHex(await sha256(new TextEncoder().encode(token)))

  await db.refreshToken.update({
    where: { tokenHash },
    data: { revokedAt: new Date() },
  })
}

export async function revokeAllUserTokens(userId: string) {
  await db.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}
```

## API Routes

### Login Route

```typescript
// app/api/auth/login/route.ts
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/auth/password'
import { generateAccessToken } from '@/lib/jwt/tokens'
import { createRefreshToken } from '@/lib/jwt/refresh-tokens'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // Find user
    const user = await db.user.findUnique({
      where: { email },
    })

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const valid = await verifyPassword(user.passwordHash, password)

    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate tokens
    const accessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    })

    const refreshToken = await createRefreshToken(user.id, {
      userAgent: request.headers.get('user-agent') ?? undefined,
      ip: request.headers.get('x-forwarded-for') ?? undefined,
    })

    // Create response with refresh token in httpOnly cookie
    const response = NextResponse.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
      },
    })

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/api/auth',
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
```

### Refresh Token Route

```typescript
// app/api/auth/refresh/route.ts
import { generateAccessToken } from '@/lib/jwt/tokens'
import { rotateRefreshToken } from '@/lib/jwt/refresh-tokens'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refreshToken')?.value

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token' },
        { status: 401 }
      )
    }

    // Rotate refresh token (invalidates old, creates new)
    const { newToken, user } = await rotateRefreshToken(refreshToken, {
      userAgent: request.headers.get('user-agent') ?? undefined,
      ip: request.headers.get('x-forwarded-for') ?? undefined,
    })

    // Generate new access token
    const accessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    })

    const response = NextResponse.json({ accessToken })

    // Set new refresh token
    response.cookies.set('refreshToken', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/api/auth',
    })

    return response
  } catch (error: any) {
    // Clear invalid refresh token
    const response = NextResponse.json(
      { error: error.message ?? 'Token refresh failed' },
      { status: 401 }
    )

    response.cookies.delete('refreshToken')

    return response
  }
}
```

### Logout Route

```typescript
// app/api/auth/logout/route.ts
import { revokeRefreshToken } from '@/lib/jwt/refresh-tokens'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refreshToken')?.value

    if (refreshToken) {
      await revokeRefreshToken(refreshToken)
    }

    const response = NextResponse.json({ success: true })
    response.cookies.delete('refreshToken')

    return response
  } catch (error) {
    return NextResponse.json({ success: true })
  }
}
```

### Protected API Route

```typescript
// lib/jwt/middleware.ts
import { verifyAccessToken, AccessTokenPayload } from './tokens'
import { NextResponse } from 'next/server'

export async function withAuth(
  request: Request,
  handler: (
    request: Request,
    payload: AccessTokenPayload
  ) => Promise<Response>
): Promise<Response> {
  const authHeader = request.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing authorization header' },
      { status: 401 }
    )
  }

  const token = authHeader.substring(7)

  try {
    const payload = await verifyAccessToken(token)
    return handler(request, payload)
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    )
  }
}

// Usage
// app/api/protected/route.ts
import { withAuth } from '@/lib/jwt/middleware'

export async function GET(request: Request) {
  return withAuth(request, async (req, payload) => {
    // Access payload.userId, payload.role, etc.
    return NextResponse.json({
      message: 'Protected data',
      userId: payload.userId,
    })
  })
}
```

### Role-Based Access

```typescript
// lib/jwt/rbac.ts
import { verifyAccessToken, AccessTokenPayload } from './tokens'
import { NextResponse } from 'next/server'

export function withRole(allowedRoles: string[]) {
  return async function (
    request: Request,
    handler: (request: Request, payload: AccessTokenPayload) => Promise<Response>
  ): Promise<Response> {
    const authHeader = request.headers.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    try {
      const payload = await verifyAccessToken(token)

      if (!allowedRoles.includes(payload.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      return handler(request, payload)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }
  }
}

// Usage
export async function DELETE(request: Request) {
  return withRole(['admin'])(request, async (req, payload) => {
    // Only admins reach here
    return NextResponse.json({ success: true })
  })
}
```

## Client-Side Token Management

### Token Storage & Refresh

```typescript
// lib/api/client.ts

let accessToken: string | null = null
let refreshPromise: Promise<string | null> | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include', // Include cookies
    })

    if (!response.ok) {
      throw new Error('Refresh failed')
    }

    const data = await response.json()
    accessToken = data.accessToken
    return accessToken
  } catch (error) {
    accessToken = null
    return null
  }
}

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // If no token, try to refresh
  if (!accessToken) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken()
    }
    accessToken = await refreshPromise
    refreshPromise = null

    if (!accessToken) {
      throw new Error('Not authenticated')
    }
  }

  // Make request with token
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  })

  // If unauthorized, try to refresh and retry
  if (response.status === 401) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken()
    }
    accessToken = await refreshPromise
    refreshPromise = null

    if (!accessToken) {
      throw new Error('Session expired')
    }

    // Retry with new token
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    })
  }

  return response
}
```

### React Hook

```typescript
// hooks/use-auth.ts
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type User = {
  id: string
  email: string
  name: string
  role: string
  plan: string
}

type AuthState = {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  setAuth: (user: User, accessToken: string) => void
  clearAuth: () => void
  refreshToken: () => Promise<boolean>
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: true,

      setAuth: (user, accessToken) => {
        set({ user, accessToken, isLoading: false })
      },

      clearAuth: () => {
        set({ user: null, accessToken: null, isLoading: false })
      },

      refreshToken: async () => {
        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
          })

          if (!response.ok) {
            get().clearAuth()
            return false
          }

          const data = await response.json()
          set({ accessToken: data.accessToken })
          return true
        } catch (error) {
          get().clearAuth()
          return false
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
```

## Middleware (Edge Runtime)

```typescript
// middleware.ts
import { jwtVerify } from 'jose'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

const protectedRoutes = ['/dashboard', '/settings']
const apiProtectedRoutes = ['/api/protected']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check API routes
  const isProtectedApiRoute = apiProtectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  if (isProtectedApiRoute) {
    const authHeader = request.headers.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    try {
      await jwtVerify(authHeader.substring(7), JWT_SECRET)
      return NextResponse.next()
    } catch {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }
  }

  // Check page routes
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute) {
    // For page routes, check refresh token cookie
    const refreshToken = request.cookies.get('refreshToken')

    if (!refreshToken) {
      const url = request.nextUrl.clone()
      url.pathname = '/sign-in'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

## Security Best Practices

### 1. Token Storage

```typescript
// DO: Store access token in memory only
let accessToken: string | null = null

// DO: Store refresh token in httpOnly cookie
response.cookies.set('refreshToken', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
})

// DON'T: Store tokens in localStorage
localStorage.setItem('token', token) // XSS vulnerable!
```

### 2. Token Rotation

```typescript
// Always rotate refresh tokens
async function refresh(oldToken: string) {
  // 1. Verify old token
  // 2. Revoke old token
  // 3. Issue new token
  // This prevents token reuse attacks
}
```

### 3. Short Expiry for Access Tokens

```typescript
// Access token: 15 minutes max
.setExpirationTime('15m')

// Refresh token: 7 days max
.setExpirationTime('7d')
```

### 4. Include Critical Claims

```typescript
const payload = {
  sub: userId,        // Subject
  iss: 'your-app',    // Issuer
  aud: 'your-api',    // Audience
  iat: Date.now(),    // Issued at
  exp: Date.now() + 15 * 60 * 1000, // Expiry
  jti: crypto.randomUUID(), // Unique ID (for revocation)
}
```

### 5. Secure Headers

```typescript
// Always verify these
await jwtVerify(token, secret, {
  issuer: 'your-app',
  audience: 'your-api',
  algorithms: ['HS256'], // Or RS256
})
```

## CLAUDE.md Integration

```markdown
## Authentication

Using JWT-based authentication with refresh token rotation.

### Key Files
- `lib/jwt/tokens.ts` - Token generation/verification
- `lib/jwt/refresh-tokens.ts` - Refresh token management
- `lib/jwt/middleware.ts` - API protection helpers

### Auth Flow
1. Login: Returns access token + sets refresh token cookie
2. API calls: Send `Authorization: Bearer <access_token>`
3. Refresh: POST `/api/auth/refresh` to get new access token
4. Logout: POST `/api/auth/logout` to revoke refresh token

### Token Expiry
- Access token: 15 minutes
- Refresh token: 7 days (rotated on each use)

### API Routes
- POST `/api/auth/login` - Login
- POST `/api/auth/refresh` - Refresh access token
- POST `/api/auth/logout` - Logout
```

## AI Suggestions

### Security Enhancements
1. **Token binding** - Bind tokens to device fingerprint
2. **Rate limiting** - Limit refresh attempts
3. **Anomaly detection** - Flag unusual refresh patterns
4. **Token revocation list** - For immediate invalidation
5. **Sliding window** - Extend session on activity

### Performance
1. **Cache public keys** - For RS256 verification
2. **Async verification** - Non-blocking token checks
3. **Edge verification** - Verify in middleware

### Monitoring
1. **Track refresh events** - Detect token theft
2. **Alert on mass revocation** - Security incident
3. **Log token lifecycle** - Audit trail
