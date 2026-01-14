# Lucia Authentication Template

Complete Lucia auth integration for Next.js applications - lightweight, flexible authentication.

## Overview

Lucia provides:
- Session-based authentication
- Database-agnostic (works with any database)
- Framework-agnostic (adapters for Next.js, SvelteKit, etc.)
- Full TypeScript support
- OAuth helpers
- Password hashing utilities
- Complete control over auth flow

## Installation

```bash
# Core
bun add lucia

# Database adapter (choose one)
bun add @lucia-auth/adapter-prisma
bun add @lucia-auth/adapter-drizzle
bun add @lucia-auth/adapter-postgresql
bun add @lucia-auth/adapter-mysql
bun add @lucia-auth/adapter-sqlite
bun add @lucia-auth/adapter-mongodb

# OAuth (optional)
bun add arctic

# Password hashing
bun add @node-rs/argon2
# or
bun add bcrypt
```

## Database Schema

### Prisma Schema

```prisma
// prisma/schema.prisma

model User {
  id            String    @id
  email         String    @unique
  emailVerified DateTime?
  passwordHash  String?
  name          String?
  image         String?
  role          String    @default("user")
  plan          String    @default("free")

  sessions      Session[]
  oauthAccounts OAuthAccount[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Session {
  id        String   @id
  userId    String
  expiresAt DateTime

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model OAuthAccount {
  providerId     String
  providerUserId String
  userId         String

  user           User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([providerId, providerUserId])
  @@index([userId])
}

model EmailVerificationCode {
  id        String   @id @default(cuid())
  code      String
  userId    String   @unique
  email     String
  expiresAt DateTime

  @@index([userId])
}

model PasswordResetToken {
  id        String   @id @default(cuid())
  tokenHash String   @unique
  userId    String
  expiresAt DateTime

  @@index([userId])
}
```

### Drizzle Schema

```typescript
// db/schema.ts
import { pgTable, text, timestamp, primaryKey, index } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified'),
  passwordHash: text('password_hash'),
  name: text('name'),
  image: text('image'),
  role: text('role').default('user').notNull(),
  plan: text('plan').default('free').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', {
    withTimezone: true,
    mode: 'date',
  }).notNull(),
}, (table) => ({
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
}))

export const oauthAccounts = pgTable('oauth_accounts', {
  providerId: text('provider_id').notNull(),
  providerUserId: text('provider_user_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.providerId, table.providerUserId] }),
  userIdIdx: index('oauth_accounts_user_id_idx').on(table.userId),
}))
```

## Lucia Configuration

### With Prisma

```typescript
// lib/auth.ts
import { Lucia, TimeSpan } from 'lucia'
import { PrismaAdapter } from '@lucia-auth/adapter-prisma'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { cache } from 'react'

const adapter = new PrismaAdapter(db.session, db.user)

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    name: 'session',
    expires: false, // Session cookies expire when browser closes
    attributes: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  },
  sessionExpiresIn: new TimeSpan(30, 'd'), // 30 days
  getUserAttributes: (attributes) => ({
    email: attributes.email,
    emailVerified: attributes.emailVerified,
    name: attributes.name,
    image: attributes.image,
    role: attributes.role,
    plan: attributes.plan,
  }),
})

// TypeScript declarations
declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia
    DatabaseUserAttributes: {
      email: string
      emailVerified: Date | null
      name: string | null
      image: string | null
      role: string
      plan: string
    }
  }
}

// Validate session helper
export const validateRequest = cache(async () => {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null

  if (!sessionId) {
    return { user: null, session: null }
  }

  const result = await lucia.validateSession(sessionId)

  try {
    if (result.session && result.session.fresh) {
      const sessionCookie = lucia.createSessionCookie(result.session.id)
      cookieStore.set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      )
    }
    if (!result.session) {
      const sessionCookie = lucia.createBlankSessionCookie()
      cookieStore.set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      )
    }
  } catch {
    // Next.js throws when cookies are set in Server Components
  }

  return result
})
```

### With Drizzle

```typescript
// lib/auth.ts
import { Lucia } from 'lucia'
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle'
import { db } from '@/db'
import { sessions, users } from '@/db/schema'

const adapter = new DrizzlePostgreSQLAdapter(db, sessions, users)

export const lucia = new Lucia(adapter, {
  // Same configuration as above
})
```

## Password Authentication

### Password Utilities

```typescript
// lib/auth/password.ts
import { hash, verify } from '@node-rs/argon2'

export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  })
}

export async function verifyPassword(
  hash: string,
  password: string
): Promise<boolean> {
  return verify(hash, password)
}
```

