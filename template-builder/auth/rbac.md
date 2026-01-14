# Role-Based Access Control (RBAC) Template

Complete RBAC implementation patterns for applications.

## Overview

RBAC provides:
- Role assignments to users
- Permission assignments to roles
- Hierarchical roles
- Resource-based permissions
- Dynamic permission checking

## Database Schema

### Prisma Schema

```prisma
// prisma/schema.prisma

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?

  // Direct role (simple approach)
  role      Role     @default(USER)

  // Many-to-many roles (complex approach)
  userRoles UserRole[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Simple role enum
enum Role {
  USER
  MODERATOR
  ADMIN
  SUPER_ADMIN
}

// Complex role system with permissions
model RoleDefinition {
  id          String       @id @default(cuid())
  name        String       @unique
  description String?
  level       Int          @default(0) // For hierarchy
  permissions Permission[]
  userRoles   UserRole[]

  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model Permission {
  id          String           @id @default(cuid())
  name        String           @unique // e.g., "users:read", "posts:write"
  description String?
  resource    String           // e.g., "users", "posts"
  action      String           // e.g., "read", "write", "delete"
  roles       RoleDefinition[]

  @@unique([resource, action])
}

model UserRole {
  id        String         @id @default(cuid())
  userId    String
  roleId    String
  scope     String?        // Optional: org/team scope
  expiresAt DateTime?      // Optional: temporary roles

  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      RoleDefinition @relation(fields: [roleId], references: [id], onDelete: Cascade)

  createdAt DateTime       @default(now())

  @@unique([userId, roleId, scope])
  @@index([userId])
  @@index([roleId])
}
```

## Simple RBAC (Role Enum)

### Role Definitions

```typescript
// lib/rbac/roles.ts

export type Role = 'user' | 'moderator' | 'admin' | 'super_admin'

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY: Record<Role, number> = {
  user: 1,
  moderator: 2,
  admin: 3,
  super_admin: 4,
}

// Role permissions
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  user: [
    'profile:read',
    'profile:update',
    'posts:read',
    'posts:create',
    'posts:update:own',
    'posts:delete:own',
  ],
  moderator: [
    'users:read',
    'posts:read',
    'posts:update',
    'posts:delete',
    'comments:delete',
    'reports:read',
    'reports:resolve',
  ],
  admin: [
    'users:read',
    'users:update',
    'users:ban',
    'settings:read',
    'settings:update',
    'analytics:read',
  ],
  super_admin: [
    'users:delete',
    'roles:assign',
    'settings:admin',
    'system:manage',
  ],
}

// Flatten permissions with inheritance
export function getPermissionsForRole(role: Role): string[] {
  const permissions = new Set<string>()
  const roleLevel = ROLE_HIERARCHY[role]

  for (const [r, level] of Object.entries(ROLE_HIERARCHY)) {
    if (level <= roleLevel) {
      ROLE_PERMISSIONS[r as Role].forEach(p => permissions.add(p))
    }
  }

  return Array.from(permissions)
}

// Check if role has permission
export function roleHasPermission(role: Role, permission: string): boolean {
  const permissions = getPermissionsForRole(role)
  return permissions.includes(permission)
}

// Check if role meets minimum level
export function roleAtLeast(userRole: Role, minimumRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole]
}
```

### Authorization Middleware

```typescript
// lib/rbac/middleware.ts
import { auth } from '@/lib/auth'
import { roleHasPermission, roleAtLeast, Role } from './roles'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'

// For Server Components
export async function requireRole(minimumRole: Role) {
  const session = await auth()

  if (!session?.user) {
    redirect('/sign-in')
  }

  const userRole = session.user.role as Role

  if (!roleAtLeast(userRole, minimumRole)) {
    redirect('/unauthorized')
  }

  return session
}

export async function requirePermission(permission: string) {
  const session = await auth()

  if (!session?.user) {
    redirect('/sign-in')
  }

  const userRole = session.user.role as Role

  if (!roleHasPermission(userRole, permission)) {
    redirect('/unauthorized')
  }

  return session
}

// For API Routes
export function withRole(minimumRole: Role) {
  return async function (request: Request, handler: Function) {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as Role

    if (!roleAtLeast(userRole, minimumRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return handler(request, session)
  }
}

export function withPermission(permission: string) {
  return async function (request: Request, handler: Function) {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as Role

    if (!roleHasPermission(userRole, permission)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return handler(request, session)
  }
}
```

