# Test Data Management Templates

Production-ready test data management patterns for seeding, generation, and cleanup.

## Overview

- **Data Generation**: Faker, realistic test data
- **Database Seeding**: Consistent test databases
- **Data Masking**: PII anonymization
- **Cleanup Strategies**: Test isolation patterns

## Quick Start

```bash
# JavaScript/TypeScript
npm install -D @faker-js/faker chance

# Python
pip install faker mimesis

# Database seeding
npm install -D prisma
pip install factory-boy sqlalchemy-utils
```

## Faker Data Generation

```typescript
// tests/data/generators.ts
import { faker } from '@faker-js/faker';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  address: Address;
  company: Company;
  createdAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Company {
  name: string;
  industry: string;
  size: string;
}

export function generateUser(overrides: Partial<User> = {}): User {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    phone: faker.phone.number(),
    address: generateAddress(),
    company: generateCompany(),
    createdAt: faker.date.past(),
    ...overrides,
  };
}

export function generateAddress(overrides: Partial<Address> = {}): Address {
  return {
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    zip: faker.location.zipCode(),
    country: faker.location.country(),
    ...overrides,
  };
}

export function generateCompany(overrides: Partial<Company> = {}): Company {
  return {
    name: faker.company.name(),
    industry: faker.commerce.department(),
    size: faker.helpers.arrayElement(['1-10', '11-50', '51-200', '201-500', '500+']),
    ...overrides,
  };
}

export function generateUsers(count: number, overrides: Partial<User> = {}): User[] {
  return Array.from({ length: count }, () => generateUser(overrides));
}

// Deterministic data for consistent tests
export function generateDeterministicUser(seed: number): User {
  faker.seed(seed);
  return generateUser();
}

// Batch generation with relationships
export function generateUserWithOrders(orderCount = 3): {
  user: User;
  orders: Order[];
} {
  const user = generateUser();
  const orders = Array.from({ length: orderCount }, () =>
    generateOrder({ userId: user.id })
  );
  return { user, orders };
}
```

```typescript
// tests/data/orders.ts
import { faker } from '@faker-js/faker';

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  shippingAddress: Address;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export function generateOrderItem(overrides: Partial<OrderItem> = {}): OrderItem {
  const quantity = overrides.quantity ?? faker.number.int({ min: 1, max: 5 });
  const price = overrides.price ?? parseFloat(faker.commerce.price({ min: 10, max: 500 }));

  return {
    id: faker.string.uuid(),
    productId: faker.string.uuid(),
    name: faker.commerce.productName(),
    quantity,
    price,
    total: quantity * price,
    ...overrides,
  };
}

export function generateOrder(overrides: Partial<Order> = {}): Order {
  const items = overrides.items ?? [
    generateOrderItem(),
    generateOrderItem(),
  ];
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.1;

  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    items,
    subtotal,
    tax,
    total: subtotal + tax,
    status: faker.helpers.arrayElement([
      'pending',
      'processing',
      'shipped',
      'delivered',
    ] as OrderStatus[]),
    shippingAddress: generateAddress(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

// Scenarios
export function generatePendingOrder(userId: string): Order {
  return generateOrder({ userId, status: 'pending' });
}

export function generateCompletedOrder(userId: string): Order {
  return generateOrder({
    userId,
    status: 'delivered',
    createdAt: faker.date.past({ years: 1 }),
  });
}

export function generateLargeOrder(userId: string, itemCount = 10): Order {
  const items = Array.from({ length: itemCount }, () => generateOrderItem());
  return generateOrder({ userId, items });
}
```

## Database Seeding

