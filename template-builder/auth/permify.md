# Permify Authorization

Google Zanzibar-inspired authorization system with relationship-based access control (ReBAC) for fine-grained permissions.

## Overview

Permify provides:
- Relationship-based access control (ReBAC)
- Google Zanzibar-inspired architecture
- Schema-based permission modeling
- Consistent authorization decisions
- Multi-tenant support
- Real-time permission updates

## Installation

```bash
# Docker
docker run -p 3476:3476 -p 3478:3478 ghcr.io/permify/permify serve

# Or download binary
curl -L https://github.com/Permify/permify/releases/latest/download/permify_Linux_x86_64.tar.gz | tar -xz

# Node.js SDK
npm install @permify/permify-node
```

## Environment Variables

```env
# .env.local
PERMIFY_HOST=localhost
PERMIFY_PORT=3476
PERMIFY_GRPC_PORT=3478
PERMIFY_TENANT_ID=t1
```

## Running Permify

```bash
# Start with in-memory storage
permify serve

# With PostgreSQL
permify serve --database-uri postgres://user:pass@localhost:5432/permify

# Docker Compose
docker-compose up -d
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: permify
      POSTGRES_USER: permify
      POSTGRES_PASSWORD: permify
    volumes:
      - postgres_data:/var/lib/postgresql/data

  permify:
    image: ghcr.io/permify/permify
    ports:
      - "3476:3476"
      - "3478:3478"
    environment:
      PERMIFY_DATABASE_URI: postgres://permify:permify@postgres:5432/permify
    depends_on:
      - postgres
    command: serve

volumes:
  postgres_data:
```

## Schema Definition

```yaml
# schemas/authorization.perm
entity user {}

entity organization {
  relation admin @user
  relation member @user

  permission edit = admin
  permission view = admin or member
  permission invite = admin
  permission delete = admin
}

entity team {
  relation org @organization
  relation lead @user
  relation member @user

  permission edit = lead or org.admin
  permission view = lead or member or org.member
  permission manage_members = lead or org.admin
}

entity document {
  relation org @organization
  relation owner @user
  relation editor @user
  relation viewer @user
  relation parent @folder

  permission edit = owner or editor or org.admin or parent.edit
  permission view = owner or editor or viewer or org.member or parent.view
  permission delete = owner or org.admin or parent.delete
  permission share = owner or org.admin
}

entity folder {
  relation org @organization
  relation owner @user
  relation editor @user
  relation viewer @user
  relation parent @folder

  permission edit = owner or editor or org.admin or parent.edit
  permission view = owner or editor or viewer or org.member or parent.view
  permission delete = owner or org.admin or parent.delete
  permission create = owner or editor or org.admin or parent.edit
}

entity comment {
  relation document @document
  relation author @user

  permission edit = author
  permission delete = author or document.owner or document.org.admin
  permission view = document.view
}
```

## Permify Client

```typescript
// lib/permify/client.ts
import { Permify } from '@permify/permify-node'

export const permify = new Permify({
  endpoint: `${process.env.PERMIFY_HOST}:${process.env.PERMIFY_GRPC_PORT}`,
})

export const tenantId = process.env.PERMIFY_TENANT_ID || 't1'
```

## Schema Management

```typescript
// lib/permify/schema.ts
import { permify, tenantId } from './client'
import { readFileSync } from 'fs'
import { join } from 'path'

// Write schema
export async function writeSchema(): Promise<string> {
  const schemaPath = join(process.cwd(), 'schemas', 'authorization.perm')
  const schema = readFileSync(schemaPath, 'utf-8')

  const response = await permify.schema.write({
    tenantId,
    schema,
  })

  return response.schemaVersion
}

// Read current schema
export async function readSchema(): Promise<string> {
  const response = await permify.schema.read({
    tenantId,
  })

  return response.schema
}

// List schema versions
export async function listSchemaVersions(): Promise<string[]> {
  const response = await permify.schema.list({
    tenantId,
  })

  return response.schemas.map((s: any) => s.version)
}
```

## Relationship Management

