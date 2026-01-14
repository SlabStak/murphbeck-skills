# NextAuth.js / Auth.js Template

Complete authentication with NextAuth.js (Auth.js) for Next.js applications.

## Overview

NextAuth.js provides:
- Multiple OAuth providers (Google, GitHub, Discord, etc.)
- Email/password authentication
- Magic link authentication
- Database sessions or JWT
- Role-based access control
- Extensible callbacks

## Installation

```bash
# Next.js App Router
bun add next-auth@beta @auth/prisma-adapter

# For credentials provider
bun add bcryptjs
bun add -D @types/bcryptjs

# For email provider
bun add resend
```

## Environment Variables

```env
# .env.local

# Required
AUTH_SECRET=your-secret-key-min-32-chars  # Generate with: openssl rand -base64 32
AUTH_URL=http://localhost:3000

# OAuth Providers
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-client-secret

AUTH_DISCORD_ID=your-discord-client-id
AUTH_DISCORD_SECRET=your-discord-client-secret

# Email Provider (Resend)
AUTH_RESEND_KEY=re_...

# Database
DATABASE_URL=postgresql://...
```

## Auth Configuration

### Main Auth Config

```typescript
// auth.ts
import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import Discord from 'next-auth/providers/discord'
import Credentials from 'next-auth/providers/credentials'
import Resend from 'next-auth/providers/resend'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(db),

  session: {
    strategy: 'jwt', // Use 'database' for database sessions
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/sign-in',
    signOut: '/sign-out',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
    newUser: '/onboarding',
  },

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),

    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),

    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
    }),

    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: 'noreply@yourdomain.com',
    }),

    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.password) {
          throw new Error('Invalid credentials')
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValid) {
          throw new Error('Invalid credentials')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      // Block sign-in for banned users
      if (user.id) {
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { banned: true },
        })

        if (dbUser?.banned) {
          return false
        }
      }

      return true
    },

    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.role = user.role ?? 'user'
        token.plan = user.plan ?? 'free'
      }

      // Update session from client
      if (trigger === 'update' && session) {
        token.name = session.name
        token.picture = session.picture
      }

      // Refresh user data periodically
      if (token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, plan: true, name: true, image: true },
        })

        if (dbUser) {
          token.role = dbUser.role
          token.plan = dbUser.plan
          token.name = dbUser.name
          token.picture = dbUser.image
        }
      }

      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.plan = token.plan as string
      }

      return session
    },

    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      if (isNewUser) {
        // Send welcome email
        // Track analytics event
        console.log(`New user signed up: ${user.email}`)
      }
    },

    async signOut({ token }) {
      // Clean up user sessions
      console.log(`User signed out: ${token?.email}`)
    },

    async linkAccount({ user, account }) {
      // Account linked to existing user
      console.log(`Account ${account.provider} linked to ${user.email}`)
    },
  },

  debug: process.env.NODE_ENV === 'development',
})
```

### Type Declarations

```typescript
// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      plan: string
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role?: string
    plan?: string
    banned?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id?: string
    role?: string
    plan?: string
  }
}
```

## Route Handlers

```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/auth'

export const { GET, POST } = handlers
```

## Middleware

```typescript
// middleware.ts
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

const publicRoutes = ['/', '/sign-in', '/sign-up', '/auth/error', '/auth/verify']
const authRoutes = ['/sign-in', '/sign-up']
const protectedRoutes = ['/dashboard', '/settings', '/api/protected']
const adminRoutes = ['/admin']

export default auth((req) => {
  const { nextUrl, auth } = req
  const isLoggedIn = !!auth?.user
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname)
  const isAuthRoute = authRoutes.includes(nextUrl.pathname)
  const isProtectedRoute = protectedRoutes.some(route =>
    nextUrl.pathname.startsWith(route)
  )
  const isAdminRoute = adminRoutes.some(route =>
    nextUrl.pathname.startsWith(route)
  )

  // Redirect logged-in users from auth pages
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  // Protect routes
  if (isProtectedRoute && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search)
    return NextResponse.redirect(
      new URL(`/sign-in?callbackUrl=${callbackUrl}`, nextUrl)
    )
  }

  // Admin-only routes
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/sign-in', nextUrl))
    }
    if (auth?.user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
```

## Sign In Page