```typescript
// tests/data/seed.ts
import { PrismaClient } from '@prisma/client';
import { generateUser, generateOrder, generateUsers } from './generators';

const prisma = new PrismaClient();

export interface SeedResult {
  users: Awaited<ReturnType<typeof prisma.user.create>>[];
  orders: Awaited<ReturnType<typeof prisma.order.create>>[];
  products: Awaited<ReturnType<typeof prisma.product.create>>[];
}

export async function seedDatabase(): Promise<SeedResult> {
  console.log('Seeding database...');

  // Create users
  const users = await Promise.all(
    generateUsers(10).map((userData) =>
      prisma.user.create({
        data: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
        },
      })
    )
  );
  console.log(`Created ${users.length} users`);

  // Create products
  const products = await Promise.all(
    Array.from({ length: 20 }, () => ({
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      price: parseFloat(faker.commerce.price()),
      stock: faker.number.int({ min: 0, max: 100 }),
    })).map((product) => prisma.product.create({ data: product }))
  );
  console.log(`Created ${products.length} products`);

  // Create orders
  const orders = await Promise.all(
    users.slice(0, 5).flatMap((user) =>
      Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () =>
        generateOrder({ userId: user.id })
      ).map((order) =>
        prisma.order.create({
          data: {
            id: order.id,
            userId: order.userId,
            status: order.status,
            subtotal: order.subtotal,
            tax: order.tax,
            total: order.total,
            items: {
              create: order.items.map((item) => ({
                id: item.id,
                productId: products[0].id,
                quantity: item.quantity,
                price: item.price,
              })),
            },
          },
        })
      )
    )
  );
  console.log(`Created ${orders.length} orders`);

  return { users, orders, products };
}

export async function cleanDatabase(): Promise<void> {
  console.log('Cleaning database...');

  // Delete in correct order for foreign key constraints
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  console.log('Database cleaned');
}

export async function resetDatabase(): Promise<SeedResult> {
  await cleanDatabase();
  return seedDatabase();
}

// Run if called directly
if (require.main === module) {
  resetDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
```

## Python Test Data

```python
# tests/data/generators.py
"""Test data generators using Faker."""
from faker import Faker
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional
import random

fake = Faker()


@dataclass
class Address:
    street: str
    city: str
    state: str
    zip_code: str
    country: str


@dataclass
class User:
    id: str
    email: str
    name: str
    phone: str
    address: Address
    created_at: datetime


@dataclass
class OrderItem:
    id: str
    product_id: str
    name: str
    quantity: int
    price: float
    total: float = field(init=False)

    def __post_init__(self):
        self.total = self.quantity * self.price


@dataclass
class Order:
    id: str
    user_id: str
    items: List[OrderItem]
    status: str
    created_at: datetime
    subtotal: float = field(init=False)
    tax: float = field(init=False)
    total: float = field(init=False)

    def __post_init__(self):
        self.subtotal = sum(item.total for item in self.items)
        self.tax = self.subtotal * 0.1
        self.total = self.subtotal + self.tax


def generate_address(overrides: Optional[dict] = None) -> Address:
    """Generate a random address."""
    data = {
        "street": fake.street_address(),
        "city": fake.city(),
        "state": fake.state(),
        "zip_code": fake.zipcode(),
        "country": fake.country(),
    }
    if overrides:
        data.update(overrides)
    return Address(**data)


def generate_user(overrides: Optional[dict] = None) -> User:
    """Generate a random user."""
    data = {
        "id": fake.uuid4(),
        "email": fake.email(),
        "name": fake.name(),
        "phone": fake.phone_number(),
        "address": generate_address(),
        "created_at": fake.date_time_this_year(),
    }
    if overrides:
        data.update(overrides)
    return User(**data)


def generate_users(count: int, **overrides) -> List[User]:
    """Generate multiple users."""
    return [generate_user(overrides) for _ in range(count)]


def generate_order_item(overrides: Optional[dict] = None) -> OrderItem:
    """Generate a random order item."""
    quantity = random.randint(1, 5)
    price = float(fake.pydecimal(left_digits=3, right_digits=2, positive=True))

    data = {
        "id": fake.uuid4(),
        "product_id": fake.uuid4(),
        "name": fake.catch_phrase(),
        "quantity": quantity,
        "price": price,
    }
    if overrides:
        data.update(overrides)
    return OrderItem(**data)


def generate_order(
    user_id: Optional[str] = None,
    item_count: int = 2,
    status: Optional[str] = None,
) -> Order:
    """Generate a random order."""
    return Order(
        id=fake.uuid4(),
        user_id=user_id or fake.uuid4(),
        items=[generate_order_item() for _ in range(item_count)],
        status=status or random.choice(["pending", "processing", "shipped", "delivered"]),
        created_at=fake.date_time_this_year(),
    )


# Deterministic generation
def generate_deterministic_user(seed: int) -> User:
    """Generate a user with deterministic data."""
    Faker.seed(seed)
    random.seed(seed)
    return generate_user()
```

