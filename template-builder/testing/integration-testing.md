# Integration Testing Templates

Production-ready integration testing patterns for databases, APIs, and external services.

## Overview

- **Database Integration**: PostgreSQL, MongoDB, Redis testing
- **API Integration**: HTTP client testing with real endpoints
- **Service Integration**: Testing service-to-service communication
- **Test Containers**: Docker-based test infrastructure

## Quick Start

```bash
# Install testcontainers
npm install -D testcontainers @testcontainers/postgresql

# Python
pip install testcontainers pytest-docker

# Run integration tests
npm test -- --testPathPattern=integration
pytest -m integration
```

## Database Integration Testing

```typescript
// tests/integration/database.setup.ts
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as schema from '../../src/db/schema';

let container: StartedPostgreSqlContainer;
let pool: Pool;
let db: ReturnType<typeof drizzle>;

export async function setupTestDatabase() {
  // Start PostgreSQL container
  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('test_db')
    .withUsername('test')
    .withPassword('test')
    .withExposedPorts(5432)
    .start();

  // Create connection pool
  pool = new Pool({
    connectionString: container.getConnectionUri(),
    max: 5,
  });

  // Initialize Drizzle
  db = drizzle(pool, { schema });

  // Run migrations
  await migrate(db, { migrationsFolder: './drizzle' });

  return { container, pool, db };
}

export async function teardownTestDatabase() {
  await pool?.end();
  await container?.stop();
}

export async function cleanupTables(db: ReturnType<typeof drizzle>) {
  // Truncate all tables
  await db.execute(`
    TRUNCATE TABLE users, orders, products RESTART IDENTITY CASCADE
  `);
}

export { container, pool, db };
```

```typescript
// tests/integration/user-repository.integration.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDatabase, teardownTestDatabase, cleanupTables } from './database.setup';
import { UserRepository } from '../../src/repositories/user-repository';
import { users } from '../../src/db/schema';

describe('UserRepository Integration Tests', () => {
  let db: Awaited<ReturnType<typeof setupTestDatabase>>['db'];
  let userRepo: UserRepository;

  beforeAll(async () => {
    const setup = await setupTestDatabase();
    db = setup.db;
    userRepo = new UserRepository(db);
  }, 60000); // 60s timeout for container startup

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTables(db);
  });

  describe('create', () => {
    it('should create a new user in the database', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed_password',
      };

      const user = await userRepo.create(userData);

      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should enforce unique email constraint', async () => {
      const userData = {
        email: 'unique@example.com',
        name: 'User 1',
        passwordHash: 'hash1',
      };

      await userRepo.create(userData);

      await expect(
        userRepo.create({ ...userData, name: 'User 2' })
      ).rejects.toThrow(/unique/i);
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const created = await userRepo.create({
        email: 'find@example.com',
        name: 'Find User',
        passwordHash: 'hash',
      });

      const found = await userRepo.findById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.email).toBe(created.email);
    });

    it('should return null for non-existent id', async () => {
      const found = await userRepo.findById('non-existent-uuid');
      expect(found).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email case-insensitively', async () => {
      await userRepo.create({
        email: 'CasE@Example.COM',
        name: 'Case User',
        passwordHash: 'hash',
      });

      const found = await userRepo.findByEmail('case@example.com');

      expect(found).not.toBeNull();
      expect(found?.email.toLowerCase()).toBe('case@example.com');
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const created = await userRepo.create({
        email: 'update@example.com',
        name: 'Original Name',
        passwordHash: 'hash',
      });

      const updated = await userRepo.update(created.id, {
        name: 'Updated Name',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.updatedAt).not.toEqual(created.updatedAt);
    });
  });

  describe('delete', () => {
    it('should soft delete user', async () => {
      const created = await userRepo.create({
        email: 'delete@example.com',
        name: 'Delete User',
        passwordHash: 'hash',
      });

      await userRepo.softDelete(created.id);

      const found = await userRepo.findById(created.id);
      expect(found).toBeNull(); // Soft deleted, not visible

      // Verify still in database
      const [row] = await db
        .select()
        .from(users)
        .where(eq(users.id, created.id));
      expect(row.deletedAt).not.toBeNull();
    });
  });

  describe('transactions', () => {
    it('should rollback on error', async () => {
      const email = 'transaction@example.com';

      try {
        await db.transaction(async (tx) => {
          await userRepo.createWithTx(tx, {
            email,
            name: 'Transaction User',
            passwordHash: 'hash',
          });

          // Force error
          throw new Error('Rollback test');
        });
      } catch (e) {
        // Expected
      }

      // User should not exist
      const found = await userRepo.findByEmail(email);
      expect(found).toBeNull();
    });
  });
});
```

