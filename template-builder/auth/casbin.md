# Casbin Authorization

Flexible access control library supporting multiple access control models (ACL, RBAC, ABAC) with policy management.

## Overview

Casbin provides:
- Multiple access control models
- Policy storage adapters
- PERM metamodel (Policy, Effect, Request, Matchers)
- Role hierarchy
- Multi-tenancy support
- Real-time policy updates

## Installation

```bash
npm install casbin
# Adapters
npm install casbin-prisma-adapter
# Or PostgreSQL
npm install casbin-pg-adapter
# Or Redis
npm install casbin-redis-adapter
```

## Environment Variables

```env
# .env.local
DATABASE_URL=postgresql://localhost:5432/myapp
CASBIN_MODEL_PATH=./config/model.conf
CASBIN_POLICY_PATH=./config/policy.csv
```

## Access Control Models

### ACL Model
```conf
# config/acl_model.conf
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act
```

### RBAC Model
```conf
# config/rbac_model.conf
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act
```

### RBAC with Domains (Multi-tenancy)
```conf
# config/rbac_domain_model.conf
[request_definition]
r = sub, dom, obj, act

[policy_definition]
p = sub, dom, obj, act

[role_definition]
g = _, _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub, r.dom) && r.dom == p.dom && r.obj == p.obj && r.act == p.act
```

### ABAC Model
```conf
# config/abac_model.conf
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub_rule, obj_rule, act

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = eval(p.sub_rule) && eval(p.obj_rule) && r.act == p.act
```

## Policy Files

```csv
# config/policy.csv
# RBAC Policies
p, admin, *, *
p, user, posts, read
p, user, posts, create
p, moderator, posts, *
p, moderator, comments, *

# Role assignments
g, alice, admin
g, bob, user
g, charlie, moderator
g, moderator, user
```

## Database Schema (Prisma)

```prisma
// prisma/schema.prisma
model CasbinRule {
  id    Int     @id @default(autoincrement())
  ptype String
  v0    String?
  v1    String?
  v2    String?
  v3    String?
  v4    String?
  v5    String?

  @@map("casbin_rules")
}
```

## Casbin Service

```typescript
// lib/casbin/index.ts
import { newEnforcer, Enforcer, newModelFromString } from 'casbin'
import { PrismaAdapter } from 'casbin-prisma-adapter'
import { prisma } from '@/lib/prisma'

let enforcer: Enforcer | null = null

// RBAC model definition
const RBAC_MODEL = `
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && keyMatch2(r.obj, p.obj) && (r.act == p.act || p.act == "*")
`

// RBAC with domains model
const RBAC_DOMAIN_MODEL = `
[request_definition]
r = sub, dom, obj, act

[policy_definition]
p = sub, dom, obj, act

[role_definition]
g = _, _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub, r.dom) && r.dom == p.dom && keyMatch2(r.obj, p.obj) && (r.act == p.act || p.act == "*")
`

// Get or create enforcer
export async function getEnforcer(): Promise<Enforcer> {
  if (enforcer) return enforcer

  const adapter = await PrismaAdapter.newAdapter()
  const model = newModelFromString(RBAC_MODEL)

  enforcer = await newEnforcer(model, adapter)

  // Enable auto-save
  enforcer.enableAutoSave(true)

  return enforcer
}

// Get enforcer with domains (multi-tenancy)
export async function getDomainEnforcer(): Promise<Enforcer> {
  const adapter = await PrismaAdapter.newAdapter()
  const model = newModelFromString(RBAC_DOMAIN_MODEL)

  return newEnforcer(model, adapter)
}

// Clear enforcer cache
export function clearEnforcerCache(): void {
  enforcer = null
}
```

## Authorization Service