### Usage Examples

```typescript
// app/admin/page.tsx
import { requireRole } from '@/lib/rbac/middleware'

export default async function AdminPage() {
  const session = await requireRole('admin')

  return (
    <div>
      <h1>Admin Panel</h1>
      <p>Welcome, {session.user.name}</p>
    </div>
  )
}

// app/api/users/[id]/route.ts
import { withPermission } from '@/lib/rbac/middleware'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  return withPermission('users:delete')(request, async (req, session) => {
    await deleteUser(params.id)
    return NextResponse.json({ success: true })
  })
}
```

## Complex RBAC (Database-Driven)

### Permission Service

```typescript
// lib/rbac/permission-service.ts
import { db } from '@/lib/db'
import { cache } from 'react'

// Cache permissions per request
export const getUserPermissions = cache(async (userId: string): Promise<string[]> => {
  const userRoles = await db.userRole.findMany({
    where: {
      userId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    include: {
      role: {
        include: {
          permissions: true,
        },
      },
    },
  })

  const permissions = new Set<string>()

  for (const userRole of userRoles) {
    for (const permission of userRole.role.permissions) {
      permissions.add(permission.name)
    }
  }

  return Array.from(permissions)
})

export async function userHasPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  return permissions.includes(permission)
}

export async function userHasAnyPermission(
  userId: string,
  permissions: string[]
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId)
  return permissions.some(p => userPermissions.includes(p))
}

export async function userHasAllPermissions(
  userId: string,
  permissions: string[]
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId)
  return permissions.every(p => userPermissions.includes(p))
}
```

### Role Management

```typescript
// lib/rbac/role-management.ts
import { db } from '@/lib/db'

export async function assignRole(
  userId: string,
  roleName: string,
  options?: {
    scope?: string
    expiresAt?: Date
  }
) {
  const role = await db.roleDefinition.findUnique({
    where: { name: roleName },
  })

  if (!role) {
    throw new Error(`Role ${roleName} not found`)
  }

  return db.userRole.upsert({
    where: {
      userId_roleId_scope: {
        userId,
        roleId: role.id,
        scope: options?.scope ?? null,
      },
    },
    create: {
      userId,
      roleId: role.id,
      scope: options?.scope,
      expiresAt: options?.expiresAt,
    },
    update: {
      expiresAt: options?.expiresAt,
    },
  })
}

export async function removeRole(
  userId: string,
  roleName: string,
  scope?: string
) {
  const role = await db.roleDefinition.findUnique({
    where: { name: roleName },
  })

  if (!role) {
    throw new Error(`Role ${roleName} not found`)
  }

  return db.userRole.delete({
    where: {
      userId_roleId_scope: {
        userId,
        roleId: role.id,
        scope: scope ?? null,
      },
    },
  })
}

export async function getUserRoles(userId: string, scope?: string) {
  return db.userRole.findMany({
    where: {
      userId,
      scope: scope ?? undefined,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    include: {
      role: true,
    },
  })
}
```

### Seed Roles and Permissions

