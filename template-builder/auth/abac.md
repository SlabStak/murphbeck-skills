# Attribute-Based Access Control (ABAC)

Fine-grained authorization based on attributes of subjects, resources, actions, and environment for complex access control requirements.

## Overview

ABAC provides:
- Dynamic policy evaluation
- Context-aware authorization
- Fine-grained access control
- Flexible attribute sources
- Audit trail for decisions
- No need for pre-defined roles

## Installation

```bash
npm install nanoid
```

## Environment Variables

```env
# .env.local
ABAC_POLICY_CACHE_TTL=300    # 5 minutes
ABAC_AUDIT_ENABLED=true
ABAC_DEFAULT_EFFECT=deny
```

## Core Types

```typescript
// lib/abac/types.ts

// Attribute types
export type AttributeValue = string | number | boolean | string[] | number[]

export interface Attributes {
  [key: string]: AttributeValue
}

// Subject represents the entity requesting access
export interface Subject {
  id: string
  type: 'user' | 'service' | 'api_key'
  attributes: Attributes
}

// Resource represents what is being accessed
export interface Resource {
  id: string
  type: string
  attributes: Attributes
}

// Action represents what operation is being performed
export interface Action {
  name: string
  attributes?: Attributes
}

// Environment context
export interface Environment {
  timestamp: Date
  ip?: string
  userAgent?: string
  location?: string
  attributes?: Attributes
}

// Access request
export interface AccessRequest {
  subject: Subject
  resource: Resource
  action: Action
  environment: Environment
}

// Policy effect
export type Effect = 'allow' | 'deny'

// Condition operators
export type Operator =
  | 'equals'
  | 'not_equals'
  | 'in'
  | 'not_in'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'starts_with'
  | 'ends_with'
  | 'matches'  // regex
  | 'between'
  | 'is_present'
  | 'is_absent'

// Condition definition
export interface Condition {
  // Attribute path (e.g., "subject.attributes.department")
  attribute: string
  operator: Operator
  // Value to compare against (can reference another attribute with $ prefix)
  value: AttributeValue | string
}

// Policy rule
export interface PolicyRule {
  id: string
  name: string
  description?: string
  effect: Effect
  priority?: number

  // Target constraints
  subjects?: {
    types?: string[]
    conditions?: Condition[]
  }
  resources?: {
    types?: string[]
    conditions?: Condition[]
  }
  actions?: {
    names?: string[]
    conditions?: Condition[]
  }
  environment?: {
    conditions?: Condition[]
  }

  // Combined conditions (all must be true)
  conditions?: Condition[]
}

// Policy set
export interface PolicySet {
  id: string
  name: string
  description?: string
  combiningAlgorithm: 'deny_overrides' | 'permit_overrides' | 'first_applicable'
  rules: PolicyRule[]
}

// Access decision
export interface AccessDecision {
  allowed: boolean
  effect: Effect
  matchedRule?: string
  reason?: string
  obligations?: Obligation[]
  advice?: Advice[]
}

// Post-decision actions
export interface Obligation {
  id: string
  type: 'log' | 'notify' | 'encrypt' | 'redact' | 'custom'
  parameters: Record<string, AttributeValue>
}

export interface Advice {
  id: string
  message: string
  parameters?: Record<string, AttributeValue>
}
```

## Policy Evaluation Engine