```typescript
// lib/permify/relationships.ts
import { permify, tenantId } from './client'

export interface Relationship {
  entity: {
    type: string
    id: string
  }
  relation: string
  subject: {
    type: string
    id: string
    relation?: string
  }
}

// Write relationships
export async function writeRelationships(
  relationships: Relationship[]
): Promise<string> {
  const tuples = relationships.map((r) => ({
    entity: r.entity,
    relation: r.relation,
    subject: r.subject,
  }))

  const response = await permify.data.write({
    tenantId,
    metadata: {
      schemaVersion: '', // Use latest
    },
    tuples,
  })

  return response.snapToken
}

// Delete relationships
export async function deleteRelationships(
  relationships: Relationship[]
): Promise<void> {
  const tuples = relationships.map((r) => ({
    entity: r.entity,
    relation: r.relation,
    subject: r.subject,
  }))

  await permify.data.delete({
    tenantId,
    tupleFilter: {
      entity: tuples[0]?.entity,
      relation: tuples[0]?.relation,
    },
  })
}

// Read relationships for entity
export async function readRelationships(
  entityType: string,
  entityId: string
): Promise<Relationship[]> {
  const response = await permify.data.relationships({
    tenantId,
    metadata: {
      schemaVersion: '',
    },
    filter: {
      entity: {
        type: entityType,
        ids: [entityId],
      },
    },
  })

  return response.tuples.map((t: any) => ({
    entity: t.entity,
    relation: t.relation,
    subject: t.subject,
  }))
}
```

## Permission Checks

```typescript
// lib/permify/authz.ts
import { permify, tenantId } from './client'
import type { Relationship } from './relationships'

export interface CheckInput {
  entityType: string
  entityId: string
  permission: string
  subjectType: string
  subjectId: string
}

// Check single permission
export async function check(input: CheckInput): Promise<boolean> {
  const response = await permify.permission.check({
    tenantId,
    metadata: {
      schemaVersion: '',
      snapToken: '',
      depth: 20,
    },
    entity: {
      type: input.entityType,
      id: input.entityId,
    },
    permission: input.permission,
    subject: {
      type: input.subjectType,
      id: input.subjectId,
    },
  })

  return response.can === 'CHECK_RESULT_ALLOWED'
}

// Check multiple permissions
export async function checkMany(
  inputs: CheckInput[]
): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>()

  await Promise.all(
    inputs.map(async (input) => {
      const key = `${input.entityType}:${input.entityId}:${input.permission}`
      results.set(key, await check(input))
    })
  )

  return results
}

// Expand permission (get all subjects with permission)
export async function expand(
  entityType: string,
  entityId: string,
  permission: string
): Promise<string[]> {
  const response = await permify.permission.expand({
    tenantId,
    metadata: {
      schemaVersion: '',
      snapToken: '',
    },
    entity: {
      type: entityType,
      id: entityId,
    },
    permission,
  })

  // Extract subject IDs from tree
  const subjects: string[] = []
  extractSubjects(response.tree, subjects)
  return [...new Set(subjects)]
}

function extractSubjects(node: any, subjects: string[]): void {
  if (node.leaf?.subjects) {
    for (const subject of node.leaf.subjects) {
      subjects.push(`${subject.type}:${subject.id}`)
    }
  }
  if (node.expand?.children) {
    for (const child of node.expand.children) {
      extractSubjects(child, subjects)
    }
  }
}

// Lookup entities (get all entities user has permission on)
export async function lookupEntities(
  entityType: string,
  permission: string,
  subjectType: string,
  subjectId: string
): Promise<string[]> {
  const response = await permify.permission.lookupEntity({
    tenantId,
    metadata: {
      schemaVersion: '',
      snapToken: '',
      depth: 20,
    },
    entityType,
    permission,
    subject: {
      type: subjectType,
      id: subjectId,
    },
  })

  return response.entityIds
}

// Lookup subjects (get all users with permission on entity)
export async function lookupSubjects(
  entityType: string,
  entityId: string,
  permission: string,
  subjectType: string
): Promise<string[]> {
  const response = await permify.permission.lookupSubject({
    tenantId,
    metadata: {
      schemaVersion: '',
      snapToken: '',
      depth: 20,
    },
    entity: {
      type: entityType,
      id: entityId,
    },
    permission,
    subjectReference: {
      type: subjectType,
      relation: '',
    },
  })

  return response.subjectIds
}
```

## Authorization Service

