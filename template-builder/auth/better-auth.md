# Better Auth

Modern, framework-agnostic authentication library with built-in support for multiple frameworks, plugins, and OAuth providers.

## Overview

Better Auth provides:
- Framework agnostic core
- Built-in social providers
- Magic link authentication
- Two-factor authentication
- Organizations & teams
- Plugin architecture
- TypeScript-first design

## Installation

```bash
npm install better-auth
# Database adapter
npm install @better-auth/prisma
# Or Drizzle
npm install @better-auth/drizzle
```

## Environment Variables

```env
# .env.local
BETTER_AUTH_SECRET=your-32-character-secret
BETTER_AUTH_URL=http://localhost:3000

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Email (for magic links)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
EMAIL_FROM=noreply@example.com

# Database
DATABASE_URL=postgresql://localhost:5432/myapp
```

## Database Schema (Prisma)

```prisma
// prisma/schema.prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified Boolean   @default(false)
  name          String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  sessions      Session[]
  accounts      Account[]
  twoFactor     TwoFactor?

  @@map("users")
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  @@index([userId])
  @@map("sessions")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  providerId        String
  providerAccountId String
  accessToken       String?
  refreshToken      String?
  accessTokenExpiresAt DateTime?
  refreshTokenExpiresAt DateTime?
  scope             String?
  idToken           String?
  password          String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([providerId, providerAccountId])
  @@index([userId])
  @@map("accounts")
}

model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())

  @@index([identifier])
  @@map("verifications")
}

model TwoFactor {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  secret    String
  backupCodes String[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("two_factor")
}
```

## Server Configuration

```typescript
// lib/auth/index.ts
import { betterAuth } from 'better-auth'
import { prismaAdapter } from '@better-auth/prisma'
import { twoFactor } from 'better-auth/plugins/two-factor'
import { magicLink } from 'better-auth/plugins/magic-link'
import { organization } from 'better-auth/plugins/organization'
import { prisma } from '@/lib/prisma'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  // Base URL
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  // Email & Password
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Reset your password',
        html: `<a href="${url}">Click here to reset your password</a>`,
      })
    },
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Verify your email',
        html: `<a href="${url}">Click here to verify your email</a>`,
      })
    },
  },

  // Social providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },

  // Plugins
  plugins: [
    twoFactor({
      issuer: 'MyApp',
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendEmail({
          to: email,
          subject: 'Your magic link',
          html: `<a href="${url}">Click here to sign in</a>`,
        })
      },
    }),
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 5,
    }),
  ],

  // Account linking
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google', 'github'],
    },
  },

  // Callbacks
  callbacks: {
    session: async ({ session, user }) => {
      // Add custom data to session
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
        },
      }
    },
  },

  // Advanced options
  advanced: {
    generateId: () => crypto.randomUUID(),
    crossSubDomainCookies: {
      enabled: false,
    },
    cookiePrefix: 'myapp',
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
})

// Email helper
async function sendEmail(options: {
  to: string
  subject: string
  html: string
}) {
  // Implement your email sending logic
  console.log('Sending email:', options)
}

// Export types
export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
```

## API Route Handler

```typescript
// app/api/auth/[...all]/route.ts
import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler(auth)
```

## Client Configuration

```typescript
// lib/auth/client.ts
import { createAuthClient } from 'better-auth/react'
import { twoFactorClient } from 'better-auth/client/plugins'
import { magicLinkClient } from 'better-auth/client/plugins'
import { organizationClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [
    twoFactorClient(),
    magicLinkClient(),
    organizationClient(),
  ],
})

// Export hooks and methods
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient
```

## Auth Provider

```typescript
// components/providers/auth-provider.tsx
'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useSession as useBetterAuthSession } from '@/lib/auth/client'

interface AuthContextType {
  user: any | null
  session: any | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  status: 'loading',
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending, error } = useBetterAuthSession()

  const status = isPending
    ? 'loading'
    : session
    ? 'authenticated'
    : 'unauthenticated'

  return (
    <AuthContext.Provider
      value={{
        user: session?.user || null,
        session,
        status,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
```

## React Components

```typescript
// components/auth/sign-in-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, authClient } from '@/lib/auth/client'

export function SignInForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [twoFactorRequired, setTwoFactorRequired] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn.email({
        email,
        password,
        callbackURL: '/dashboard',
      })

      if (result.error) {
        setError(result.error.message || 'Sign in failed')
      } else if (result.data?.twoFactorRequired) {
        setTwoFactorRequired(true)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await authClient.twoFactor.verifyTotp({
        code: twoFactorCode,
      })

      if (result.error) {
        setError(result.error.message || 'Invalid code')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialSignIn = async (provider: 'google' | 'github') => {
    await signIn.social({
      provider,
      callbackURL: '/dashboard',
    })
  }

  const handleMagicLink = async () => {
    if (!email) {
      setError('Email required')
      return
    }

    setLoading(true)
    const result = await authClient.signIn.magicLink({
      email,
      callbackURL: '/dashboard',
    })

    if (result.error) {
      setError(result.error.message || 'Failed to send magic link')
    } else {
      setError('')
      alert('Check your email for the magic link!')
    }
    setLoading(false)
  }

  if (twoFactorRequired) {
    return (
      <form onSubmit={handleTwoFactor} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">
            Two-Factor Code
          </label>
          <input
            type="text"
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value)}
            placeholder="Enter 6-digit code"
            className="mt-1 block w-full rounded border px-3 py-2"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </form>
    )
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded border px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded border px-3 py-2"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <button
        onClick={handleMagicLink}
        disabled={loading}
        className="w-full rounded border py-2 hover:bg-gray-50 disabled:opacity-50"
      >
        Send Magic Link
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleSocialSignIn('google')}
          className="flex items-center justify-center rounded border py-2 hover:bg-gray-50"
        >
          Google
        </button>
        <button
          onClick={() => handleSocialSignIn('github')}
          className="flex items-center justify-center rounded border py-2 hover:bg-gray-50"
        >
          GitHub
        </button>
      </div>
    </div>
  )
}
```

