# Keycloak Authentication

Self-hosted identity and access management with Keycloak for enterprise applications requiring full control over authentication infrastructure.

## Overview

Keycloak provides:
- Self-hosted authentication server
- OpenID Connect / OAuth 2.0 / SAML 2.0
- Single Sign-On (SSO)
- Identity brokering
- User federation (LDAP/AD)
- Fine-grained authorization

## Installation

```bash
# Keycloak Server (Docker)
docker run -d --name keycloak \
  -p 8080:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:latest start-dev

# Production with PostgreSQL
docker-compose up -d
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: keycloak_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  keycloak:
    image: quay.io/keycloak/keycloak:latest
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: keycloak_password
      KC_HOSTNAME: auth.yourdomain.com
      KC_HOSTNAME_STRICT: 'false'
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin_password
    command: start
    ports:
      - "8080:8080"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

## Next.js Client Setup

```bash
npm install next-auth @auth/core keycloak-js
```

## Environment Variables

```env
# .env.local
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=myrealm
KEYCLOAK_CLIENT_ID=nextjs-app
KEYCLOAK_CLIENT_SECRET=your-client-secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

## NextAuth.js Keycloak Provider

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from 'next-auth'
import KeycloakProvider from 'next-auth/providers/keycloak'
import { JWT } from 'next-auth/jwt'

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const url = `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.KEYCLOAK_CLIENT_ID!,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken as string,
      }),
    })

    const refreshedTokens = await response.json()

    if (!response.ok) throw refreshedTokens

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    }
  } catch (error) {
    console.error('Error refreshing access token:', error)
    return { ...token, error: 'RefreshAccessTokenError' }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          accessTokenExpires: account.expires_at! * 1000,
          refreshToken: account.refresh_token,
          user,
        }
      }

      // Return previous token if the access token has not expired
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token
      }

      // Access token expired, refresh it
      return refreshAccessToken(token)
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.error = token.error as string | undefined
      session.user = token.user as any
      return session
    },
  },
  events: {
    async signOut({ token }) {
      // Logout from Keycloak
      const logoutUrl = `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/logout`

      await fetch(logoutUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.KEYCLOAK_CLIENT_ID!,
          client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
          refresh_token: token.refreshToken as string,
        }),
      })
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

## Type Extensions

```typescript
// types/next-auth.d.ts
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    error?: string
    user: {
      id: string
      email: string
      name: string
      roles: string[]
      groups: string[]
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    accessTokenExpires?: number
    refreshToken?: string
    error?: string
    user?: {
      id: string
      email: string
      name: string
      roles: string[]
      groups: string[]
    }
  }
}
```

## Keycloak Admin Client

```typescript
// lib/keycloak/admin.ts
import KcAdminClient from '@keycloak/keycloak-admin-client'

let adminClient: KcAdminClient | null = null
let tokenExpires = 0

async function getAdminClient(): Promise<KcAdminClient> {
  if (adminClient && Date.now() < tokenExpires) {
    return adminClient
  }

  adminClient = new KcAdminClient({
    baseUrl: process.env.KEYCLOAK_URL,
    realmName: 'master',
  })

  await adminClient.auth({
    grantType: 'client_credentials',
    clientId: 'admin-cli',
    clientSecret: process.env.KEYCLOAK_ADMIN_SECRET,
  })

  // Token expires in 60 seconds, refresh at 50
  tokenExpires = Date.now() + 50000

  // Set target realm
  adminClient.setConfig({ realmName: process.env.KEYCLOAK_REALM })

  return adminClient
}

// User Management
export async function createUser(userData: {
  email: string
  firstName?: string
  lastName?: string
  password?: string
  enabled?: boolean
  groups?: string[]
}) {
  const client = await getAdminClient()

  const user = await client.users.create({
    email: userData.email,
    username: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    enabled: userData.enabled ?? true,
    emailVerified: false,
    requiredActions: ['VERIFY_EMAIL'],
  })

  // Set password if provided
  if (userData.password) {
    await client.users.resetPassword({
      id: user.id,
      credential: {
        temporary: false,
        type: 'password',
        value: userData.password,
      },
    })
  }

  // Add to groups
  if (userData.groups?.length) {
    for (const groupName of userData.groups) {
      const groups = await client.groups.find({ search: groupName })
      if (groups[0]) {
        await client.users.addToGroup({ id: user.id, groupId: groups[0].id! })
      }
    }
  }

  return user
}

export async function getUser(userId: string) {
  const client = await getAdminClient()
  return client.users.findOne({ id: userId })
}