```typescript
// lib/abac/engine.ts
import {
  AccessRequest,
  AccessDecision,
  PolicySet,
  PolicyRule,
  Condition,
  Effect,
  Attributes,
  AttributeValue,
} from './types'

// Resolve attribute path from request
function resolveAttribute(
  request: AccessRequest,
  path: string
): AttributeValue | undefined {
  const parts = path.split('.')
  let current: any = request

  for (const part of parts) {
    if (current === undefined || current === null) return undefined
    current = current[part]
  }

  return current as AttributeValue
}

// Resolve value (may reference another attribute with $ prefix)
function resolveValue(
  request: AccessRequest,
  value: AttributeValue | string
): AttributeValue | undefined {
  if (typeof value === 'string' && value.startsWith('$')) {
    return resolveAttribute(request, value.slice(1))
  }
  return value
}

// Evaluate a single condition
function evaluateCondition(
  request: AccessRequest,
  condition: Condition
): boolean {
  const attributeValue = resolveAttribute(request, condition.attribute)
  const targetValue = resolveValue(request, condition.value)

  switch (condition.operator) {
    case 'equals':
      return attributeValue === targetValue

    case 'not_equals':
      return attributeValue !== targetValue

    case 'in':
      if (!Array.isArray(targetValue)) return false
      return targetValue.includes(attributeValue as any)

    case 'not_in':
      if (!Array.isArray(targetValue)) return true
      return !targetValue.includes(attributeValue as any)

    case 'contains':
      if (Array.isArray(attributeValue)) {
        return attributeValue.includes(targetValue as any)
      }
      if (typeof attributeValue === 'string' && typeof targetValue === 'string') {
        return attributeValue.includes(targetValue)
      }
      return false

    case 'not_contains':
      if (Array.isArray(attributeValue)) {
        return !attributeValue.includes(targetValue as any)
      }
      if (typeof attributeValue === 'string' && typeof targetValue === 'string') {
        return !attributeValue.includes(targetValue)
      }
      return true

    case 'greater_than':
      if (typeof attributeValue === 'number' && typeof targetValue === 'number') {
        return attributeValue > targetValue
      }
      return false

    case 'less_than':
      if (typeof attributeValue === 'number' && typeof targetValue === 'number') {
        return attributeValue < targetValue
      }
      return false

    case 'greater_than_or_equal':
      if (typeof attributeValue === 'number' && typeof targetValue === 'number') {
        return attributeValue >= targetValue
      }
      return false

    case 'less_than_or_equal':
      if (typeof attributeValue === 'number' && typeof targetValue === 'number') {
        return attributeValue <= targetValue
      }
      return false

    case 'starts_with':
      if (typeof attributeValue === 'string' && typeof targetValue === 'string') {
        return attributeValue.startsWith(targetValue)
      }
      return false

    case 'ends_with':
      if (typeof attributeValue === 'string' && typeof targetValue === 'string') {
        return attributeValue.endsWith(targetValue)
      }
      return false

    case 'matches':
      if (typeof attributeValue === 'string' && typeof targetValue === 'string') {
        try {
          return new RegExp(targetValue).test(attributeValue)
        } catch {
          return false
        }
      }
      return false

    case 'between':
      if (typeof attributeValue === 'number' && Array.isArray(targetValue)) {
        const [min, max] = targetValue as number[]
        return attributeValue >= min && attributeValue <= max
      }
      return false

    case 'is_present':
      return attributeValue !== undefined && attributeValue !== null

    case 'is_absent':
      return attributeValue === undefined || attributeValue === null

    default:
      return false
  }
}

// Evaluate multiple conditions (all must be true)
function evaluateConditions(
  request: AccessRequest,
  conditions: Condition[]
): boolean {
  return conditions.every((condition) => evaluateCondition(request, condition))
}

// Check if rule target matches
function targetMatches(
  request: AccessRequest,
  rule: PolicyRule
): boolean {
  // Check subject target
  if (rule.subjects) {
    if (rule.subjects.types && !rule.subjects.types.includes(request.subject.type)) {
      return false
    }
    if (rule.subjects.conditions && !evaluateConditions(request, rule.subjects.conditions)) {
      return false
    }
  }

  // Check resource target
  if (rule.resources) {
    if (rule.resources.types && !rule.resources.types.includes(request.resource.type)) {
      return false
    }
    if (rule.resources.conditions && !evaluateConditions(request, rule.resources.conditions)) {
      return false
    }
  }

  // Check action target
  if (rule.actions) {
    if (rule.actions.names && !rule.actions.names.includes(request.action.name)) {
      return false
    }
    if (rule.actions.conditions && !evaluateConditions(request, rule.actions.conditions)) {
      return false
    }
  }

  // Check environment target
  if (rule.environment?.conditions) {
    if (!evaluateConditions(request, rule.environment.conditions)) {
      return false
    }
  }

  return true
}

// Evaluate a single rule
function evaluateRule(
  request: AccessRequest,
  rule: PolicyRule
): Effect | null {
  // Check if rule target matches
  if (!targetMatches(request, rule)) {
    return null // Rule doesn't apply
  }

  // Evaluate rule conditions
  if (rule.conditions && !evaluateConditions(request, rule.conditions)) {
    return null // Conditions not met
  }

  return rule.effect
}

// Evaluate policy set
export function evaluatePolicySet(
  request: AccessRequest,
  policySet: PolicySet
): AccessDecision {
  // Sort rules by priority (lower = higher priority)
  const sortedRules = [...policySet.rules].sort(
    (a, b) => (a.priority ?? 100) - (b.priority ?? 100)
  )

  let decision: AccessDecision | null = null

  switch (policySet.combiningAlgorithm) {
    case 'deny_overrides':
      // Any deny wins
      for (const rule of sortedRules) {
        const effect = evaluateRule(request, rule)
        if (effect === 'deny') {
          return {
            allowed: false,
            effect: 'deny',
            matchedRule: rule.id,
            reason: `Denied by rule: ${rule.name}`,
          }
        }
        if (effect === 'allow' && !decision) {
          decision = {
            allowed: true,
            effect: 'allow',
            matchedRule: rule.id,
            reason: `Allowed by rule: ${rule.name}`,
          }
        }
      }
      break

    case 'permit_overrides':
      // Any permit wins
      for (const rule of sortedRules) {
        const effect = evaluateRule(request, rule)
        if (effect === 'allow') {
          return {
            allowed: true,
            effect: 'allow',
            matchedRule: rule.id,
            reason: `Allowed by rule: ${rule.name}`,
          }
        }
        if (effect === 'deny' && !decision) {
          decision = {
            allowed: false,
            effect: 'deny',
            matchedRule: rule.id,
            reason: `Denied by rule: ${rule.name}`,
          }
        }
      }
      break

    case 'first_applicable':
      // First matching rule wins
      for (const rule of sortedRules) {
        const effect = evaluateRule(request, rule)
        if (effect !== null) {
          return {
            allowed: effect === 'allow',
            effect,
            matchedRule: rule.id,
            reason: `${effect === 'allow' ? 'Allowed' : 'Denied'} by rule: ${rule.name}`,
          }
        }
      }
      break
  }

  // Return decision or default deny
  return decision || {
    allowed: false,
    effect: 'deny',
    reason: 'No matching rule found (default deny)',
  }
}
```