```typescript
// lib/casbin/auth.ts
import { getEnforcer, getDomainEnforcer, clearEnforcerCache } from './index'

// Check permission
export async function checkPermission(
  subject: string,
  object: string,
  action: string
): Promise<boolean> {
  const enforcer = await getEnforcer()
  return enforcer.enforce(subject, object, action)
}

// Check permission with domain
export async function checkPermissionInDomain(
  subject: string,
  domain: string,
  object: string,
  action: string
): Promise<boolean> {
  const enforcer = await getDomainEnforcer()
  return enforcer.enforce(subject, domain, object, action)
}

// Get all permissions for a user
export async function getUserPermissions(user: string): Promise<string[][]> {
  const enforcer = await getEnforcer()
  return enforcer.getPermissionsForUser(user)
}

// Get all roles for a user
export async function getUserRoles(user: string): Promise<string[]> {
  const enforcer = await getEnforcer()
  return enforcer.getRolesForUser(user)
}

// Get users with a role
export async function getUsersForRole(role: string): Promise<string[]> {
  const enforcer = await getEnforcer()
  return enforcer.getUsersForRole(role)
}

// Get implicit permissions (including inherited from roles)
export async function getImplicitPermissions(user: string): Promise<string[][]> {
  const enforcer = await getEnforcer()
  return enforcer.getImplicitPermissionsForUser(user)
}

// Get implicit roles (including inherited roles)
export async function getImplicitRoles(user: string): Promise<string[]> {
  const enforcer = await getEnforcer()
  return enforcer.getImplicitRolesForUser(user)
}
```

## Policy Management

```typescript
// lib/casbin/policy.ts
import { getEnforcer, clearEnforcerCache } from './index'

// Add policy
export async function addPolicy(
  subject: string,
  object: string,
  action: string
): Promise<boolean> {
  const enforcer = await getEnforcer()
  const added = await enforcer.addPolicy(subject, object, action)
  if (added) clearEnforcerCache()
  return added
}

// Remove policy
export async function removePolicy(
  subject: string,
  object: string,
  action: string
): Promise<boolean> {
  const enforcer = await getEnforcer()
  const removed = await enforcer.removePolicy(subject, object, action)
  if (removed) clearEnforcerCache()
  return removed
}

// Add role for user
export async function addRoleForUser(
  user: string,
  role: string
): Promise<boolean> {
  const enforcer = await getEnforcer()
  const added = await enforcer.addRoleForUser(user, role)
  if (added) clearEnforcerCache()
  return added
}

// Remove role from user
export async function removeRoleForUser(
  user: string,
  role: string
): Promise<boolean> {
  const enforcer = await getEnforcer()
  const removed = await enforcer.deleteRoleForUser(user, role)
  if (removed) clearEnforcerCache()
  return removed
}

// Delete all roles for user
export async function deleteRolesForUser(user: string): Promise<boolean> {
  const enforcer = await getEnforcer()
  const deleted = await enforcer.deleteRolesForUser(user)
  if (deleted) clearEnforcerCache()
  return deleted
}

// Delete user
export async function deleteUser(user: string): Promise<boolean> {
  const enforcer = await getEnforcer()
  const deleted = await enforcer.deleteUser(user)
  if (deleted) clearEnforcerCache()
  return deleted
}

// Delete role
export async function deleteRole(role: string): Promise<boolean> {
  const enforcer = await getEnforcer()
  const deleted = await enforcer.deleteRole(role)
  if (deleted) clearEnforcerCache()
  return deleted
}

// Get all subjects
export async function getAllSubjects(): Promise<string[]> {
  const enforcer = await getEnforcer()
  return enforcer.getAllSubjects()
}

// Get all roles
export async function getAllRoles(): Promise<string[]> {
  const enforcer = await getEnforcer()
  return enforcer.getAllRoles()
}

// Get all policies
export async function getAllPolicies(): Promise<string[][]> {
  const enforcer = await getEnforcer()
  return enforcer.getPolicy()
}

// Get filtered policies
export async function getFilteredPolicy(
  fieldIndex: number,
  ...fieldValues: string[]
): Promise<string[][]> {
  const enforcer = await getEnforcer()
  return enforcer.getFilteredPolicy(fieldIndex, ...fieldValues)
}
```

## Middleware