export async function getUserByEmail(email: string) {
  const client = await getAdminClient()
  const users = await client.users.find({ email, exact: true })
  return users[0] || null
}

export async function updateUser(userId: string, data: Partial<{
  email: string
  firstName: string
  lastName: string
  enabled: boolean
  emailVerified: boolean
}>) {
  const client = await getAdminClient()
  await client.users.update({ id: userId }, data)
}

export async function deleteUser(userId: string) {
  const client = await getAdminClient()
  await client.users.del({ id: userId })
}

export async function listUsers(params?: {
  first?: number
  max?: number
  search?: string
}) {
  const client = await getAdminClient()
  return client.users.find(params)
}

// Role Management
export async function getUserRoles(userId: string) {
  const client = await getAdminClient()
  return client.users.listRealmRoleMappings({ id: userId })
}

export async function assignRole(userId: string, roleName: string) {
  const client = await getAdminClient()

  const role = await client.roles.findOneByName({ name: roleName })
  if (!role) throw new Error(`Role ${roleName} not found`)

  await client.users.addRealmRoleMappings({
    id: userId,
    roles: [{ id: role.id!, name: role.name! }],
  })
}

export async function removeRole(userId: string, roleName: string) {
  const client = await getAdminClient()

  const role = await client.roles.findOneByName({ name: roleName })
  if (!role) throw new Error(`Role ${roleName} not found`)

  await client.users.delRealmRoleMappings({
    id: userId,
    roles: [{ id: role.id!, name: role.name! }],
  })
}

// Group Management
export async function getUserGroups(userId: string) {
  const client = await getAdminClient()
  return client.users.listGroups({ id: userId })
}

export async function addUserToGroup(userId: string, groupId: string) {
  const client = await getAdminClient()
  await client.users.addToGroup({ id: userId, groupId })
}

export async function removeUserFromGroup(userId: string, groupId: string) {
  const client = await getAdminClient()
  await client.users.delFromGroup({ id: userId, groupId })
}

// Session Management
export async function getUserSessions(userId: string) {
  const client = await getAdminClient()
  return client.users.listSessions({ id: userId })
}

export async function logoutUser(userId: string) {
  const client = await getAdminClient()
  await client.users.logout({ id: userId })
}

export async function logoutAllSessions(userId: string) {
  const client = await getAdminClient()
  const sessions = await client.users.listSessions({ id: userId })

  for (const session of sessions) {
    await client.realms.deleteSession({
      realm: process.env.KEYCLOAK_REALM!,
      session: session.id!,
    })
  }
}
```

## Server-Side Token Validation

```typescript
// lib/keycloak/validate.ts
import * as jose from 'jose'

interface KeycloakTokenPayload {
  exp: number
  iat: number
  sub: string
  email: string
  email_verified: boolean
  name: string
  preferred_username: string
  realm_access: { roles: string[] }
  resource_access: Record<string, { roles: string[] }>
}

let jwks: jose.JWTVerifyGetKey | null = null

async function getJWKS() {
  if (!jwks) {
    const issuer = `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`
    jwks = jose.createRemoteJWKSet(new URL(`${issuer}/protocol/openid-connect/certs`))
  }
  return jwks
}

export async function validateToken(token: string): Promise<KeycloakTokenPayload | null> {
  try {
    const jwks = await getJWKS()
    const issuer = `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`

    const { payload } = await jose.jwtVerify(token, jwks, {
      issuer,
      audience: process.env.KEYCLOAK_CLIENT_ID,
    })

    return payload as unknown as KeycloakTokenPayload
  } catch (error) {
    console.error('Token validation failed:', error)
    return null
  }
}

export function hasRole(payload: KeycloakTokenPayload, role: string): boolean {
  return payload.realm_access?.roles?.includes(role) ?? false
}

export function hasClientRole(
  payload: KeycloakTokenPayload,
  clientId: string,
  role: string
): boolean {
  return payload.resource_access?.[clientId]?.roles?.includes(role) ?? false
}
```

## Middleware

```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Check for token refresh errors
    if (token?.error === 'RefreshAccessTokenError') {
      return NextResponse.redirect(new URL('/login?error=SessionExpired', req.url))
    }

    // Role-based access control
    if (path.startsWith('/admin')) {
      const roles = (token?.user as any)?.roles || []
      if (!roles.includes('admin')) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/settings/:path*'],
}
```

## React Hooks

```typescript
// hooks/use-keycloak-auth.ts
'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useCallback, useMemo } from 'react'