## Policy Definitions

```typescript
// lib/abac/policies.ts
import { PolicySet, PolicyRule } from './types'

// Example: Document access policy
export const documentAccessPolicy: PolicySet = {
  id: 'document-access',
  name: 'Document Access Policy',
  description: 'Controls access to documents based on user and document attributes',
  combiningAlgorithm: 'deny_overrides',
  rules: [
    {
      id: 'owner-full-access',
      name: 'Owners have full access to their documents',
      effect: 'allow',
      priority: 1,
      resources: { types: ['document'] },
      conditions: [
        {
          attribute: 'resource.attributes.ownerId',
          operator: 'equals',
          value: '$subject.id',
        },
      ],
    },
    {
      id: 'department-access',
      name: 'Users can read documents in their department',
      effect: 'allow',
      priority: 2,
      resources: { types: ['document'] },
      actions: { names: ['read', 'list'] },
      conditions: [
        {
          attribute: 'resource.attributes.department',
          operator: 'equals',
          value: '$subject.attributes.department',
        },
      ],
    },
    {
      id: 'public-read',
      name: 'Anyone can read public documents',
      effect: 'allow',
      priority: 3,
      resources: { types: ['document'] },
      actions: { names: ['read'] },
      conditions: [
        {
          attribute: 'resource.attributes.visibility',
          operator: 'equals',
          value: 'public',
        },
      ],
    },
    {
      id: 'confidential-deny',
      name: 'Deny access to confidential without clearance',
      effect: 'deny',
      priority: 0, // High priority
      resources: { types: ['document'] },
      conditions: [
        {
          attribute: 'resource.attributes.classification',
          operator: 'equals',
          value: 'confidential',
        },
        {
          attribute: 'subject.attributes.clearanceLevel',
          operator: 'not_in',
          value: ['secret', 'top-secret'],
        },
      ],
    },
    {
      id: 'business-hours-only',
      name: 'External access only during business hours',
      effect: 'deny',
      priority: 1,
      subjects: {
        conditions: [
          {
            attribute: 'subject.attributes.isExternal',
            operator: 'equals',
            value: true,
          },
        ],
      },
      environment: {
        conditions: [
          {
            attribute: 'environment.attributes.hour',
            operator: 'not_in',
            value: [9, 10, 11, 12, 13, 14, 15, 16, 17],
          },
        ],
      },
    },
  ],
}

// Example: API access policy
export const apiAccessPolicy: PolicySet = {
  id: 'api-access',
  name: 'API Access Policy',
  combiningAlgorithm: 'first_applicable',
  rules: [
    {
      id: 'admin-full-access',
      name: 'Admins have full API access',
      effect: 'allow',
      priority: 1,
      conditions: [
        {
          attribute: 'subject.attributes.role',
          operator: 'equals',
          value: 'admin',
        },
      ],
    },
    {
      id: 'rate-limited',
      name: 'Deny if rate limit exceeded',
      effect: 'deny',
      priority: 0,
      conditions: [
        {
          attribute: 'subject.attributes.requestsThisHour',
          operator: 'greater_than',
          value: '$subject.attributes.rateLimit',
        },
      ],
    },
    {
      id: 'read-only-users',
      name: 'Basic users have read-only access',
      effect: 'allow',
      priority: 2,
      actions: { names: ['read', 'list', 'get'] },
      conditions: [
        {
          attribute: 'subject.attributes.plan',
          operator: 'equals',
          value: 'free',
        },
      ],
    },
    {
      id: 'premium-write',
      name: 'Premium users can write',
      effect: 'allow',
      priority: 2,
      actions: { names: ['create', 'update', 'delete'] },
      conditions: [
        {
          attribute: 'subject.attributes.plan',
          operator: 'in',
          value: ['pro', 'enterprise'],
        },
      ],
    },
  ],
}

// Get all policies
export function getAllPolicies(): PolicySet[] {
  return [documentAccessPolicy, apiAccessPolicy]
}

// Get policy by resource type
export function getPolicyForResource(resourceType: string): PolicySet | null {
  const policyMap: Record<string, PolicySet> = {
    document: documentAccessPolicy,
    api: apiAccessPolicy,
  }
  return policyMap[resourceType] || null
}
```

