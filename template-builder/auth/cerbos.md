# Cerbos Authorization

Scalable, self-hosted authorization layer with GitOps-friendly YAML policies and context-aware access control.

## Overview

Cerbos provides:
- YAML-based policy definitions
- GitOps workflow for policy management
- Context-aware authorization
- Audit logging built-in
- gRPC and HTTP APIs
- Playground for policy testing

## Installation

```bash
# Install Cerbos CLI
brew install cerbos/tap/cerbos

# Or download from releases
curl -sSL https://github.com/cerbos/cerbos/releases/latest/download/cerbos_Linux_x86_64.tar.gz | tar -xz

# Node.js SDK
npm install @cerbos/grpc @cerbos/http
```

## Environment Variables

```env
# .env.local
CERBOS_HOST=localhost
CERBOS_PORT=3593
CERBOS_HTTP_PORT=3592
CERBOS_POLICY_DIR=./policies
```

## Running Cerbos

```bash
# Start Cerbos server
cerbos server --config=./config/cerbos.yaml

# Docker
docker run -p 3593:3593 -p 3592:3592 \
  -v $(pwd)/policies:/policies \
  ghcr.io/cerbos/cerbos:latest \
  server --set=storage.driver=disk --set=storage.disk.directory=/policies
```

## Cerbos Configuration

```yaml
# config/cerbos.yaml
server:
  httpListenAddr: ":3592"
  grpcListenAddr: ":3593"

storage:
  driver: disk
  disk:
    directory: /policies
    watchForChanges: true

audit:
  enabled: true
  backend: local
  local:
    storagePath: /var/log/cerbos/audit
    retentionPeriod: 168h  # 7 days

schema:
  enforcement: warn

engine:
  defaultPolicyVersion: "default"
```

## Policy Definitions

```yaml
# policies/resource_document.yaml
apiVersion: api.cerbos.dev/v1
resourcePolicy:
  version: "default"
  resource: "document"
  rules:
    # Owner has full access
    - actions: ["*"]
      effect: EFFECT_ALLOW
      condition:
        match:
          expr: request.resource.attr.owner_id == request.principal.id
      name: owner-access

    # Admins have full access
    - actions: ["*"]
      effect: EFFECT_ALLOW
      roles: ["admin"]
      name: admin-access

    # Editors can read and update
    - actions: ["read", "update"]
      effect: EFFECT_ALLOW
      roles: ["editor"]
      name: editor-access

    # Viewers can only read
    - actions: ["read"]
      effect: EFFECT_ALLOW
      roles: ["viewer"]
      name: viewer-access

    # Team members can read team documents
    - actions: ["read"]
      effect: EFFECT_ALLOW
      condition:
        match:
          all:
            of:
              - expr: request.resource.attr.visibility == "team"
              - expr: request.resource.attr.team_id == request.principal.attr.team_id
      name: team-read

    # Public documents are readable by all authenticated users
    - actions: ["read"]
      effect: EFFECT_ALLOW
      condition:
        match:
          expr: request.resource.attr.visibility == "public"
      name: public-read

    # Classification-based access
    - actions: ["read"]
      effect: EFFECT_DENY
      condition:
        match:
          all:
            of:
              - expr: request.resource.attr.classification == "confidential"
              - expr: request.principal.attr.clearance_level < 3
      name: confidential-deny
```

```yaml
# policies/resource_post.yaml
apiVersion: api.cerbos.dev/v1
resourcePolicy:
  version: "default"
  resource: "post"
  rules:
    - actions: ["create"]
      effect: EFFECT_ALLOW
      roles: ["user", "admin"]
      name: create-post

    - actions: ["read", "list"]
      effect: EFFECT_ALLOW
      name: read-posts

    - actions: ["update", "delete"]
      effect: EFFECT_ALLOW
      condition:
        match:
          any:
            of:
              - expr: request.resource.attr.author_id == request.principal.id
              - expr: '"admin" in request.principal.roles'
      name: modify-own-post
```

