# Clerk Authentication Template

Complete Clerk authentication integration for Next.js applications.

## Overview

Clerk provides:
- User authentication (email, social, passkeys)
- User management dashboard
- Multi-factor authentication
- Organization/team support
- Session management
- Webhooks for user events

## Installation

```bash
# Next.js
bun add @clerk/nextjs

# React (Vite/CRA)
bun add @clerk/clerk-react

# Express/Node
bun add @clerk/clerk-sdk-node

# Remix
bun add @clerk/remix
```

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional: Custom URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Webhook secret (for syncing user data)
CLERK_WEBHOOK_SECRET=whsec_...
```

## Next.js App Router Setup

### Middleware

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/pricing',
  '/about',
])

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/settings(.*)',
  '/api/protected(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
```

### Root Layout

```typescript
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark, // or undefined for light
        variables: {
          colorPrimary: '#0066ff',
          colorBackground: '#1a1a1a',
          colorText: '#ffffff',
          colorTextSecondary: '#a0a0a0',
          borderRadius: '0.5rem',
        },
        elements: {
          formButtonPrimary: 'bg-primary hover:bg-primary/90',
          card: 'shadow-xl',
          headerTitle: 'text-2xl font-bold',
          socialButtonsBlockButton: 'border-gray-700',
        },
      }}
      localization={{
        signIn: {
          start: {
            title: 'Welcome back',
            subtitle: 'Sign in to continue to {{applicationName}}',
          },
        },
      }}
    >
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

### Sign In Page

```typescript
// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-gray-900 border border-gray-800',
          },
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/dashboard"
      />
    </div>
  )
}
```

### Sign Up Page

```typescript
// app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-gray-900 border border-gray-800',
          },
        }}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/onboarding"
      />
    </div>
  )
}
```

## Server-Side Authentication

### Get Current User (Server Components)

```typescript
// app/dashboard/page.tsx
import { currentUser, auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Access user data
  const { id, firstName, lastName, emailAddresses, imageUrl } = user
  const primaryEmail = emailAddresses[0]?.emailAddress

  return (
    <div>
      <h1>Welcome, {firstName}!</h1>
      <p>Email: {primaryEmail}</p>
      <img src={imageUrl} alt="Profile" className="w-12 h-12 rounded-full" />
    </div>
  )
}
```

### Get Auth State (Server Components)

```typescript
// app/api-example/page.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const { userId, sessionClaims, orgId, orgRole } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Check organization membership
  if (orgId) {
    console.log(`User is in org ${orgId} with role ${orgRole}`)
  }

  // Access custom session claims
  const userRole = sessionClaims?.metadata?.role as string | undefined

  return (
    <div>
      <p>User ID: {userId}</p>
      {userRole && <p>Role: {userRole}</p>}
    </div>
  )
}
```

### API Route Protection

```typescript
// app/api/protected/route.ts
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch user-specific data
  const data = await fetchUserData(userId)

  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { userId, orgId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  // Create resource owned by user
  const resource = await createResource({
    ...body,
    userId,
    orgId, // Optional: associate with organization
  })

  return NextResponse.json(resource, { status: 201 })
}
```

## Client-Side Authentication

### User Button Component

```typescript
// components/user-nav.tsx
'use client'

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs'

export function UserNav() {
  return (
    <div className="flex items-center gap-4">
      <SignedOut>
        <SignInButton mode="modal">
          <button className="btn btn-ghost">Sign In</button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="btn btn-primary">Get Started</button>
        </SignUpButton>
      </SignedOut>

      <SignedIn>
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'w-10 h-10',
            },
          }}
          afterSignOutUrl="/"
          userProfileMode="navigation"
          userProfileUrl="/settings/profile"
        >
          <UserButton.MenuItems>
            <UserButton.Link
              label="Dashboard"
              labelIcon={<DashboardIcon />}
              href="/dashboard"
            />
            <UserButton.Link
              label="Settings"
              labelIcon={<SettingsIcon />}
              href="/settings"
            />
            <UserButton.Action label="manageAccount" />
          </UserButton.MenuItems>
        </UserButton>
      </SignedIn>
    </div>
  )
}
```

### useUser Hook

```typescript
// components/profile-form.tsx
'use client'

import { useUser } from '@clerk/nextjs'
import { useState } from 'react'

