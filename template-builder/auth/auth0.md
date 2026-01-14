# Auth0 Authentication Template

Complete Auth0 integration for Next.js applications.

## Overview

Auth0 provides:
- Universal Login (hosted login page)
- Social connections (50+ providers)
- Enterprise connections (SAML, LDAP, AD)
- Passwordless authentication
- Multi-factor authentication
- Machine-to-machine authentication
- Fine-grained authorization (RBAC)

## Installation

```bash
bun add @auth0/nextjs-auth0
```

## Environment Variables

```env
# .env.local

# Auth0 Configuration
AUTH0_SECRET=a-long-secret-value-min-32-characters  # Generate with: openssl rand -hex 32
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret

# Optional: Audience for API authorization
AUTH0_AUDIENCE=https://your-api.example.com

# Optional: Custom scopes
AUTH0_SCOPE=openid profile email

# Management API (for user management)
AUTH0_MGMT_CLIENT_ID=your-mgmt-client-id
AUTH0_MGMT_CLIENT_SECRET=your-mgmt-client-secret
```

## Basic Setup

### Route Handler

```typescript
// app/api/auth/[auth0]/route.ts
import { handleAuth, handleLogin, handleLogout, handleCallback } from '@auth0/nextjs-auth0'

export const GET = handleAuth({
  login: handleLogin({
    authorizationParams: {
      audience: process.env.AUTH0_AUDIENCE,
      scope: 'openid profile email',
    },
    returnTo: '/dashboard',
  }),

  logout: handleLogout({
    returnTo: '/',
  }),

  callback: handleCallback({
    afterCallback: async (req, session) => {
      // Custom logic after successful login
      // e.g., sync user to database
      return session
    },
  }),

  signup: handleLogin({
    authorizationParams: {
      screen_hint: 'signup',
    },
    returnTo: '/onboarding',
  }),
})
```

### User Provider

```typescript
// app/layout.tsx
import { UserProvider } from '@auth0/nextjs-auth0/client'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  )
}
```

## Client-Side Authentication

### useUser Hook

```typescript
// components/user-profile.tsx
'use client'

import { useUser } from '@auth0/nextjs-auth0/client'

export function UserProfile() {
  const { user, error, isLoading } = useUser()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>{error.message}</div>

  if (!user) {
    return (
      <div>
        <a href="/api/auth/login">Sign In</a>
        <a href="/api/auth/login?screen_hint=signup">Sign Up</a>
      </div>
    )
  }

  return (
    <div>
      <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <a href="/api/auth/logout">Sign Out</a>
    </div>
  )
}
```

### Protected Client Component

```typescript
// components/protected-content.tsx
'use client'

import { withPageAuthRequired } from '@auth0/nextjs-auth0/client'

function ProtectedContent() {
  return (
    <div>
      <h1>Protected Content</h1>
      <p>Only visible to authenticated users</p>
    </div>
  )
}

export default withPageAuthRequired(ProtectedContent, {
  onRedirecting: () => <div>Redirecting to login...</div>,
  onError: (error) => <div>Error: {error.message}</div>,
})
```

## Server-Side Authentication

### Get Session in Server Components

```typescript
// app/dashboard/page.tsx
import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await getSession()

  if (!session?.user) {
    redirect('/api/auth/login?returnTo=/dashboard')
  }

  const { user } = session

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>Email: {user.email}</p>
      <img src={user.picture} alt="Avatar" />

      {/* Access custom claims */}
      <p>Roles: {user['https://your-app.com/roles']?.join(', ')}</p>
    </div>
  )
}
```

### Protected Page (Alternative)

```typescript
// app/settings/page.tsx
import { withPageAuthRequired, getSession } from '@auth0/nextjs-auth0'

export default withPageAuthRequired(
  async function SettingsPage() {
    const session = await getSession()
    const user = session?.user

    return (
      <div>
        <h1>Settings</h1>
        <p>Logged in as: {user?.email}</p>
      </div>
    )
  },
  { returnTo: '/settings' }
)
```