```yaml
# policies/derived_roles.yaml
apiVersion: api.cerbos.dev/v1
derivedRoles:
  name: document_roles
  definitions:
    - name: document_owner
      parentRoles: ["user"]
      condition:
        match:
          expr: request.resource.attr.owner_id == request.principal.id

    - name: team_member
      parentRoles: ["user"]
      condition:
        match:
          expr: request.resource.attr.team_id == request.principal.attr.team_id

    - name: department_member
      parentRoles: ["user"]
      condition:
        match:
          expr: request.resource.attr.department == request.principal.attr.department
```

```yaml
# policies/principal_policy.yaml
apiVersion: api.cerbos.dev/v1
principalPolicy:
  version: "default"
  principal: "service_account"
  rules:
    - resource: "*"
      actions:
        - action: "*"
          effect: EFFECT_ALLOW
          condition:
            match:
              expr: request.principal.attr.api_key_valid == true
```

## Cerbos Client

```typescript
// lib/cerbos/client.ts
import { GRPC } from '@cerbos/grpc'
import { HTTP } from '@cerbos/http'

// gRPC client (recommended for performance)
export const cerbosGRPC = new GRPC(
  `${process.env.CERBOS_HOST}:${process.env.CERBOS_PORT}`,
  { tls: process.env.NODE_ENV === 'production' }
)

// HTTP client (alternative)
export const cerbosHTTP = new HTTP(
  `http://${process.env.CERBOS_HOST}:${process.env.CERBOS_HTTP_PORT}`
)

// Use gRPC by default
export const cerbos = cerbosGRPC
```

## Authorization Service

```typescript
// lib/cerbos/authz.ts
import { cerbos } from './client'

export interface Principal {
  id: string
  roles: string[]
  attributes?: Record<string, any>
}

export interface Resource {
  kind: string
  id: string
  attributes?: Record<string, any>
}

// Check single permission
export async function isAllowed(
  principal: Principal,
  resource: Resource,
  action: string
): Promise<boolean> {
  const result = await cerbos.checkResource({
    principal: {
      id: principal.id,
      roles: principal.roles,
      attr: principal.attributes || {},
    },
    resource: {
      kind: resource.kind,
      id: resource.id,
      attr: resource.attributes || {},
    },
    actions: [action],
  })

  return result.isAllowed(action)
}

// Check multiple actions
export async function checkActions(
  principal: Principal,
  resource: Resource,
  actions: string[]
): Promise<Record<string, boolean>> {
  const result = await cerbos.checkResource({
    principal: {
      id: principal.id,
      roles: principal.roles,
      attr: principal.attributes || {},
    },
    resource: {
      kind: resource.kind,
      id: resource.id,
      attr: resource.attributes || {},
    },
    actions,
  })

  const permissions: Record<string, boolean> = {}
  for (const action of actions) {
    permissions[action] = result.isAllowed(action)
  }

  return permissions
}

// Check multiple resources
export async function checkResources(
  principal: Principal,
  resources: Array<{ resource: Resource; actions: string[] }>
): Promise<Map<string, Record<string, boolean>>> {
  const results = await cerbos.checkResources({
    principal: {
      id: principal.id,
      roles: principal.roles,
      attr: principal.attributes || {},
    },
    resources: resources.map(({ resource, actions }) => ({
      resource: {
        kind: resource.kind,
        id: resource.id,
        attr: resource.attributes || {},
      },
      actions,
    })),
  })

  const permissions = new Map<string, Record<string, boolean>>()

  for (const { resource, actions } of resources) {
    const key = `${resource.kind}:${resource.id}`
    const resourceResult = results.findResult({ kind: resource.kind, id: resource.id })

    if (resourceResult) {
      permissions.set(key, {})
      for (const action of actions) {
        permissions.get(key)![action] = resourceResult.isAllowed(action)
      }
    }
  }

  return permissions
}

// Plan resources (for data filtering)
export async function planResources(
  principal: Principal,
  resourceKind: string,
  action: string
): Promise<{ condition: any; filters: any }> {
  const result = await cerbos.planResources({
    principal: {
      id: principal.id,
      roles: principal.roles,
      attr: principal.attributes || {},
    },
    resource: {
      kind: resourceKind,
    },
    action,
  })

  return {
    condition: result.toJSON(),
    filters: result.filters,
  }
}
```

## Middleware

```typescript
// middleware/cerbos.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { isAllowed, type Principal, type Resource } from '@/lib/cerbos/authz'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