```typescript
// lib/permify/service.ts
import { check, lookupEntities, lookupSubjects } from './authz'
import { writeRelationships, deleteRelationships, type Relationship } from './relationships'

// High-level authorization service
export class AuthorizationService {
  // Check if user can perform action on entity
  async can(
    userId: string,
    permission: string,
    entityType: string,
    entityId: string
  ): Promise<boolean> {
    return check({
      entityType,
      entityId,
      permission,
      subjectType: 'user',
      subjectId: userId,
    })
  }

  // Add user to organization
  async addUserToOrganization(
    userId: string,
    orgId: string,
    role: 'admin' | 'member'
  ): Promise<void> {
    await writeRelationships([
      {
        entity: { type: 'organization', id: orgId },
        relation: role,
        subject: { type: 'user', id: userId },
      },
    ])
  }

  // Remove user from organization
  async removeUserFromOrganization(
    userId: string,
    orgId: string,
    role: 'admin' | 'member'
  ): Promise<void> {
    await deleteRelationships([
      {
        entity: { type: 'organization', id: orgId },
        relation: role,
        subject: { type: 'user', id: userId },
      },
    ])
  }

  // Create document with owner
  async createDocument(
    documentId: string,
    ownerId: string,
    orgId: string,
    folderId?: string
  ): Promise<void> {
    const relationships: Relationship[] = [
      {
        entity: { type: 'document', id: documentId },
        relation: 'owner',
        subject: { type: 'user', id: ownerId },
      },
      {
        entity: { type: 'document', id: documentId },
        relation: 'org',
        subject: { type: 'organization', id: orgId },
      },
    ]

    if (folderId) {
      relationships.push({
        entity: { type: 'document', id: documentId },
        relation: 'parent',
        subject: { type: 'folder', id: folderId },
      })
    }

    await writeRelationships(relationships)
  }

  // Share document with user
  async shareDocument(
    documentId: string,
    userId: string,
    role: 'editor' | 'viewer'
  ): Promise<void> {
    await writeRelationships([
      {
        entity: { type: 'document', id: documentId },
        relation: role,
        subject: { type: 'user', id: userId },
      },
    ])
  }

  // Get all documents user can access
  async getAccessibleDocuments(
    userId: string,
    permission: 'view' | 'edit' = 'view'
  ): Promise<string[]> {
    return lookupEntities('document', permission, 'user', userId)
  }

  // Get all users with access to document
  async getDocumentUsers(
    documentId: string,
    permission: 'view' | 'edit' = 'view'
  ): Promise<string[]> {
    return lookupSubjects('document', documentId, permission, 'user')
  }
}

export const authzService = new AuthorizationService()
```

## Middleware

```typescript
// middleware/permify.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authzService } from '@/lib/permify/service'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

interface PermifyOptions {
  entityType: string
  permission: string
  getEntityId?: (request: NextRequest) => string
}

export function withPermify(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: PermifyOptions
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entityId = options.getEntityId?.(request) ||
      request.nextUrl.pathname.split('/').pop() || 'unknown'

    const allowed = await authzService.can(
      session.user.id,
      options.permission,
      options.entityType,
      entityId
    )

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          details: {
            permission: options.permission,
            entityType: options.entityType,
          },
        },
        { status: 403 }
      )
    }

    return handler(request)
  }
}

// Permission-to-method mapping
const methodPermissions: Record<string, string> = {
  GET: 'view',
  POST: 'create',
  PUT: 'edit',
  PATCH: 'edit',
  DELETE: 'delete',
}

export function withPermifyAuto(
  handler: (request: NextRequest) => Promise<NextResponse>,
  entityType: string
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const permission = methodPermissions[request.method] || 'view'

    return withPermify(handler, {
      entityType,
      permission,
    })(request)
  }
}
```

## API Routes

```typescript
// app/api/documents/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withPermify } from '@/middleware/permify'
import { prisma } from '@/lib/prisma'

async function getDocument(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const document = await prisma.document.findUnique({
    where: { id: params.id },
  })

  if (!document) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(document)
}

async function updateDocument(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json()
  const document = await prisma.document.update({
    where: { id: params.id },
    data: body,
  })

  return NextResponse.json(document)
}

async function deleteDocument(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.document.delete({
    where: { id: params.id },
  })

  return new NextResponse(null, { status: 204 })
}

export const GET = withPermify(getDocument as any, {
  entityType: 'document',
  permission: 'view',
})

export const PUT = withPermify(updateDocument as any, {
  entityType: 'document',
  permission: 'edit',
})

export const DELETE = withPermify(deleteDocument as any, {
  entityType: 'document',
  permission: 'delete',
})
```

```typescript
// app/api/documents/[id]/share/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authzService } from '@/lib/permify/service'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user can share
  const canShare = await authzService.can(
    session.user.id,
    'share',
    'document',
    params.id
  )

  if (!canShare) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { userId, role } = body

  if (!['editor', 'viewer'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  await authzService.shareDocument(params.id, userId, role)

  return NextResponse.json({ success: true })
}
```

## React Hook