```python
# tests/data/seed.py
"""Database seeding utilities."""
from sqlalchemy.orm import Session
from app.models import User, Order, Product
from tests.data.generators import (
    generate_user,
    generate_order,
    generate_users,
)
import logging

logger = logging.getLogger(__name__)


class DatabaseSeeder:
    """Database seeding manager."""

    def __init__(self, session: Session):
        self.session = session

    def seed_all(self) -> dict:
        """Seed all test data."""
        logger.info("Seeding database...")

        users = self.seed_users(10)
        products = self.seed_products(20)
        orders = self.seed_orders(users[:5])

        self.session.commit()

        return {
            "users": users,
            "products": products,
            "orders": orders,
        }

    def seed_users(self, count: int) -> list[User]:
        """Seed users."""
        users = []
        for user_data in generate_users(count):
            user = User(
                id=user_data.id,
                email=user_data.email,
                name=user_data.name,
                phone=user_data.phone,
            )
            self.session.add(user)
            users.append(user)

        logger.info(f"Created {len(users)} users")
        return users

    def seed_products(self, count: int) -> list[Product]:
        """Seed products."""
        from faker import Faker
        fake = Faker()

        products = []
        for _ in range(count):
            product = Product(
                id=fake.uuid4(),
                name=fake.catch_phrase(),
                price=float(fake.pydecimal(left_digits=3, right_digits=2, positive=True)),
                stock=fake.random_int(min=0, max=100),
            )
            self.session.add(product)
            products.append(product)

        logger.info(f"Created {len(products)} products")
        return products

    def seed_orders(self, users: list[User]) -> list[Order]:
        """Seed orders for users."""
        orders = []
        for user in users:
            order_count = random.randint(1, 3)
            for _ in range(order_count):
                order_data = generate_order(user_id=user.id)
                order = Order(
                    id=order_data.id,
                    user_id=order_data.user_id,
                    status=order_data.status,
                    subtotal=order_data.subtotal,
                    tax=order_data.tax,
                    total=order_data.total,
                )
                self.session.add(order)
                orders.append(order)

        logger.info(f"Created {len(orders)} orders")
        return orders

    def clean_all(self) -> None:
        """Clean all test data."""
        logger.info("Cleaning database...")

        self.session.query(OrderItem).delete()
        self.session.query(Order).delete()
        self.session.query(Product).delete()
        self.session.query(User).delete()

        self.session.commit()
        logger.info("Database cleaned")

    def reset(self) -> dict:
        """Reset and reseed database."""
        self.clean_all()
        return self.seed_all()
```

## Data Masking and Anonymization

```typescript
// tests/data/masking.ts
import { faker } from '@faker-js/faker';
import * as crypto from 'crypto';

export interface MaskingConfig {
  fields: Record<string, MaskingStrategy>;
}

export type MaskingStrategy =
  | 'hash'
  | 'fake'
  | 'redact'
  | 'preserve-format'
  | { type: 'truncate'; length: number }
  | { type: 'replace'; value: string };

export function maskData<T extends object>(
  data: T,
  config: MaskingConfig
): T {
  const masked = { ...data };

  for (const [field, strategy] of Object.entries(config.fields)) {
    if (field in masked) {
      (masked as any)[field] = applyMaskingStrategy(
        (data as any)[field],
        strategy
      );
    }
  }

  return masked;
}

function applyMaskingStrategy(value: unknown, strategy: MaskingStrategy): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  const stringValue = String(value);

  if (strategy === 'hash') {
    return crypto
      .createHash('sha256')
      .update(stringValue)
      .digest('hex')
      .substring(0, 16);
  }

  if (strategy === 'fake') {
    // Detect type and generate fake data
    if (stringValue.includes('@')) {
      return faker.internet.email();
    }
    if (/^\d{3}-\d{3}-\d{4}$/.test(stringValue)) {
      return faker.phone.number('###-###-####');
    }
    if (/^\d{4}$/.test(stringValue)) {
      return faker.string.numeric(4);
    }
    return faker.string.alphanumeric(stringValue.length);
  }

  if (strategy === 'redact') {
    return '[REDACTED]';
  }

  if (strategy === 'preserve-format') {
    // Replace characters but preserve format
    return stringValue.replace(/[a-zA-Z]/g, 'X').replace(/\d/g, '0');
  }

  if (typeof strategy === 'object') {
    if (strategy.type === 'truncate') {
      return stringValue.substring(0, strategy.length) + '...';
    }
    if (strategy.type === 'replace') {
      return strategy.value;
    }
  }

  return value;
}

// Production data anonymization
export async function anonymizeProductionData(
  data: User[]
): Promise<User[]> {
  const maskingConfig: MaskingConfig = {
    fields: {
      email: 'fake',
      phone: 'preserve-format',
      ssn: 'redact',
      creditCard: { type: 'truncate', length: 4 },
      name: 'fake',
      address: 'fake',
    },
  };

  return data.map((user) => maskData(user, maskingConfig));
}
```

