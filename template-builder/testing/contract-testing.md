# Contract Testing Templates

Production-ready contract testing patterns with Pact, OpenAPI validation, and schema testing.

## Overview

- **Consumer-Driven Contracts**: Pact for API contracts
- **Provider Verification**: Server-side contract validation
- **Schema Validation**: OpenAPI/JSON Schema testing
- **Event Contracts**: Message/event schema validation

## Quick Start

```bash
# Node.js Pact
npm install -D @pact-foundation/pact @pact-foundation/pact-node

# Python Pact
pip install pact-python

# OpenAPI validation
npm install -D openapi-typescript-codegen ajv
pip install openapi-spec-validator schemathesis
```

## Pact Consumer Tests (TypeScript)

```typescript
// tests/contracts/consumer/user-api.pact.test.ts
import { Pact, Matchers } from '@pact-foundation/pact';
import { resolve } from 'path';
import { UserApiClient } from '../../../src/clients/user-api';

const { like, eachLike, iso8601DateTime, uuid } = Matchers;

describe('User API Consumer Contract', () => {
  const provider = new Pact({
    consumer: 'OrderService',
    provider: 'UserService',
    port: 8080,
    log: resolve(__dirname, '../../../logs', 'pact.log'),
    dir: resolve(__dirname, '../../../pacts'),
    logLevel: 'warn',
    spec: 3,
  });

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  describe('GET /api/users/:id', () => {
    it('returns user by id', async () => {
      const expectedUser = {
        id: uuid(),
        email: like('user@example.com'),
        name: like('John Doe'),
        role: like('user'),
        createdAt: iso8601DateTime(),
        updatedAt: iso8601DateTime(),
      };

      await provider.addInteraction({
        state: 'user with id user-123 exists',
        uponReceiving: 'a request for user by id',
        withRequest: {
          method: 'GET',
          path: '/api/users/user-123',
          headers: {
            Accept: 'application/json',
            Authorization: like('Bearer token'),
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedUser,
        },
      });

      const client = new UserApiClient(provider.mockService.baseUrl);
      const user = await client.getUser('user-123', 'token');

      expect(user).toMatchObject({
        id: expect.any(String),
        email: expect.any(String),
        name: expect.any(String),
      });
    });

    it('returns 404 for non-existent user', async () => {
      await provider.addInteraction({
        state: 'user with id non-existent does not exist',
        uponReceiving: 'a request for non-existent user',
        withRequest: {
          method: 'GET',
          path: '/api/users/non-existent',
          headers: {
            Accept: 'application/json',
            Authorization: like('Bearer token'),
          },
        },
        willRespondWith: {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            error: 'NotFound',
            message: like('User not found'),
          },
        },
      });

      const client = new UserApiClient(provider.mockService.baseUrl);

      await expect(client.getUser('non-existent', 'token'))
        .rejects.toThrow('User not found');
    });
  });

  describe('GET /api/users', () => {
    it('returns paginated list of users', async () => {
      await provider.addInteraction({
        state: 'users exist',
        uponReceiving: 'a request for users list',
        withRequest: {
          method: 'GET',
          path: '/api/users',
          query: {
            page: '1',
            limit: '10',
          },
          headers: {
            Accept: 'application/json',
            Authorization: like('Bearer token'),
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            data: eachLike({
              id: uuid(),
              email: like('user@example.com'),
              name: like('User Name'),
              role: like('user'),
            }),
            pagination: {
              page: like(1),
              limit: like(10),
              total: like(100),
              totalPages: like(10),
            },
          },
        },
      });

      const client = new UserApiClient(provider.mockService.baseUrl);
      const result = await client.listUsers({ page: 1, limit: 10 }, 'token');

      expect(result.data).toBeInstanceOf(Array);
      expect(result.pagination).toHaveProperty('total');
    });
  });

  describe('POST /api/users', () => {
    it('creates new user', async () => {
      const newUser = {
        email: 'new@example.com',
        name: 'New User',
        password: 'SecureP@ss123',
      };

      await provider.addInteraction({
        state: 'email new@example.com is available',
        uponReceiving: 'a request to create user',
        withRequest: {
          method: 'POST',
          path: '/api/users',
          headers: {
            'Content-Type': 'application/json',
            Authorization: like('Bearer admin-token'),
          },
          body: newUser,
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            id: uuid(),
            email: newUser.email,
            name: newUser.name,
            role: 'user',
            createdAt: iso8601DateTime(),
          },
        },
      });

      const client = new UserApiClient(provider.mockService.baseUrl);
      const user = await client.createUser(newUser, 'admin-token');

      expect(user.email).toBe(newUser.email);
      expect(user.id).toBeDefined();
    });

    it('returns 409 for duplicate email', async () => {
      await provider.addInteraction({
        state: 'email existing@example.com is taken',
        uponReceiving: 'a request to create user with existing email',
        withRequest: {
          method: 'POST',
          path: '/api/users',
          headers: {
            'Content-Type': 'application/json',
            Authorization: like('Bearer admin-token'),
          },
          body: {
            email: 'existing@example.com',
            name: 'Duplicate User',
            password: 'SecureP@ss123',
          },
        },
        willRespondWith: {
          status: 409,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            error: 'Conflict',
            message: like('Email already exists'),
          },
        },
      });

      const client = new UserApiClient(provider.mockService.baseUrl);

      await expect(
        client.createUser(
          { email: 'existing@example.com', name: 'Dup', password: 'pass' },
          'admin-token'
        )
      ).rejects.toThrow('Email already exists');
    });
  });
});
```

