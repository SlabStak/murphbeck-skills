# Open Policy Agent (OPA)

Policy-based control for cloud-native applications using OPA and Rego policy language.

## Overview

OPA provides:
- Declarative policy language (Rego)
- Decoupled policy decision making
- Context-aware authorization
- Policy bundles for distribution
- Decision logging and auditing
- Partial evaluation for data filtering

## Installation

```bash
# Install OPA CLI
brew install opa
# Or download from https://www.openpolicyagent.org/docs/latest/#running-opa

# Node.js SDK
npm install @open-policy-agent/opa-wasm
```

## Environment Variables

```env
# .env.local
OPA_URL=http://localhost:8181
OPA_POLICY_PATH=./policies
OPA_BUNDLE_URL=https://policy-server.example.com/bundles/authz.tar.gz
```

## Running OPA Server

```bash
# Start OPA server
opa run --server --addr :8181 ./policies

# With bundle
opa run --server --addr :8181 \
  --set bundles.authz.resource=https://policy-server.example.com/bundles/authz.tar.gz \
  --set bundles.authz.polling.min_delay_seconds=60

# Docker
docker run -p 8181:8181 \
  -v $(pwd)/policies:/policies \
  openpolicyagent/opa:latest \
  run --server /policies
```

## Rego Policies

```rego
# policies/authz.rego
package authz

import future.keywords.if
import future.keywords.in

# Default deny
default allow := false

# Allow admins everything
allow if {
    input.user.roles[_] == "admin"
}

# Users can read their own data
allow if {
    input.action == "read"
    input.resource.type == "user"
    input.resource.id == input.user.id
}

# Users can read public resources
allow if {
    input.action == "read"
    input.resource.visibility == "public"
}

# Resource owners have full access
allow if {
    input.resource.owner_id == input.user.id
}

# Team members can read team resources
allow if {
    input.action == "read"
    input.user.team_id == input.resource.team_id
}

# Managers can manage team resources
allow if {
    input.action in ["read", "update", "delete"]
    input.user.role == "manager"
    input.user.team_id == input.resource.team_id
}

# Rate limit check
allow if {
    input.action == "api_call"
    input.user.requests_today < input.user.rate_limit
}

# Time-based access
allow if {
    input.action == "access_sensitive"
    is_business_hours
    input.user.clearance_level >= input.resource.required_clearance
}

is_business_hours if {
    now := time.now_ns()
    day := time.weekday(now)
    day != "Saturday"
    day != "Sunday"
    hour := time.clock(now)[0]
    hour >= 9
    hour < 17
}
```

```rego
# policies/rbac.rego
package rbac

import future.keywords.if
import future.keywords.in

# Role definitions
roles := {
    "admin": {
        "permissions": ["*"],
        "inherits": ["manager"]
    },
    "manager": {
        "permissions": ["read", "create", "update", "delete"],
        "inherits": ["user"]
    },
    "user": {
        "permissions": ["read", "create"],
        "inherits": []
    },
    "guest": {
        "permissions": ["read"],
        "inherits": []
    }
}

# Get all permissions for a role (including inherited)
role_permissions(role) := perms if {
    some r in roles
    r == role
    base_perms := roles[r].permissions
    inherited := roles[r].inherits
    inherited_perms := union({role_permissions(ir) | ir := inherited[_]})
    perms := base_perms | inherited_perms
}

role_permissions(role) := set() if {
    not roles[role]
}

# Check if user has permission
has_permission(user, permission) if {
    some role in user.roles
    permission in role_permissions(role)
}

has_permission(user, permission) if {
    some role in user.roles
    "*" in role_permissions(role)
}

# Allow rule
default allow := false

allow if {
    has_permission(input.user, input.action)
}
```

```rego
# policies/abac.rego
package abac

import future.keywords.if

# ABAC rules combining multiple attributes
default allow := false

# Document access rules
allow if {
    input.resource.type == "document"
    document_access_allowed
}

document_access_allowed if {
    # Owner access
    input.resource.owner_id == input.user.id
}

document_access_allowed if {
    # Department access
    input.action == "read"
    input.resource.department == input.user.department
}

document_access_allowed if {
    # Classification check
    input.user.clearance >= classification_level(input.resource.classification)
}

classification_level(c) := 1 if c == "public"
classification_level(c) := 2 if c == "internal"
classification_level(c) := 3 if c == "confidential"
classification_level(c) := 4 if c == "secret"
classification_level(c) := 0 if not c
```

## OPA Client