```typescript
// components/auth/sign-up-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUp } from '@/lib/auth/client'

export function SignUpForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signUp.email({
        email,
        password,
        name,
        callbackURL: '/dashboard',
      })

      if (result.error) {
        setError(result.error.message || 'Sign up failed')
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <h3 className="text-lg font-medium">Check your email</h3>
        <p className="text-gray-600 mt-2">
          We sent a verification link to {email}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded border px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded border px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded border px-3 py-2"
          minLength={8}
          required
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating account...' : 'Sign Up'}
      </button>
    </form>
  )
}
```

## Two-Factor Setup Component

```typescript
// components/auth/two-factor-setup.tsx
'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth/client'

export function TwoFactorSetup() {
  const [step, setStep] = useState<'initial' | 'verify' | 'complete'>('initial')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleEnable = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await authClient.twoFactor.enable()

      if (result.error) {
        setError(result.error.message || 'Failed to enable 2FA')
      } else {
        setQrCode(result.data?.qrCode || '')
        setSecret(result.data?.secret || '')
        setStep('verify')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await authClient.twoFactor.verifyTotp({
        code,
      })

      if (result.error) {
        setError(result.error.message || 'Invalid code')
      } else {
        setBackupCodes(result.data?.backupCodes || [])
        setStep('complete')
      }
    } catch (err) {
      setError('Verification failed')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'complete') {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 p-4 rounded">
          <p className="text-green-800 font-medium">
            Two-factor authentication enabled!
          </p>
        </div>

        <div className="bg-yellow-50 p-4 rounded">
          <p className="text-yellow-800 font-medium mb-2">
            Save your backup codes
          </p>
          <p className="text-yellow-700 text-sm mb-4">
            These codes can be used if you lose access to your authenticator app.
          </p>
          <div className="grid grid-cols-2 gap-2 font-mono text-sm">
            {backupCodes.map((code, i) => (
              <div key={i} className="bg-white p-2 rounded border">
                {code}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (step === 'verify') {
    return (
      <form onSubmit={handleVerify} className="space-y-4">
        <div className="text-center">
          <img
            src={qrCode}
            alt="QR Code"
            className="mx-auto w-48 h-48"
          />
          <p className="text-sm text-gray-500 mt-2">
            Scan this QR code with your authenticator app
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Or enter manually: {secret}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium">
            Verification Code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter 6-digit code"
            className="mt-1 block w-full rounded border px-3 py-2"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify & Enable'}
        </button>
      </form>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-600">
        Add an extra layer of security to your account by enabling
        two-factor authentication.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleEnable}
        disabled={loading}
        className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Setting up...' : 'Enable Two-Factor Authentication'}
      </button>
    </div>
  )
}
```

## Server-Side Session

```typescript
// lib/auth/server.ts
import { auth } from '@/lib/auth'
import { headers, cookies } from 'next/headers'

export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: headers(),
  })
  return session
}

export async function requireAuth() {
  const session = await getServerSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

// Server component usage
// app/dashboard/page.tsx
import { getServerSession } from '@/lib/auth/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
    </div>
  )
}
```

## Middleware

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

const protectedRoutes = ['/dashboard', '/settings', '/profile']
const authRoutes = ['/login', '/signup', '/forgot-password']

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('myapp.session_token')
  const isAuthenticated = !!sessionCookie

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !isAuthenticated) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

## Testing

```typescript
// __tests__/auth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Better Auth', () => {
  describe('Sign Up', () => {
    it('should create a new user', async () => {
      // Test implementation
    })

    it('should require email verification', async () => {
      // Test implementation
    })
  })

  describe('Sign In', () => {
    it('should authenticate with email/password', async () => {
      // Test implementation
    })

    it('should handle 2FA challenge', async () => {
      // Test implementation
    })

    it('should support magic link', async () => {
      // Test implementation
    })
  })

  describe('Social Auth', () => {
    it('should redirect to Google', async () => {
      // Test implementation
    })

    it('should handle OAuth callback', async () => {
      // Test implementation
    })
  })
})
```

## CLAUDE.md Integration

```markdown
## Better Auth

This project uses Better Auth for authentication.

### Key Files
- `lib/auth/index.ts` - Server configuration
- `lib/auth/client.ts` - Client configuration
- `lib/auth/server.ts` - Server-side utilities
- `app/api/auth/[...all]/route.ts` - API handler

### Features Enabled
- Email/Password authentication
- Google & GitHub OAuth
- Magic link sign in
- Two-factor authentication
- Organizations

### Usage
```typescript
// Client-side
import { signIn, useSession } from '@/lib/auth/client'
await signIn.email({ email, password })

// Server-side
import { getServerSession } from '@/lib/auth/server'
const session = await getServerSession()
```

### Environment Variables Required
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- OAuth credentials for enabled providers
```

## AI Suggestions

1. **Passkeys/WebAuthn** - Add passwordless authentication with passkeys
2. **Rate limiting** - Implement login attempt rate limiting
3. **Session management** - Add active sessions list and remote logout
4. **Audit logging** - Log authentication events for security
5. **Custom email templates** - Design branded email templates
6. **Account recovery** - Implement secure account recovery flows
7. **IP-based security** - Detect suspicious login locations
8. **Device fingerprinting** - Track and verify known devices