export function ProfileForm() {
  const { isLoaded, isSignedIn, user } = useUser()
  const [firstName, setFirstName] = useState('')

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  if (!isSignedIn) {
    return <div>Please sign in</div>
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      await user.update({
        firstName,
      })

      // Optionally update public metadata
      await user.update({
        unsafeMetadata: {
          onboardingComplete: true,
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        },
      })
    } catch (error) {
      console.error('Failed to update user:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        placeholder={user.firstName || 'First name'}
      />
      <button type="submit">Update</button>
    </form>
  )
}
```

### useAuth Hook

```typescript
// components/api-caller.tsx
'use client'

import { useAuth } from '@clerk/nextjs'

export function ApiCaller() {
  const { isLoaded, userId, getToken } = useAuth()

  async function callProtectedApi() {
    if (!isLoaded || !userId) return

    // Get session token for API calls
    const token = await getToken()

    const response = await fetch('/api/protected', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response.json()
  }

  // For external APIs that need a custom JWT template
  async function callExternalApi() {
    const token = await getToken({ template: 'supabase' })

    // Use token with Supabase client
  }

  return <button onClick={callProtectedApi}>Call API</button>
}
```

## Organizations (Multi-Tenancy)

### Organization Switcher

```typescript
// components/org-switcher.tsx
'use client'

import { OrganizationSwitcher } from '@clerk/nextjs'

export function OrgSwitcher() {
  return (
    <OrganizationSwitcher
      appearance={{
        elements: {
          rootBox: 'w-full',
          organizationSwitcherTrigger: 'w-full justify-between',
        },
      }}
      createOrganizationMode="modal"
      organizationProfileMode="navigation"
      organizationProfileUrl="/settings/organization"
      afterCreateOrganizationUrl="/dashboard"
      afterSelectOrganizationUrl="/dashboard"
      afterLeaveOrganizationUrl="/dashboard"
    />
  )
}
```

### Organization-Scoped Data

```typescript
// app/api/projects/route.ts
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function GET() {
  const { userId, orgId } = await auth()

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch projects scoped to organization (if in one) or user
  const projects = await db.project.findMany({
    where: orgId
      ? { organizationId: orgId }
      : { userId, organizationId: null },
  })

  return Response.json(projects)
}
```

### Role-Based Access Control

```typescript
// lib/auth.ts
import { auth } from '@clerk/nextjs/server'

type OrgRole = 'org:admin' | 'org:member' | 'org:billing'

export async function requireOrgRole(allowedRoles: OrgRole[]) {
  const { userId, orgId, orgRole } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  if (!orgId) {
    throw new Error('No organization selected')
  }

  if (!allowedRoles.includes(orgRole as OrgRole)) {
    throw new Error('Insufficient permissions')
  }

  return { userId, orgId, orgRole }
}

// Usage in API route
export async function DELETE(req: Request) {
  const { orgId } = await requireOrgRole(['org:admin'])

  // Only org admins can delete
  await deleteResource(orgId)

  return Response.json({ success: true })
}
```

## Webhooks (Sync User Data)

### Webhook Handler

```typescript
// app/api/webhooks/clerk/route.ts
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { Webhook } from 'svix'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Missing CLERK_WEBHOOK_SECRET')
  }

  // Get headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return Response.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  // Get body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Verify webhook
  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle events
  switch (evt.type) {
    case 'user.created': {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data

      await db.user.create({
        data: {
          clerkId: id,
          email: email_addresses[0]?.email_address ?? '',
          firstName: first_name,
          lastName: last_name,
          imageUrl: image_url,
        },
      })
      break
    }

    case 'user.updated': {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data

      await db.user.update({
        where: { clerkId: id },
        data: {
          email: email_addresses[0]?.email_address,
          firstName: first_name,
          lastName: last_name,
          imageUrl: image_url,
        },
      })
      break
    }

    case 'user.deleted': {
      const { id } = evt.data

      if (id) {
        await db.user.delete({
          where: { clerkId: id },
        })
      }
      break
    }

    case 'organization.created': {
      const { id, name, slug, image_url, created_by } = evt.data

      await db.organization.create({
        data: {
          clerkId: id,
          name,
          slug: slug ?? id,
          imageUrl: image_url,
          createdBy: created_by,
        },
      })
      break
    }

    case 'organizationMembership.created': {
      const { organization, public_user_data, role } = evt.data

      await db.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: public_user_data.user_id,
          role,
        },
      })
      break
    }

    case 'organizationMembership.deleted': {
      const { organization, public_user_data } = evt.data

      await db.organizationMember.delete({
        where: {
          organizationId_userId: {
            organizationId: organization.id,
            userId: public_user_data.user_id,
          },
        },
      })
      break
    }
  }

  return Response.json({ received: true })
}
```

## Custom Session Claims

### Configure in Clerk Dashboard

```json
// Clerk Dashboard > Sessions > Customize session token
{
  "metadata": "{{user.public_metadata}}",
  "role": "{{user.public_metadata.role}}",
  "plan": "{{user.public_metadata.plan}}",
  "orgMetadata": "{{org.public_metadata}}"
}
```

### Access Custom Claims

```typescript
// lib/auth.ts
import { auth } from '@clerk/nextjs/server'

type UserRole = 'admin' | 'user' | 'moderator'
type Plan = 'free' | 'pro' | 'enterprise'