```typescript
// lib/opa/client.ts
const OPA_URL = process.env.OPA_URL || 'http://localhost:8181'

interface OPAInput {
  user: {
    id: string
    roles: string[]
    team_id?: string
    department?: string
    clearance_level?: number
    [key: string]: any
  }
  action: string
  resource: {
    type: string
    id: string
    owner_id?: string
    team_id?: string
    visibility?: string
    [key: string]: any
  }
  context?: {
    [key: string]: any
  }
}

interface OPAResult {
  result: boolean
}

interface OPADecision {
  decision_id: string
  result: boolean | any
}

// Query OPA for authorization decision
export async function queryOPA(
  policy: string,
  input: OPAInput
): Promise<boolean> {
  const response = await fetch(`${OPA_URL}/v1/data/${policy}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  })

  if (!response.ok) {
    console.error('OPA query failed:', await response.text())
    return false
  }

  const data: OPAResult = await response.json()
  return data.result === true
}

// Query with decision logging
export async function queryOPAWithLogging(
  policy: string,
  input: OPAInput
): Promise<OPADecision> {
  const response = await fetch(`${OPA_URL}/v1/data/${policy}?provenance=true&explain=notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  })

  if (!response.ok) {
    throw new Error(`OPA query failed: ${response.statusText}`)
  }

  return response.json()
}

// Batch query multiple decisions
export async function batchQueryOPA(
  queries: Array<{ policy: string; input: OPAInput }>
): Promise<boolean[]> {
  const results = await Promise.all(
    queries.map(({ policy, input }) => queryOPA(policy, input))
  )
  return results
}

// Get all allowed actions for a resource
export async function getAllowedActions(
  user: OPAInput['user'],
  resource: OPAInput['resource']
): Promise<string[]> {
  const actions = ['read', 'create', 'update', 'delete', 'admin']
  const results = await batchQueryOPA(
    actions.map((action) => ({
      policy: 'authz/allow',
      input: { user, action, resource },
    }))
  )

  return actions.filter((_, index) => results[index])
}
```

## OPA WASM (Client-Side)

```typescript
// lib/opa/wasm.ts
import { loadPolicy, type LoadPolicyOptions } from '@open-policy-agent/opa-wasm'

let policy: any = null

// Load policy from WASM bundle
export async function loadOPAPolicy(wasmUrl: string): Promise<void> {
  const response = await fetch(wasmUrl)
  const policyWasm = await response.arrayBuffer()

  policy = await loadPolicy(policyWasm)
}

// Evaluate policy locally
export function evaluatePolicy(input: any): any {
  if (!policy) {
    throw new Error('Policy not loaded')
  }

  return policy.evaluate(input)
}

// Set data for policy evaluation
export function setPolicyData(data: any): void {
  if (!policy) {
    throw new Error('Policy not loaded')
  }

  policy.setData(data)
}
```

## Authorization Service

```typescript
// lib/opa/authz.ts
import { queryOPA, getAllowedActions, type OPAInput } from './client'

export interface User {
  id: string
  email: string
  roles: string[]
  teamId?: string
  department?: string
  clearanceLevel?: number
}

export interface Resource {
  id: string
  type: string
  ownerId?: string
  teamId?: string
  visibility?: 'public' | 'private' | 'team'
  classification?: 'public' | 'internal' | 'confidential' | 'secret'
}

// Check if user can perform action on resource
export async function can(
  user: User,
  action: string,
  resource: Resource
): Promise<boolean> {
  const input: OPAInput = {
    user: {
      id: user.id,
      roles: user.roles,
      team_id: user.teamId,
      department: user.department,
      clearance_level: user.clearanceLevel,
    },
    action,
    resource: {
      id: resource.id,
      type: resource.type,
      owner_id: resource.ownerId,
      team_id: resource.teamId,
      visibility: resource.visibility,
      classification: resource.classification,
    },
  }

  return queryOPA('authz/allow', input)
}

// Check multiple permissions at once
export async function canAll(
  user: User,
  checks: Array<{ action: string; resource: Resource }>
): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>()

  await Promise.all(
    checks.map(async ({ action, resource }) => {
      const key = `${action}:${resource.type}:${resource.id}`
      results.set(key, await can(user, action, resource))
    })
  )

  return results
}

// Get permissions for a resource
export async function getPermissions(
  user: User,
  resource: Resource
): Promise<string[]> {
  return getAllowedActions(
    {
      id: user.id,
      roles: user.roles,
      team_id: user.teamId,
      department: user.department,
      clearance_level: user.clearanceLevel,
    },
    {
      id: resource.id,
      type: resource.type,
      owner_id: resource.ownerId,
      team_id: resource.teamId,
      visibility: resource.visibility,
    }
  )
}
```

## Middleware

```typescript
// middleware/opa.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { can, type User, type Resource } from '@/lib/opa/authz'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

interface OPAMiddlewareOptions {
  getResource: (request: NextRequest) => Promise<Resource> | Resource
  getAction?: (request: NextRequest) => string
}

export function withOPA(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: OPAMiddlewareOptions
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user: User = {
      id: session.user.id,
      email: session.user.email!,
      roles: (session.user as any).roles || ['user'],
      teamId: (session.user as any).teamId,
      department: (session.user as any).department,
      clearanceLevel: (session.user as any).clearanceLevel,
    }

    const resource = await options.getResource(request)
    const action = options.getAction?.(request) || methodToAction(request.method)

    const allowed = await can(user, action, resource)

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          details: { action, resource: resource.type },
        },
        { status: 403 }
      )
    }

    return handler(request)
  }
}

function methodToAction(method: string): string {
  const mapping: Record<string, string> = {
    GET: 'read',
    POST: 'create',
    PUT: 'update',
    PATCH: 'update',
    DELETE: 'delete',
  }
  return mapping[method] || 'read'
}
```

## API Routes

```typescript
// app/api/documents/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withOPA } from '@/middleware/opa'
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

// Get resource from database for authorization
async function getResource(request: NextRequest) {
  const id = request.nextUrl.pathname.split('/').pop()!
  const document = await prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      ownerId: true,
      teamId: true,
      visibility: true,
      classification: true,
    },
  })

  return {
    id,
    type: 'document',
    ownerId: document?.ownerId,
    teamId: document?.teamId,
    visibility: document?.visibility as any,
    classification: document?.classification as any,
  }
}

export const GET = withOPA(getDocument as any, { getResource })
export const PUT = withOPA(updateDocument as any, { getResource })
export const DELETE = withOPA(deleteDocument as any, { getResource })
```

## React Hook

```typescript
// hooks/use-opa.ts
'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Resource {
  id: string
  type: string
  [key: string]: any
}

export function useOPA(resource?: Resource) {
  const { data: session } = useSession()
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const checkPermission = useCallback(async (
    action: string,
    res: Resource
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, resource: res }),
      })
      const { allowed } = await response.json()
      return allowed
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
        const response = await fetch('/api/auth/permissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resource }),
        })
        const { permissions: perms } = await response.json()
        setPermissions(perms)
      } catch {
        setPermissions([])
      }
      setLoading(false)
    }

    loadPermissions()
  }, [resource, session])

  const can = useCallback((action: string): boolean => {
    return permissions.includes(action) || permissions.includes('admin')
  }, [permissions])

  return {
    can,
    checkPermission,
    permissions,
    loading,
  }
}
```

## Testing Policies

```bash
# Test policy with OPA CLI
opa eval -i input.json -d policies/ "data.authz.allow"

# Example input.json
{
  "user": {
    "id": "user-123",
    "roles": ["user"],
    "team_id": "team-1"
  },
  "action": "read",
  "resource": {
    "type": "document",
    "id": "doc-456",
    "team_id": "team-1",
    "visibility": "team"
  }
}

# Run OPA tests
opa test policies/ -v
```

```rego
# policies/authz_test.rego
package authz

test_admin_allowed {
    allow with input as {
        "user": {"id": "admin-1", "roles": ["admin"]},
        "action": "delete",
        "resource": {"type": "document", "id": "doc-1"}
    }
}

test_owner_allowed {
    allow with input as {
        "user": {"id": "user-1", "roles": ["user"]},
        "action": "delete",
        "resource": {"type": "document", "id": "doc-1", "owner_id": "user-1"}
    }
}

test_non_owner_denied {
    not allow with input as {
        "user": {"id": "user-2", "roles": ["user"]},
        "action": "delete",
        "resource": {"type": "document", "id": "doc-1", "owner_id": "user-1"}
    }
}
```

## CLAUDE.md Integration

```markdown
## Open Policy Agent (OPA)

This project uses OPA for policy-based authorization.

### Key Files
- `policies/authz.rego` - Main authorization policies
- `policies/rbac.rego` - Role-based access control
- `policies/abac.rego` - Attribute-based access control
- `lib/opa/client.ts` - OPA client utilities

### Running OPA
```bash
# Start OPA server
opa run --server --addr :8181 ./policies

# Test policies
opa test policies/ -v
```

### Policy Structure
- Default deny
- Admin override
- Owner access
- Team-based access
- Classification-based access

### Adding New Policies
1. Create/edit `.rego` files in `policies/`
2. Write tests in `*_test.rego`
3. Restart OPA server to load changes
```

## AI Suggestions

1. **Bundle server** - Deploy policies as bundles for versioning and distribution
2. **Decision logging** - Enable OPA decision logs for audit trail
3. **Partial evaluation** - Use partial eval for data filtering queries
4. **Policy testing** - Comprehensive test coverage for all policies
5. **Performance monitoring** - Track OPA query latency
6. **Status API** - Health checks for OPA server
7. **Policy playground** - Internal tool for testing policies
8. **IDE integration** - VS Code extension for Rego development