### Sign Up Action

```typescript
// app/sign-up/actions.ts
'use server'

import { lucia } from '@/lib/auth'
import { hashPassword } from '@/lib/auth/password'
import { generateId } from 'lucia'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const signUpSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

export async function signUp(formData: FormData) {
  const result = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    name: formData.get('name'),
  })

  if (!result.success) {
    return { error: result.error.errors[0].message }
  }

  const { email, password, name } = result.data

  // Check if user exists
  const existingUser = await db.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    return { error: 'Email already registered' }
  }

  // Hash password
  const passwordHash = await hashPassword(password)

  // Create user
  const userId = generateId(15)

  await db.user.create({
    data: {
      id: userId,
      email,
      passwordHash,
      name,
    },
  })

  // Create session
  const session = await lucia.createSession(userId, {})
  const sessionCookie = lucia.createSessionCookie(session.id)

  const cookieStore = await cookies()
  cookieStore.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  )

  redirect('/dashboard')
}
```

### Sign In Action

```typescript
// app/sign-in/actions.ts
'use server'

import { lucia, validateRequest } from '@/lib/auth'
import { verifyPassword } from '@/lib/auth/password'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function signIn(formData: FormData) {
  const result = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!result.success) {
    return { error: 'Invalid credentials' }
  }

  const { email, password } = result.data

  // Find user
  const user = await db.user.findUnique({
    where: { email },
  })

  if (!user || !user.passwordHash) {
    return { error: 'Invalid credentials' }
  }

  // Verify password
  const validPassword = await verifyPassword(user.passwordHash, password)

  if (!validPassword) {
    return { error: 'Invalid credentials' }
  }

  // Create session
  const session = await lucia.createSession(user.id, {})
  const sessionCookie = lucia.createSessionCookie(session.id)

  const cookieStore = await cookies()
  cookieStore.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  )

  redirect('/dashboard')
}

export async function signOut() {
  const { session } = await validateRequest()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  await lucia.invalidateSession(session.id)

  const sessionCookie = lucia.createBlankSessionCookie()

  const cookieStore = await cookies()
  cookieStore.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  )

  redirect('/')
}
```

### Sign In Form

```typescript
// app/sign-in/page.tsx
import { signIn } from './actions'
import { validateRequest } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function SignInPage() {
  const { user } = await validateRequest()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form action={signIn} className="w-full max-w-md space-y-4 p-8">
        <h1 className="text-2xl font-bold">Sign In</h1>

        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-white"
        >
          Sign In
        </button>
      </form>
    </div>
  )
}
```

## OAuth Authentication

### OAuth Configuration with Arctic

```typescript
// lib/auth/oauth.ts
import { GitHub, Google, Discord } from 'arctic'

export const github = new GitHub(
  process.env.GITHUB_CLIENT_ID!,
  process.env.GITHUB_CLIENT_SECRET!
)

export const google = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`
)