```typescript
// hooks/use-permify.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface UsePermifyOptions {
  entityType: string
  entityId: string
}

export function usePermify(options?: UsePermifyOptions) {
  const { data: session } = useSession()
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  const checkPermission = useCallback(async (
    entityType: string,
    entityId: string,
    permission: string
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, entityId, permission }),
      })

      const { allowed } = await response.json()
      return allowed
    } catch {
      return false
    }
  }, [])

  const can = useCallback((permission: string): boolean => {
    return permissions[permission] ?? false
  }, [permissions])

  // Load permissions for entity
  useEffect(() => {
    if (!options || !session) {
      setLoading(false)
      return
    }

    async function loadPermissions() {
      setLoading(true)
      const perms = ['view', 'edit', 'delete', 'share']
      const results: Record<string, boolean> = {}

      await Promise.all(
        perms.map(async (perm) => {
          results[perm] = await checkPermission(
            options.entityType,
            options.entityId,
            perm
          )
        })
      )

      setPermissions(results)
      setLoading(false)
    }

    loadPermissions()
  }, [options, session, checkPermission])

  return {
    can,
    checkPermission,
    permissions,
    loading,
  }
}
```

## Testing

```bash
# Create schema
curl -X POST http://localhost:3476/v1/tenants/t1/schemas/write \
  -H "Content-Type: application/json" \
  -d '{
    "schema": "entity user {}\n\nentity document {\n  relation owner @user\n  permission view = owner\n  permission edit = owner\n}"
  }'

# Write relationship
curl -X POST http://localhost:3476/v1/tenants/t1/data/write \
  -H "Content-Type: application/json" \
  -d '{
    "metadata": {},
    "tuples": [{
      "entity": {"type": "document", "id": "doc1"},
      "relation": "owner",
      "subject": {"type": "user", "id": "user1"}
    }]
  }'

# Check permission
curl -X POST http://localhost:3476/v1/tenants/t1/permissions/check \
  -H "Content-Type: application/json" \
  -d '{
    "metadata": {},
    "entity": {"type": "document", "id": "doc1"},
    "permission": "edit",
    "subject": {"type": "user", "id": "user1"}
  }'
```

```typescript
// __tests__/permify.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import { check, lookupEntities } from '@/lib/permify/authz'
import { writeRelationships } from '@/lib/permify/relationships'
import { writeSchema } from '@/lib/permify/schema'

describe('Permify Authorization', () => {
  beforeAll(async () => {
    // Setup schema
    await writeSchema()

    // Create test relationships
    await writeRelationships([
      {
        entity: { type: 'document', id: 'doc1' },
        relation: 'owner',
        subject: { type: 'user', id: 'user1' },
      },
      {
        entity: { type: 'document', id: 'doc1' },
        relation: 'viewer',
        subject: { type: 'user', id: 'user2' },
      },
    ])
  })

  it('owner should have edit permission', async () => {
    const allowed = await check({
      entityType: 'document',
      entityId: 'doc1',
      permission: 'edit',
      subjectType: 'user',
      subjectId: 'user1',
    })

    expect(allowed).toBe(true)
  })

  it('viewer should not have edit permission', async () => {
    const allowed = await check({
      entityType: 'document',
      entityId: 'doc1',
      permission: 'edit',
      subjectType: 'user',
      subjectId: 'user2',
    })

    expect(allowed).toBe(false)
  })

  it('viewer should have view permission', async () => {
    const allowed = await check({
      entityType: 'document',
      entityId: 'doc1',
      permission: 'view',
      subjectType: 'user',
      subjectId: 'user2',
    })

    expect(allowed).toBe(true)
  })
})
```

## CLAUDE.md Integration

```markdown
## Permify Authorization

This project uses Permify for relationship-based access control.

### Key Files
- `schemas/authorization.perm` - Permission schema
- `lib/permify/client.ts` - Permify client
- `lib/permify/service.ts` - Authorization service
- `middleware/permify.ts` - Request middleware

### Running Permify
```bash
docker-compose up -d
```

### Schema Entities
- `user` - System users
- `organization` - Organizations with admin/member roles
- `team` - Teams within organizations
- `document` - Documents with hierarchical permissions
- `folder` - Folders for document organization

### Usage
```typescript
// Check permission
const canEdit = await authzService.can(userId, 'edit', 'document', docId)

// Share document
await authzService.shareDocument(docId, userId, 'editor')

// Get accessible documents
const docs = await authzService.getAccessibleDocuments(userId)
```
```

## AI Suggestions

1. **Watch API** - Subscribe to permission changes for real-time updates
2. **Bulk checks** - Batch multiple permission checks for efficiency
3. **Permission caching** - Cache frequently checked permissions
4. **Audit logging** - Log all authorization decisions
5. **Schema migrations** - Version control for schema changes
6. **Permission graphs** - Visualize permission relationships
7. **Data sync** - Sync relationships with main database
8. **Multi-tenant isolation** - Strict tenant boundaries