export function useKeycloakAuth() {
  const { data: session, status, update } = useSession()

  const isAuthenticated = status === 'authenticated'
  const isLoading = status === 'loading'

  const user = useMemo(() => {
    if (!session?.user) return null
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      roles: session.user.roles || [],
      groups: session.user.groups || [],
    }
  }, [session])

  const hasRole = useCallback(
    (role: string) => user?.roles.includes(role) ?? false,
    [user]
  )

  const hasAnyRole = useCallback(
    (roles: string[]) => roles.some((role) => user?.roles.includes(role)),
    [user]
  )

  const hasAllRoles = useCallback(
    (roles: string[]) => roles.every((role) => user?.roles.includes(role)),
    [user]
  )

  const login = useCallback(async (callbackUrl?: string) => {
    await signIn('keycloak', { callbackUrl: callbackUrl || '/dashboard' })
  }, [])

  const logout = useCallback(async () => {
    await signOut({ callbackUrl: '/' })
  }, [])

  return {
    user,
    session,
    isAuthenticated,
    isLoading,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    login,
    logout,
    updateSession: update,
    accessToken: session?.accessToken,
    error: session?.error,
  }
}
```

## React Components

```typescript
// components/auth/role-guard.tsx
'use client'

import { useKeycloakAuth } from '@/hooks/use-keycloak-auth'
import { useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'

interface RoleGuardProps {
  children: ReactNode
  roles: string[]
  mode?: 'any' | 'all'
  fallback?: ReactNode
  redirectTo?: string
}

export function RoleGuard({
  children,
  roles,
  mode = 'any',
  fallback,
  redirectTo,
}: RoleGuardProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading, hasAnyRole, hasAllRoles } = useKeycloakAuth()

  const hasAccess = mode === 'any' ? hasAnyRole(roles) : hasAllRoles(roles)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    } else if (!isLoading && isAuthenticated && !hasAccess && redirectTo) {
      router.push(redirectTo)
    }
  }, [isLoading, isAuthenticated, hasAccess, redirectTo, router])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return null
  }

  if (!hasAccess) {
    return fallback || null
  }

  return <>{children}</>
}
```

```typescript
// components/auth/user-menu.tsx
'use client'

import { useKeycloakAuth } from '@/hooks/use-keycloak-auth'

export function UserMenu() {
  const { user, isAuthenticated, isLoading, login, logout, hasRole } = useKeycloakAuth()

  if (isLoading) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
  }

  if (!isAuthenticated) {
    return (
      <button
        onClick={() => login()}
        className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Sign In
      </button>
    )
  }

  return (
    <div className="relative group">
      <button className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <span>{user?.name}</span>
      </button>

      <div className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
        <div className="py-2">
          <div className="px-4 py-2 text-sm text-gray-500">{user?.email}</div>
          <div className="border-t" />

          <a href="/profile" className="block px-4 py-2 text-sm hover:bg-gray-100">
            Profile
          </a>

          {hasRole('admin') && (
            <a href="/admin" className="block px-4 py-2 text-sm hover:bg-gray-100">
              Admin Panel
            </a>
          )}

          <div className="border-t" />

          <button
            onClick={() => logout()}
            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
```

## API Route Protection

```typescript
// app/api/protected/route.ts
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { validateToken, hasRole } from '@/lib/keycloak/validate'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate token with Keycloak
  const payload = await validateToken(session.accessToken)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  return NextResponse.json({
    message: 'Protected data',
    user: {
      email: payload.email,
      roles: payload.realm_access.roles,
    },
  })
}

