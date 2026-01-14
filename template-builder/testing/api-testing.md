# API Testing Templates

Production-ready API testing patterns with Supertest, HTTPie, and Python requests.

## Overview

- **REST API Testing**: Endpoint testing with Supertest
- **GraphQL Testing**: Query and mutation testing
- **API Contract Testing**: Schema validation
- **Load Testing**: API performance under load

## Quick Start

```bash
# Node.js
npm install -D supertest @types/supertest

# Python
pip install httpx pytest-httpx respx
```

## Supertest API Testing

```typescript
// tests/api/users.api.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { db } from '../../src/db';
import { createTestUser, generateAuthToken } from '../helpers';

describe('Users API', () => {
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const user = await createTestUser({ role: 'admin' });
    testUserId = user.id;
    authToken = generateAuthToken(user);
  });

  afterAll(async () => {
    await db.cleanup();
  });

  describe('GET /api/users', () => {
    it('returns paginated users list', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        data: expect.any(Array),
        pagination: {
          page: 1,
          limit: 10,
          total: expect.any(Number),
          totalPages: expect.any(Number),
        },
      });
    });

    it('filters users by role', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ role: 'admin' });

      expect(response.status).toBe(200);
      expect(response.body.data.every((u: any) => u.role === 'admin')).toBe(true);
    });

    it('returns 401 without auth token', async () => {
      const response = await request(app).get('/api/users');

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        message: expect.any(String),
      });
    });

    it('returns 403 for non-admin users', async () => {
      const regularUser = await createTestUser({ role: 'user' });
      const userToken = generateAuthToken(regularUser);

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/users/:id', () => {
    it('returns user by id', async () => {
      const response = await request(app)
        .get(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: testUserId,
        email: expect.any(String),
        name: expect.any(String),
      });
      expect(response.body).not.toHaveProperty('password');
    });

    it('returns 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/users', () => {
    it('creates new user with valid data', async () => {
      const userData = {
        email: 'newuser@example.com',
        name: 'New User',
        password: 'SecureP@ss123',
        role: 'user',
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        email: userData.email,
        name: userData.name,
        role: userData.role,
      });
      expect(response.body).not.toHaveProperty('password');
    });

    it('returns 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'invalid-email',
          name: 'Test',
          password: 'pass123',
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'email',
          message: expect.stringContaining('valid email'),
        })
      );
    });

    it('returns 409 for duplicate email', async () => {
      const existingUser = await createTestUser();

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: existingUser.email,
          name: 'Duplicate',
          password: 'SecureP@ss123',
        });

      expect(response.status).toBe(409);
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('updates user fields', async () => {
      const user = await createTestUser();

      const response = await request(app)
        .patch(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
    });

    it('returns 400 for invalid update data', async () => {
      const response = await request(app)
        .patch(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'invalid' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('deletes user', async () => {
      const user = await createTestUser();

      const response = await request(app)
        .delete(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verify deletion
      const getResponse = await request(app)
        .get(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('returns 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/users/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
```

## Python API Testing

```python
# tests/api/test_users_api.py
"""API tests for user endpoints."""
import pytest
from httpx import AsyncClient
from app.main import app
from tests.factories import UserFactory
from tests.helpers import create_auth_headers


@pytest.fixture
async def client():
    """Create async HTTP client."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.fixture
async def auth_headers(client):
    """Create authentication headers."""
    user = await UserFactory.create(role="admin")
    return create_auth_headers(user)


class TestUsersAPI:
    """Tests for /api/users endpoints."""

    @pytest.mark.asyncio
    async def test_list_users(self, client, auth_headers):
        """Test listing users."""
        # Create test users
        await UserFactory.create_batch(5)

        response = await client.get(
            "/api/users",
            headers=auth_headers,
            params={"page": 1, "limit": 10},
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "pagination" in data
        assert len(data["data"]) >= 5

    @pytest.mark.asyncio
    async def test_list_users_unauthorized(self, client):
        """Test listing users without auth."""
        response = await client.get("/api/users")

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_user(self, client, auth_headers):
        """Test getting single user."""
        user = await UserFactory.create()

        response = await client.get(
            f"/api/users/{user.id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(user.id)
        assert data["email"] == user.email
        assert "password" not in data

    @pytest.mark.asyncio
    async def test_get_user_not_found(self, client, auth_headers):
        """Test getting non-existent user."""
        response = await client.get(
            "/api/users/non-existent-id",
            headers=auth_headers,
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_create_user(self, client, auth_headers):
        """Test creating user."""
        user_data = {
            "email": "newuser@example.com",
            "name": "New User",
            "password": "SecureP@ss123",
        }

        response = await client.post(
            "/api/users",
            headers=auth_headers,
            json=user_data,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["name"] == user_data["name"]
        assert "password" not in data

    @pytest.mark.asyncio
    async def test_create_user_invalid_email(self, client, auth_headers):
        """Test creating user with invalid email."""
        response = await client.post(
            "/api/users",
            headers=auth_headers,
            json={
                "email": "invalid",
                "name": "Test",
                "password": "pass123",
            },
        )

        assert response.status_code == 422
        data = response.json()
        assert any(e["loc"] == ["body", "email"] for e in data["detail"])

    @pytest.mark.asyncio
    async def test_create_user_duplicate_email(self, client, auth_headers):
        """Test creating user with existing email."""
        existing = await UserFactory.create()

        response = await client.post(
            "/api/users",
            headers=auth_headers,
            json={
                "email": existing.email,
                "name": "Duplicate",
                "password": "SecureP@ss123",
            },
        )

        assert response.status_code == 409

    @pytest.mark.asyncio
    async def test_update_user(self, client, auth_headers):
        """Test updating user."""
        user = await UserFactory.create()

        response = await client.patch(
            f"/api/users/{user.id}",
            headers=auth_headers,
            json={"name": "Updated Name"},
        )

        assert response.status_code == 200
        assert response.json()["name"] == "Updated Name"

    @pytest.mark.asyncio
    async def test_delete_user(self, client, auth_headers):
        """Test deleting user."""
        user = await UserFactory.create()

        response = await client.delete(
            f"/api/users/{user.id}",
            headers=auth_headers,
        )

        assert response.status_code == 204

        # Verify deletion
        get_response = await client.get(
            f"/api/users/{user.id}",
            headers=auth_headers,
        )
        assert get_response.status_code == 404


class TestUsersAPIFiltering:
    """Tests for user filtering and search."""

    @pytest.mark.asyncio
    async def test_filter_by_role(self, client, auth_headers):
        """Test filtering users by role."""
        await UserFactory.create_batch(3, role="admin")
        await UserFactory.create_batch(2, role="user")

        response = await client.get(
            "/api/users",
            headers=auth_headers,
            params={"role": "admin"},
        )

        assert response.status_code == 200
        data = response.json()
        assert all(u["role"] == "admin" for u in data["data"])

    @pytest.mark.asyncio
    async def test_search_by_name(self, client, auth_headers):
        """Test searching users by name."""
        await UserFactory.create(name="Alice Smith")
        await UserFactory.create(name="Bob Jones")

        response = await client.get(
            "/api/users",
            headers=auth_headers,
            params={"search": "alice"},
        )

        assert response.status_code == 200
        data = response.json()
        assert all("alice" in u["name"].lower() for u in data["data"])

    @pytest.mark.asyncio
    async def test_sort_by_created_at(self, client, auth_headers):
        """Test sorting users by creation date."""
        response = await client.get(
            "/api/users",
            headers=auth_headers,
            params={"sort": "created_at", "order": "desc"},
        )

        assert response.status_code == 200
        data = response.json()["data"]

        dates = [u["created_at"] for u in data]
        assert dates == sorted(dates, reverse=True)
```