```typescript
// middleware/casbin.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { checkPermission, checkPermissionInDomain } from '@/lib/casbin/auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

interface CasbinOptions {
  getSubject?: (session: any) => string
  getObject?: (request: NextRequest) => string
  getAction?: (request: NextRequest) => string
  getDomain?: (request: NextRequest) => string | null
}

const defaultOptions: CasbinOptions = {
  getSubject: (session) => session?.user?.id || 'anonymous',
  getObject: (request) => request.nextUrl.pathname,
  getAction: (request) => request.method.toLowerCase(),
  getDomain: () => null,
}

export function withCasbin(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: CasbinOptions = {}
): (request: NextRequest) => Promise<NextResponse> {
  const config = { ...defaultOptions, ...options }

  return async (request: NextRequest) => {
    const session = await getServerSession(authOptions)

    const subject = config.getSubject!(session)
    const object = config.getObject!(request)
    const action = config.getAction!(request)
    const domain = config.getDomain!(request)

    let allowed: boolean

    if (domain) {
      allowed = await checkPermissionInDomain(subject, domain, object, action)
    } else {
      allowed = await checkPermission(subject, object, action)
    }

    if (!allowed) {
      return NextResponse.json(
        { error: 'Forbidden', subject, object, action },
        { status: 403 }
      )
    }

    return handler(request)
  }
}

// Route-based middleware
export async function casbinMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip public routes
  if (pathname.startsWith('/api/public') || pathname.startsWith('/_next')) {
    return NextResponse.next()
  }

  // Get session from cookie or header
  const sessionToken = request.cookies.get('next-auth.session-token')?.value
  if (!sessionToken) {
    return NextResponse.next() // Let route handlers handle auth
  }

  // For protected API routes, check Casbin
  if (pathname.startsWith('/api/')) {
    // Extract resource from path
    const resource = pathname.replace('/api/', '').split('/')[0]
    const action = request.method.toLowerCase()

    // This requires session lookup - better done in route handlers
    // Return next() and let route handlers use withCasbin
    return NextResponse.next()
  }

  return NextResponse.next()
}
```

## API Routes

```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withCasbin } from '@/middleware/casbin'

async function getPosts(request: NextRequest) {
  // Your logic here
  return NextResponse.json({ posts: [] })
}

async function createPost(request: NextRequest) {
  // Your logic here
  const body = await request.json()
  return NextResponse.json({ post: body }, { status: 201 })
}

export const GET = withCasbin(getPosts, {
  getObject: () => 'posts',
  getAction: () => 'read',
})

export const POST = withCasbin(createPost, {
  getObject: () => 'posts',
  getAction: () => 'create',
})
```

```typescript
// app/api/admin/policies/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import {
  getAllPolicies,
  addPolicy,
  removePolicy,
  addRoleForUser,
  removeRoleForUser,
  getAllRoles,
} from '@/lib/casbin/policy'
import { checkPermission } from '@/lib/casbin/auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Get all policies
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check admin permission
  const canManage = await checkPermission(session.user.id, 'policies', 'manage')
  if (!canManage) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const policies = await getAllPolicies()
  const roles = await getAllRoles()

  return NextResponse.json({ policies, roles })
}

// Add policy or role assignment
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const canManage = await checkPermission(session.user.id, 'policies', 'manage')
  if (!canManage) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { type, subject, object, action, role, user } = body

  if (type === 'policy') {
    const added = await addPolicy(subject, object, action)
    return NextResponse.json({ success: added })
  }

  if (type === 'role') {
    const added = await addRoleForUser(user, role)
    return NextResponse.json({ success: added })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}

// Remove policy or role assignment
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const canManage = await checkPermission(session.user.id, 'policies', 'manage')
  if (!canManage) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const subject = searchParams.get('subject')
  const object = searchParams.get('object')
  const action = searchParams.get('action')
  const role = searchParams.get('role')
  const user = searchParams.get('user')

  if (type === 'policy' && subject && object && action) {
    const removed = await removePolicy(subject, object, action)
    return NextResponse.json({ success: removed })
  }

  if (type === 'role' && user && role) {
    const removed = await removeRoleForUser(user, role)
    return NextResponse.json({ success: removed })
  }

  return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
}
```

## React Hook

```typescript
// hooks/use-casbin.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export function useCasbin() {
  const { data: session } = useSession()
  const [permissions, setPermissions] = useState<Map<string, boolean>>(new Map())
  const [loading, setLoading] = useState(false)

  const checkPermission = useCallback(async (
    object: string,
    action: string
  ): Promise<boolean> => {
    const key = `${object}:${action}`

    // Check cache
    if (permissions.has(key)) {
      return permissions.get(key)!
    }

    try {
      const response = await fetch('/api/auth/check-permission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ object, action }),
      })

      const { allowed } = await response.json()

      setPermissions(prev => new Map(prev).set(key, allowed))
      return allowed
    } catch {
      return false
    }
  }, [permissions])

  const can = useCallback((object: string, action: string): boolean => {
    const key = `${object}:${action}`
    return permissions.get(key) ?? false
  }, [permissions])

  // Preload common permissions
  const preloadPermissions = useCallback(async (
    checks: Array<{ object: string; action: string }>
  ) => {
    setLoading(true)
    await Promise.all(
      checks.map(({ object, action }) => checkPermission(object, action))
    )
    setLoading(false)
  }, [checkPermission])

  return {
    can,
    checkPermission,
    preloadPermissions,
    loading,
    isAuthenticated: !!session,
  }
}
```