// Admin-only endpoint
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await validateToken(session.accessToken)
  if (!payload || !hasRole(payload, 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  // Process admin request...

  return NextResponse.json({ success: true })
}
```

## Keycloak Realm Configuration

```json
// realm-export.json (import into Keycloak)
{
  "realm": "myrealm",
  "enabled": true,
  "sslRequired": "external",
  "registrationAllowed": true,
  "registrationEmailAsUsername": true,
  "verifyEmail": true,
  "loginWithEmailAllowed": true,
  "duplicateEmailsAllowed": false,
  "resetPasswordAllowed": true,
  "editUsernameAllowed": false,
  "bruteForceProtected": true,
  "permanentLockout": false,
  "maxFailureWaitSeconds": 900,
  "minimumQuickLoginWaitSeconds": 60,
  "waitIncrementSeconds": 60,
  "quickLoginCheckMilliSeconds": 1000,
  "maxDeltaTimeSeconds": 43200,
  "failureFactor": 5,
  "roles": {
    "realm": [
      { "name": "admin", "description": "Administrator" },
      { "name": "user", "description": "Regular user" },
      { "name": "moderator", "description": "Moderator" }
    ]
  },
  "groups": [
    { "name": "admins", "realmRoles": ["admin"] },
    { "name": "users", "realmRoles": ["user"] }
  ],
  "clients": [
    {
      "clientId": "nextjs-app",
      "enabled": true,
      "clientAuthenticatorType": "client-secret",
      "secret": "your-client-secret",
      "redirectUris": [
        "http://localhost:3000/*",
        "https://yourdomain.com/*"
      ],
      "webOrigins": [
        "http://localhost:3000",
        "https://yourdomain.com"
      ],
      "standardFlowEnabled": true,
      "implicitFlowEnabled": false,
      "directAccessGrantsEnabled": true,
      "publicClient": false,
      "protocol": "openid-connect",
      "fullScopeAllowed": true
    }
  ],
  "smtpServer": {
    "host": "smtp.example.com",
    "port": "587",
    "from": "noreply@yourdomain.com",
    "fromDisplayName": "Your App",
    "auth": true,
    "user": "smtp-user",
    "password": "smtp-password",
    "starttls": true
  }
}
```

## Testing

```typescript
// __tests__/keycloak.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateToken, hasRole, hasClientRole } from '@/lib/keycloak/validate'

// Mock jose
vi.mock('jose', () => ({
  createRemoteJWKSet: vi.fn(() => vi.fn()),
  jwtVerify: vi.fn(),
}))

import * as jose from 'jose'

describe('Keycloak Token Validation', () => {
  const mockPayload = {
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    sub: 'user-123',
    email: 'test@example.com',
    email_verified: true,
    name: 'Test User',
    preferred_username: 'testuser',
    realm_access: { roles: ['user', 'admin'] },
    resource_access: {
      'nextjs-app': { roles: ['read', 'write'] },
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateToken', () => {
    it('should validate a valid token', async () => {
      vi.mocked(jose.jwtVerify).mockResolvedValue({ payload: mockPayload } as any)

      const result = await validateToken('valid-token')

      expect(result).toEqual(mockPayload)
    })

    it('should return null for invalid token', async () => {
      vi.mocked(jose.jwtVerify).mockRejectedValue(new Error('Invalid token'))

      const result = await validateToken('invalid-token')

      expect(result).toBeNull()
    })
  })

  describe('hasRole', () => {
    it('should return true if user has role', () => {
      expect(hasRole(mockPayload, 'admin')).toBe(true)
      expect(hasRole(mockPayload, 'user')).toBe(true)
    })

    it('should return false if user does not have role', () => {
      expect(hasRole(mockPayload, 'superadmin')).toBe(false)
    })
  })

  describe('hasClientRole', () => {
    it('should return true if user has client role', () => {
      expect(hasClientRole(mockPayload, 'nextjs-app', 'read')).toBe(true)
      expect(hasClientRole(mockPayload, 'nextjs-app', 'write')).toBe(true)
    })

    it('should return false if user does not have client role', () => {
      expect(hasClientRole(mockPayload, 'nextjs-app', 'delete')).toBe(false)
      expect(hasClientRole(mockPayload, 'other-app', 'read')).toBe(false)
    })
  })
})
```

## CLAUDE.md Integration

```markdown
## Keycloak Authentication

This project uses self-hosted Keycloak for authentication.

### Key Files
- `lib/keycloak/admin.ts` - Admin client for user management
- `lib/keycloak/validate.ts` - Server-side token validation
- `hooks/use-keycloak-auth.ts` - React auth hook
- `app/api/auth/[...nextauth]/route.ts` - NextAuth configuration

### Keycloak Setup
1. Start Keycloak: `docker-compose up -d`
2. Access admin console: http://localhost:8080/admin
3. Create realm and client
4. Configure environment variables

### Commands
```bash
# Start Keycloak
docker-compose up -d

# View logs
docker-compose logs -f keycloak

# Import realm
docker exec keycloak /opt/keycloak/bin/kc.sh import --file /tmp/realm-export.json
```

### Role Hierarchy
- `user` - Basic access
- `moderator` - Content moderation
- `admin` - Full administrative access
```

## AI Suggestions

1. **LDAP/Active Directory federation** - Connect to existing corporate directory services for user sync
2. **Identity brokering** - Allow login with external identity providers (Google, GitHub, SAML)
3. **Custom themes** - Brand the login pages with your company's look and feel
4. **Custom user attributes** - Add organization-specific fields to user profiles
5. **Authorization services** - Use Keycloak's fine-grained authorization with policies and permissions
6. **Event listeners** - Implement custom event listeners for audit logging or webhook notifications
7. **User storage SPI** - Connect to legacy user databases while migrating to Keycloak
8. **Multi-tenancy** - Use separate realms or groups for tenant isolation