## ABAC Service

```typescript
// lib/abac/service.ts
import { AccessRequest, AccessDecision, Subject, Resource, Action, Environment } from './types'
import { evaluatePolicySet } from './engine'
import { getPolicyForResource, getAllPolicies } from './policies'

// Audit logging
async function logDecision(
  request: AccessRequest,
  decision: AccessDecision
): Promise<void> {
  if (process.env.ABAC_AUDIT_ENABLED !== 'true') return

  const auditLog = {
    timestamp: new Date().toISOString(),
    subject: {
      id: request.subject.id,
      type: request.subject.type,
    },
    resource: {
      id: request.resource.id,
      type: request.resource.type,
    },
    action: request.action.name,
    decision: decision.allowed ? 'ALLOW' : 'DENY',
    matchedRule: decision.matchedRule,
    reason: decision.reason,
  }

  console.log('ABAC Decision:', JSON.stringify(auditLog))
  // In production, send to logging service
}

// Main authorization check
export async function isAuthorized(
  request: AccessRequest
): Promise<AccessDecision> {
  // Find applicable policy
  const policy = getPolicyForResource(request.resource.type)

  if (!policy) {
    const decision: AccessDecision = {
      allowed: process.env.ABAC_DEFAULT_EFFECT === 'allow',
      effect: process.env.ABAC_DEFAULT_EFFECT === 'allow' ? 'allow' : 'deny',
      reason: 'No policy found for resource type',
    }
    await logDecision(request, decision)
    return decision
  }

  // Evaluate policy
  const decision = evaluatePolicySet(request, policy)

  // Log decision
  await logDecision(request, decision)

  return decision
}

// Simplified authorization check
export async function can(
  subject: Subject,
  action: string,
  resource: Resource
): Promise<boolean> {
  const request: AccessRequest = {
    subject,
    action: { name: action },
    resource,
    environment: {
      timestamp: new Date(),
      attributes: {
        hour: new Date().getHours(),
        dayOfWeek: new Date().getDay(),
      },
    },
  }

  const decision = await isAuthorized(request)
  return decision.allowed
}

// Batch authorization check
export async function canAll(
  subject: Subject,
  checks: Array<{ action: string; resource: Resource }>
): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>()

  await Promise.all(
    checks.map(async ({ action, resource }) => {
      const key = `${action}:${resource.type}:${resource.id}`
      results.set(key, await can(subject, action, resource))
    })
  )

  return results
}

// Get all allowed actions for a resource
export async function getAllowedActions(
  subject: Subject,
  resource: Resource
): Promise<string[]> {
  const actions = ['read', 'create', 'update', 'delete', 'list', 'admin']
  const allowed: string[] = []

  for (const action of actions) {
    if (await can(subject, action, resource)) {
      allowed.push(action)
    }
  }

  return allowed
}
```