### Protected API Routes

```typescript
// app/api/protected/route.ts
import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0'
import { NextResponse } from 'next/server'

export const GET = withApiAuthRequired(async function handler(req) {
  const session = await getSession()
  const user = session?.user

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch user-specific data
  const data = await fetchUserData(user.sub)

  return NextResponse.json(data)
})

export const POST = withApiAuthRequired(async function handler(req) {
  const session = await getSession()
  const user = session?.user

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  // Create resource for user
  const resource = await createResource({
    ...body,
    userId: user.sub,
  })

  return NextResponse.json(resource, { status: 201 })
})
```

### Get Access Token for APIs

```typescript
// app/api/external/route.ts
import { getAccessToken, withApiAuthRequired } from '@auth0/nextjs-auth0'
import { NextResponse } from 'next/server'

export const GET = withApiAuthRequired(async function handler(req) {
  try {
    // Get access token for external API
    const { accessToken } = await getAccessToken({
      scopes: ['read:data', 'write:data'],
    })

    // Call external API
    const response = await fetch('https://api.example.com/data', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    if (error.code === 'ERR_INSUFFICIENT_SCOPE') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    throw error
  }
})
```

## Middleware Protection

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0/edge'

const protectedRoutes = ['/dashboard', '/settings', '/api/protected']
const authRoutes = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const session = await getSession(request, response)

  const { pathname } = request.nextUrl

  // Check protected routes
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute && !session?.user) {
    const loginUrl = new URL('/api/auth/login', request.url)
    loginUrl.searchParams.set('returnTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users from auth routes
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  if (isAuthRoute && session?.user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## Custom Claims & RBAC

### Add Claims in Auth0 Action

```javascript
// Auth0 Dashboard > Actions > Post Login

exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://your-app.com'

  // Add roles from Auth0 metadata or external source
  const roles = event.authorization?.roles ?? []

  api.idToken.setCustomClaim(`${namespace}/roles`, roles)
  api.accessToken.setCustomClaim(`${namespace}/roles`, roles)

  // Add custom user data
  const userMetadata = event.user.user_metadata ?? {}
  api.idToken.setCustomClaim(`${namespace}/plan`, userMetadata.plan ?? 'free')
}
```

### Access Claims in Application

```typescript
// lib/auth0/claims.ts
import { getSession } from '@auth0/nextjs-auth0'

const NAMESPACE = 'https://your-app.com'

export async function getUserRoles(): Promise<string[]> {
  const session = await getSession()
  return session?.user?.[`${NAMESPACE}/roles`] ?? []
}

export async function getUserPlan(): Promise<string> {
  const session = await getSession()
  return session?.user?.[`${NAMESPACE}/plan`] ?? 'free'
}

export async function requireRole(allowedRoles: string[]) {
  const roles = await getUserRoles()
  const hasRole = allowedRoles.some(role => roles.includes(role))

  if (!hasRole) {
    throw new Error('Insufficient permissions')
  }

  return roles
}

export async function requirePlan(allowedPlans: string[]) {
  const plan = await getUserPlan()

  if (!allowedPlans.includes(plan)) {
    throw new Error('Upgrade required')
  }

  return plan
}
```

### Role-Based Component

```typescript
// components/role-guard.tsx
'use client'

import { useUser } from '@auth0/nextjs-auth0/client'

type RoleGuardProps = {
  allowedRoles: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const { user, isLoading } = useUser()

  if (isLoading) {
    return <div>Loading...</div>
  }

  const userRoles = user?.['https://your-app.com/roles'] as string[] ?? []
  const hasAccess = allowedRoles.some(role => userRoles.includes(role))

  if (!hasAccess) {
    return fallback ?? <div>Access denied</div>
  }

  return <>{children}</>
}

// Usage
function AdminPanel() {
  return (
    <RoleGuard allowedRoles={['admin']} fallback={<div>Admin only</div>}>
      <div>Admin content here</div>
    </RoleGuard>
  )
}
```

## Management API (User Operations)

```typescript
// lib/auth0/management.ts
import { ManagementClient } from 'auth0'

const management = new ManagementClient({
  domain: process.env.AUTH0_ISSUER_BASE_URL!.replace('https://', ''),
  clientId: process.env.AUTH0_MGMT_CLIENT_ID!,
  clientSecret: process.env.AUTH0_MGMT_CLIENT_SECRET!,
})

// Get user by ID
export async function getUser(userId: string) {
  return management.users.get({ id: userId })
}

// Update user metadata
export async function updateUserMetadata(
  userId: string,
  metadata: Record<string, any>
) {
  return management.users.update(
    { id: userId },
    { user_metadata: metadata }
  )
}

// Assign roles to user
export async function assignRoles(userId: string, roleIds: string[]) {
  return management.users.assignRoles(
    { id: userId },
    { roles: roleIds }
  )
}

// Get user roles
export async function getUserRoles(userId: string) {
  return management.users.getRoles({ id: userId })
}

// Delete user
export async function deleteUser(userId: string) {
  return management.users.delete({ id: userId })
}

// Block user
export async function blockUser(userId: string) {
  return management.users.update({ id: userId }, { blocked: true })
}

// Send verification email
export async function sendVerificationEmail(userId: string) {
  return management.jobs.verifyEmail({ user_id: userId })
}

// Change password
export async function changePassword(userId: string, newPassword: string) {
  return management.users.update({ id: userId }, { password: newPassword })
}
```

### User Management API Routes

```typescript
// app/api/users/[id]/route.ts
import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0'
import { getUser, updateUserMetadata } from '@/lib/auth0/management'
import { requireRole } from '@/lib/auth0/claims'
import { NextResponse } from 'next/server'

export const GET = withApiAuthRequired(async function handler(
  req,
  { params }: { params: { id: string } }
) {
  // Only admins can view other users
  await requireRole(['admin'])

  const user = await getUser(params.id)
  return NextResponse.json(user)
})

export const PATCH = withApiAuthRequired(async function handler(
  req,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  const currentUserId = session?.user?.sub

  // Users can only update themselves, admins can update anyone
  const isAdmin = session?.user?.['https://your-app.com/roles']?.includes('admin')
  const isSelf = currentUserId === params.id

  if (!isAdmin && !isSelf) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  await updateUserMetadata(params.id, body)

  return NextResponse.json({ success: true })
})
```

## Organizations (Multi-Tenancy)

```typescript
// app/api/auth/[auth0]/route.ts
import { handleAuth, handleLogin } from '@auth0/nextjs-auth0'

export const GET = handleAuth({
  login: handleLogin({
    authorizationParams: {
      organization: 'org_xxx', // Specific organization
      // Or let user choose organization
    },
  }),

  // Login with organization prompt
  'org-login': handleLogin({
    authorizationParams: {
      organization_prompt: 'login',
    },
  }),
})
```

### Organization-Aware Components

```typescript
// components/org-switcher.tsx
'use client'

import { useUser } from '@auth0/nextjs-auth0/client'

export function OrgSwitcher() {
  const { user } = useUser()
  const currentOrg = user?.org_id

  async function switchOrg(orgId: string) {
    // Redirect to login with specific organization
    window.location.href = `/api/auth/login?organization=${orgId}`
  }

  return (
    <div>
      <p>Current Organization: {currentOrg ?? 'Personal'}</p>
      <button onClick={() => switchOrg('org_xxx')}>
        Switch to Acme Corp
      </button>
    </div>
  )
}
```

## Sync User to Database

```typescript
// app/api/auth/[auth0]/route.ts
import { handleAuth, handleCallback } from '@auth0/nextjs-auth0'
import { db } from '@/lib/db'

export const GET = handleAuth({
  callback: handleCallback({
    afterCallback: async (req, session, state) => {
      if (session?.user) {
        const { sub, email, name, picture } = session.user

        // Upsert user in database
        await db.user.upsert({
          where: { auth0Id: sub },
          update: {
            email,
            name,
            image: picture,
            lastLoginAt: new Date(),
          },
          create: {
            auth0Id: sub,
            email,
            name,
            image: picture,
          },
        })
      }

      return session
    },
  }),
})
```

## Webhooks

```typescript
// app/api/webhooks/auth0/route.ts
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// Auth0 Log Streams or Actions can send webhooks

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')

  // Verify webhook secret
  if (authHeader !== `Bearer ${process.env.AUTH0_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const events = await req.json()

  for (const event of events) {
    switch (event.type) {
      case 'ss': // Successful silent auth
      case 's': // Successful login
        await db.user.update({
          where: { auth0Id: event.user_id },
          data: { lastLoginAt: new Date(event.date) },
        })
        break

      case 'du': // Deleted user
        await db.user.delete({
          where: { auth0Id: event.user_id },
        })
        break

      case 'scu': // User signup
        await db.user.create({
          data: {
            auth0Id: event.user_id,
            email: event.user_email,
          },
        })
        break
    }
  }

  return NextResponse.json({ received: true })
}
```

## Testing

```typescript
// tests/setup.ts
import { vi } from 'vitest'

// Mock Auth0
vi.mock('@auth0/nextjs-auth0', () => ({
  getSession: vi.fn(() => ({
    user: {
      sub: 'auth0|test123',
      email: 'test@example.com',
      name: 'Test User',
      'https://your-app.com/roles': ['user'],
    },
  })),
  withApiAuthRequired: (handler: Function) => handler,
  withPageAuthRequired: (component: Function) => component,
}))

vi.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: () => ({
    user: {
      sub: 'auth0|test123',
      email: 'test@example.com',
      name: 'Test User',
    },
    isLoading: false,
    error: undefined,
  }),
  UserProvider: ({ children }: { children: React.ReactNode }) => children,
  withPageAuthRequired: (component: Function) => component,
}))
```

## CLAUDE.md Integration

```markdown
## Authentication