```typescript
// prisma/seed.ts
import { db } from '@/lib/db'

const PERMISSIONS = [
  // Users
  { name: 'users:read', resource: 'users', action: 'read' },
  { name: 'users:create', resource: 'users', action: 'create' },
  { name: 'users:update', resource: 'users', action: 'update' },
  { name: 'users:delete', resource: 'users', action: 'delete' },
  { name: 'users:ban', resource: 'users', action: 'ban' },

  // Posts
  { name: 'posts:read', resource: 'posts', action: 'read' },
  { name: 'posts:create', resource: 'posts', action: 'create' },
  { name: 'posts:update', resource: 'posts', action: 'update' },
  { name: 'posts:delete', resource: 'posts', action: 'delete' },

  // Settings
  { name: 'settings:read', resource: 'settings', action: 'read' },
  { name: 'settings:update', resource: 'settings', action: 'update' },

  // System
  { name: 'system:manage', resource: 'system', action: 'manage' },
  { name: 'roles:assign', resource: 'roles', action: 'assign' },
]

const ROLES = [
  {
    name: 'user',
    description: 'Basic user',
    level: 1,
    permissions: ['posts:read', 'posts:create'],
  },
  {
    name: 'moderator',
    description: 'Content moderator',
    level: 2,
    permissions: [
      'users:read',
      'posts:read',
      'posts:update',
      'posts:delete',
    ],
  },
  {
    name: 'admin',
    description: 'Administrator',
    level: 3,
    permissions: [
      'users:read',
      'users:create',
      'users:update',
      'users:ban',
      'posts:read',
      'posts:create',
      'posts:update',
      'posts:delete',
      'settings:read',
      'settings:update',
    ],
  },
  {
    name: 'super_admin',
    description: 'Super Administrator',
    level: 4,
    permissions: PERMISSIONS.map(p => p.name), // All permissions
  },
]

async function seed() {
  // Create permissions
  for (const perm of PERMISSIONS) {
    await db.permission.upsert({
      where: { name: perm.name },
      create: perm,
      update: {},
    })
  }

  // Create roles with permissions
  for (const role of ROLES) {
    await db.roleDefinition.upsert({
      where: { name: role.name },
      create: {
        name: role.name,
        description: role.description,
        level: role.level,
        permissions: {
          connect: role.permissions.map(name => ({ name })),
        },
      },
      update: {
        permissions: {
          set: role.permissions.map(name => ({ name })),
        },
      },
    })
  }
}

seed()
```

## React Components

### Permission Gate

```typescript
// components/permission-gate.tsx
'use client'

import { useUser } from '@/hooks/use-user'
import { roleHasPermission, Role } from '@/lib/rbac/roles'

type PermissionGateProps = {
  permission: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { user, isLoading } = useUser()

  if (isLoading) {
    return null
  }

  if (!user) {
    return fallback
  }

  const hasPermission = roleHasPermission(user.role as Role, permission)

  if (!hasPermission) {
    return fallback
  }

  return <>{children}</>
}

// Usage
function PostActions({ post }: { post: Post }) {
  return (
    <div>
      <PermissionGate permission="posts:update">
        <button onClick={() => editPost(post.id)}>Edit</button>
      </PermissionGate>

      <PermissionGate permission="posts:delete">
        <button onClick={() => deletePost(post.id)}>Delete</button>
      </PermissionGate>
    </div>
  )
}
```

### Role Gate

```typescript
// components/role-gate.tsx
'use client'

import { useUser } from '@/hooks/use-user'
import { roleAtLeast, Role } from '@/lib/rbac/roles'

type RoleGateProps = {
  minimumRole: Role
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGate({
  minimumRole,
  children,
  fallback = null,
}: RoleGateProps) {
  const { user, isLoading } = useUser()

  if (isLoading) {
    return null
  }

  if (!user || !roleAtLeast(user.role as Role, minimumRole)) {
    return fallback
  }

  return <>{children}</>
}

// Usage
function Sidebar() {
  return (
    <nav>
      <Link href="/dashboard">Dashboard</Link>

      <RoleGate minimumRole="moderator">
        <Link href="/reports">Reports</Link>
      </RoleGate>

      <RoleGate minimumRole="admin">
        <Link href="/settings">Settings</Link>
        <Link href="/users">User Management</Link>
      </RoleGate>

      <RoleGate minimumRole="super_admin">
        <Link href="/system">System</Link>
      </RoleGate>
    </nav>
  )
}
```

### usePermissions Hook

```typescript
// hooks/use-permissions.ts
'use client'

import { useUser } from '@/hooks/use-user'
import { getPermissionsForRole, roleHasPermission, Role } from '@/lib/rbac/roles'
import { useMemo } from 'react'

export function usePermissions() {
  const { user } = useUser()

  const permissions = useMemo(() => {
    if (!user?.role) return []
    return getPermissionsForRole(user.role as Role)
  }, [user?.role])

  const can = useMemo(() => {
    return (permission: string) => {
      if (!user?.role) return false
      return roleHasPermission(user.role as Role, permission)
    }
  }, [user?.role])

  const canAny = useMemo(() => {
    return (perms: string[]) => perms.some(p => can(p))
  }, [can])

  const canAll = useMemo(() => {
    return (perms: string[]) => perms.every(p => can(p))
  }, [can])

  return {
    permissions,
    can,
    canAny,
    canAll,
    role: user?.role as Role | undefined,
  }
}

// Usage
function PostEditor({ post }: { post: Post }) {
  const { can } = usePermissions()

  return (
    <div>
      <input defaultValue={post.title} disabled={!can('posts:update')} />

      {can('posts:delete') && (
        <button onClick={() => deletePost(post.id)}>Delete</button>
      )}
    </div>
  )
}
```