## API Integration Testing

```typescript
// tests/integration/api.integration.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { setupTestDatabase, teardownTestDatabase, cleanupTables, db } from './database.setup';

describe('User API Integration Tests', () => {
  let authToken: string;

  beforeAll(async () => {
    await setupTestDatabase();
  }, 60000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTables(db);

    // Create test user and get auth token
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin@test.com',
        password: 'SecureP@ss123',
        name: 'Admin User',
      });

    authToken = response.body.token;
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'newuser@test.com',
          name: 'New User',
          role: 'user',
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        email: 'newuser@test.com',
        name: 'New User',
      });
      expect(response.body.id).toBeDefined();
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'invalid-email',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({ field: 'email' })
      );
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'test@test.com',
          name: 'Test User',
        });

      expect(response.status).toBe(401);
    });

    it('should return 409 for duplicate email', async () => {
      // Create first user
      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'duplicate@test.com',
          name: 'First User',
        });

      // Try to create duplicate
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'duplicate@test.com',
          name: 'Second User',
        });

      expect(response.status).toBe(409);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      // Create user
      const createResponse = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'getuser@test.com',
          name: 'Get User',
        });

      const userId = createResponse.body.id;

      // Get user
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(userId);
      expect(response.body.email).toBe('getuser@test.com');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/users', () => {
    beforeEach(async () => {
      // Create multiple users
      for (let i = 1; i <= 15; i++) {
        await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            email: `user${i}@test.com`,
            name: `User ${i}`,
          });
      }
    });

    it('should return paginated users', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: expect.any(Number),
      });
    });

    it('should filter users by search query', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({ search: 'user1' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      // Should match user1, user10-user15
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(
        response.body.data.every((u: any) =>
          u.email.includes('user1') || u.name.includes('User 1')
        )
      ).toBe(true);
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('should update user fields', async () => {
      const createResponse = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'updateuser@test.com',
          name: 'Original Name',
        });

      const userId = createResponse.body.id;

      const response = await request(app)
        .patch(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user', async () => {
      const createResponse = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'deleteuser@test.com',
          name: 'Delete User',
        });

      const userId = createResponse.body.id;

      const deleteResponse = await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(204);

      // Verify deleted
      const getResponse = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });
  });
});
```

## Python Integration Testing

```python
# tests/integration/conftest.py
"""Integration test configuration."""
import pytest
import asyncio
from testcontainers.postgres import PostgresContainer
from testcontainers.redis import RedisContainer
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.core.config import settings


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def postgres_container():
    """Start PostgreSQL container."""
    with PostgresContainer("postgres:16-alpine") as postgres:
        yield postgres


@pytest.fixture(scope="session")
def redis_container():
    """Start Redis container."""
    with RedisContainer("redis:7-alpine") as redis:
        yield redis


@pytest.fixture(scope="session")
async def db_engine(postgres_container):
    """Create database engine."""
    engine = create_async_engine(
        postgres_container.get_connection_url().replace(
            "postgresql://", "postgresql+asyncpg://"
        ),
        echo=True,
    )

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    await engine.dispose()


@pytest.fixture
async def db_session(db_engine):
    """Create database session."""
    async_session = sessionmaker(
        db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with async_session() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def redis_client(redis_container):
    """Create Redis client."""
    import redis.asyncio as redis

    client = redis.from_url(
        f"redis://{redis_container.get_container_host_ip()}:"
        f"{redis_container.get_exposed_port(6379)}"
    )
    yield client
    await client.close()
```