interface CerbosOptions {
  resourceKind: string
  getResourceId?: (request: NextRequest) => string
  getResourceAttributes?: (request: NextRequest) => Promise<Record<string, any>>
  getAction?: (request: NextRequest) => string
}

export function withCerbos(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: CerbosOptions
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const principal: Principal = {
      id: session.user.id,
      roles: (session.user as any).roles || ['user'],
      attributes: {
        email: session.user.email,
        team_id: (session.user as any).teamId,
        department: (session.user as any).department,
        clearance_level: (session.user as any).clearanceLevel || 0,
      },
    }

    const resourceId = options.getResourceId?.(request) ||
      request.nextUrl.searchParams.get('id') || 'unknown'

    const resourceAttributes = options.getResourceAttributes
      ? await options.getResourceAttributes(request)
      : {}

    const resource: Resource = {
      kind: options.resourceKind,
      id: resourceId,
      attributes: resourceAttributes,
    }

    const action = options.getAction?.(request) || methodToAction(request.method)

    const allowed = await isAllowed(principal, resource, action)

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          details: { action, resource: options.resourceKind },
        },
        { status: 403 }
      )
    }

    return handler(request)
  }
}

function methodToAction(method: string): string {
  return {
    GET: 'read',
    POST: 'create',
    PUT: 'update',
    PATCH: 'update',
    DELETE: 'delete',
  }[method] || 'read'
}
```

## API Routes

```typescript
// app/api/documents/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withCerbos } from '@/middleware/cerbos'
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

async function getResourceAttributes(request: NextRequest) {
  const id = request.nextUrl.pathname.split('/').pop()!
  const document = await prisma.document.findUnique({
    where: { id },
    select: {
      owner_id: true,
      team_id: true,
      visibility: true,
      classification: true,
    },
  })

  return document || {}
}

export const GET = withCerbos(getDocument as any, {
  resourceKind: 'document',
  getResourceAttributes,
})
```

```typescript
// app/api/permissions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { checkActions, type Principal, type Resource } from '@/lib/cerbos/authz'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { resourceKind, resourceId, resourceAttributes, actions } = body

  const principal: Principal = {
    id: session.user.id,
    roles: (session.user as any).roles || ['user'],
    attributes: {
      team_id: (session.user as any).teamId,
      department: (session.user as any).department,
      clearance_level: (session.user as any).clearanceLevel || 0,
    },
  }

  const resource: Resource = {
    kind: resourceKind,
    id: resourceId,
    attributes: resourceAttributes || {},
  }

  const permissions = await checkActions(
    principal,
    resource,
    actions || ['read', 'update', 'delete']
  )

  return NextResponse.json({ permissions })
}
```

## React Hook

```typescript
// hooks/use-cerbos.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface Resource {
  kind: string
  id: string
  attributes?: Record<string, any>
}

export function useCerbos(resource?: Resource) {
  const { data: session } = useSession()
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  // Check permission for action
  const can = useCallback((action: string): boolean => {
    return permissions[action] ?? false
  }, [permissions])

  // Check permission dynamically
  const checkPermission = useCallback(async (
    action: string,
    res: Resource
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceKind: res.kind,
          resourceId: res.id,
          resourceAttributes: res.attributes,
          actions: [action],
        }),
      })

      const { permissions: perms } = await response.json()
      return perms[action] ?? false
    } catch {
      return false
    }
  }, [])

  // Load permissions for resource
  useEffect(() => {
    if (!resource || !session) {
      setLoading(false)
      return
    }

    async function loadPermissions() {
      setLoading(true)
      try {
        const response = await fetch('/api/permissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resourceKind: resource.kind,
            resourceId: resource.id,
            resourceAttributes: resource.attributes,
            actions: ['read', 'create', 'update', 'delete', 'admin'],
          }),
        })

        const { permissions: perms } = await response.json()
        setPermissions(perms)
      } catch {
        setPermissions({})
      }
      setLoading(false)
    }

    loadPermissions()
  }, [resource, session])

  return {
    can,
    checkPermission,
    permissions,
    loading,
  }
}
```

## React Component

```typescript
// components/auth/cerbos-gate.tsx
'use client'