## Test Data Cleanup

```typescript
// tests/data/cleanup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function cleanupTestData(prefix = 'test-'): Promise<void> {
  // Delete data with test prefix
  await prisma.order.deleteMany({
    where: { id: { startsWith: prefix } },
  });

  await prisma.user.deleteMany({
    where: { email: { contains: '@test.example.com' } },
  });
}

export async function cleanupOldTestData(daysOld = 7): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  // Delete old test data
  await prisma.order.deleteMany({
    where: {
      AND: [
        { createdAt: { lt: cutoffDate } },
        { status: { in: ['pending', 'cancelled'] } },
      ],
    },
  });
}

// Transaction-based cleanup
export async function withCleanup<T>(
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await prisma.$transaction(async (tx) => {
      return await fn();
    });
  } finally {
    // Rollback happens automatically on error
  }
}

// Savepoint-based cleanup
export class TestTransaction {
  private savepoint: string;

  constructor(private prisma: PrismaClient) {
    this.savepoint = `sp_${Date.now()}`;
  }

  async begin(): Promise<void> {
    await this.prisma.$executeRawUnsafe(`SAVEPOINT ${this.savepoint}`);
  }

  async rollback(): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `ROLLBACK TO SAVEPOINT ${this.savepoint}`
    );
  }
}
```

## CI/CD Data Management

```yaml
# .github/workflows/test-data.yml
name: Test Data Management

on:
  schedule:
    - cron: '0 0 * * 0' # Weekly cleanup
  workflow_dispatch:
    inputs:
      action:
        description: 'Action to perform'
        required: true
        default: 'seed'
        type: choice
        options:
          - seed
          - clean
          - reset
          - anonymize

jobs:
  manage-test-data:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run data management
        run: |
          case "${{ github.event.inputs.action }}" in
            seed)
              npm run db:seed
              ;;
            clean)
              npm run db:clean
              ;;
            reset)
              npm run db:reset
              ;;
            anonymize)
              npm run db:anonymize
              ;;
          esac
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

## CLAUDE.md Integration

```markdown
# Test Data Management

## Commands
- `npm run db:seed` - Seed test data
- `npm run db:clean` - Clean test data
- `npm run db:reset` - Reset database
- `npm run data:generate` - Generate fixtures

## Data Generation
- Uses Faker.js for realistic data
- Deterministic option with seeds
- Supports relationships

## Cleanup Strategies
- Transaction rollback
- Prefix-based cleanup
- Age-based cleanup

## Best Practices
- Use factories over raw data
- Clean up after tests
- Use transactions for isolation
- Mask PII in test data
```

## AI Suggestions

1. **Smart data generation** - Context-aware test data
2. **Data profiling** - Analyze production for realistic fakes
3. **Relationship graphs** - Generate connected data
4. **Data validation** - Ensure generated data is valid
5. **Snapshot testing** - Store known good data states
6. **Performance data** - Generate large datasets efficiently
7. **Edge case generation** - Automatically find edge cases
8. **Data versioning** - Version test data fixtures
9. **Cross-environment sync** - Sync test data across envs
10. **Compliance checking** - Ensure test data meets compliance