export const discord = new Discord(
  process.env.DISCORD_CLIENT_ID!,
  process.env.DISCORD_CLIENT_SECRET!,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/discord`
)
```

### GitHub OAuth Route

```typescript
// app/api/auth/github/route.ts
import { github } from '@/lib/auth/oauth'
import { generateState } from 'arctic'
import { cookies } from 'next/headers'

export async function GET() {
  const state = generateState()
  const url = await github.createAuthorizationURL(state, {
    scopes: ['user:email'],
  })

  const cookieStore = await cookies()
  cookieStore.set('github_oauth_state', state, {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 10, // 10 minutes
    sameSite: 'lax',
  })

  return Response.redirect(url)
}
```

### GitHub Callback Route

```typescript
// app/api/auth/callback/github/route.ts
import { github } from '@/lib/auth/oauth'
import { lucia } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateId } from 'lucia'
import { cookies } from 'next/headers'
import { OAuth2RequestError } from 'arctic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  const cookieStore = await cookies()
  const storedState = cookieStore.get('github_oauth_state')?.value ?? null

  if (!code || !state || !storedState || state !== storedState) {
    return new Response(null, { status: 400 })
  }

  try {
    const tokens = await github.validateAuthorizationCode(code)

    // Get GitHub user
    const githubUserResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    })
    const githubUser = await githubUserResponse.json()

    // Get primary email
    const emailsResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    })
    const emails = await emailsResponse.json()
    const primaryEmail = emails.find((e: any) => e.primary)?.email

    // Check if OAuth account exists
    const existingAccount = await db.oAuthAccount.findUnique({
      where: {
        providerId_providerUserId: {
          providerId: 'github',
          providerUserId: String(githubUser.id),
        },
      },
      include: { user: true },
    })

    if (existingAccount) {
      // Create session for existing user
      const session = await lucia.createSession(existingAccount.userId, {})
      const sessionCookie = lucia.createSessionCookie(session.id)

      cookieStore.set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      )

      return new Response(null, {
        status: 302,
        headers: { Location: '/dashboard' },
      })
    }

    // Check if user with email exists
    const existingUser = await db.user.findUnique({
      where: { email: primaryEmail },
    })

    if (existingUser) {
      // Link OAuth account to existing user
      await db.oAuthAccount.create({
        data: {
          providerId: 'github',
          providerUserId: String(githubUser.id),
          userId: existingUser.id,
        },
      })

      const session = await lucia.createSession(existingUser.id, {})
      const sessionCookie = lucia.createSessionCookie(session.id)

      cookieStore.set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      )

      return new Response(null, {
        status: 302,
        headers: { Location: '/dashboard' },
      })
    }

    // Create new user
    const userId = generateId(15)

    await db.user.create({
      data: {
        id: userId,
        email: primaryEmail,
        emailVerified: new Date(),
        name: githubUser.name ?? githubUser.login,
        image: githubUser.avatar_url,
        oauthAccounts: {
          create: {
            providerId: 'github',
            providerUserId: String(githubUser.id),
          },
        },
      },
    })

    const session = await lucia.createSession(userId, {})
    const sessionCookie = lucia.createSessionCookie(session.id)

    cookieStore.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    )

    return new Response(null, {
      status: 302,
      headers: { Location: '/onboarding' },
    })
  } catch (error) {
    console.error('OAuth error:', error)

    if (error instanceof OAuth2RequestError) {
      return new Response(null, { status: 400 })
    }

    return new Response(null, { status: 500 })
  }
}
```

### Google OAuth Routes

```typescript
// app/api/auth/google/route.ts
import { google } from '@/lib/auth/oauth'
import { generateState, generateCodeVerifier } from 'arctic'
import { cookies } from 'next/headers'

export async function GET() {
  const state = generateState()
  const codeVerifier = generateCodeVerifier()

  const url = await google.createAuthorizationURL(state, codeVerifier, {
    scopes: ['openid', 'email', 'profile'],
  })

  const cookieStore = await cookies()

  cookieStore.set('google_oauth_state', state, {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: 'lax',
  })

  cookieStore.set('google_code_verifier', codeVerifier, {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: 'lax',
  })

  return Response.redirect(url)
}
```

```typescript
// app/api/auth/callback/google/route.ts
import { google } from '@/lib/auth/oauth'
import { lucia } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateId } from 'lucia'
import { cookies } from 'next/headers'
import { decodeIdToken, OAuth2Tokens } from 'arctic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  const cookieStore = await cookies()
  const storedState = cookieStore.get('google_oauth_state')?.value
  const codeVerifier = cookieStore.get('google_code_verifier')?.value

  if (!code || !state || !storedState || state !== storedState || !codeVerifier) {
    return new Response(null, { status: 400 })
  }

  try {
    const tokens: OAuth2Tokens = await google.validateAuthorizationCode(
      code,
      codeVerifier
    )

    // Decode ID token to get user info
    const claims = decodeIdToken(tokens.idToken())
    const googleId = claims.sub
    const email = claims.email as string
    const name = claims.name as string
    const picture = claims.picture as string

    // Same logic as GitHub callback...
    // Check existing account, link or create user

    // ... (implementation similar to GitHub callback)

    return new Response(null, {
      status: 302,
      headers: { Location: '/dashboard' },
    })
  } catch (error) {
    console.error('Google OAuth error:', error)
    return new Response(null, { status: 500 })
  }
}
```

## Protected Routes

### Server Component Protection

```typescript
// app/dashboard/page.tsx
import { validateRequest } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const { user, session } = await validateRequest()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      <p>Plan: {user.plan}</p>
    </div>
  )
}
```

### API Route Protection

```typescript
// app/api/protected/route.ts
import { validateRequest } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const { user, session } = await validateRequest()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Return user data
  return NextResponse.json({ user })
}
```

### Role-Based Protection

```typescript
// lib/auth/rbac.ts
import { validateRequest } from '@/lib/auth'
import { redirect } from 'next/navigation'

export async function requireRole(allowedRoles: string[]) {
  const { user } = await validateRequest()

  if (!user) {
    redirect('/sign-in')
  }

  if (!allowedRoles.includes(user.role)) {
    redirect('/unauthorized')
  }

  return user
}

export async function requirePlan(allowedPlans: string[]) {
  const { user } = await validateRequest()

  if (!user) {
    redirect('/sign-in')
  }

  if (!allowedPlans.includes(user.plan)) {
    redirect('/upgrade')
  }

  return user
}

// Usage
export default async function AdminPage() {
  const user = await requireRole(['admin'])
  return <div>Admin panel for {user.email}</div>
}
```

## Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/dashboard', '/settings', '/api/protected']
const authRoutes = ['/sign-in', '/sign-up']

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')
  const { pathname } = request.nextUrl

  // Check protected routes
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute && !sessionCookie) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users from auth routes
  const isAuthRoute = authRoutes.includes(pathname)

  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