```python
# tests/integration/test_user_repository.py
"""User repository integration tests."""
import pytest
from datetime import datetime

from app.repositories.user import UserRepository
from app.models.user import User


@pytest.mark.integration
class TestUserRepositoryIntegration:
    """Integration tests for UserRepository."""

    @pytest.fixture
    def user_repo(self, db_session):
        """Create user repository."""
        return UserRepository(db_session)

    @pytest.mark.asyncio
    async def test_create_user(self, user_repo, db_session):
        """Test creating a user in the database."""
        user_data = {
            "email": "test@example.com",
            "name": "Test User",
            "password_hash": "hashed_password",
        }

        user = await user_repo.create(**user_data)

        assert user.id is not None
        assert user.email == user_data["email"]
        assert user.name == user_data["name"]
        assert user.created_at is not None

    @pytest.mark.asyncio
    async def test_find_by_email(self, user_repo, db_session):
        """Test finding user by email."""
        # Create user
        await user_repo.create(
            email="find@example.com",
            name="Find User",
            password_hash="hash",
        )

        # Find user
        user = await user_repo.find_by_email("find@example.com")

        assert user is not None
        assert user.email == "find@example.com"

    @pytest.mark.asyncio
    async def test_find_by_email_case_insensitive(self, user_repo, db_session):
        """Test case-insensitive email search."""
        await user_repo.create(
            email="UPPER@EXAMPLE.COM",
            name="Upper User",
            password_hash="hash",
        )

        user = await user_repo.find_by_email("upper@example.com")

        assert user is not None

    @pytest.mark.asyncio
    async def test_update_user(self, user_repo, db_session):
        """Test updating user."""
        user = await user_repo.create(
            email="update@example.com",
            name="Original",
            password_hash="hash",
        )

        updated = await user_repo.update(user.id, name="Updated")

        assert updated.name == "Updated"
        assert updated.updated_at > user.created_at

    @pytest.mark.asyncio
    async def test_delete_user(self, user_repo, db_session):
        """Test soft deleting user."""
        user = await user_repo.create(
            email="delete@example.com",
            name="Delete User",
            password_hash="hash",
        )

        await user_repo.soft_delete(user.id)

        # Should not be found
        found = await user_repo.find_by_id(user.id)
        assert found is None

    @pytest.mark.asyncio
    async def test_list_users_with_pagination(self, user_repo, db_session):
        """Test paginated user listing."""
        # Create multiple users
        for i in range(15):
            await user_repo.create(
                email=f"user{i}@example.com",
                name=f"User {i}",
                password_hash="hash",
            )

        # Get first page
        users, total = await user_repo.list_paginated(page=1, limit=10)

        assert len(users) == 10
        assert total == 15

        # Get second page
        users, total = await user_repo.list_paginated(page=2, limit=10)

        assert len(users) == 5


@pytest.mark.integration
class TestUserRepositoryWithRedis:
    """Integration tests with Redis caching."""

    @pytest.mark.asyncio
    async def test_cached_find_by_id(
        self,
        user_repo,
        redis_client,
        db_session,
    ):
        """Test user retrieval with Redis caching."""
        from app.repositories.cached_user import CachedUserRepository

        cached_repo = CachedUserRepository(db_session, redis_client)

        # Create user
        user = await cached_repo.create(
            email="cached@example.com",
            name="Cached User",
            password_hash="hash",
        )

        # First call - cache miss
        found1 = await cached_repo.find_by_id(user.id)
        assert found1 is not None

        # Second call - cache hit
        found2 = await cached_repo.find_by_id(user.id)
        assert found2 is not None
        assert found2.id == found1.id

        # Verify cache was set
        cached = await redis_client.get(f"user:{user.id}")
        assert cached is not None
```

## CLAUDE.md Integration

```markdown
# Integration Testing

## Commands
- `npm run test:integration` - Run integration tests
- `pytest -m integration` - Run Python integration tests
- `docker-compose up -d` - Start test containers

## Test Isolation
- Each test gets clean database state
- Use transactions for automatic rollback
- Testcontainers for isolated infrastructure

## Best Practices
- Test real database interactions
- Verify constraint enforcement
- Test pagination and filtering
- Check error handling with real errors
```

## AI Suggestions

1. **Parallel test containers** - Run database containers in parallel
2. **Shared container pool** - Reuse containers across test suites
3. **Database seeding** - Pre-populate test data efficiently
4. **Transaction isolation** - Use savepoints for nested transactions
5. **Network testing** - Test timeout and retry behavior
6. **Load test integration** - Combine integration with load testing
7. **Contract verification** - Verify API contracts against database
8. **Migration testing** - Test database migration scripts
9. **Connection pool testing** - Test connection exhaustion scenarios
10. **Multi-database testing** - Test cross-database operations