## GraphQL API Testing

```typescript
// tests/graphql/users.graphql.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { createTestUser, generateAuthToken } from '../helpers';

describe('GraphQL Users API', () => {
  let authToken: string;

  beforeAll(async () => {
    const user = await createTestUser({ role: 'admin' });
    authToken = generateAuthToken(user);
  });

  const graphqlRequest = (query: string, variables?: object) =>
    request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ query, variables });

  describe('Query: users', () => {
    it('returns list of users', async () => {
      const query = `
        query GetUsers($limit: Int, $offset: Int) {
          users(limit: $limit, offset: $offset) {
            id
            email
            name
            role
          }
        }
      `;

      const response = await graphqlRequest(query, { limit: 10, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.users).toBeInstanceOf(Array);
    });

    it('returns specific user by id', async () => {
      const user = await createTestUser();

      const query = `
        query GetUser($id: ID!) {
          user(id: $id) {
            id
            email
            name
          }
        }
      `;

      const response = await graphqlRequest(query, { id: user.id });

      expect(response.body.data.user).toMatchObject({
        id: user.id,
        email: user.email,
      });
    });
  });

  describe('Mutation: createUser', () => {
    it('creates new user', async () => {
      const mutation = `
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
            email
            name
          }
        }
      `;

      const response = await graphqlRequest(mutation, {
        input: {
          email: 'graphql@example.com',
          name: 'GraphQL User',
          password: 'SecureP@ss123',
        },
      });

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.createUser).toMatchObject({
        email: 'graphql@example.com',
        name: 'GraphQL User',
      });
    });

    it('returns validation errors', async () => {
      const mutation = `
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
          }
        }
      `;

      const response = await graphqlRequest(mutation, {
        input: {
          email: 'invalid',
          name: '',
          password: 'short',
        },
      });

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
    });
  });

  describe('Mutation: updateUser', () => {
    it('updates user fields', async () => {
      const user = await createTestUser();

      const mutation = `
        mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
          updateUser(id: $id, input: $input) {
            id
            name
          }
        }
      `;

      const response = await graphqlRequest(mutation, {
        id: user.id,
        input: { name: 'Updated via GraphQL' },
      });

      expect(response.body.data.updateUser.name).toBe('Updated via GraphQL');
    });
  });

  describe('Mutation: deleteUser', () => {
    it('deletes user', async () => {
      const user = await createTestUser();

      const mutation = `
        mutation DeleteUser($id: ID!) {
          deleteUser(id: $id)
        }
      `;

      const response = await graphqlRequest(mutation, { id: user.id });

      expect(response.body.data.deleteUser).toBe(true);
    });
  });
});
```

## CLAUDE.md Integration

```markdown
# API Testing

## Commands
- `npm run test:api` - Run API tests
- `pytest tests/api -v` - Run Python API tests
- `npm run test:api -- --coverage` - With coverage

## Test Patterns
- Test all HTTP methods
- Test auth and authorization
- Test validation errors
- Test edge cases and error states

## Best Practices
- Use fixtures for auth tokens
- Clean up test data
- Test response schemas
- Mock external services
```

## AI Suggestions

1. **OpenAPI validation** - Validate responses against OpenAPI spec
2. **Rate limiting tests** - Test rate limit behavior
3. **Pagination testing** - Comprehensive pagination tests
4. **File upload tests** - Test multipart form uploads
5. **Webhook testing** - Test webhook delivery
6. **API versioning tests** - Test version compatibility
7. **CORS testing** - Verify CORS headers
8. **Content negotiation** - Test Accept header handling
9. **Caching headers** - Test cache control headers
10. **API deprecation** - Test deprecation warnings