export async function getUserPlan(): Promise<Plan> {
  const { sessionClaims } = await auth()
  return (sessionClaims?.plan as Plan) ?? 'free'
}

export async function requirePlan(requiredPlans: Plan[]) {
  const plan = await getUserPlan()

  if (!requiredPlans.includes(plan)) {
    throw new Error('Upgrade required')
  }

  return plan
}

export async function requireRole(requiredRoles: UserRole[]) {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.role as UserRole) ?? 'user'

  if (!requiredRoles.includes(role)) {
    throw new Error('Insufficient permissions')
  }

  return role
}
```

## Prisma Schema

```prisma
// prisma/schema.prisma

model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String   @unique
  firstName String?
  lastName  String?
  imageUrl  String?

  // Subscription
  plan      Plan     @default(FREE)
  stripeCustomerId String? @unique

  // Relations
  projects  Project[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([clerkId])
  @@index([email])
}

model Organization {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  name      String
  slug      String   @unique
  imageUrl  String?
  createdBy String

  // Relations
  members   OrganizationMember[]
  projects  Project[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([clerkId])
  @@index([slug])
}

model OrganizationMember {
  id             String       @id @default(cuid())
  organizationId String
  userId         String
  role           String

  organization   Organization @relation(fields: [organizationId], references: [clerkId], onDelete: Cascade)

  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@unique([organizationId, userId])
  @@index([organizationId])
  @@index([userId])
}

model Project {
  id             String        @id @default(cuid())
  name           String
  userId         String?
  organizationId String?

  user           User?         @relation(fields: [userId], references: [clerkId], onDelete: Cascade)
  organization   Organization? @relation(fields: [organizationId], references: [clerkId], onDelete: Cascade)

  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@index([userId])
  @@index([organizationId])
}

enum Plan {
  FREE
  PRO
  ENTERPRISE
}
```

## Testing

### Mock Clerk in Tests

```typescript
// tests/setup.ts
import { vi } from 'vitest'

// Mock Clerk
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({
    userId: 'test-user-id',
    orgId: null,
    sessionClaims: { role: 'user', plan: 'free' },
  })),
  currentUser: vi.fn(() => ({
    id: 'test-user-id',
    firstName: 'Test',
    lastName: 'User',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
  })),
  clerkMiddleware: vi.fn(() => (req: Request) => req),
}))

vi.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useUser: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: 'test-user-id',
      firstName: 'Test',
      lastName: 'User',
    },
  }),
  useAuth: () => ({
    isLoaded: true,
    userId: 'test-user-id',
    getToken: () => Promise.resolve('mock-token'),
  }),
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
}))
```

### Integration Tests

```typescript
// tests/api/protected.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/protected/route'
import { auth } from '@clerk/nextjs/server'

vi.mock('@clerk/nextjs/server')

describe('Protected API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any)

    const response = await GET()
    expect(response.status).toBe(401)
  })

  it('returns data when authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)

    const response = await GET()
    expect(response.status).toBe(200)
  })
})
```

## CLAUDE.md Integration

```markdown
## Authentication

Using Clerk for authentication.

### Key Files
- `middleware.ts` - Route protection
- `app/sign-in/[[...sign-in]]/page.tsx` - Sign in page
- `app/sign-up/[[...sign-up]]/page.tsx` - Sign up page
- `app/api/webhooks/clerk/route.ts` - Webhook handler

### Auth Patterns
```typescript
// Server Components
import { currentUser, auth } from '@clerk/nextjs/server'
const user = await currentUser()
const { userId, orgId } = await auth()

// Client Components
import { useUser, useAuth } from '@clerk/nextjs'
const { user } = useUser()
const { getToken } = useAuth()
```

### Protected Routes
Routes starting with `/dashboard`, `/settings`, `/api/protected` require authentication.

### Organizations
- Users can create/join organizations
- Data can be scoped to org or personal
- Roles: `org:admin`, `org:member`, `org:billing`
```

## AI Suggestions

### Security Enhancements
1. **Rate limiting** - Add rate limiting to auth endpoints
2. **Session rotation** - Enable session rotation in Clerk settings
3. **IP allowlisting** - Restrict admin access by IP
4. **Audit logging** - Log all auth events

### UX Improvements
1. **Magic links** - Enable passwordless authentication
2. **Passkeys** - Enable WebAuthn/passkey support
3. **Social login** - Add Google, GitHub, Apple sign-in
4. **MFA enforcement** - Require MFA for sensitive roles

### Performance
1. **Edge middleware** - Clerk middleware runs on edge for fast auth checks
2. **Token caching** - Cache getToken() results
3. **Preload user** - Use `<ClerkLoaded>` for better UX

### Monitoring
1. **Track auth events** - Send to analytics (PostHog, Mixpanel)
2. **Alert on failures** - Monitor failed auth attempts
3. **Session analytics** - Track active sessions, devices