## Pact Provider Verification (TypeScript)

```typescript
// tests/contracts/provider/verify-user-service.test.ts
import { Verifier, VerifierOptions } from '@pact-foundation/pact';
import { resolve } from 'path';
import { app } from '../../../src/app';
import { db } from '../../../src/db';
import { createTestUser } from '../../helpers';

describe('User Service Provider Verification', () => {
  const server = app.listen(8081);

  afterAll(async () => {
    server.close();
    await db.close();
  });

  it('validates against consumer contracts', async () => {
    const options: VerifierOptions = {
      provider: 'UserService',
      providerBaseUrl: 'http://localhost:8081',
      pactUrls: [
        resolve(__dirname, '../../../pacts/orderservice-userservice.json'),
      ],
      // Or use Pact Broker
      // pactBrokerUrl: process.env.PACT_BROKER_URL,
      // pactBrokerToken: process.env.PACT_BROKER_TOKEN,
      // consumerVersionSelectors: [{ latest: true }],
      publishVerificationResult: process.env.CI === 'true',
      providerVersion: process.env.GIT_SHA || '1.0.0',
      stateHandlers: {
        'user with id user-123 exists': async () => {
          await createTestUser({ id: 'user-123' });
          return 'User created';
        },
        'user with id non-existent does not exist': async () => {
          // No setup needed - user doesn't exist
          return 'No user';
        },
        'users exist': async () => {
          await Promise.all([
            createTestUser({ id: 'user-1' }),
            createTestUser({ id: 'user-2' }),
            createTestUser({ id: 'user-3' }),
          ]);
          return 'Users created';
        },
        'email new@example.com is available': async () => {
          // Ensure email is not taken
          await db.users.deleteMany({ email: 'new@example.com' });
          return 'Email available';
        },
        'email existing@example.com is taken': async () => {
          await createTestUser({ email: 'existing@example.com' });
          return 'Email taken';
        },
      },
      requestFilter: (req, res, next) => {
        // Add auth for all requests
        if (req.headers.authorization) {
          // Validate and set user context
          req.user = { id: 'test-admin', role: 'admin' };
        }
        next();
      },
    };

    await new Verifier(options).verifyProvider();
  });
});
```

## Python Pact Testing

