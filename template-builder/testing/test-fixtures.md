# Test Fixtures Templates

Production-ready test fixture patterns for data setup, factories, and builders.

## Overview

- **Factory Pattern**: Generate test data with factories
- **Builder Pattern**: Fluent test data builders
- **Database Fixtures**: Seed and cleanup strategies
- **Shared State**: Test context management

## Quick Start

```bash
# TypeScript
npm install -D @faker-js/faker fishery

# Python
pip install factory-boy faker pytest-factoryboy
```

## Factory Pattern (TypeScript)

```typescript
// tests/factories/user.factory.ts
import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';
import { User, UserRole } from '../../src/types';

export const userFactory = Factory.define<User>(({ sequence, params }) => ({
  id: params.id ?? `user-${sequence}`,
  email: params.email ?? faker.internet.email(),
  name: params.name ?? faker.person.fullName(),
  role: params.role ?? 'user',
  passwordHash: params.passwordHash ?? faker.string.alphanumeric(64),
  avatar: params.avatar ?? faker.image.avatar(),
  bio: params.bio ?? faker.lorem.sentence(),
  createdAt: params.createdAt ?? faker.date.past(),
  updatedAt: params.updatedAt ?? faker.date.recent(),
  emailVerified: params.emailVerified ?? true,
  settings: params.settings ?? {
    notifications: true,
    theme: 'light',
  },
}));

// Traits for common variations
export const adminUser = userFactory.params({ role: 'admin' as UserRole });
export const unverifiedUser = userFactory.params({ emailVerified: false });

// Associations
export const userWithPosts = userFactory.associations({
  posts: () => postFactory.buildList(3),
});
```

```typescript
// tests/factories/order.factory.ts
import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';
import { Order, OrderItem, OrderStatus } from '../../src/types';
import { userFactory } from './user.factory';
import { productFactory } from './product.factory';

export const orderItemFactory = Factory.define<OrderItem>(({ sequence }) => {
  const product = productFactory.build();
  const quantity = faker.number.int({ min: 1, max: 5 });

  return {
    id: `item-${sequence}`,
    productId: product.id,
    productName: product.name,
    quantity,
    unitPrice: product.price,
    totalPrice: product.price * quantity,
  };
});

export const orderFactory = Factory.define<Order>(({ sequence, params, transientParams }) => {
  const items = params.items ?? orderItemFactory.buildList(transientParams.itemCount ?? 2);
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return {
    id: params.id ?? `order-${sequence}`,
    userId: params.userId ?? userFactory.build().id,
    status: params.status ?? 'pending',
    items,
    subtotal,
    tax: subtotal * 0.1,
    total: subtotal * 1.1,
    shippingAddress: params.shippingAddress ?? {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zip: faker.location.zipCode(),
      country: 'USA',
    },
    createdAt: params.createdAt ?? faker.date.recent(),
    updatedAt: params.updatedAt ?? faker.date.recent(),
  };
});

// Factory with transient params
export const orderWithItems = (itemCount: number) =>
  orderFactory.transient({ itemCount });

// Status variations
export const pendingOrder = orderFactory.params({ status: 'pending' as OrderStatus });
export const completedOrder = orderFactory.params({ status: 'completed' as OrderStatus });
export const cancelledOrder = orderFactory.params({ status: 'cancelled' as OrderStatus });
```

```typescript
// tests/factories/index.ts
export { userFactory, adminUser, unverifiedUser } from './user.factory';
export { orderFactory, orderItemFactory, pendingOrder, completedOrder } from './order.factory';
export { productFactory, digitalProduct, physicalProduct } from './product.factory';
export { postFactory, publishedPost, draftPost } from './post.factory';

// Convenience functions
import { userFactory } from './user.factory';
import { db } from '../../src/db';

export async function createUser(overrides = {}) {
  const userData = userFactory.build(overrides);
  return db.users.create(userData);
}

export async function createUsers(count: number, overrides = {}) {
  const usersData = userFactory.buildList(count, overrides);
  return Promise.all(usersData.map(u => db.users.create(u)));
}
```

## Builder Pattern