Using Auth0 for authentication.

### Key Files
- `app/api/auth/[auth0]/route.ts` - Auth routes
- `app/layout.tsx` - UserProvider
- `lib/auth0/claims.ts` - Custom claims helpers
- `lib/auth0/management.ts` - Management API

### Auth Patterns
```typescript
// Server Components
import { getSession } from '@auth0/nextjs-auth0'
const session = await getSession()

// Client Components
import { useUser } from '@auth0/nextjs-auth0/client'
const { user, isLoading } = useUser()

// API Routes
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0'
export const GET = withApiAuthRequired(async (req) => { ... })
```

### Auth URLs
- `/api/auth/login` - Sign in
- `/api/auth/logout` - Sign out
- `/api/auth/signup` - Sign up
- `/api/auth/callback` - OAuth callback
- `/api/auth/me` - Get user info

### Custom Claims
Access via `user['https://your-app.com/roles']` or `user['https://your-app.com/plan']`
```

## AI Suggestions

### Security Best Practices
1. **Rotate secrets** - Regularly rotate AUTH0_SECRET
2. **Secure cookies** - Ensure httpOnly and secure flags
3. **RBAC** - Use Auth0 roles for authorization
4. **API permissions** - Use scoped access tokens
5. **Audit logs** - Enable and monitor Auth0 logs

### UX Improvements
1. **Universal Login** - Customize hosted login page
2. **Social connections** - Add popular providers
3. **Passwordless** - Enable email/SMS magic links
4. **Remember device** - Reduce friction for returning users

### Advanced Features
1. **Organizations** - Multi-tenancy support
2. **Machine-to-machine** - Service authentication
3. **Custom domains** - Use your domain for login
4. **Breached password detection** - Auto-enable
5. **Bot detection** - Enable for signup/login