```python
# tests/contracts/consumer/test_user_api_contract.py
"""Consumer contract tests for User API."""
import pytest
import atexit
from pact import Consumer, Provider, Like, EachLike, Format
from app.clients import UserApiClient


# Create pact
pact = Consumer("OrderService").has_pact_with(
    Provider("UserService"),
    pact_dir="./pacts",
    log_dir="./logs",
)
pact.start_service()
atexit.register(pact.stop_service)


class TestUserApiContract:
    """Consumer contract tests."""

    def test_get_user_by_id(self):
        """Test getting user by ID."""
        expected = {
            "id": Format().uuid,
            "email": Like("user@example.com"),
            "name": Like("John Doe"),
            "role": Like("user"),
            "created_at": Format().iso_8601_datetime(),
        }

        pact.given(
            "user with id user-123 exists"
        ).upon_receiving(
            "a request for user by id"
        ).with_request(
            method="GET",
            path="/api/users/user-123",
            headers={"Authorization": Like("Bearer token")},
        ).will_respond_with(
            status=200,
            headers={"Content-Type": "application/json"},
            body=expected,
        )

        with pact:
            client = UserApiClient(pact.uri)
            user = client.get_user("user-123", "token")

        assert user["id"] is not None
        assert "@" in user["email"]

    def test_get_user_not_found(self):
        """Test 404 for non-existent user."""
        pact.given(
            "user with id non-existent does not exist"
        ).upon_receiving(
            "a request for non-existent user"
        ).with_request(
            method="GET",
            path="/api/users/non-existent",
            headers={"Authorization": Like("Bearer token")},
        ).will_respond_with(
            status=404,
            headers={"Content-Type": "application/json"},
            body={
                "error": "NotFound",
                "message": Like("User not found"),
            },
        )

        with pact:
            client = UserApiClient(pact.uri)
            with pytest.raises(client.NotFoundError):
                client.get_user("non-existent", "token")

    def test_list_users(self):
        """Test listing users."""
        pact.given(
            "users exist"
        ).upon_receiving(
            "a request for users list"
        ).with_request(
            method="GET",
            path="/api/users",
            query={"page": "1", "limit": "10"},
            headers={"Authorization": Like("Bearer token")},
        ).will_respond_with(
            status=200,
            headers={"Content-Type": "application/json"},
            body={
                "data": EachLike({
                    "id": Format().uuid,
                    "email": Like("user@example.com"),
                    "name": Like("User"),
                }),
                "pagination": {
                    "page": Like(1),
                    "limit": Like(10),
                    "total": Like(100),
                },
            },
        )

        with pact:
            client = UserApiClient(pact.uri)
            result = client.list_users(page=1, limit=10, token="token")

        assert len(result["data"]) > 0
        assert "pagination" in result

    def test_create_user(self):
        """Test creating user."""
        new_user = {
            "email": "new@example.com",
            "name": "New User",
            "password": "SecureP@ss123",
        }

        pact.given(
            "email new@example.com is available"
        ).upon_receiving(
            "a request to create user"
        ).with_request(
            method="POST",
            path="/api/users",
            headers={
                "Content-Type": "application/json",
                "Authorization": Like("Bearer admin-token"),
            },
            body=new_user,
        ).will_respond_with(
            status=201,
            headers={"Content-Type": "application/json"},
            body={
                "id": Format().uuid,
                "email": new_user["email"],
                "name": new_user["name"],
                "role": "user",
            },
        )

        with pact:
            client = UserApiClient(pact.uri)
            user = client.create_user(new_user, "admin-token")

        assert user["email"] == new_user["email"]
        assert user["id"] is not None
```