```typescript
// tests/builders/user.builder.ts
import { faker } from '@faker-js/faker';
import { User, UserRole } from '../../src/types';

export class UserBuilder {
  private user: Partial<User> = {};

  constructor() {
    this.reset();
  }

  reset(): this {
    this.user = {
      id: `user-${faker.string.uuid()}`,
      email: faker.internet.email(),
      name: faker.person.fullName(),
      role: 'user',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return this;
  }

  withId(id: string): this {
    this.user.id = id;
    return this;
  }

  withEmail(email: string): this {
    this.user.email = email;
    return this;
  }

  withName(name: string): this {
    this.user.name = name;
    return this;
  }

  withRole(role: UserRole): this {
    this.user.role = role;
    return this;
  }

  asAdmin(): this {
    this.user.role = 'admin';
    return this;
  }

  unverified(): this {
    this.user.emailVerified = false;
    return this;
  }

  withSettings(settings: User['settings']): this {
    this.user.settings = settings;
    return this;
  }

  createdAt(date: Date): this {
    this.user.createdAt = date;
    return this;
  }

  build(): User {
    const result = { ...this.user } as User;
    this.reset();
    return result;
  }

  buildMany(count: number): User[] {
    return Array.from({ length: count }, () => this.build());
  }
}

// Usage
const user = new UserBuilder()
  .withEmail('test@example.com')
  .withName('Test User')
  .asAdmin()
  .build();
```

```typescript
// tests/builders/request.builder.ts
import { Request } from 'express';

export class RequestBuilder {
  private req: Partial<Request> = {};

  constructor() {
    this.reset();
  }

  reset(): this {
    this.req = {
      body: {},
      params: {},
      query: {},
      headers: {},
      method: 'GET',
      path: '/',
    };
    return this;
  }

  withMethod(method: string): this {
    this.req.method = method;
    return this;
  }

  withPath(path: string): this {
    this.req.path = path;
    return this;
  }

  withBody(body: object): this {
    this.req.body = body;
    return this;
  }

  withParams(params: Record<string, string>): this {
    this.req.params = params;
    return this;
  }

  withQuery(query: Record<string, string>): this {
    this.req.query = query;
    return this;
  }

  withHeaders(headers: Record<string, string>): this {
    this.req.headers = { ...this.req.headers, ...headers };
    return this;
  }

  withAuth(token: string): this {
    this.req.headers = {
      ...this.req.headers,
      authorization: `Bearer ${token}`,
    };
    return this;
  }

  withUser(user: object): this {
    (this.req as any).user = user;
    return this;
  }

  build(): Request {
    return this.req as Request;
  }
}
```

## Python Factory Boy

```python
# tests/factories.py
"""Test factories using factory_boy."""
import factory
from factory import fuzzy
from datetime import datetime, timedelta
from models import User, Order, OrderItem, Product


class UserFactory(factory.Factory):
    """Factory for User model."""

    class Meta:
        model = User

    id = factory.Sequence(lambda n: f"user-{n}")
    email = factory.LazyAttribute(lambda o: f"{o.name.lower().replace(' ', '.')}@example.com")
    name = factory.Faker("name")
    role = "user"
    email_verified = True
    created_at = factory.LazyFunction(datetime.utcnow)
    updated_at = factory.LazyFunction(datetime.utcnow)
    password_hash = factory.Faker("sha256")

    class Params:
        # Traits
        admin = factory.Trait(role="admin")
        unverified = factory.Trait(email_verified=False)
        recent = factory.Trait(
            created_at=factory.LazyFunction(
                lambda: datetime.utcnow() - timedelta(hours=1)
            )
        )


class ProductFactory(factory.Factory):
    """Factory for Product model."""

    class Meta:
        model = Product

    id = factory.Sequence(lambda n: f"prod-{n}")
    name = factory.Faker("catch_phrase")
    description = factory.Faker("paragraph")
    price = fuzzy.FuzzyDecimal(10.0, 1000.0, precision=2)
    stock = fuzzy.FuzzyInteger(0, 100)
    category = fuzzy.FuzzyChoice(["Electronics", "Clothing", "Books", "Home"])
    created_at = factory.LazyFunction(datetime.utcnow)

    class Params:
        out_of_stock = factory.Trait(stock=0)
        expensive = factory.Trait(
            price=fuzzy.FuzzyDecimal(500.0, 5000.0, precision=2)
        )


class OrderItemFactory(factory.Factory):
    """Factory for OrderItem model."""

    class Meta:
        model = OrderItem

    id = factory.Sequence(lambda n: f"item-{n}")
    product = factory.SubFactory(ProductFactory)
    product_id = factory.LazyAttribute(lambda o: o.product.id)
    quantity = fuzzy.FuzzyInteger(1, 5)
    unit_price = factory.LazyAttribute(lambda o: o.product.price)
    total_price = factory.LazyAttribute(lambda o: o.unit_price * o.quantity)


class OrderFactory(factory.Factory):
    """Factory for Order model."""

    class Meta:
        model = Order

    id = factory.Sequence(lambda n: f"order-{n}")
    user = factory.SubFactory(UserFactory)
    user_id = factory.LazyAttribute(lambda o: o.user.id)
    status = "pending"
    created_at = factory.LazyFunction(datetime.utcnow)
    updated_at = factory.LazyFunction(datetime.utcnow)

    @factory.lazy_attribute
    def items(self):
        return OrderItemFactory.build_batch(2)

    @factory.lazy_attribute
    def subtotal(self):
        return sum(item.total_price for item in self.items)

    @factory.lazy_attribute
    def tax(self):
        return self.subtotal * 0.1

    @factory.lazy_attribute
    def total(self):
        return self.subtotal + self.tax

    class Params:
        pending = factory.Trait(status="pending")
        completed = factory.Trait(status="completed")
        cancelled = factory.Trait(status="cancelled")
        with_many_items = factory.Trait(
            items=factory.LazyFunction(lambda: OrderItemFactory.build_batch(5))
        )


# Database-backed factories (SQLAlchemy)
class SQLAlchemyModelFactory(factory.alchemy.SQLAlchemyModelFactory):
    """Base factory for SQLAlchemy models."""

    class Meta:
        abstract = True
        sqlalchemy_session = None  # Set in conftest

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Create and persist instance."""
        instance = super()._create(model_class, *args, **kwargs)
        cls._meta.sqlalchemy_session.commit()
        return instance


class DBUserFactory(SQLAlchemyModelFactory):
    """Database-backed user factory."""

    class Meta:
        model = User

    id = factory.Sequence(lambda n: f"user-{n}")
    email = factory.Faker("email")
    name = factory.Faker("name")
```