## Email Verification

```typescript
// lib/auth/email-verification.ts
import { generateId } from 'lucia'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'

export async function createEmailVerificationCode(
  userId: string,
  email: string
): Promise<string> {
  // Delete existing codes
  await db.emailVerificationCode.deleteMany({
    where: { userId },
  })

  const code = generateId(6).toUpperCase()

  await db.emailVerificationCode.create({
    data: {
      userId,
      email,
      code,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    },
  })

  return code
}

export async function sendVerificationEmail(email: string, code: string) {
  await sendEmail({
    to: email,
    subject: 'Verify your email',
    html: `
      <p>Your verification code is:</p>
      <h1>${code}</h1>
      <p>This code expires in 15 minutes.</p>
    `,
  })
}

export async function verifyEmailCode(userId: string, code: string) {
  const record = await db.emailVerificationCode.findFirst({
    where: {
      userId,
      code,
      expiresAt: { gt: new Date() },
    },
  })

  if (!record) {
    return false
  }

  await db.$transaction([
    db.emailVerificationCode.delete({ where: { id: record.id } }),
    db.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
    }),
  ])

  return true
}
```

## Password Reset

```typescript
// lib/auth/password-reset.ts
import { generateId } from 'lucia'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { sha256 } from 'oslo/crypto'
import { encodeHex } from 'oslo/encoding'

export async function createPasswordResetToken(userId: string): Promise<string> {
  // Delete existing tokens
  await db.passwordResetToken.deleteMany({
    where: { userId },
  })

  const token = generateId(40)
  const tokenHash = encodeHex(await sha256(new TextEncoder().encode(token)))

  await db.passwordResetToken.create({
    data: {
      tokenHash,
      userId,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  })

  return token
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

  await sendEmail({
    to: email,
    subject: 'Reset your password',
    html: `
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link expires in 1 hour.</p>
    `,
  })
}

export async function validatePasswordResetToken(token: string) {
  const tokenHash = encodeHex(await sha256(new TextEncoder().encode(token)))

  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  })

  if (!record || record.expiresAt < new Date()) {
    return null
  }

  return record
}
```

## CLAUDE.md Integration

```markdown
## Authentication

Using Lucia for session-based authentication.

### Key Files
- `lib/auth.ts` - Lucia configuration
- `lib/auth/password.ts` - Password hashing
- `lib/auth/oauth.ts` - OAuth providers (Arctic)
- `app/sign-in/actions.ts` - Sign in action
- `app/sign-up/actions.ts` - Sign up action

### Auth Patterns
```typescript
// Server Components / API Routes
import { validateRequest } from '@/lib/auth'
const { user, session } = await validateRequest()

// Server Actions
import { lucia } from '@/lib/auth'
const session = await lucia.createSession(userId, {})
```

### OAuth Providers
- `/api/auth/github` - GitHub OAuth
- `/api/auth/google` - Google OAuth
- `/api/auth/discord` - Discord OAuth

### Session Management
Sessions stored in database, validated on each request.
Session cookies are httpOnly and secure in production.
```

## AI Suggestions

### Security Best Practices
1. **Argon2 for passwords** - Most secure hashing algorithm
2. **CSRF protection** - Use SameSite cookies
3. **Session rotation** - On privilege escalation
4. **Rate limiting** - On auth endpoints
5. **Secure cookies** - httpOnly, secure, sameSite

### Additional Features
1. **Remember me** - Longer session expiry
2. **Device management** - List/revoke sessions
3. **Account linking** - Connect multiple OAuth
4. **2FA/MFA** - TOTP support with oslo/otp
5. **Login notifications** - Email on new device

### Performance
1. **Session caching** - Cache validateRequest with React cache
2. **Connection pooling** - For database adapter
3. **Lazy loading** - Load OAuth providers on demand