## Middleware

```typescript
// middleware/abac.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { isAuthorized, Subject, Resource, AccessRequest } from '@/lib/abac'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

interface ABACOptions {
  resourceType: string
  action: string
  getResourceId?: (request: NextRequest) => string
  getResourceAttributes?: (request: NextRequest) => Promise<Record<string, any>>
}

export function withABAC(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: ABACOptions
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    // Get session
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build subject from session
    const subject: Subject = {
      id: session.user.id,
      type: 'user',
      attributes: {
        email: session.user.email || '',
        role: (session.user as any).role || 'user',
        department: (session.user as any).department,
        clearanceLevel: (session.user as any).clearanceLevel,
        plan: (session.user as any).plan || 'free',
        isExternal: (session.user as any).isExternal || false,
      },
    }

    // Get resource ID
    const resourceId = options.getResourceId?.(request) ||
      request.nextUrl.searchParams.get('id') ||
      'unknown'

    // Get resource attributes
    const resourceAttributes = options.getResourceAttributes
      ? await options.getResourceAttributes(request)
      : {}

    // Build resource
    const resource: Resource = {
      id: resourceId,
      type: options.resourceType,
      attributes: resourceAttributes,
    }

    // Build access request
    const accessRequest: AccessRequest = {
      subject,
      resource,
      action: { name: options.action },
      environment: {
        timestamp: new Date(),
        ip: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        attributes: {
          hour: new Date().getHours(),
          dayOfWeek: new Date().getDay(),
        },
      },
    }

    // Check authorization
    const decision = await isAuthorized(accessRequest)

    if (!decision.allowed) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          reason: decision.reason,
        },
        { status: 403 }
      )
    }

    // Continue to handler
    return handler(request)
  }
}
```

## React Hook

```typescript
// hooks/use-abac.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface UseABACOptions {
  resourceType: string
  resourceId: string
  resourceAttributes?: Record<string, any>
}

export function useABAC(options: UseABACOptions) {
  const { data: session } = useSession()
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  const checkPermission = useCallback(async (action: string): Promise<boolean> => {
    if (!session?.user) return false

    try {
      const response = await fetch('/api/abac/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          resourceType: options.resourceType,
          resourceId: options.resourceId,
          resourceAttributes: options.resourceAttributes,
        }),
      })

      const data = await response.json()
      return data.allowed
    } catch {
      return false
    }
  }, [session, options])

  // Load initial permissions
  useEffect(() => {
    async function loadPermissions() {
      if (!session?.user) {
        setLoading(false)
        return
      }

      setLoading(true)
      const actions = ['read', 'create', 'update', 'delete', 'admin']
      const results: Record<string, boolean> = {}

      await Promise.all(
        actions.map(async (action) => {
          results[action] = await checkPermission(action)
        })
      )

      setPermissions(results)
      setLoading(false)
    }

    loadPermissions()
  }, [session, checkPermission])

  return {
    can: (action: string) => permissions[action] ?? false,
    checkPermission,
    permissions,
    loading,
  }
}
```

## React Component

```typescript
// components/abac/permission-gate.tsx
'use client'

import { ReactNode } from 'react'
import { useABAC } from '@/hooks/use-abac'

interface PermissionGateProps {
  action: string
  resourceType: string
  resourceId: string
  resourceAttributes?: Record<string, any>
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGate({
  action,
  resourceType,
  resourceId,
  resourceAttributes,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { can, loading } = useABAC({
    resourceType,
    resourceId,
    resourceAttributes,
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
function DocumentActions({ document }: { document: any }) {
  return (
    <div>
      <PermissionGate
        action="read"
        resourceType="document"
        resourceId={document.id}
        resourceAttributes={document}
      >
        <button>View</button>
      </PermissionGate>

      <PermissionGate
        action="update"
        resourceType="document"
        resourceId={document.id}
        resourceAttributes={document}
      >
        <button>Edit</button>
      </PermissionGate>

      <PermissionGate
        action="delete"
        resourceType="document"
        resourceId={document.id}
        resourceAttributes={document}
      >
        <button>Delete</button>
      </PermissionGate>
    </div>
  )
}
```