```python
# tests/conftest.py
"""Pytest fixtures for factories."""
import pytest
from tests.factories import (
    UserFactory,
    ProductFactory,
    OrderFactory,
    DBUserFactory,
)


@pytest.fixture
def user():
    """Create a single user."""
    return UserFactory.build()


@pytest.fixture
def admin_user():
    """Create an admin user."""
    return UserFactory.build(admin=True)


@pytest.fixture
def users():
    """Create multiple users."""
    return UserFactory.build_batch(5)


@pytest.fixture
def order_with_items():
    """Create order with items."""
    return OrderFactory.build(with_many_items=True)


@pytest.fixture(autouse=True)
def setup_db_factory(db_session):
    """Configure database session for factories."""
    DBUserFactory._meta.sqlalchemy_session = db_session


@pytest.fixture
async def created_user(db_session):
    """Create user in database."""
    user = DBUserFactory.create()
    return user
```

## Database Fixtures

```typescript
// tests/fixtures/database.fixture.ts
import { db } from '../../src/db';
import { userFactory, orderFactory, productFactory } from '../factories';

export interface TestData {
  users: User[];
  products: Product[];
  orders: Order[];
}

export async function seedTestDatabase(): Promise<TestData> {
  // Create users
  const users = await Promise.all(
    userFactory.buildList(10).map(u => db.users.create(u))
  );

  // Create products
  const products = await Promise.all(
    productFactory.buildList(20).map(p => db.products.create(p))
  );

  // Create orders
  const orders = await Promise.all(
    users.slice(0, 5).map(user =>
      db.orders.create(
        orderFactory.build({
          userId: user.id,
          items: [{ productId: products[0].id, quantity: 1 }],
        })
      )
    )
  );

  return { users, products, orders };
}

export async function cleanupTestDatabase(): Promise<void> {
  await db.orders.deleteMany({});
  await db.products.deleteMany({});
  await db.users.deleteMany({});
}

export async function withTestData<T>(
  fn: (data: TestData) => Promise<T>
): Promise<T> {
  const data = await seedTestDatabase();
  try {
    return await fn(data);
  } finally {
    await cleanupTestDatabase();
  }
}
```

## CLAUDE.md Integration

```markdown
# Test Fixtures

## Commands
- `npm test` - Run tests with factories
- `pytest -v` - Run Python tests

## Factory Patterns
- Build: Create in-memory object
- Create: Persist to database
- BuildList: Create multiple objects
- Traits: Predefined variations

## Best Practices
- Use factories over raw objects
- Define traits for common cases
- Keep factories in sync with schema
- Use builders for complex objects
```

## AI Suggestions

1. **Auto-generate from schema** - Generate factories from DB schema
2. **GraphQL fixtures** - Generate test data for GraphQL
3. **Snapshot fixtures** - Save/load fixture snapshots
4. **Fixture inheritance** - Extend base fixtures
5. **Time-travel fixtures** - Create historical data
6. **Relationship fixtures** - Generate related data graphs
7. **Randomization control** - Seed random data generation
8. **Fixture validation** - Validate fixtures match schema
9. **Performance fixtures** - Generate large datasets efficiently
10. **Fixture documentation** - Auto-document available fixtures