```typescript
// app/sign-in/page.tsx
import { auth, signIn } from '@/auth'
import { redirect } from 'next/navigation'
import { AuthError } from 'next-auth'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string }
}) {
  const session = await auth()

  if (session?.user) {
    redirect('/dashboard')
  }

  const callbackUrl = searchParams.callbackUrl ?? '/dashboard'

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign In</h1>
          <p className="text-gray-600">Choose your sign-in method</p>
        </div>

        {searchParams.error && (
          <div className="rounded-md bg-red-50 p-4 text-red-500">
            {getErrorMessage(searchParams.error)}
          </div>
        )}

        {/* OAuth Providers */}
        <div className="space-y-3">
          <form
            action={async () => {
              'use server'
              await signIn('google', { redirectTo: callbackUrl })
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-md border bg-white px-4 py-3 hover:bg-gray-50"
            >
              <GoogleIcon className="h-5 w-5" />
              Continue with Google
            </button>
          </form>

          <form
            action={async () => {
              'use server'
              await signIn('github', { redirectTo: callbackUrl })
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-md border bg-white px-4 py-3 hover:bg-gray-50"
            >
              <GitHubIcon className="h-5 w-5" />
              Continue with GitHub
            </button>
          </form>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <CredentialsForm callbackUrl={callbackUrl} />

        {/* Magic Link Form */}
        <MagicLinkForm />

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/sign-up" className="font-medium text-blue-600 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}

function getErrorMessage(error: string): string {
  switch (error) {
    case 'CredentialsSignin':
      return 'Invalid email or password'
    case 'OAuthAccountNotLinked':
      return 'Email already exists with different provider'
    case 'EmailSignin':
      return 'Error sending magic link email'
    case 'AccessDenied':
      return 'Access denied. Your account may be banned.'
    default:
      return 'An error occurred during sign in'
  }
}
```

### Credentials Form Component

```typescript
// components/auth/credentials-form.tsx
'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CredentialsForm({ callbackUrl }: { callbackUrl: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  )
}
```

### Magic Link Form

```typescript
// components/auth/magic-link-form.tsx
'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'

export function MagicLinkForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    await signIn('resend', {
      email,
      redirect: false,
    })

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="rounded-md bg-green-50 p-4 text-center text-green-700">
        Check your email for a magic link!
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="magic-email" className="block text-sm font-medium">
          Email for Magic Link
        </label>
        <input
          id="magic-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          className="mt-1 block w-full rounded-md border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md border border-blue-600 px-4 py-2 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send Magic Link'}
      </button>
    </form>
  )
}
```

## Sign Up with Password

```typescript
// app/sign-up/page.tsx
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { SignUpForm } from '@/components/auth/sign-up-form'

export default async function SignUpPage() {
  const session = await auth()

  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-gray-600">Get started with your account</p>
        </div>

        <SignUpForm />

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/sign-in" className="font-medium text-blue-600 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}
```

### Sign Up Form

```typescript
// components/auth/sign-up-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

export function SignUpForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Create user via API
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Registration failed')
      }

      // Sign in after registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Failed to sign in after registration')
      } else {
        router.push('/onboarding')
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="mt-1 block w-full rounded-md border px-3 py-2"
        />
        <p className="mt-1 text-xs text-gray-500">
          Must be at least 8 characters
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  )
}
```

### Registration API

```typescript
// app/api/auth/register/route.ts
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password } = registerSchema.parse(body)

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return Response.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    return Response.json({
      user: { id: user.id, name: user.name, email: user.email }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return Response.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
```

## Server-Side Auth

### Get Session in Server Components

```typescript
// app/dashboard/page.tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/sign-in')
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}!</h1>
      <p>Role: {session.user.role}</p>
      <p>Plan: {session.user.plan}</p>
    </div>
  )
}
```

### Protected API Routes

```typescript
// app/api/protected/route.ts
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Access user data
  const { id, role, plan } = session.user

  return Response.json({
    message: 'Protected data',
    userId: id,
    role,
    plan,
  })
}
```

### Role-Based Access

```typescript
// lib/auth-utils.ts
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const session = await auth()

  if (!session?.user) {
    redirect('/sign-in')
  }

  return session
}

export async function requireRole(roles: string[]) {
  const session = await requireAuth()

  if (!roles.includes(session.user.role)) {
    redirect('/unauthorized')
  }

  return session
}

export async function requirePlan(plans: string[]) {
  const session = await requireAuth()

  if (!plans.includes(session.user.plan)) {
    redirect('/upgrade')
  }

  return session
}

// Usage
export default async function AdminPage() {
  const session = await requireRole(['admin'])
  // Only admins reach here
}
```