## Testing

```typescript
// __tests__/abac.test.ts
import { describe, it, expect } from 'vitest'
import { evaluatePolicySet } from '@/lib/abac/engine'
import { documentAccessPolicy } from '@/lib/abac/policies'
import { AccessRequest, Subject, Resource, Environment } from '@/lib/abac/types'

describe('ABAC Engine', () => {
  const createRequest = (
    subjectAttrs: Record<string, any>,
    resourceAttrs: Record<string, any>,
    action: string
  ): AccessRequest => ({
    subject: {
      id: 'user-1',
      type: 'user',
      attributes: subjectAttrs,
    },
    resource: {
      id: 'doc-1',
      type: 'document',
      attributes: resourceAttrs,
    },
    action: { name: action },
    environment: {
      timestamp: new Date(),
      attributes: { hour: 10 },
    },
  })

  describe('Document Access Policy', () => {
    it('should allow owner full access', () => {
      const request = createRequest(
        { department: 'engineering' },
        { ownerId: 'user-1', department: 'sales' },
        'delete'
      )

      const decision = evaluatePolicySet(request, documentAccessPolicy)
      expect(decision.allowed).toBe(true)
    })

    it('should allow same department read access', () => {
      const request = createRequest(
        { department: 'engineering' },
        { ownerId: 'other-user', department: 'engineering' },
        'read'
      )

      const decision = evaluatePolicySet(request, documentAccessPolicy)
      expect(decision.allowed).toBe(true)
    })

    it('should deny cross-department write access', () => {
      const request = createRequest(
        { department: 'engineering' },
        { ownerId: 'other-user', department: 'sales' },
        'update'
      )

      const decision = evaluatePolicySet(request, documentAccessPolicy)
      expect(decision.allowed).toBe(false)
    })

    it('should allow public document read', () => {
      const request = createRequest(
        { department: 'any' },
        { visibility: 'public' },
        'read'
      )

      const decision = evaluatePolicySet(request, documentAccessPolicy)
      expect(decision.allowed).toBe(true)
    })

    it('should deny confidential without clearance', () => {
      const request = createRequest(
        { clearanceLevel: 'public' },
        { classification: 'confidential', ownerId: 'user-1' },
        'read'
      )

      const decision = evaluatePolicySet(request, documentAccessPolicy)
      expect(decision.allowed).toBe(false)
    })

    it('should allow confidential with clearance', () => {
      const request = createRequest(
        { clearanceLevel: 'secret' },
        { classification: 'confidential', ownerId: 'user-1' },
        'read'
      )

      const decision = evaluatePolicySet(request, documentAccessPolicy)
      expect(decision.allowed).toBe(true)
    })
  })
})
```

## CLAUDE.md Integration

```markdown
## Attribute-Based Access Control (ABAC)

This project uses ABAC for fine-grained authorization.

### Key Files
- `lib/abac/types.ts` - ABAC type definitions
- `lib/abac/engine.ts` - Policy evaluation engine
- `lib/abac/policies.ts` - Policy definitions
- `lib/abac/service.ts` - Authorization service

### Policy Structure
Policies are evaluated using:
- Subject attributes (user properties)
- Resource attributes (document/object properties)
- Action (read, write, delete, etc.)
- Environment (time, location, etc.)

### Usage
```typescript
const allowed = await can(subject, 'read', resource)

// With full context
const decision = await isAuthorized({
  subject,
  resource,
  action: { name: 'read' },
  environment: { timestamp: new Date() }
})
```

### Adding Policies
Define policies in `lib/abac/policies.ts` following the PolicySet structure.
```

## AI Suggestions

1. **Policy administration point (PAP)** - Admin UI for managing policies dynamically
2. **Policy information point (PIP)** - External attribute sources (LDAP, APIs)
3. **Policy caching** - Cache policy evaluations for performance
4. **Hierarchical attributes** - Support for org hierarchies in policies
5. **Temporal policies** - Time-based access rules (business hours, embargoes)
6. **Delegation** - Allow users to delegate their permissions
7. **Policy simulation** - Test policies before deployment
8. **XACML export** - Export policies to standard XACML format
