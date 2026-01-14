# API-First Development Workflow

A structured workflow for building APIs that prioritize design, documentation, and testing before implementation.

---

## WORKFLOW OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                    API-FIRST DEVELOPMENT                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐        │
│  │  DESIGN  │ → │   MOCK   │ → │  BUILD   │ → │  VERIFY  │        │
│  │   API    │   │   API    │   │   API    │   │   API    │        │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘        │
│       ↓              ↓              ↓              ↓               │
│   OpenAPI       Mock Server    Implementation   Testing &          │
│   Spec          for Frontend   with Types       Documentation      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## PHASE 1: API DESIGN

### Skills Used
- `/api-design` - Design API endpoints
- `/graphql-builder` - GraphQL schema (if applicable)

### Steps

```bash
# 1. Design REST API
/api-design "User management API with CRUD operations"

# 2. Or design GraphQL API
/graphql-builder "User management schema"
```

### OpenAPI Specification

```yaml
openapi: 3.0.3
info:
  title: User Management API
  version: 1.0.0

paths:
  /users:
    get:
      summary: List all users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: List of users
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserList'
    post:
      summary: Create a user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUser'
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

  /users/{id}:
    get:
      summary: Get user by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: User found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          description: User not found

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
          format: email
        name:
          type: string
        createdAt:
          type: string
          format: date-time
      required:
        - id
        - email

    CreateUser:
      type: object
      properties:
        email:
          type: string
          format: email
        name:
          type: string
        password:
          type: string
          minLength: 8
      required:
        - email
        - password

    UserList:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/User'
        pagination:
          $ref: '#/components/schemas/Pagination'
```

### Deliverables
- [ ] OpenAPI/GraphQL specification
- [ ] Endpoint documentation
- [ ] Request/response schemas
- [ ] Error response formats

---

## PHASE 2: TYPE GENERATION

### Skills Used
- `/typescript` - Generate TypeScript types
- `/prisma-builder` - Database types

### Steps

```bash
# 1. Generate types from OpenAPI
npx openapi-typescript api.yaml -o src/types/api.ts

# 2. Or generate from Prisma
npx prisma generate
```

### Generated Types

```typescript
// src/types/api.ts
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

export interface CreateUserRequest {
  email: string;
  name?: string;
  password: string;
}

export interface UserListResponse {
  data: User[];
  pagination: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

---

## PHASE 3: MOCK SERVER

### Skills Used
- `/n8n-api` - Create mock endpoints
- Testing libraries

### Mock Setup

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
import type { User, CreateUserRequest } from '@/types/api';

const users: User[] = [
  { id: '1', email: 'john@example.com', name: 'John', createdAt: '2024-01-01' },
  { id: '2', email: 'jane@example.com', name: 'Jane', createdAt: '2024-01-02' },
];

export const handlers = [
  http.get('/api/users', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 20;

    return HttpResponse.json({
      data: users.slice((page - 1) * limit, page * limit),
      pagination: {
        page,
        limit,
        total: users.length,
        totalPages: Math.ceil(users.length / limit)
      }
    });
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json() as CreateUserRequest;
    const newUser: User = {
      id: String(users.length + 1),
      email: body.email,
      name: body.name,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    return HttpResponse.json(newUser, { status: 201 });
  }),

  http.get('/api/users/:id', ({ params }) => {
    const user = users.find(u => u.id === params.id);
    if (!user) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(user);
  })
];
```

---

## PHASE 4: IMPLEMENTATION

### Skills Used
- `/prisma-builder` - Database layer
- `/blueprint` - API implementation

### API Route Implementation

```typescript
// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  password: z.string().min(8)
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 20;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count()
  ]);

  return NextResponse.json({
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const hashedPassword = await hash(parsed.data.password, 12);

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      password: hashedPassword
    }
  });

  return NextResponse.json(user, { status: 201 });
}
```

---

## PHASE 5: TESTING

### Skills Used
- `/vitest-builder` - Unit tests
- `/playwright-builder` - E2E API tests

### API Tests

```typescript
// src/app/api/users/__tests__/route.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { prisma } from '@/lib/prisma';

describe('Users API', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  describe('GET /api/users', () => {
    it('returns paginated users', async () => {
      await prisma.user.createMany({
        data: [
          { email: 'user1@test.com', name: 'User 1', password: 'hash' },
          { email: 'user2@test.com', name: 'User 2', password: 'hash' }
        ]
      });

      const request = new Request('http://localhost/api/users?page=1&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(data.pagination.total).toBe(2);
    });
  });

  describe('POST /api/users', () => {
    it('creates a new user', async () => {
      const request = new Request('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'new@test.com',
          name: 'New User',
          password: 'password123'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.email).toBe('new@test.com');
    });

    it('validates email format', async () => {
      const request = new Request('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid',
          password: 'password123'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });
});
```

---

## PHASE 6: DOCUMENTATION

### Skills Used
- `/docs` - Generate documentation
- Swagger UI setup

### Auto-Generated Docs

```typescript
// src/app/api/docs/route.ts
import { NextResponse } from 'next/server';
import spec from '@/api.yaml';

export async function GET() {
  return NextResponse.json(spec);
}
```

```typescript
// src/app/docs/page.tsx
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function DocsPage() {
  return <SwaggerUI url="/api/docs" />;
}
```

---

## WORKFLOW COMMAND

```bash
# Full API-first development
claude "Build a REST API for product management with:
1. OpenAPI spec first
2. TypeScript types generated
3. Prisma for database
4. Full test coverage
5. Swagger documentation"
```

---

## SUCCESS CRITERIA

- [ ] OpenAPI spec complete
- [ ] Types match spec exactly
- [ ] All endpoints implemented
- [ ] Tests cover all scenarios
- [ ] Documentation auto-generated
- [ ] Mock server available

$ARGUMENTS