## Client-Side Auth

### Session Provider

```typescript
// app/providers.tsx
'use client'

import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}

// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### useSession Hook

```typescript
// components/user-menu.tsx
'use client'

import { useSession, signOut } from 'next-auth/react'

export function UserMenu() {
  const { data: session, status, update } = useSession()

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session) {
    return <a href="/sign-in">Sign In</a>
  }

  async function handleSignOut() {
    await signOut({ callbackUrl: '/' })
  }

  async function updateProfile(name: string) {
    // Update session data
    await update({ name })
  }

  return (
    <div>
      <img
        src={session.user.image ?? '/default-avatar.png'}
        alt="Avatar"
        className="w-8 h-8 rounded-full"
      />
      <span>{session.user.name}</span>
      <button onClick={handleSignOut}>Sign Out</button>
    </div>
  )
}
```

## Prisma Schema

```prisma
// prisma/schema.prisma

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?   // For credentials provider
  role          String    @default("user")
  plan          String    @default("free")
  banned        Boolean   @default(false)

  accounts      Account[]
  sessions      Session[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

## Password Reset

```typescript
// app/api/auth/forgot-password/route.ts
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'
import { sendEmail } from '@/lib/email'

export async function POST(req: Request) {
  const { email } = await req.json()

  const user = await db.user.findUnique({ where: { email } })

  // Always return success to prevent email enumeration
  if (!user) {
    return Response.json({ success: true })
  }

  // Generate reset token
  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 3600000) // 1 hour

  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expires,
    },
  })

  // Send email
  await sendEmail({
    to: email,
    subject: 'Reset your password',
    html: `
      <p>Click the link below to reset your password:</p>
      <a href="${process.env.AUTH_URL}/reset-password?token=${token}">
        Reset Password
      </a>
      <p>This link expires in 1 hour.</p>
    `,
  })

  return Response.json({ success: true })
}
```

```typescript
// app/api/auth/reset-password/route.ts
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const { token, password } = await req.json()

  const resetToken = await db.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!resetToken || resetToken.expires < new Date()) {
    return Response.json(
      { error: 'Invalid or expired token' },
      { status: 400 }
    )
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(password, 12)

  // Update user password
  await db.user.update({
    where: { id: resetToken.userId },
    data: { password: hashedPassword },
  })

  // Delete used token
  await db.passwordResetToken.delete({
    where: { token },
  })

  return Response.json({ success: true })
}
```

## CLAUDE.md Integration

```markdown
## Authentication

Using NextAuth.js (Auth.js) for authentication.

### Key Files
- `auth.ts` - Main auth configuration
- `middleware.ts` - Route protection
- `app/api/auth/[...nextauth]/route.ts` - Auth API routes
- `app/sign-in/page.tsx` - Sign in page
- `app/sign-up/page.tsx` - Sign up page

### Auth Patterns
```typescript
// Server Components
import { auth } from '@/auth'
const session = await auth()

// Client Components
import { useSession, signIn, signOut } from 'next-auth/react'
const { data: session } = useSession()

// Server Actions
import { signIn, signOut } from '@/auth'
await signIn('google', { redirectTo: '/dashboard' })
```

### Protected Routes
- `/dashboard/*` - Requires authentication
- `/settings/*` - Requires authentication
- `/admin/*` - Requires admin role
- `/api/protected/*` - Requires authentication

### Providers Configured
- Google OAuth
- GitHub OAuth
- Discord OAuth
- Email (Magic Link via Resend)
- Credentials (Email/Password)
```

## AI Suggestions

### Security Enhancements
1. **CSRF protection** - Built into NextAuth, ensure cookies are secure
2. **Rate limiting** - Add rate limiting to auth endpoints
3. **Password requirements** - Enforce strong passwords
4. **Account lockout** - Lock after failed attempts
5. **Session rotation** - Rotate session on sensitive actions
6. **Secure cookies** - Use `__Secure-` prefix in production

### UX Improvements
1. **Remember me** - Extended session for trusted devices
2. **Social linking** - Allow linking multiple providers
3. **Profile completion** - Prompt for missing info
4. **Session management** - Show/revoke active sessions

### Production Checklist
1. Set `AUTH_SECRET` to a strong random value
2. Enable HTTPS only
3. Configure proper callback URLs
4. Set up webhook monitoring
5. Enable rate limiting
6. Add logging for auth events
7. Set up alerts for failed logins