```python
# tests/contracts/provider/test_verify_contracts.py
"""Provider verification tests."""
import pytest
from pact import Verifier
from app.main import app
from tests.factories import UserFactory
from app.db import get_session


@pytest.fixture(scope="module")
def provider_server():
    """Start provider server for verification."""
    import uvicorn
    import threading

    thread = threading.Thread(
        target=uvicorn.run,
        args=(app,),
        kwargs={"host": "localhost", "port": 8081, "log_level": "error"},
        daemon=True,
    )
    thread.start()
    import time
    time.sleep(1)  # Wait for server to start
    yield "http://localhost:8081"


def test_verify_contracts(provider_server):
    """Verify provider against consumer contracts."""
    verifier = Verifier(
        provider="UserService",
        provider_base_url=provider_server,
    )

    # Setup state handlers
    def state_handler(state: str):
        session = next(get_session())

        if state == "user with id user-123 exists":
            UserFactory.create(id="user-123", session=session)
        elif state == "users exist":
            UserFactory.create_batch(3, session=session)
        elif state == "email existing@example.com is taken":
            UserFactory.create(email="existing@example.com", session=session)

        session.commit()

    verifier.set_state_handler(state_handler)

    success, logs = verifier.verify_pacts(
        "./pacts/orderservice-userservice.json",
        verbose=True,
    )

    assert success, f"Pact verification failed: {logs}"
```

## OpenAPI Contract Validation

```typescript
// tests/contracts/openapi/validate-api.test.ts
import SwaggerParser from '@apidevtools/swagger-parser';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import request from 'supertest';
import { app } from '../../../src/app';

describe('OpenAPI Contract Validation', () => {
  let schemas: Record<string, object>;
  let ajv: Ajv;

  beforeAll(async () => {
    const spec = await SwaggerParser.dereference('./openapi.yaml');
    schemas = spec.components?.schemas || {};

    ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);

    // Add all schemas
    Object.entries(schemas).forEach(([name, schema]) => {
      ajv.addSchema(schema, `#/components/schemas/${name}`);
    });
  });

  describe('Response Schema Validation', () => {
    it('GET /api/users matches UserList schema', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer test-token');

      const validate = ajv.compile({
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/User' },
          },
          pagination: { $ref: '#/components/schemas/Pagination' },
        },
        required: ['data', 'pagination'],
      });

      const valid = validate(response.body);
      if (!valid) {
        console.error('Validation errors:', validate.errors);
      }
      expect(valid).toBe(true);
    });

    it('GET /api/users/:id matches User schema', async () => {
      const response = await request(app)
        .get('/api/users/user-123')
        .set('Authorization', 'Bearer test-token');

      const validate = ajv.compile({ $ref: '#/components/schemas/User' });
      expect(validate(response.body)).toBe(true);
    });

    it('POST /api/users validates request body', async () => {
      const invalidBody = {
        email: 'not-an-email',
        name: '', // empty name
      };

      const validate = ajv.compile({
        $ref: '#/components/schemas/CreateUserRequest',
      });

      expect(validate(invalidBody)).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({ keyword: 'format' })
      );
    });
  });
});
```

## Schemathesis API Testing (Python)

```python
# tests/contracts/schemathesis/test_api_schema.py
"""Property-based API testing with Schemathesis."""
import schemathesis
from hypothesis import settings, Phase

# Load schema from file or URL
schema = schemathesis.from_path("./openapi.yaml", base_url="http://localhost:8000")

# Or from running app
# schema = schemathesis.from_pytest_fixture("app_schema")


@schema.parametrize()
@settings(max_examples=100, phases=[Phase.generate])
def test_api_schema_conformance(case):
    """Test all endpoints conform to schema."""
    response = case.call()
    case.validate_response(response)


@schema.parametrize(endpoint="/api/users")
@settings(max_examples=50)
def test_users_endpoint(case):
    """Test users endpoint specifically."""
    response = case.call()
    case.validate_response(response)

    # Additional assertions
    if response.status_code == 200:
        data = response.json()
        assert "data" in data
        assert isinstance(data["data"], list)


@schema.parametrize(method="POST")
@settings(max_examples=50)
def test_post_endpoints(case):
    """Test all POST endpoints."""
    response = case.call()
    case.validate_response(response)

    # POST should return 201 or 4xx for invalid data
    assert response.status_code in [201, 400, 401, 403, 409, 422]


# Custom schema testing
class TestSchemaConformance:
    """Custom schema conformance tests."""

    @pytest.fixture
    def client(self, test_app):
        return schemathesis.from_asgi(test_app)

    def test_all_endpoints(self, client):
        """Run all schema tests."""
        for endpoint in client:
            for case in endpoint.as_strategy().example():
                response = case.call()
                case.validate_response(response)