import { ReactNode } from 'react'
import { useCerbos } from '@/hooks/use-cerbos'

interface CerbosGateProps {
  resourceKind: string
  resourceId: string
  resourceAttributes?: Record<string, any>
  action: string
  children: ReactNode
  fallback?: ReactNode
}

export function CerbosGate({
  resourceKind,
  resourceId,
  resourceAttributes,
  action,
  children,
  fallback = null,
}: CerbosGateProps) {
  const { can, loading } = useCerbos({
    kind: resourceKind,
    id: resourceId,
    attributes: resourceAttributes,
  })

  if (loading) {
    return null
  }

  if (!can(action)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Usage example
function DocumentPage({ document }: { document: any }) {
  return (
    <div>
      <h1>{document.title}</h1>

      <CerbosGate
        resourceKind="document"
        resourceId={document.id}
        resourceAttributes={document}
        action="update"
      >
        <button>Edit Document</button>
      </CerbosGate>

      <CerbosGate
        resourceKind="document"
        resourceId={document.id}
        resourceAttributes={document}
        action="delete"
        fallback={<span className="text-gray-400">Cannot delete</span>}
      >
        <button className="text-red-600">Delete</button>
      </CerbosGate>
    </div>
  )
}
```

## Testing Policies

```bash
# Validate policies
cerbos compile ./policies

# Test with CLI
cerbos decide --policies=./policies \
  --principal='{"id":"user1","roles":["user"],"attr":{"team_id":"team1"}}' \
  --resource='{"kind":"document","id":"doc1","attr":{"owner_id":"user1","team_id":"team1"}}' \
  --action=read

# Run playground
cerbos server --set=server.playgroundEnabled=true
# Open http://localhost:3592/playground
```

```yaml
# policies/document_test.yaml
apiVersion: api.cerbos.dev/v1
tests:
  name: DocumentTests
  tests:
    - name: owner can do anything
      input:
        principals:
          - id: owner1
            roles: [user]
        resources:
          - kind: document
            id: doc1
            attr:
              owner_id: owner1
        actions: [read, update, delete]
      expected:
        - principal: owner1
          resource: doc1
          actions:
            read: EFFECT_ALLOW
            update: EFFECT_ALLOW
            delete: EFFECT_ALLOW

    - name: non-owner cannot delete
      input:
        principals:
          - id: user2
            roles: [user]
        resources:
          - kind: document
            id: doc1
            attr:
              owner_id: owner1
              visibility: private
        actions: [read, delete]
      expected:
        - principal: user2
          resource: doc1
          actions:
            read: EFFECT_DENY
            delete: EFFECT_DENY
```

## CLAUDE.md Integration

```markdown
## Cerbos Authorization

This project uses Cerbos for access control.

### Key Files
- `policies/*.yaml` - Policy definitions
- `lib/cerbos/client.ts` - Cerbos client
- `lib/cerbos/authz.ts` - Authorization service
- `middleware/cerbos.ts` - Request middleware

### Running Cerbos
```bash
# Start server
cerbos server --config=./config/cerbos.yaml

# Validate policies
cerbos compile ./policies

# Run tests
cerbos decide --policies=./policies ...
```

### Policy Structure
- Resource policies per resource type
- Derived roles for dynamic role assignment
- Principal policies for service accounts

### Usage
```typescript
const allowed = await isAllowed(principal, resource, 'update')
```
```

## AI Suggestions

1. **Policy bundles** - Package policies for deployment
2. **Admin UI** - Build interface for policy management
3. **Audit dashboard** - Visualize authorization decisions
4. **Policy simulation** - What-if testing for policies
5. **Schema validation** - Define and enforce resource schemas
6. **Custom conditions** - Use CEL expressions for complex logic
7. **Policy versioning** - Manage multiple policy versions
8. **Hub integration** - Use Cerbos Hub for SaaS deployment