## Resource-Based Permissions

### Check Ownership

```typescript
// lib/rbac/resource-permissions.ts
import { db } from '@/lib/db'
import { roleHasPermission, Role } from './roles'

export async function canAccessResource(
  userId: string,
  userRole: Role,
  resourceType: string,
  resourceId: string,
  action: 'read' | 'update' | 'delete'
): Promise<boolean> {
  // Check global permission first
  const globalPermission = `${resourceType}:${action}`
  if (roleHasPermission(userRole, globalPermission)) {
    return true
  }

  // Check own resource permission
  const ownPermission = `${resourceType}:${action}:own`
  if (roleHasPermission(userRole, ownPermission)) {
    // Verify ownership
    const resource = await getResource(resourceType, resourceId)
    return resource?.userId === userId
  }

  return false
}

async function getResource(type: string, id: string) {
  switch (type) {
    case 'posts':
      return db.post.findUnique({ where: { id } })
    case 'comments':
      return db.comment.findUnique({ where: { id } })
    default:
      return null
  }
}

// Usage in API route
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const canAccess = await canAccessResource(
    session.user.id,
    session.user.role as Role,
    'posts',
    params.id,
    'update'
  )

  if (!canAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Update post...
}
```

## Multi-Tenant RBAC

### Scoped Roles

```typescript
// lib/rbac/tenant-permissions.ts
import { db } from '@/lib/db'

export async function getUserTenantRole(
  userId: string,
  tenantId: string
): Promise<string | null> {
  const userRole = await db.userRole.findFirst({
    where: {
      userId,
      scope: tenantId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    include: { role: true },
    orderBy: { role: { level: 'desc' } }, // Highest role first
  })

  return userRole?.role.name ?? null
}

export async function getUserTenantPermissions(
  userId: string,
  tenantId: string
): Promise<string[]> {
  const userRoles = await db.userRole.findMany({
    where: {
      userId,
      scope: tenantId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    include: {
      role: {
        include: { permissions: true },
      },
    },
  })

  const permissions = new Set<string>()

  for (const userRole of userRoles) {
    for (const permission of userRole.role.permissions) {
      permissions.add(permission.name)
    }
  }

  return Array.from(permissions)
}

// Usage
export async function requireTenantPermission(
  userId: string,
  tenantId: string,
  permission: string
) {
  const permissions = await getUserTenantPermissions(userId, tenantId)

  if (!permissions.includes(permission)) {
    throw new Error('Forbidden')
  }
}
```

## CLAUDE.md Integration

```markdown
## Authorization

Using RBAC for authorization.

### Roles
- `user` - Basic user (level 1)
- `moderator` - Content moderation (level 2)
- `admin` - Administration (level 3)
- `super_admin` - Full access (level 4)

### Permission Format
`resource:action` or `resource:action:scope`
Examples: `users:read`, `posts:delete`, `posts:update:own`

### Usage Patterns
```typescript
// Server Components
import { requireRole, requirePermission } from '@/lib/rbac/middleware'
await requireRole('admin')
await requirePermission('users:delete')

// React Components
<PermissionGate permission="posts:delete">
  <DeleteButton />
</PermissionGate>

// Hooks
const { can, canAny } = usePermissions()
if (can('posts:update')) { ... }
```

### Key Files
- `lib/rbac/roles.ts` - Role definitions
- `lib/rbac/middleware.ts` - Authorization middleware
- `components/permission-gate.tsx` - React permission component
```

## AI Suggestions

### Security
1. **Least privilege** - Assign minimum necessary permissions
2. **Audit logging** - Log all permission checks
3. **Regular review** - Audit role assignments
4. **Separation of duties** - Split sensitive operations

### Performance
1. **Cache permissions** - Use React cache() or Redis
2. **Batch checks** - Check multiple permissions at once
3. **Preload** - Load permissions with user session

### Patterns
1. **Deny by default** - Explicit grants only
2. **Hierarchical roles** - Inherit from lower roles
3. **Time-bound roles** - Auto-expire temporary access
4. **Scoped roles** - Per-tenant/org permissions