```

## Event/Message Contract Testing

```typescript
// tests/contracts/events/user-events.pact.test.ts
import {
  MessageConsumerPact,
  asynchronousBodyHandler,
  Matchers,
} from '@pact-foundation/pact';
import { resolve } from 'path';
import { UserEventHandler } from '../../../src/handlers/user-events';

const { like, uuid, iso8601DateTime } = Matchers;

describe('User Events Consumer Contract', () => {
  const messagePact = new MessageConsumerPact({
    consumer: 'NotificationService',
    provider: 'UserService',
    dir: resolve(__dirname, '../../../pacts'),
    logLevel: 'warn',
  });

  describe('UserCreated event', () => {
    it('processes user created event', async () => {
      await messagePact
        .given('a user is created')
        .expectsToReceive('a UserCreated event')
        .withContent({
          type: 'UserCreated',
          data: {
            id: uuid(),
            email: like('user@example.com'),
            name: like('John Doe'),
            createdAt: iso8601DateTime(),
          },
          metadata: {
            correlationId: uuid(),
            timestamp: iso8601DateTime(),
          },
        })
        .withMetadata({
          'content-type': 'application/json',
        })
        .verify(
          asynchronousBodyHandler(async (message) => {
            const handler = new UserEventHandler();
            await handler.handleUserCreated(message);
            // Handler should not throw
          })
        );
    });
  });

  describe('UserUpdated event', () => {
    it('processes user updated event', async () => {
      await messagePact
        .given('a user is updated')
        .expectsToReceive('a UserUpdated event')
        .withContent({
          type: 'UserUpdated',
          data: {
            id: uuid(),
            changes: {
              name: like('New Name'),
              email: like('new@example.com'),
            },
            updatedAt: iso8601DateTime(),
          },
          metadata: {
            correlationId: uuid(),
            timestamp: iso8601DateTime(),
          },
        })
        .verify(
          asynchronousBodyHandler(async (message) => {
            const handler = new UserEventHandler();
            await handler.handleUserUpdated(message);
          })
        );
    });
  });

  describe('UserDeleted event', () => {
    it('processes user deleted event', async () => {
      await messagePact
        .given('a user is deleted')
        .expectsToReceive('a UserDeleted event')
        .withContent({
          type: 'UserDeleted',
          data: {
            id: uuid(),
            deletedAt: iso8601DateTime(),
          },
          metadata: {
            correlationId: uuid(),
            timestamp: iso8601DateTime(),
          },
        })
        .verify(
          asynchronousBodyHandler(async (message) => {
            const handler = new UserEventHandler();
            await handler.handleUserDeleted(message);
          })
        );
    });
  });
});
```

## CLAUDE.md Integration

```markdown
# Contract Testing

## Commands
- `npm run test:contracts` - Run all contract tests
- `npm run pact:verify` - Verify provider contracts
- `npm run pact:publish` - Publish to Pact Broker
- `schemathesis run openapi.yaml` - Run schema tests

## Contract Types
- Consumer-driven contracts (Pact)
- OpenAPI schema validation
- Event/message contracts
- GraphQL schema testing

## Best Practices
- Write consumer tests first
- Use meaningful provider states
- Version contracts with code
- Verify in CI pipeline
```

## AI Suggestions

1. **Contract diff detection** - Detect breaking changes
2. **Auto-generated contracts** - Generate from API logs
3. **Contract versioning** - Semantic versioning for contracts
4. **Cross-service validation** - Validate entire service mesh
5. **Contract documentation** - Generate docs from contracts
6. **Mock server generation** - Generate mocks from contracts
7. **Contract migration** - Migrate between contract versions
8. **GraphQL contracts** - Schema-based GraphQL contracts
9. **gRPC contracts** - Protocol buffer contract testing
10. **Contract monitoring** - Monitor contract compliance in production