## React Component

```typescript
// components/auth/casbin-gate.tsx
'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useCasbin } from '@/hooks/use-casbin'

interface CasbinGateProps {
  object: string
  action: string
  children: ReactNode
  fallback?: ReactNode
}

export function CasbinGate({
  object,
  action,
  children,
  fallback = null,
}: CasbinGateProps) {
  const { checkPermission, can } = useCasbin()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    checkPermission(object, action).then(() => setChecked(true))
  }, [object, action, checkPermission])

  if (!checked) {
    return null
  }

  if (!can(object, action)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Usage
function AdminPanel() {
  return (
    <div>
      <h1>Dashboard</h1>

      <CasbinGate object="users" action="manage">
        <button>Manage Users</button>
      </CasbinGate>

      <CasbinGate object="posts" action="delete">
        <button>Delete All Posts</button>
      </CasbinGate>

      <CasbinGate
        object="settings"
        action="update"
        fallback={<p>You cannot modify settings</p>}
      >
        <button>Update Settings</button>
      </CasbinGate>
    </div>
  )
}
```

## Testing

```typescript
// __tests__/casbin.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { newEnforcer, newModelFromString } from 'casbin'

const RBAC_MODEL = `
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act
`

describe('Casbin Authorization', () => {
  let enforcer: any

  beforeAll(async () => {
    const model = newModelFromString(RBAC_MODEL)
    enforcer = await newEnforcer(model)

    // Add policies
    await enforcer.addPolicy('admin', 'posts', '*')
    await enforcer.addPolicy('user', 'posts', 'read')
    await enforcer.addPolicy('user', 'posts', 'create')

    // Add role assignments
    await enforcer.addRoleForUser('alice', 'admin')
    await enforcer.addRoleForUser('bob', 'user')
  })

  describe('Permission checks', () => {
    it('admin should have all permissions on posts', async () => {
      expect(await enforcer.enforce('alice', 'posts', 'read')).toBe(true)
      expect(await enforcer.enforce('alice', 'posts', 'create')).toBe(true)
      expect(await enforcer.enforce('alice', 'posts', 'delete')).toBe(true)
    })

    it('user should only have read and create on posts', async () => {
      expect(await enforcer.enforce('bob', 'posts', 'read')).toBe(true)
      expect(await enforcer.enforce('bob', 'posts', 'create')).toBe(true)
      expect(await enforcer.enforce('bob', 'posts', 'delete')).toBe(false)
    })

    it('unknown user should have no permissions', async () => {
      expect(await enforcer.enforce('charlie', 'posts', 'read')).toBe(false)
    })
  })

  describe('Role management', () => {
    it('should return roles for user', async () => {
      const roles = await enforcer.getRolesForUser('alice')
      expect(roles).toContain('admin')
    })

    it('should return users for role', async () => {
      const users = await enforcer.getUsersForRole('user')
      expect(users).toContain('bob')
    })
  })
})
```

## CLAUDE.md Integration

```markdown
## Casbin Authorization

This project uses Casbin for access control.

### Key Files
- `lib/casbin/index.ts` - Enforcer setup
- `lib/casbin/auth.ts` - Authorization checks
- `lib/casbin/policy.ts` - Policy management
- `config/rbac_model.conf` - RBAC model definition

### Access Control Model
Using RBAC (Role-Based Access Control) with:
- Roles: admin, user, moderator
- Resources: posts, comments, users, settings
- Actions: read, create, update, delete, manage

### Usage
```typescript
// Check permission
const allowed = await checkPermission(userId, 'posts', 'delete')

// Add role
await addRoleForUser(userId, 'admin')
```

### Admin Commands
```bash
# View all policies
curl /api/admin/policies

# Add policy
curl -X POST /api/admin/policies -d '{"type":"policy","subject":"user","object":"posts","action":"read"}'
```
```

## AI Suggestions

1. **Policy versioning** - Track policy changes with version history
2. **Policy inheritance** - Support resource hierarchies (e.g., /posts/* inherits from /posts)
3. **Watcher** - Sync policies across multiple instances
4. **Policy simulation** - Test what-if scenarios before applying changes
5. **Audit logging** - Log all authorization decisions
6. **Time-based policies** - Support temporal access control
7. **Request caching** - Cache enforcement results for performance
8. **GraphQL integration** - Field-level authorization for GraphQL APIs
